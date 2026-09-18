// Two honesty properties of the published report.
//
// 1. A re-scored snapshot must never read as a fresh search.
//    scripts/rescore-snapshot.mjs recomputes scores from advert text a previous
//    run already stored, and deliberately keeps the ORIGINAL acquisition
//    timestamp -- so "Frissítve" alone cannot distinguish a re-score from a live
//    run. Without an explicit line the PO would read stale vacancies as freshly
//    verified, and might apply to something already filled.
//
// 2. A caveat that is no longer true must be removed.
//    The header used to end with "Munkáltatói névváltozatok miatt duplikáció
//    maradhat." -- a disclosed defect rather than a fixed one. Now that
//    lib/vacancy-dedup.mjs collapses those variants the sentence is false, and a
//    false caveat teaches the reader to skip the caveats that still matter.

import test from 'node:test';
import assert from 'node:assert/strict';
import { currentResultsMarkdown } from './current-report.mjs';

const BASE = {
  generatedAt: '2026-09-17T08:14:05.397Z',
  visibleThreshold: 60,
  results: [],
  excluded: [],
};
const OPTS = { snapshotRelative: 's.json', htmlRelative: 'h.html' };

test('a re-scored snapshot is explicitly labelled as not a new search', () => {
  const md = currentResultsMarkdown(
    { ...BASE, rescoredAt: '2026-09-17T22:10:00.000Z', rescoredFrom: 'docs/evidence/real-job-hunter-current-run.json' },
    OPTS
  );
  assert.match(md, /újrapontozás, nem új keresés/);
  assert.match(md, /kvóta nem fogyott/);
  assert.match(md, /2026-09-17T22:10:00\.000Z/, 'the re-score time must be visible, not just the acquisition time');
  assert.match(md, /2026-09-17T08:14:05\.397Z/, 'the acquisition time must still be shown');
});

test('a genuine live run carries no re-score disclaimer', () => {
  const md = currentResultsMarkdown(BASE, OPTS);
  assert.ok(!/újrapontozás/.test(md), 'an always-on notice would be noise');
});

test('the duplicate caveat that dedup made false is gone', () => {
  for (const run of [BASE, { ...BASE, rescoredAt: '2026-09-17T22:10:00.000Z' }]) {
    const md = currentResultsMarkdown(run, OPTS);
    assert.ok(!/duplikáció maradhat/.test(md));
  }
});

// 3. A run that had no search provider covered a fraction of the market, so its
//    ABSENCES say nothing about what jobs exist.
//
//    Measured: CI run 35289908379 (2026-09-18) had an empty SERPAPI_API_KEY
//    secret, fell back to direct-Profession-only acquisition, checked 137 advert
//    pages instead of 682, produced 4 candidates instead of 16, and published
//    that list over a better-covered one. The only signal was a log line nobody
//    reads. The published report has to say it.
test('a run without a search provider is labelled as reduced coverage', () => {
  const md = currentResultsMarkdown(
    { ...BASE, searchCredentialAvailable: false, confirmedJobAdPages: 137 },
    OPTS
  );
  assert.match(md, /szűkebb|csökkentett|hiányos/i);
  assert.match(md, /nem bizonyítja|nem jelenti/i, 'must say the absences prove nothing');
});

test('a fully-sourced run carries no reduced-coverage warning', () => {
  const md = currentResultsMarkdown(
    { ...BASE, searchCredentialAvailable: true, confirmedJobAdPages: 682 },
    OPTS
  );
  assert.ok(!/csökkentett lefedettség/i.test(md), 'an always-on warning would be noise');
});
