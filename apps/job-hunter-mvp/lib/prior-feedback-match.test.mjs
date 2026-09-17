// A recorded PO rejection must still be recognised when the portal spells the
// employer or title differently.
//
// Measured gap: profile/learned_preferences.md holds SIX real DO_NOT_APPLY
// decisions from the 2026-09-04 live review, but in the 2026-09-17 run only ONE
// row carried a poDecision. findPriorFeedback() required exact normalised
// equality of BOTH employer and title, so:
//
//   recorded : "WAY Group / CAIP Hungary — IT Manager, Nyíregyháza"
//   advert   : company "WAY Group", title "IT Manager (m/f/d) | CAIP Hungary,
//              Nyíregyháza"
//
// did not match, and the advert the PO had explicitly rejected 13 days earlier
// came back as a 78% candidate. The report itself filters DO_NOT_APPLY out of the
// candidate list, so enforcement was never the problem -- recognition was.
//
// The opposite error is worse than a repeat: inheriting a rejection onto a
// DIFFERENT role at the same employer would silently delete a real opportunity.
// The negative cases below pin that boundary.

import test from 'node:test';
import assert from 'node:assert/strict';
import { findPriorFeedback } from './candidate-fit.mjs';

// Verbatim excerpt of the real file's decision lines.
const LEARNED_TEXT = [
  '## 2026-09-04 élő PO-review — konkrét döntési bizonyítékok',
  '',
  '- **MOL Group — E&P IT Operations Manager:** DO_NOT_APPLY. Elsődleges ok: a hirdetés erős/aktív angolt követel; ez a PO számára kizáró tényező.',
  '- **Deloitte — IT Associate Service Manager / Incident Management:** DO_NOT_APPLY. Elsődleges ok: kötelező német + angol, legalább B2 szinten.',
  '- **WAY Group / CAIP Hungary — IT Manager, Nyíregyháza:** DO_NOT_APPLY. Elsődleges ok: a nagy távolság együtt a helyszíni, teljes munkaidős működéssel.',
  '- **Siemens Energy — IT Development and Operations Manager:** DO_NOT_APPLY. Elsődleges ok: a szerep túl SAP-/gyártási IT-központú és operatív.',
  '- **Emerson — Documentation Program Manager:** DO_NOT_APPLY. A dokumentációs/content-platform transzformációs fókusz nem volt megfelelő.',
  '- **Iron Mountain — Strategic Initiatives Program Manager:** DO_NOT_APPLY. Elsődleges ok: a globális szerep jelentős aktív üzleti angolt igényel.',
].join('\n');

function decisionFor(company, title) {
  const matches = findPriorFeedback(LEARNED_TEXT, company, title);
  return matches.at(-1) || null;
}

test('the exact-match case that already worked keeps working', () => {
  // This is the single row that carried a decision in the real 2026-09-17 run.
  const found = decisionFor('Deloitte', 'IT Associate Service Manager - Incident Management');
  assert.equal(found?.decision, 'DO_NOT_APPLY');
  assert.match(found.reason, /német/);
});

test('the real WAY Group / CAIP advert is recognised despite both names differing', () => {
  const found = decisionFor('WAY Group', 'IT Manager (m/f/d) | CAIP Hungary, Nyíregyháza');
  assert.equal(found?.decision, 'DO_NOT_APPLY', 'the 78% candidate the PO had already rejected');
  assert.match(found.reason, /távolság/);
});

test('employer legal-form and group suffixes do not block a match', () => {
  for (const company of ['MOL Group', 'MOL Nyrt.', 'MOL']) {
    const found = decisionFor(company, 'E&P IT Operations Manager');
    assert.equal(found?.decision, 'DO_NOT_APPLY', `should match employer variant: ${company}`);
  }
});

test('a DIFFERENT role at the same employer does NOT inherit the rejection', () => {
  // Inheriting here would silently delete a real opportunity -- strictly worse
  // than showing a repeat the PO can dismiss in one glance.
  for (const [company, title] of [
    ['Siemens Energy', 'IT Manager'],
    ['Siemens Energy', 'Head of IT Infrastructure'],
    ['Deloitte', 'IT Projektmenedzser'],
    ['Iron Mountain', 'IT Operations Team Lead'],
    ['MOL Group', 'Digitalizációs vezető'],
  ]) {
    assert.equal(decisionFor(company, title), null, `must NOT inherit: ${company} — ${title}`);
  }
});

test('an unrelated employer never matches on title alone', () => {
  assert.equal(decisionFor('Indotek Group', 'IT Manager'), null);
  assert.equal(decisionFor('HumanField Kft', 'IT Manager'), null);
});

test('no learned text and malformed lines are handled without throwing', () => {
  assert.deepEqual(findPriorFeedback('', 'MOL Group', 'E&P IT Operations Manager'), []);
  assert.deepEqual(findPriorFeedback(null, 'MOL Group', 'x'), []);
  assert.deepEqual(findPriorFeedback('- **broken line without decision**', 'MOL Group', 'x'), []);
  assert.deepEqual(findPriorFeedback(LEARNED_TEXT, '', ''), []);
});
