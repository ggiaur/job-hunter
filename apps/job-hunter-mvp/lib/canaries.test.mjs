// Tests derived from JH-SUP-0026 section 2: canary discovery-through-real-
// acquisition invariant, not injection. Revised after an independent Codex
// adversarial review (2026-09-04) found the original version treated bare
// URL presence (added before any fetch) as "acquired" -- these tests now
// exercise the real stage-evidence fetch outcome.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CANARIES, checkCanaries, allCanariesAcquired, allCanariesReachedScoring } from './canaries.mjs';

function row(url, overrides = {}) {
  return { url, fetch: { attempted: true, ok: true, status: 200, error: null }, ...overrides };
}

test('a canary that reached the visible results set is ACQUIRED_VISIBLE', () => {
  const results = [{ url: 'https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550', visible: true, relevancePercent: 85 }];
  const rows = [row(results[0].url)];
  const check = checkCanaries(rows, { results });
  const piller = check.find((c) => c.id === 'piller-nonprofit-projektmenedzser');
  assert.equal(piller.status, 'ACQUIRED_VISIBLE');
  assert.equal(piller.score, 85);
});

test('a canary that scored below the visible threshold is ACQUIRED_SCORED_BELOW_THRESHOLD, not a failure', () => {
  const results = [{ url: 'https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550', visible: false, relevancePercent: 45 }];
  const rows = [row(results[0].url)];
  const check = checkCanaries(rows, { results });
  assert.equal(check[0].status, 'ACQUIRED_SCORED_BELOW_THRESHOLD');
});

test('a canary that was hard-excluded is ACQUIRED_EXCLUDED, not NOT_ACQUIRED -- exclusion after real evaluation is legitimate', () => {
  const excluded = [{ url: 'https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550', exclusionReason: 'Kizárva: teszt ok.' }];
  const rows = [row(excluded[0].url)];
  const check = checkCanaries(rows, { excluded });
  assert.equal(check[0].status, 'ACQUIRED_EXCLUDED');
  assert.equal(check[0].exclusionReason, 'Kizárva: teszt ok.');
});

test('a canary never discovered at all (no stage-evidence row) is NOT_ACQUIRED -- the original Pillér-miss failure mode', () => {
  const check = checkCanaries([], {});
  assert.ok(check.every((c) => c.status === 'NOT_ACQUIRED'));
  assert.equal(allCanariesAcquired(check), false);
  assert.equal(allCanariesReachedScoring(check), false);
});

test('a canary discovered but whose fetch failed is FETCH_FAILED, distinct from never having tried', () => {
  const url = `https://www.profession.hu/allas/${CANARIES[1].urlFragment}-9999999`;
  const rows = [row(url, { fetch: { attempted: true, ok: false, status: null, error: 'fetch failed' } })];
  const check = checkCanaries(rows, {});
  const enco = check.find((c) => c.id === CANARIES[1].id);
  assert.equal(enco.status, 'FETCH_FAILED');
  assert.equal(enco.fetchError, 'fetch failed');
  // FETCH_FAILED still counts as "acquired" (a real attempt was made, with
  // an explicit evidence-backed source failure) but NOT as "reached scoring".
  assert.equal(allCanariesAcquired([enco]), true);
  assert.equal(allCanariesReachedScoring([enco]), false);
});

test('a canary whose fetch succeeded but never reached results/excluded (e.g. no JobPosting schema) is ACQUIRED_UNSCORED', () => {
  const url = `https://www.profession.hu/allas/${CANARIES[2].urlFragment}-9999999`;
  const rows = [row(url)];
  const check = checkCanaries(rows, {});
  const swiss = check.find((c) => c.id === CANARIES[2].id);
  assert.equal(swiss.status, 'ACQUIRED_UNSCORED');
  assert.equal(allCanariesReachedScoring([swiss]), false);
});

test('allCanariesReachedScoring is true only when every canary genuinely reached scoring (visible, below-threshold, or excluded)', () => {
  const rows = CANARIES.map((c) => row(`https://www.profession.hu/allas/${c.urlFragment}-9999999`));
  const results = [
    { url: rows[0].url, visible: true, relevancePercent: 85 },
    { url: rows[1].url, visible: false, relevancePercent: 40 },
  ];
  const excluded = [{ url: rows[2].url, exclusionReason: 'test' }];
  const check = checkCanaries(rows, { results, excluded });
  assert.equal(allCanariesReachedScoring(check), true);
});
