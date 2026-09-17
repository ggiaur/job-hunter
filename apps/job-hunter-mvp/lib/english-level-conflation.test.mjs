// Mandatory-advanced-English detection must not be triggered by a DEGREE
// requirement or by generic soft-skill adjectives.
//
// Why this test exists (measured, not hypothesised): in the committed
// 2026-09-17 live run, 184 of 617 exclusions were "kötelező felsőfokú
// /tárgyalásképes/anyanyelvi angol". A hard exclusion removes the ad from the
// report entirely, so a false positive here is INVISIBLE to the Product
// Owner -- strictly worse than a false negative, which merely shows one ad the
// PO can dismiss at a glance. Recall is therefore the priority.
//
// Root cause the cases below pin down: the detector's proximity window was
// [^.\n;], which does NOT stop at a comma. Hungarian requirement bullets are
// comma-separated lists, so "Felsőfokú végzettség, angol nyelvtudás" put
// "felsőfokú" (which modifies *végzettség*) within 25 characters of "angol"
// and was read as an advanced-English requirement.
//
// Note on `hasMandatoryMarker` interaction: checkAdvancedEnglishRequired is
// the level detector only. These cases assert the level detection itself,
// which is what the exclusion in scoring.mjs keys off.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAdvancedEnglishRequired,
  checkHigherEducationRequired,
} from './extract.mjs';

// --- Must NOT be read as a mandatory advanced-English requirement ----------
// Each string is phrasing that occurs verbatim in Hungarian IT job adverts.
const NOT_ADVANCED_ENGLISH = [
  ['Felsőfokú végzettség, angol nyelvtudás', '"felsőfokú" modifies the degree, not the language'],
  ['Angol nyelvtudás, felsőfokú végzettség', 'same list, reversed order'],
  ['Elvárás: felsőfokú informatikai végzettség, angol nyelvtudás', 'degree with a qualifier word'],
  ['Kiváló kommunikációs készség, angol nyelvtudás', '"kiváló" modifies communication skills'],
  ['Magabiztos fellépés, angol nyelv alapszinten', '"magabiztos" modifies demeanour; English is basic'],
  ['Felsőfokú német nyelvtudás; angol nyelvtudás előny', 'advanced GERMAN; English only an advantage'],
  ['Középfokú angol nyelvtudás', 'intermediate English is explicitly allowed by the PO rule'],
  ['Angol nyelvtudás előnyt jelent', 'English merely an advantage'],
  ['Egyetemi vagy főiskolai végzettség, angol nyelvtudás', 'degree phrased without "felsőfokú"'],
];

// --- Must STILL be read as a mandatory advanced-English requirement -------
// If any of these regress, the PO's single hardest exclusion rule stops
// working and the report fills up with ads he cannot take.
const IS_ADVANCED_ENGLISH = [
  ['Felsőfokú angol nyelvtudás kötelező', 'level directly modifies the language'],
  ['Tárgyalóképes angol nyelvtudás', 'classic Hungarian blocker phrasing'],
  ['Tárgyalásképes angol nyelvtudás szükséges', 'spelling variant'],
  ['Angol nyelvtudás felsőfokon', 'level follows the language'],
  ['Anyanyelvi szintű angol', 'native level'],
  ['Folyékony angol nyelvtudás', 'fluent'],
  ['Fluent English is required', 'English-language advert'],
  ['Advanced English knowledge', 'English-language advert'],
  ['Angol nyelvtudás, tárgyalóképes szinten', 'comma present, but "szinten" binds the level to the language'],
];

test('a degree requirement is never read as an advanced-English requirement', () => {
  for (const [text, why] of NOT_ADVANCED_ENGLISH) {
    assert.equal(
      checkAdvancedEnglishRequired(text),
      false,
      `must NOT exclude (${why}): ${text}`
    );
  }
});

test('genuine mandatory advanced English is still detected', () => {
  for (const [text, why] of IS_ADVANCED_ENGLISH) {
    assert.equal(
      checkAdvancedEnglishRequired(text),
      true,
      `must exclude (${why}): ${text}`
    );
  }
});

test('the degree detector still sees the degree it is responsible for', () => {
  // Proves the two concerns stay separated rather than one silently swallowing
  // the other: the same text that must NOT trigger the English exclusion must
  // still be recognised as mentioning a degree (which is explicitly NOT a
  // disqualifier per profile/persona.md, only informational).
  for (const text of [
    'Felsőfokú végzettség, angol nyelvtudás',
    'Egyetemi vagy főiskolai végzettség, angol nyelvtudás',
  ]) {
    assert.equal(checkHigherEducationRequired(text), true, `degree not seen: ${text}`);
  }
});

test('a comma-separated list does not leak a level across items', () => {
  // The general form of the bug, stated independently of any single wording:
  // items separated by a comma are separate requirements, so a level word in
  // one item must not attach to "angol" in another.
  const text = 'Elvárások: felsőfokú végzettség, vezetői tapasztalat, angol nyelvtudás, jogosítvány';
  assert.equal(checkAdvancedEnglishRequired(text), false);
});
