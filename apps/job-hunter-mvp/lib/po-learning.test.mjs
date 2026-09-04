// Tests derived from JH-SUP-0026 section 4, using the real 2026-09-04 PO
// decision text from profile/learned_preferences.md as regression fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDecisionReason, buildDecisionRecord, KNOWN_2026_09_04_DECISIONS } from './po-learning.mjs';

test('every real 2026-09-04 PO decision reason normalizes to its expected category', () => {
  for (const entry of KNOWN_2026_09_04_DECISIONS) {
    const category = normalizeDecisionReason(entry.reasonText);
    assert.equal(category, entry.expectedCategory, `${entry.company}: expected ${entry.expectedCategory}, got ${category}`);
  }
});

test('CAIP/WAY Group reason does not overgeneralize to "Nyíregyháza always excluded" -- category is location+onsite+no-hybrid, not a city name', () => {
  const category = normalizeDecisionReason('Elsődleges ok: a nagy távolság együtt a helyszíni, teljes munkaidős működéssel és a hibrid/remote lehetőség hiányával.');
  assert.equal(category, 'LOCATION_ONSITE_FULLTIME_NO_HYBRID');
  // A DIFFERENT Nyíregyháza-based ad with hybrid work available must not
  // hit the same category from city name alone -- it isn't in the reason
  // text at all here, only the onsite+no-hybrid combination is.
  assert.notEqual(normalizeDecisionReason('Nyíregyháza'), 'LOCATION_ONSITE_FULLTIME_NO_HYBRID');
});

test('Siemens reason does not overgeneralize to a blanket SAP ban -- category is operational/manufacturing focus specifically', () => {
  const category = normalizeDecisionReason('Elsődleges ok: a szerep túl SAP-/gyártási IT-központú és operatív.');
  assert.equal(category, 'OPERATIONAL_SAP_MANUFACTURING_FOCUS');
  // A role that merely mentions SAP once in passing, without operational/
  // manufacturing framing, must not hit this category.
  assert.notEqual(normalizeDecisionReason('A csapat SAP modult is használ a napi munkában.'), 'OPERATIONAL_SAP_MANUFACTURING_FOCUS');
});

test('Emerson reason does not overgeneralize against cross-functional leadership in general -- category is domain-focus mismatch', () => {
  const category = normalizeDecisionReason('a dokumentációs/content-platform transzformációs fókusz összességében nem volt megfelelő.');
  assert.equal(category, 'DOMAIN_FOCUS_MISMATCH');
});

test('Iron Mountain: language risk is primary, management-scope-absence is secondary, both preserved distinctly', () => {
  const record = buildDecisionRecord({
    decision: 'DO_NOT_APPLY',
    reason: 'a globális, több országot és senior stakeholder kommunikációt érintő szerep nagy valószínűséggel jelentős aktív üzleti angolt igényel.',
    secondaryReason: 'a saját csapat hiánya csak másodlagos.',
  });
  assert.equal(record.decisionReasonPrimary, 'LANGUAGE_ACTIVE_BUSINESS_ENGLISH_LIKELY');
  assert.equal(record.decisionReasonSecondary, 'MANAGEMENT_SCOPE_ABSENT');
});

test('buildDecisionRecord preserves the exact evidence fragment for future re-verification', () => {
  const record = buildDecisionRecord({
    decision: 'DO_NOT_APPLY',
    reason: 'Kötelező felsőfokú angol.',
    evidenceFragment: 'Elvárt: felsőfokú, tárgyalóképes angol nyelvtudás.',
  });
  assert.equal(record.evidenceFragment, 'Elvárt: felsőfokú, tárgyalóképes angol nyelvtudás.');
  assert.equal(record.decisionReasonPrimary, 'LANGUAGE_MANDATORY_ADVANCED_ENGLISH');
});

test('a reason with no recognizable category maps to OTHER, not fabricated', () => {
  assert.equal(normalizeDecisionReason('valami egészen más, korábban nem látott ok'), 'OTHER');
  assert.equal(normalizeDecisionReason(null), 'OTHER');
});

test('buildDecisionRecord requires poReason (not just the binary label) to be usable learning data', () => {
  const record = buildDecisionRecord({ decision: 'DO_NOT_APPLY', reason: null });
  assert.equal(record.poReason, null);
  assert.equal(record.decisionReasonPrimary, 'OTHER');
});
