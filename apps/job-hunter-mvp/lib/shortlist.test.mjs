import test from 'node:test';
import assert from 'node:assert/strict';
import { applyShortlistLimit, dedupeCrossSourceJobs, SHORTLIST_MAX } from './shortlist.mjs';

test('cross-source syndication duplicates collapse while preserving provenance', () => {
  const rows = [
    { title: 'E&P IT Operations Manager', company: 'MOL IT & Digital GBS Kft.', source: 'profession.hu', url: 'https://profession.hu/a', relevancePercent: 96 },
    { title: 'E&P IT Operations Manager', company: 'MOL Group', source: 'linkedin.com', url: 'https://linkedin.com/b', relevancePercent: 92 },
    { title: 'E&P IT Operations Manager', company: 'Unrelated Employer', source: 'other.hu', url: 'https://other.hu/c', relevancePercent: 90 },
  ];
  const result = dedupeCrossSourceJobs(rows);
  assert.equal(result.length, 2);
  assert.equal(result[0].url, 'https://profession.hu/a');
  assert.deepEqual(result[0].alternateSources, [{ source: 'linkedin.com', company: 'MOL Group', url: 'https://linkedin.com/b', relevancePercent: 92 }]);
});

test('shortlist keeps every score-qualified row auditable but shows at most 15', () => {
  const rows = Array.from({ length: 18 }, (_, i) => ({ title: `Role ${i}`, relevancePercent: 100 - i }));
  const result = applyShortlistLimit(rows);
  assert.equal(result.filter((row) => row.qualified).length, 18);
  assert.equal(result.filter((row) => row.visible).length, SHORTLIST_MAX);
  assert.equal(result[14].visible, true);
  assert.equal(result[15].qualified, true);
  assert.equal(result[15].visible, false);
});

test('shortlist never promotes a below-threshold row to fill a slot', () => {
  const result = applyShortlistLimit([{ title: 'Weak', relevancePercent: 59 }]);
  assert.equal(result[0].qualified, false);
  assert.equal(result[0].visible, false);
});

test('an acquired score-qualified canary replaces the lowest non-canary slot without bypassing the cap', () => {
  const rows = Array.from({ length: 17 }, (_, i) => ({
    title: `Role ${i}`,
    url: i === 16 ? 'https://example.test/known-canary' : `https://example.test/${i}`,
    relevancePercent: 100 - i,
  }));
  const result = applyShortlistLimit(rows, 15, ['known-canary']);
  assert.equal(result.filter((row) => row.visible).length, 15);
  assert.equal(result[16].qualified, true);
  assert.equal(result[16].visible, true);
  assert.equal(result[14].visible, false);
});
