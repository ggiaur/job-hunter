import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProfile, loadCandidateProfile } from './profile.mjs';
import { compareCandidate, findPriorFeedback } from './candidate-fit.mjs';
import { computeRelevanceAssessment, scoreLocation } from './scoring.mjs';
import { matchesTargetPosition, checkAdvancedEnglishRequired, englishRequirementLabel } from './extract.mjs';
import { detectWorkArrangement } from './work-arrangement.mjs';
import { renderHtmlReport } from '../presentation/render.mjs';
import { reviewJobPosting } from './vacancy-review.mjs';

const profileDir = fileURLToPath(new URL('../../../profile/', import.meta.url));
const { candidate } = await loadProfile(profileDir);
const vacancy = {
  title: 'IT vezető',
  descriptionText: 'Csapatot vezet, beosztottak irányítása. IT infrastruktúra, projektterv, stakeholder és Microsoft 365.',
  locationText: 'Budapest', datePosted: null, positionRelevant: true, isGenericTitle: false,
};

test('actual CV and supplied certificates are loaded with source evidence; no invented degree level or CEFR', () => {
  assert.equal(candidate.education.hasDegree, true);
  assert.equal(candidate.education.qualification, 'Programtervező informatikus');
  assert.equal(candidate.education.institution, 'Nyíregyházi Egyetem');
  assert.equal(candidate.education.degreeLevel, null);
  assert.equal(candidate.english.cefr, null);
  assert.match(candidate.sourceSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(candidate.certificates.map(c => [c.title, c.issuedAt]), [
    ['AI vállalati bevezetés', '2026-07-19'], ['MS Copilot alapok', '2026-08-04'],
  ]);
  assert.ok(candidate.certificates.every(c => c.issuer === null && c.type === 'online-course-completion'));
});

test('profile load fails before search when an asserted CV fact has no source', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'jh-cv-test-'));
  try {
    const profile = structuredClone(candidate);
    profile.facts[0].evidence = 'Invented qualification that is absent from the source.';
    await writeFile(path.join(dir, 'candidate.json'), JSON.stringify(profile));
    await writeFile(path.join(dir, candidate.sourceFile), await readFile(path.join(profileDir, candidate.sourceFile)));
    await assert.rejects(loadCandidateProfile(dir), /forrásbizonyíték/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('changing the CV changes the same vacancy assessment, not only printed metadata', () => {
  const withCV = computeRelevanceAssessment({ ...vacancy, candidateProfile: candidate });
  const withoutExperience = computeRelevanceAssessment({ ...vacancy, candidateProfile: { ...candidate, facts: [] } });
  assert.equal(withCV.hardExcluded, false);
  assert.ok(withCV.score > withoutExperience.score);
  assert.ok(withCV.candidateReview.matches.some(m => m.factId === 'm365' && m.cvEvidence && m.jobEvidence));
  assert.equal(withoutExperience.candidateReview.matches.length, 0);
});

test('degree requirement is neutral and shows the actual informatics qualification, not a mismatch', () => {
  const baseline = computeRelevanceAssessment({ ...vacancy, candidateProfile: candidate });
  const result = computeRelevanceAssessment({ ...vacancy, descriptionText: `${vacancy.descriptionText}\nFelsőfokú informatikai végzettség.`, candidateProfile: candidate });
  assert.equal(result.hardExcluded, false);
  assert.equal(result.score, baseline.score);
  assert.match(result.educationNote, /Programtervező informatikus/);
  assert.ok(!result.mismatchReasons.some(r => /végzettség|diploma/.test(r)));
});

test('ERP and Docker never fabricate SAP or Kubernetes evidence; AI course is not an ML engineering certification', () => {
  const review = compareCandidate(candidate, 'ERP, Docker, SAP, Kubernetes, WebLogic. AI vállalati bevezetés, MS Copilot.');
  assert.ok(review.matches.some(m => m.factId === 'erp-integration'));
  assert.ok(review.matches.some(m => m.factId === 'virtualization'));
  assert.ok(review.matches.some(m => m.factId === 'ai-adoption-training'));
  assert.ok(review.matches.some(m => m.factId === 'copilot-training'));
  assert.deepEqual(review.unverifiedSkills, ['SAP', 'Kubernetes', 'WebLogic']);
});

test('the real EURO ONE spaced service manager title remains in scope', () => {
  assert.equal(matchesTargetPosition('IT szolgáltatás menedzser'), true);
  assert.equal(matchesTargetPosition('IT szolgáltatásmenedzser'), true);
});

test('the production schema-to-result path requires a CV and carries its evidence to the result', async () => {
  const profile = await loadProfile(profileDir);
  const schema = { '@type': 'JobPosting', title: 'IT projektmenedzser', hiringOrganization: { name: 'Example' },
    description: 'Projektterv, stakeholder, döntés-előkészítés. Microsoft 365, költségvetés, hibrid projektmódszertan.',
    educationRequirements: 'Főiskola', jobLocation: { address: { addressLocality: 'Budapest' } } };
  const { record, assessment } = reviewJobPosting(schema, { url: 'https://example.org/job', profile });
  assert.equal(assessment.hardExcluded, false);
  assert.equal(record.candidateSourceSha256, candidate.sourceSha256);
  assert.ok(record.candidateReview.matches.some(m => m.factId === 'm365'));
  assert.equal(record.workArrangement, null);
  assert.throws(() => reviewJobPosting(schema, { url: 'https://example.org/job', profile: {} }), /Önéletrajzi forrás nélkül/);
});

test('Pillér methodology and hybrid technology are not remote working arrangements', () => {
  for (const text of ['Hibrid projektmódszertan ismerete előny.', 'Hybrid cloud and remote monitoring.', 'Nincs home office.', 'No remote work.']) {
    assert.equal(detectWorkArrangement('Budapest', text), null, text);
    assert.equal(scoreLocation('Budapest', text).points, 6, text);
  }
  for (const text of ['Hibrid munkavégzés.', '50% home office lehetőség.', 'Remote working possible.']) {
    assert.equal(detectWorkArrangement('Budapest', text), 'remote/hibrid', text);
  }
});

test('an expired vacancy is not recommended; missing expiry does not fabricate expiry', () => {
  assert.equal(computeRelevanceAssessment({ ...vacancy, validThrough: '2001-01-01', candidateProfile: candidate }).hardExcluded, true);
  assert.equal(computeRelevanceAssessment({ ...vacancy, validThrough: null, candidateProfile: candidate }).hardExcluded, false);
});

test('exact prior feedback is retained with its reason without generalizing to other roles', () => {
  const text = '- **Example — IT vezető:** DO_NOT_APPLY. Korábbi konkrét indok.';
  assert.equal(findPriorFeedback(text, 'Example', 'IT vezető')[0].reason, 'Korábbi konkrét indok.');
  assert.deepEqual(findPriorFeedback(text, 'Example', 'Projektmenedzser'), []);
});

test('real English requirement word orders are recognized without excluding intermediate or optional English', () => {
  for (const text of ['You are fluent in English and French - written and spoken.', 'English - strong verbal and written communication skills']) {
    assert.equal(checkAdvancedEnglishRequired(text), true, text);
  }
  for (const text of ['Fluent in English preferred.', 'Nice-to-have: fluent in English.', 'English - strong verbal and written communication skills are optional.']) {
    assert.equal(checkAdvancedEnglishRequired(text), false, text);
  }
  for (const text of ['Középszintű angol nyelvtudás', 'Társalgási szintű angol nyelvtudás', 'German and English at minimum B2 level']) {
    assert.equal(checkAdvancedEnglishRequired(text), false, text);
    assert.match(englishRequirementLabel(text), /basic\/intermediate/, text);
  }
  assert.equal(checkAdvancedEnglishRequired('Fluent in French; intermediate English.'), false);
});

test('an exact prior rejection is active, retained for audit, and absent from the initial recommendation view', async () => {
  const profile = await loadProfile(profileDir);
  profile.learnedText = '- **Example — IT vezető:** DO_NOT_APPLY. Korábbi konkrét indok.';
  const schema = { title: vacancy.title, hiringOrganization: { name: 'Example' }, description: vacancy.descriptionText,
    jobLocation: { address: { addressLocality: 'Budapest' } } };
  const { record, assessment } = reviewJobPosting(schema, { url: 'https://example.org/job', profile });
  assert.equal(assessment.hardExcluded, false);
  assert.equal(record.visible, true); // score retained; PO rejection is a separate decision
  assert.equal(record.poDecision, 'DO_NOT_APPLY');
  assert.equal(record.poReason, 'Korábbi konkrét indok.');
  const html = renderHtmlReport({ results: [record] }, { decisionsDict: {} });
  assert.match(html, /Ellenőrizendő jelöltek[^<]+<strong>0<\/strong>/);
  assert.match(html, /data-po-decision="DO_NOT_APPLY"\s+style="display:none;"/);
  assert.ok(html.includes('Korábbi konkrét indok.'));
  const other = reviewJobPosting({ ...schema, hiringOrganization: { name: 'Another employer' } }, { url: 'https://example.org/other', profile });
  assert.equal(other.record.poDecision, null);
  const reversed = renderHtmlReport({ results: [record] }, { decisionsDict: { [record.url]: { poDecision: 'APPLY', poReason: 'Friss döntés' } } });
  assert.match(reversed, /data-po-decision="APPLY"\s+style="display:block;"/);
});

test('AI adoption courses do not prove specialist machine learning or data engineering experience', () => {
  const review = compareCandidate(candidate, 'Machine learning, data science, Databricks, data engineering required.');
  assert.deepEqual(review.unverifiedSkills, ['Databricks', 'machine learning', 'data science', 'data engineering']);
});

test('the rendered vacancy shows CV evidence, degree and original feedback with HTML escaping', () => {
  const assessment = computeRelevanceAssessment({ ...vacancy, descriptionText: `${vacancy.descriptionText}\nFelsőfokú végzettség.`, candidateProfile: candidate });
  const html = renderHtmlReport({ generatedAt: '2026-09-16', results: [{
    ...assessment, title: vacancy.title, company: 'Example', url: 'https://example.org/job',
    relevancePercent: assessment.score, priorFeedback: [{ decision: 'DO_NOT_APPLY', reason: '<script>unsafe</script>' }],
  }] }, { decisionsDict: {} });
  assert.ok(html.includes('Programtervező informatikus'));
  assert.ok(html.includes('Önéletrajzi bizonyítékok'));
  assert.ok(html.includes('Levelezési és fájlkezelési rendszer'));
  assert.ok(html.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
});
