// The same vacancy reaching the report twice is a credibility problem: the PO
// counts candidates, so two rows for one job inflates the list and makes the
// score look arbitrary ("why is this 92% twice?").
//
// Every duplicate pair below is REAL, taken from CURRENT_RESULTS.md of the
// 2026-09-17 08:14 live run, where 15 candidates contained 2 duplicate pairs
// (so ~13 actual jobs). The old key was `title.toLowerCase()|company
// .toLowerCase()`, exact match, which cannot see:
//
//   * a parent/subsidiary or short/long employer name for one identical job
//     ("MVM" vs "MVM Ügyfélkapcsolati Kft.");
//   * an agency reference code appended to the title
//     ("IT Manager" vs "IT Manager (4174)").
//
// The report even disclosed the defect instead of fixing it ("Munkáltatói
// névváltozatok miatt duplikáció maradhat.").
//
// The negative cases matter just as much: several genuinely distinct roles in
// this run share an employer, and collapsing them would DELETE real
// opportunities -- a far worse outcome than a visible duplicate.

import test from 'node:test';
import assert from 'node:assert/strict';
import { isSameVacancy, dedupeVacancies } from './vacancy-dedup.mjs';

// --- real duplicate pairs that must collapse ------------------------------
const DUPLICATES = [
  [
    { title: 'Digitális csatorna menedzsment és üzemeltetés csoportvezető', company: 'MVM Ügyfélkapcsolati Kft.' },
    { title: 'Digitális csatorna menedzsment és üzemeltetés csoportvezető', company: 'MVM' },
    'identical role, short vs full employer name',
  ],
  [
    { title: 'IT Manager', company: 'HumanField Kft' },
    { title: 'IT Manager (4174)', company: 'HumanField Vezető- és Specialistakiválasztó Kft.' },
    'agency reference code in the title, short vs full agency name',
  ],
];

// --- genuinely different roles that must NOT collapse ---------------------
const DISTINCT = [
  [
    { title: 'Projektmenedzser (junior IT)', company: 'Indotek Group' },
    { title: 'Projektmenedzser (PMO)', company: 'Indotek Group' },
    'same employer, two different projects roles -- both real openings',
  ],
  [
    { title: 'Vezetékes hálózatfelügyeleti csoportvezető', company: '2Connect Hungary' },
    { title: 'Mobil hálózatfelügyeleti csoportvezető', company: '2Connect Hungary' },
    'wired vs mobile network team lead -- different teams',
  ],
  [
    { title: 'IT IGAZGATÓ', company: 'BECK AND PARTNERS Kft.' },
    { title: 'IT Manager', company: 'HumanField Kft' },
    'unrelated employers and roles',
  ],
  [
    { title: 'Senior IT projektmenedzser', company: 'MVM' },
    { title: 'Digitális csatorna menedzsment és üzemeltetés csoportvezető', company: 'MVM' },
    'same employer, clearly different positions',
  ],
];

test('real duplicate pairs from the 2026-09-17 run are recognised', () => {
  for (const [a, b, why] of DUPLICATES) {
    assert.equal(isSameVacancy(a, b), true, `should match (${why})`);
    assert.equal(isSameVacancy(b, a), true, `must be symmetric (${why})`);
  }
});

test('distinct roles are never collapsed', () => {
  for (const [a, b, why] of DISTINCT) {
    assert.equal(isSameVacancy(a, b), false, `must stay separate (${why})`);
    assert.equal(isSameVacancy(b, a), false, `must be symmetric (${why})`);
  }
});

test('dedupeVacancies keeps the highest-scored copy and records the alternates', () => {
  const input = [
    { title: 'IT Manager (4174)', company: 'HumanField Vezető- és Specialistakiválasztó Kft.', relevancePercent: 72, url: 'https://www.cvonline.hu/a' },
    { title: 'IT Manager', company: 'HumanField Kft', relevancePercent: 74, url: 'https://www.profession.hu/b' },
    { title: 'IT IGAZGATÓ', company: 'BECK AND PARTNERS Kft.', relevancePercent: 89, url: 'https://www.profession.hu/c' },
  ];
  const { kept, duplicates } = dedupeVacancies(input);
  assert.equal(kept.length, 2);
  const humanField = kept.find((r) => /humanfield/i.test(r.company));
  assert.equal(humanField.relevancePercent, 74, 'must keep the higher-scored copy');
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].url, 'https://www.cvonline.hu/a');
  assert.equal(duplicates[0].duplicateOfUrl, 'https://www.profession.hu/b');
});

test('an equal-score duplicate keeps the primary job portal, not the LinkedIn mirror', () => {
  // Both MVM copies scored 92 in the real run. Which URL the PO gets matters:
  // profession.hu carries the employer's own advert with the full requirement
  // text and a direct application route; the LinkedIn copy can expire
  // independently. Ordering by URL alphabetically would hand over LinkedIn.
  const { kept } = dedupeVacancies([
    { title: 'Digitális csatorna menedzsment és üzemeltetés csoportvezető', company: 'MVM', relevancePercent: 92, url: 'https://hu.linkedin.com/y' },
    { title: 'Digitális csatorna menedzsment és üzemeltetés csoportvezető', company: 'MVM Ügyfélkapcsolati Kft.', relevancePercent: 92, url: 'https://www.profession.hu/x' },
  ]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].url, 'https://www.profession.hu/x');
});

test('the surviving copy carries its alternate source URLs for transparency', () => {
  // The PO must still be able to reach the other posting of the same job --
  // silently dropping it would hide that the advert exists on two portals.
  const { kept } = dedupeVacancies([
    { title: 'Digitális csatorna menedzsment és üzemeltetés csoportvezető', company: 'MVM Ügyfélkapcsolati Kft.', relevancePercent: 92, url: 'https://www.profession.hu/x' },
    { title: 'Digitális csatorna menedzsment és üzemeltetés csoportvezető', company: 'MVM', relevancePercent: 92, url: 'https://hu.linkedin.com/y' },
  ]);
  assert.equal(kept.length, 1);
  assert.deepEqual(kept[0].alsoPostedAt, ['https://hu.linkedin.com/y']);
});

test('an equal-score tie is resolved deterministically, not by input order', () => {
  const forward = dedupeVacancies([
    { title: 'IT Manager', company: 'HumanField Kft', relevancePercent: 72, url: 'https://b.example/2' },
    { title: 'IT Manager (4174)', company: 'HumanField Kft', relevancePercent: 72, url: 'https://a.example/1' },
  ]);
  const backward = dedupeVacancies([
    { title: 'IT Manager (4174)', company: 'HumanField Kft', relevancePercent: 72, url: 'https://a.example/1' },
    { title: 'IT Manager', company: 'HumanField Kft', relevancePercent: 72, url: 'https://b.example/2' },
  ]);
  assert.equal(forward.kept.length, 1);
  assert.equal(forward.kept[0].url, backward.kept[0].url, 'same input set must give the same survivor');
});

test('missing or empty fields never throw and never merge unrelated rows', () => {
  const { kept } = dedupeVacancies([
    { title: '', company: '', relevancePercent: 10, url: 'https://x/1' },
    { title: undefined, company: undefined, relevancePercent: 20, url: 'https://x/2' },
    { title: 'IT vezető', company: 'Valami Kft.', relevancePercent: 30, url: 'https://x/3' },
  ]);
  // Two blank rows are not evidence of being the same job.
  assert.equal(kept.length, 3);
});
