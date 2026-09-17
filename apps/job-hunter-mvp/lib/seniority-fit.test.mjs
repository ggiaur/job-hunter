// Seniority fit was not scored at all.
//
// Measured gap: in the 2026-09-17 report "Indotek Group — Projektmenedzser
// (junior IT)" scored 81, ranking equal with "2Connect Hungary — Vezetékes
// hálózatfelügyeleti csoportvezető" (81) and above several genuine leadership
// roles. A grep for junior/entry-level across apps/job-hunter-mvp/lib returned
// nothing outside comments: the pipeline had no seniority signal whatsoever,
// for a candidate with 20+ years who currently heads a 6-person IT department.
//
// The rule is not invented here -- profile/persona.md lists under "Kizáró
// feltételek (0 pont)":
//
//   "Junior / entry-level KIVÉVE ha a pozíció maga vezetői/menedzseri jellegű
//    (pl. 'junior IT manager', 'assistant IT team lead') — ilyenkor a vezetői
//    jelleg felülírja a junior címkét, NE zárd ki automatikusan"
//
// So a junior-labelled leadership title must stay inspectable but must NOT rank
// as if seniority matched. A penalty (not an exclusion) is the only reading that
// satisfies both halves of that sentence.

import test from 'node:test';
import assert from 'node:assert/strict';
import { detectEntryLevelTitle, computeRelevanceAssessment } from './scoring.mjs';

// A description with real leadership scope, so the cases below differ only in
// the title and the seniority signal is measured in isolation.
const LEADERSHIP_TEXT = [
  'Feladatok: az IT csapat irányítása, közvetlen beosztottak vezetése,',
  'teljesítményértékelés, IT költségvetés tervezése és követése,',
  'szállítói koordináció, projekttervezés, erőforrás- és kockázatkezelés,',
  'vezetői riportok készítése a felső vezetés részére.',
].join('\n');

function score(title) {
  const assessment = computeRelevanceAssessment({
    title,
    descriptionText: LEADERSHIP_TEXT,
    locationText: 'Budapest, HU',
    datePosted: new Date().toISOString().slice(0, 10),
    validThrough: 'unknown',
    positionRelevant: true,
    isGenericTitle: false,
    candidateProfile: null,
  });
  assert.ok(!assessment.hardExcluded, `must not be hard-excluded: ${title}`);
  return assessment;
}

test('entry-level markers are detected in the title', () => {
  for (const title of [
    'Projektmenedzser (junior IT)',
    'Junior IT Manager',
    'junior it vezető',
    'Gyakornok IT projektmenedzser',
    'Pályakezdő IT koordinátor',
    'IT Project Manager - Trainee',
    'Jr. IT Manager',
    'Entry-level IT team lead',
  ]) {
    assert.equal(detectEntryLevelTitle(title), true, `should flag: ${title}`);
  }
});

test('ordinary and senior titles are not flagged', () => {
  for (const title of [
    'IT Manager',
    'IT IGAZGATÓ',
    'Senior IT projektmenedzser',
    'Vezetékes hálózatfelügyeleti csoportvezető',
    'Digitális csatorna menedzsment és üzemeltetés csoportvezető',
    // persona.md names this as explicitly ACCEPTABLE, so "assistant" must not
    // be treated as an entry-level marker.
    'Assistant IT team lead',
    'Rendszermérnök Csoportvezető',
  ]) {
    assert.equal(detectEntryLevelTitle(title), false, `should NOT flag: ${title}`);
  }
});

test('a junior mention in the DESCRIPTION never affects the role seniority', () => {
  // "mentoring junior colleagues" is a duty of a SENIOR role. Reading the
  // marker from the description would invert the meaning and penalise exactly
  // the leadership adverts the PO wants.
  const withJuniorDuty = computeRelevanceAssessment({
    title: 'IT Manager',
    descriptionText: `${LEADERSHIP_TEXT}\nJunior kollégák mentorálása és szakmai fejlesztése.`,
    locationText: 'Budapest, HU',
    datePosted: new Date().toISOString().slice(0, 10),
    validThrough: 'unknown',
    positionRelevant: true,
    isGenericTitle: false,
    candidateProfile: null,
  });
  const plain = score('IT Manager');
  assert.equal(withJuniorDuty.score, plain.score);
  assert.ok(
    !withJuniorDuty.mismatchReasons.some((r) => /junior|pályakezdő|gyakornok/i.test(r)),
    'must not report a seniority mismatch for mentoring duties'
  );
});

test('a junior-labelled leadership title is penalised, not excluded', () => {
  const junior = score('Projektmenedzser (junior IT)');
  const senior = score('Projektmenedzser');
  assert.ok(
    junior.score < senior.score,
    `junior must score lower: junior=${junior.score} vs plain=${senior.score}`
  );
  assert.ok(
    junior.mismatchReasons.some((r) => /junior|pályakezdő|gyakornok|belépő/i.test(r)),
    'the reason must be stated to the PO, not applied silently'
  );
});

test('the penalty is large enough to matter for the visible list', () => {
  // The real defect was rank, not presence: the junior advert sat among genuine
  // leadership roles. The penalty must be able to move such a row below the
  // 60% visibility threshold rather than nudging it a point or two.
  const junior = score('Projektmenedzser (junior IT)');
  const senior = score('Projektmenedzser');
  assert.ok(
    senior.score - junior.score >= 20,
    `penalty too small to change ranking: ${senior.score - junior.score}`
  );
});
