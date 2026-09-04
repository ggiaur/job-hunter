// Tests derived from JH-SUP-0026 section 2: canary discovery-through-real-
// acquisition invariant, not injection.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CANARIES, checkCanaries, allCanariesAcquired } from './canaries.mjs';

test('a canary that reached the visible results set is ACQUIRED_VISIBLE', () => {
  const results = [{ url: 'https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550', visible: true, relevancePercent: 85 }];
  const check = checkCanaries([results[0].url], { results });
  const piller = check.find((c) => c.id === 'piller-nonprofit-projektmenedzser');
  assert.equal(piller.status, 'ACQUIRED_VISIBLE');
  assert.equal(piller.score, 85);
});

test('a canary that scored below the visible threshold is ACQUIRED_SCORED_BELOW_THRESHOLD, not a failure', () => {
  const results = [{ url: 'https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550', visible: false, relevancePercent: 45 }];
  const check = checkCanaries([results[0].url], { results });
  assert.equal(check[0].status, 'ACQUIRED_SCORED_BELOW_THRESHOLD');
});

test('a canary that was hard-excluded is ACQUIRED_EXCLUDED, not NOT_ACQUIRED -- exclusion after real evaluation is legitimate', () => {
  const excluded = [{ url: 'https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550', exclusionReason: 'Kizárva: teszt ok.' }];
  const check = checkCanaries([excluded[0].url], { excluded });
  assert.equal(check[0].status, 'ACQUIRED_EXCLUDED');
  assert.equal(check[0].exclusionReason, 'Kizárva: teszt ok.');
});

test('a canary never fetched at all is NOT_ACQUIRED -- the real Pillér-miss failure mode', () => {
  const check = checkCanaries([], {});
  assert.ok(check.every((c) => c.status === 'NOT_ACQUIRED'));
  assert.equal(allCanariesAcquired(check), false);
});

test('a canary only fetched but never scored (unreachable/unclassified) is ACQUIRED_UNSCORED, not silently missing', () => {
  const trackedUrls = ['https://www.profession.hu/allas/senior-it-projektmenedzser-en-co-software-zrt-budapest-2974271'];
  const check = checkCanaries(trackedUrls, {});
  const enco = check.find((c) => c.id === 'en-co-software-senior-it-projektmenedzser');
  assert.equal(enco.status, 'ACQUIRED_UNSCORED');
});

test('allCanariesAcquired is true only when every canary was at least fetched', () => {
  const trackedUrls = CANARIES.map((c) => `https://www.profession.hu/allas/${c.urlFragment}-9999999`);
  const check = checkCanaries(trackedUrls, {});
  assert.equal(allCanariesAcquired(check), true);
});
