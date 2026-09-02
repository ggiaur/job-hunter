# Live Job Search Acceptance (JH-SUP-0003 section 5)

Executed 2026-09-02 against `job-hunter` @ this commit, real network (`requests`), zero Firecrawl/Gemini/Telegram calls. This is the decision doc's own "smallest live falsification" experiment: 2 portal pages/portal (ProfessionAdapter + CVOnlineAdapter), no employer watchlist, no direct-detail enrichment, Firecrawl disabled.

## Result: NOT ACCEPTED

Per JH-SUP-0003's own rule ("If the live result still does not produce materially suitable jobs, the task is NOT accepted even if all automated tests pass"), this run does not meet acceptance. Recorded honestly, not presented as success.

## What was measured

| Metric | Value |
|---|---|
| Queries issued | 2 (`it vezető budapest`, `it manager budapest`) × 2 portals = 4 requests |
| Firecrawl calls | 0 (disabled for this experiment) |
| Gemini calls | 0 (not reached -- this experiment stops at metadata ranking, per the decision doc) |
| Raw candidates (profession.hu) | 20 per query (40 total, real server-rendered listings) |
| Raw candidates (cvonline.hu) | 0 per query (known adapter gap, see below) |
| Unique candidates | 21 |
| Cheap-filter survivors | 7 |
| Materially relevant IT-leadership jobs among survivors | **0** |

## Bugs found and fixed live during this run (all committed)

1. `ProfessionAdapter.extract()`'s original `job-card`/`job-item` CSS-class regex matched nothing real on the live page -- it fell through to garbage (an SVG icon URL, a YouTube link, an unrendered `{{ data.position }}` template placeholder). Rewrote to match real `profession.hu/allas/<slug>-<id>` anchor tags directly (the same URL shape job-searcher's legacy scraper already proved works). This alone took raw candidates from 94 garbage matches/query to 20 real listings/query.
2. Even after fixing the anchor match, title and URL were mismatched for every result (e.g. "Targoncavezető" title paired with a "Logisztikai munkatárs" URL). Root cause: each real job URL appears twice in the raw HTML -- once in a `data-link` attribute on an outer `<li>` wrapper (no title), once inside the real `<a href=... data-item-name=...>` anchor. The first fix used `rfind`/`find` to locate a "nearby" `<a>` tag around a bare URL match, which grabbed the wrong (adjacent job's) anchor. Fixed by matching the whole `<a href=...>` tag in one regex, eliminating the ambiguity. Verified: `source_job_id` (from `data-item-id`) now matches the URL's own numeric suffix for every result.

## Root cause of the remaining NOT ACCEPTED result

Both fixes above were about extraction *correctness*, not extraction *relevance*. With extraction now correct, the 7 cheap-filter survivors are still not materially IT-leadership roles (a forklift-operator posting, a deputy shop manager, an insurance sales manager, an HR talent-development manager, one plausibly-adjacent "Incident Management Reliability Engineer"). This means **`https://www.profession.hu/allasok?keyword={query}` does not actually filter results by the keyword** -- profession.hu returns what looks like a generic/default listing page regardless of the `keyword` value tried. This is a query-mechanism defect, separate from and downstream of the two extraction bugs above.

`CVOnlineAdapter` returned 0 candidates in every run: the assumed `https://www.cvonline.hu/hu/allasok?search={query}` URL 404s. The real search entrypoint was not identified within this round's live-verification budget; the adapter now fails open (returns `[]`) rather than guessing another wrong pattern, and is documented in-code as a known gap.

## What this does and does not falsify

The **acquisition architecture** (persona-driven query planning, pre-flight hard budgets, metadata-only cheap filter before any paid call, portal-native-first with Firecrawl demoted to capped fallback, freshness-aware dedupe) is not falsified by this result -- it behaved exactly as designed: zero paid calls were made, the budget/dedupe/filter pipeline ran correctly end-to-end, and it correctly ran out of relevant material because the underlying query mechanism doesn't work yet, not because the pipeline logic is wrong.

What **is** falsified is the specific "guess a `?keyword=` query-string parameter" approach to querying profession.hu, and the unverified `cvonline.hu` URL shape.

## Next required step (not yet started)

Identify each portal's real search mechanism live (inspect the actual search form's real parameter name/method on profession.hu; find cvonline.hu's real listing/search URL) before re-running this same falsification experiment. Do not re-attempt without live verification of the exact parameter, per this same round's own lesson (two guessed patterns already failed live: the CSS-class card regex, the `cvonline.hu` search URL, and the `?keyword=` filter parameter).
