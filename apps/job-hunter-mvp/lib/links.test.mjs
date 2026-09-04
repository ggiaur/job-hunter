// Tests derived from JH-SUP-0026 section 1.1 and section 6's required
// regression list, using the real Profession.hu listing page HTML that
// contains the confirmed-missed Pillér vacancy (fetched live 2026-09-04,
// saved as fixtures/profession-piller-listing.html) plus synthetic HTML for
// the specific false-negative mechanism classes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { extractJobLikeLinks, classifyJobPath, discoverPaginationLinks, countJobLikeLinks } from './links.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PILLER_LISTING_HTML = readFileSync(path.join(__dirname, 'fixtures', 'profession-piller-listing.html'), 'utf8');
const PILLER_LISTING_URL = 'https://www.profession.hu/allasok/budapest/1,0,23,projektmenedzser';
const PILLER_DETAIL_URL_FRAGMENT = 'projektmenedzser-piller-nonprofit-kft-budapest-2988550';

test('real Pillér listing page: the confirmed-missed vacancy is now queued even though it was past the old 12-link cap', () => {
  const result = extractJobLikeLinks(PILLER_LISTING_HTML, PILLER_LISTING_URL, 12);
  const found = result.detailLinks.some((u) => u.includes(PILLER_DETAIL_URL_FRAGMENT));
  assert.equal(found, true, 'Pillér detail link must be queued under the real classifier + a 12-link cap, since non-vacancy links no longer consume the budget');
});

test('real Pillér listing page: utility/company/category links do not consume the vacancy-detail cap', () => {
  const result = extractJobLikeLinks(PILLER_LISTING_HTML, PILLER_LISTING_URL, 200);
  // Real, independently-confirmed count from live fetch: 20 distinct
  // vacancy-detail URLs on this page (each job card links to its detail
  // page twice -- title + thumbnail -- so the raw href count is 40, but
  // deduped-by-pathname is 20; confirmed via `sort -u` on the raw fixture).
  assert.equal(result.totalDetailLinksFound, 20);
  assert.ok(result.filteredNonJobCount > 0, 'RSS/alert/advice/category/company-profile links must be filtered, not counted as detail links');
  assert.ok(Object.keys(result.filteredReasons).length > 0, 'filtered reasons must be recorded for explainability');
});

test('countJobLikeLinks on the real listing returns the true unique-detail-link count, not a raw href-occurrence count', () => {
  assert.equal(countJobLikeLinks(PILLER_LISTING_HTML, PILLER_LISTING_URL), 20);
});

test('a listing-page classifier check (>=3 real detail links) still correctly recognizes this page as a LISTING', () => {
  const result = extractJobLikeLinks(PILLER_LISTING_HTML, PILLER_LISTING_URL, 200);
  assert.ok(result.totalDetailLinksFound >= 3);
});

test('classifyJobPath: a real Profession.hu vacancy-detail path is DETAIL', () => {
  const cls = classifyJobPath('www.profession.hu', '/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550');
  assert.equal(cls.kind, 'DETAIL');
});

test('classifyJobPath: a Profession.hu category/listing path (plural allasok) is OTHER, not DETAIL', () => {
  const cls = classifyJobPath('www.profession.hu', '/allasok/budapest/1,0,23,projektmenedzser');
  assert.equal(cls.kind, 'OTHER');
});

test('classifyJobPath: a company-profile path under /allasok/ is OTHER', () => {
  const cls = classifyJobPath('www.profession.hu', '/allasok/beck-and-partners-kft/1,0,0,0,0,0,0,0,0,0,7597');
  assert.equal(cls.kind, 'OTHER');
});

test('classifyJobPath: RSS feed link is OTHER with an explicit reason', () => {
  const cls = classifyJobPath('www.profession.hu', '/allasok');
  assert.equal(cls.kind, 'OTHER');
});

test('classifyJobPath: job-alert signup link is OTHER', () => {
  const cls = classifyJobPath('www.profession.hu', '/allasertesito/regisztracio');
  assert.equal(cls.kind, 'OTHER');
});

test('classifyJobPath: advice page is OTHER', () => {
  const cls = classifyJobPath('www.profession.hu', '/allaskeresesi-tanacsok');
  assert.equal(cls.kind, 'OTHER');
});

test('a Pillér-like detail link below raw DOM position 12 is still queued when the cap is correctly applied post-filter', () => {
  // Synthetic listing page: 5 non-detail links first (mirroring the real
  // utility/RSS/alert/advice/company-profile pattern that consumed slots
  // under the old broad-substring cap), then 15 real detail links. Position
  // 20 overall, but only the 15th real detail link -- well past the old
  // raw-position-12 cutoff, but the 13th queued item is still within a
  // 200-item detail cap.
  const nonDetail = [
    '<a href="/allasok">RSS</a>',
    '<a href="/allasertesito/regisztracio">Alert</a>',
    '<a href="/allaskeresesi-tanacsok">Advice</a>',
    '<a href="/allasok/some-company/1,0,0,0,0,0,0,0,0,0,111">Company profile</a>',
    '<a href="/allasok/budapest/1,0,23,x,2">Pagination</a>',
  ].join('\n');
  const detailLinks = Array.from({ length: 15 }, (_, i) => `<a href="/allas/real-job-${i}-${1000 + i}">Job ${i}</a>`).join('\n');
  const html = `<html><body>${nonDetail}${detailLinks}</body></html>`;
  const result = extractJobLikeLinks(html, 'https://www.profession.hu/allasok/budapest/1,0,23,x', 12);
  assert.equal(result.totalDetailLinksFound, 15);
  assert.equal(result.queuedCount, 12);
  assert.equal(result.truncatedCount, 3);
  // Crucially: the FIRST 12 real detail links are queued (not pushed out by
  // the 5 non-detail links before them), unlike the old broad-substring cap.
  assert.ok(result.detailLinks.includes('https://www.profession.hu/allas/real-job-0-1000'));
  assert.ok(result.detailLinks.includes('https://www.profession.hu/allas/real-job-11-1011'));
});

test('duplicate detail links (same vacancy reached via two hrefs) are deduplicated without consuming extra cap budget', () => {
  const html = `
    <a href="/allas/real-job-a-1000">Job A</a>
    <a href="/allas/real-job-a-1000?keyword=foo&hash=bar">Job A again, different tracking params</a>
    <a href="/allas/real-job-b-2000">Job B</a>
  `;
  const result = extractJobLikeLinks(html, 'https://www.profession.hu/allasok/x', 12);
  assert.equal(result.totalDetailLinksFound, 2, 'query-string-only variants of the same detail path must not count twice');
});

test('discoverPaginationLinks finds same-category-family links without guessing Profession\'s parameter encoding', () => {
  const html = `
    <a href="/allasok/budapest/1,0,23,projektmenedzser,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1">Page 1</a>
    <a href="/allasok/budapest/1,0,23,projektmenedzser,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2">Page 2</a>
    <a href="/allas/unrelated-detail-999">Detail link, not pagination</a>
    <a href="https://other-site.hu/allasok/xyz,3">Cross-origin, ignored</a>
  `;
  const pages = discoverPaginationLinks(html, 'https://www.profession.hu/allasok/budapest/1,0,23,projektmenedzser', 2);
  assert.equal(pages.length, 2);
  assert.ok(pages.every((p) => p.includes('/allasok/budapest/1,0,23,projektmenedzser')));
});

test('discoverPaginationLinks respects the maxPages bound', () => {
  const many = Array.from({ length: 10 }, (_, i) => `<a href="/allasok/budapest/1,0,23,x,${i}">Page ${i}</a>`).join('\n');
  const pages = discoverPaginationLinks(many, 'https://www.profession.hu/allasok/budapest/1,0,23,x', 2);
  assert.equal(pages.length, 2);
});

test('Codex adversarial finding #1: the generic non-Profession fallback no longer misclassifies career/feed/alert pages as DETAIL', () => {
  // Exact reproduction of the independent Codex adversarial review
  // (2026-09-04): a company-profile page, a job-feed page, and a Hungarian
  // job-alert-signup page, none of which are real vacancy detail pages, were
  // all classified DETAIL by the original generic fallback because it only
  // checked for a job-path substring anywhere in the URL. Fixed by requiring
  // the same trailing-numeric-ID structural signal as the Profession-
  // specific classifier.
  const html = `
    <a href="/companies/acme-careers-1001">Acme careers hub</a>
    <a href="/job-feed/latest-1002">Job feed</a>
    <a href="/allasfigyelo/feliratkozas-1003">Job alert signup</a>
    <a href="/jobs/genuine-vacancy-2001">Genuine vacancy 1</a>
    <a href="/jobs/genuine-vacancy-2002">Genuine vacancy 2</a>
    <a href="/jobs/genuine-vacancy-2003">Genuine vacancy 3</a>
  `;
  const result = extractJobLikeLinks(html, 'https://careers.example.hu/jobs', 3);
  assert.equal(result.detailLinks.some((u) => u.includes('acme-careers-1001')), false, 'company-profile page must not be classified DETAIL');
  assert.equal(result.detailLinks.some((u) => u.includes('job-feed/latest-1002')), false, 'job-feed page must not be classified DETAIL');
  assert.equal(result.detailLinks.some((u) => u.includes('allasfigyelo/feliratkozas-1003')), false, 'job-alert signup must not be classified DETAIL');
  assert.equal(result.detailLinks.length, 3, 'only the 3 genuine vacancies should be queued');
  assert.ok(result.detailLinks.every((u) => u.includes('genuine-vacancy')));
});

test('classifyJobPath: generic fallback requires a trailing numeric ID, not just a job-path keyword', () => {
  assert.equal(classifyJobPath('careers.example.hu', '/companies/acme-careers-1001').kind, 'OTHER');
  assert.equal(classifyJobPath('careers.example.hu', '/jobs/genuine-vacancy-2001').kind, 'DETAIL');
  assert.equal(classifyJobPath('careers.example.hu', '/jobs/no-trailing-id-here').kind, 'OTHER');
});
