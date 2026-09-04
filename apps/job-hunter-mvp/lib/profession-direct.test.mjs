// Tests derived from JH-SUP-0026 section 1.3 ("direct Profession discovery
// is active and produces real detail URLs") and section 1.3's failure-mode
// requirement (provider failure must not silently become success).
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDirectProfessionUrl, searchProfessionDirect, runDirectProfessionAcquisition } from './profession-direct.mjs';

test('buildDirectProfessionUrl produces the verified-live national keyword-search URL pattern', () => {
  const url = buildDirectProfessionUrl('informatikai vezető');
  assert.equal(url, 'https://www.profession.hu/allasok/1,0,0,informatikai%20vezet%C5%91');
});

test('searchProfessionDirect returns real detail URLs on a successful fetch', async () => {
  const fakeFetch = async (url) => ({ ok: true, status: 200, html: '<a href="/allas/real-job-1">x</a>' });
  const fakeExtract = (html, url, limit) => ({ detailLinks: ['https://www.profession.hu/allas/real-job-1'], totalDetailLinksFound: 1, filteredNonJobCount: 0 });
  const result = await searchProfessionDirect(fakeFetch, fakeExtract, 'IT vezető');
  assert.equal(result.ok, true);
  assert.deepEqual(result.detailUrls, ['https://www.profession.hu/allas/real-job-1']);
});

test('a transient failure is retried once before being reported', async () => {
  let calls = 0;
  const fakeFetch = async () => {
    calls++;
    if (calls === 1) return { ok: false, status: 500, error: 'HTTP 500' };
    return { ok: true, status: 200, html: '<a href="/allas/real-job-2">x</a>' };
  };
  const fakeExtract = () => ({ detailLinks: ['https://www.profession.hu/allas/real-job-2'], totalDetailLinksFound: 1, filteredNonJobCount: 0 });
  const result = await searchProfessionDirect(fakeFetch, fakeExtract, 'informatikai vezető', { retryDelayMs: 1 });
  assert.equal(calls, 2, 'must retry once on transient failure');
  assert.equal(result.ok, true);
});

test('a persistent failure is reported honestly, not silently dropped as an empty success', async () => {
  const fakeFetch = async () => ({ ok: false, status: 500, error: 'HTTP 500' });
  const fakeExtract = () => { throw new Error('must not be called on failure'); };
  const result = await searchProfessionDirect(fakeFetch, fakeExtract, 'IT vezető', { retryDelayMs: 1 });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'HTTP 500');
  assert.deepEqual(result.detailUrls, []);
});

test('runDirectProfessionAcquisition runs sequentially (not concurrently) across keywords and reports each honestly', async () => {
  const seenOrder = [];
  const fakeFetch = async (url) => {
    seenOrder.push(url);
    return { ok: true, status: 200, html: '<a href="/allas/x-1">x</a>' };
  };
  const fakeExtract = () => ({ detailLinks: ['https://www.profession.hu/allas/x-1'], totalDetailLinksFound: 1, filteredNonJobCount: 0 });
  const results = await runDirectProfessionAcquisition(fakeFetch, fakeExtract, ['a', 'b'], { staggerMs: 1 });
  assert.equal(results.length, 2);
  assert.ok(results.every((r) => r.ok));
  assert.equal(seenOrder.length, 2);
});

test('LIVE: a real direct Profession.hu query against a known-working keyword returns real detail URLs', { skip: !process.env.JOB_HUNTER_LIVE_TESTS }, async () => {
  const realFetch = async (url) => {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      return { ok: res.ok, status: res.status, html: await res.text() };
    } catch (err) {
      return { ok: false, status: null, error: err.message };
    }
  };
  const { extractJobLikeLinks } = await import('./links.mjs');
  const result = await searchProfessionDirect(realFetch, extractJobLikeLinks, 'informatikai vezető');
  assert.equal(result.ok, true);
  assert.ok(result.detailUrls.length > 0);
});
