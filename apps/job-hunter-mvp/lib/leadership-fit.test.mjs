import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadProfile } from './profile.mjs';
import { fileURLToPath } from 'node:url';
import { reviewJobPosting } from './vacancy-review.mjs';
import { computeRelevanceAssessment } from './scoring.mjs';
import { assessEnglishGate } from './extract.mjs';
import { MATCHING_POLICY } from './leadership-fit.mjs';
import { renderHtmlReport } from '../presentation/render.mjs';
import { currentResultsMarkdown } from '../presentation/current-report.mjs';
import { ROLE_FAMILIES, buildAcquisitionQueries } from './queries.mjs';

const profile = await loadProfile(fileURLToPath(new URL('../../../profile/', import.meta.url)));
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/leadership-2026-09-30.json', import.meta.url)));
const input = { title: 'IT vezető', descriptionText: fixtures.jobs[0].description, locationText: 'Budapest', positionRelevant: true, candidateProfile: profile.candidate };

for (const job of fixtures.jobs) test(`${job.company}: strong leadership through the production schema-to-result path`, () => {
  const { record } = reviewJobPosting({ '@type': 'JobPosting', title: job.title, description: job.description,
    hiringOrganization: { name: job.company }, jobLocation: { address: { addressLocality: 'Budapest' } } }, { url: job.url, profile });
  assert.equal(record.fitClass, 'STRONG_MATCH');
  assert.equal(record.eligibility, 'PASS');
  assert.equal(record.visible, true);
  assert.equal(record.english_gate.status, 'PASS');
  for (const field of MATCHING_POLICY.output_required) assert.ok(field in record, field);
  assert.ok(record.people_management_fit.evidence.length);
});

test('ordinary IT PM stays secondary despite freshness, location, strategy and budget keywords', () => {
  const result = computeRelevanceAssessment({ ...input, title: 'IT Project Manager', datePosted: new Date().toISOString(), locationText: 'Székesfehérvár',
    descriptionText: '3–5 év projektvezetési tapasztalat. IT-stratégia támogatása, projektterv és határidők. Költségvetés tervezése, szállítói koordináció, beszerzés, digitalizáció, ERP és AI.' });
  assert.equal(result.matchClass, 'SECONDARY');
  assert.equal(result.people_management_fit.status, 'NOT_EVIDENCED');
  assert.ok(result.score < 60);
  assert.equal(result.visible, false);
});

test('project title is strong only with people, authority AND broad IT scope', () => {
  const full = 'IT csapat irányítása. Döntési jogkör. A teljes IT működéséért felel: infrastruktúra, fejlesztőcsapat, IT-biztonság.';
  assert.equal(computeRelevanceAssessment({ ...input, title: 'IT Project Manager', descriptionText: full }).fitClass, 'STRONG_MATCH');
  for (const descriptionText of ['IT csapat irányítása. Döntési jogkör.', 'IT csapat irányítása. IT infrastruktúra és fejlesztőcsapat.', 'Döntési jogkör. A teljes IT működéséért felel.']) {
    assert.notEqual(computeRelevanceAssessment({ ...input, title: 'IT Project Manager', descriptionText }).fitClass, 'STRONG_MATCH');
  }
});

test('fluent daily English rejects even a high-fit operations manager and preserves fit evidence', () => {
  const baseline = computeRelevanceAssessment(input);
  const result = computeRelevanceAssessment({ ...input, title: 'IT Operations Manager', descriptionText: `${input.descriptionText}\nFluent English required. Daily international communication.` });
  assert.equal(result.fitScore, baseline.fitScore);
  assert.equal(result.fitClass, 'STRONG_MATCH');
  assert.equal(result.matchClass, 'REJECT');
  assert.equal(result.visible, false);
  assert.equal(result.english_gate.status, 'REJECT');
  assert.match(result.hard_rejection_reason, /angol/i);
});

test('English usage gate separates optional, documentation, unknown and working language', () => {
  for (const text of ['Nem kell nyelvtudás.', 'Felsőfokú angol előny.', 'Fluent English preferred.', 'Angol kizárólag dokumentáció olvasásához.', 'English for reading documentation only.', 'Előnyt jelent:\nFluent English.']) assert.equal(assessEnglishGate(text).status, 'PASS', text);
  for (const text of ['Angol B2.', 'Középfokú angol nyelvtudás.']) assert.equal(assessEnglishGate(text).status, 'REVIEW', text);
  for (const text of ['Angol B2, napi kommunikáció angolul.', 'English is our working language.', 'Daily communication in English.', 'Angol nyelv használata külföldi partnerekkel.', 'Angol előny. Napi angol kommunikáció szükséges.', 'Előnyt jelent:\nAngol.\nFeladatok:\nNapi angol egyeztetés.']) assert.equal(assessEnglishGate(text).status, 'REJECT', text);
  assert.notEqual(assessEnglishGate('Felsőfokú végzettség, angol nyelvtudás.').status, 'REJECT');
  assert.equal(assessEnglishGate('Angol előny, de napi angol kommunikáció kötelező.').status, 'REJECT');
});

test('title does not add points; concrete IT leadership can rescue a generic title', () => {
  const a = computeRelevanceAssessment(input);
  const b = computeRelevanceAssessment({ ...input, title: 'Osztályvezető', positionRelevant: false, isGenericTitle: true });
  assert.equal(a.score, b.score);
  assert.equal(b.visible, true);
  assert.equal(computeRelevanceAssessment({ ...input, title: 'CIO / IT Director', descriptionText: 'Önálló hibajegykezelés.' }).visible, false);
});

test('a developer or a negated team responsibility cannot become a people leader', () => {
  for (const descriptionText of ['Budget responsibility. IT stratégia.', 'Nincs beosztott. IT infrastruktúra.', 'No people management. IT operations.', 'Csapatban dolgozunk. A rendszer működtetése.']) {
    const result = computeRelevanceAssessment({ ...input, descriptionText });
    assert.equal(result.people_management_fit.status, 'NOT_EVIDENCED');
    assert.equal(result.visible, false);
  }
  assert.equal(computeRelevanceAssessment({ ...input, title: 'Senior Developer', descriptionText: 'Projektterv és stakeholder egyeztetés, PHP-fejlesztés.' }).hardExcluded, true);
});

test('PHP and development evidence comes from the dated user clarification, not an invented CV quote', () => {
  const result = computeRelevanceAssessment({ ...input, descriptionText: `${input.descriptionText}\nPHP és API-integráció, development background required.` });
  assert.equal(result.hardExcluded, false);
  assert.ok(result.development_fit.candidateEvidence.some(s => s.includes('PHP')));
  assert.ok(result.candidateReview.matches.some(m => m.factId === 'php-development' && m.sourceFile === 'user-clarifications-2026-09-30.md'));
});

test('a high score cannot reopen an explicit REVIEW or REJECT in HTML or Markdown', () => {
  for (const status of ['REJECT', 'REVIEW']) {
    const row = { title: 'Hidden high fit', company: 'Example', url: 'https://example.org/job', relevancePercent: 99, fitScore: 99, visible: false, eligibility: status };
    const html = renderHtmlReport({ results: [row] });
    assert.match(html, /data-visible="false"/);
    assert.match(html, /style="display:none;"/);
    const md = currentResultsMarkdown({ results: [row] }, {});
    assert.ok(!md.split('## Másodlagos')[0].includes('### Example'));
  }
});

test('acquisition prioritizes leadership within the existing 17-query quota', () => {
  assert.equal(buildAcquisitionQueries().length, 17);
  const pm = ROLE_FAMILIES.find(r => /projektmenedzser/.test(r.q));
  assert.ok(ROLE_FAMILIES.filter(r => /vezető|igazgató|Head of IT/.test(r.q) && r !== pm).every(r => r.priorityWeight > pm.priorityWeight));
});
