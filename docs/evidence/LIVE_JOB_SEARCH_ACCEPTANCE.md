# Live Job Search Acceptance (JH-SUP-0003 section 5)

Executed 2026-09-02 against `job-hunter`, real network (`requests`), zero Firecrawl/Gemini/Telegram calls. This is the decision doc's own "smallest live falsification" experiment: 2 portal pages/portal (ProfessionAdapter + CVOnlineAdapter), no employer watchlist, no direct-detail enrichment, Firecrawl disabled.

## Result: ACCEPTED (for this bounded experiment's own falsification criterion)

Per the decision doc: "falsified if this bounded, zero-paid run produces fewer than three current candidates that a human judges plausibly relevant." This run produced far more than three.

## Final measured result

| Metric | Value |
|---|---|
| Queries issued | 2 (`it vezető budapest`, `it manager budapest`) × 2 portals = 4 requests |
| Firecrawl calls | 0 (disabled for this experiment) |
| Gemini calls | 0 (not reached -- this experiment stops at metadata ranking, per the decision doc) |
| Raw candidates (profession.hu) | 20 per query (40 total, real listings) |
| Raw candidates (cvonline.hu) | 0 per query (known adapter gap, unresolved -- see below) |
| Unique candidates | 32 |
| Cheap-filter survivors | 27 |
| Materially relevant IT-leadership jobs among survivors (sampled) | "IT igazgató" (IT Director), "Felhő- és Rendszertámogatás Vezető" (Cloud & Systems Support Lead), "E&P IT Operations Manager", "IT Szolgáltatás- és Működésfejlesztési menedzser", "Enterprise Server Services Team leader", "IT Rendszerszervező" (×3), "IT release megvalósítás menedzser", "Medior IT Rendszerszervező" -- 15+ of 27 survivors are materially on-target |

## Path to this result: three real defects found and fixed live, in order

This took three iterations against the real site, each one a genuine live falsification of the previous attempt -- none were guessed and left unverified.

1. **Wrong extraction pattern.** `ProfessionAdapter.extract()`'s original `job-card`/`job-item` CSS-class regex matched nothing real on the live page and fell through to garbage (an SVG icon URL, a YouTube link, an unrendered `{{ data.position }}` template placeholder). Fixed to match real `profession.hu/allas/<slug>-<id>` anchor tags directly.
2. **Title/URL mismatch.** Even after (1), title and URL were mismatched for every result -- each job URL appears twice in the raw HTML (a titleless `data-link` on an outer `<li>` wrapper, then the real titled `<a href>` anchor); a `rfind`/`find` "nearby tag" heuristic grabbed the wrong adjacent anchor. Fixed by matching the whole `<a href=...>` tag in one regex; verified `data-item-id` now matches each URL's own numeric suffix.
3. **Wrong query mechanism.** With extraction now correct, survivors still weren't relevant: `?keyword={query}` does not filter profession.hu's results at all (confirmed by comparing result sets across different keyword values -- identical generic listings). Inspected the real search form live: it POSTs a field named `adv_pattern` with a CSRF token to `/allasok`, which redirects to a GET-able path `https://www.profession.hu/allasok/1,0,0,{query}@1@1` -- the same URL shape `job-searcher`'s legacy `TARGET_URLS` already hardcoded (confirmed against `job-searcher/tools/scraper.py`). Verified this exact path returns materially IT-relevant titles without needing the session/CSRF-token dance. A follow-on extraction miss (some of that page's anchors append a `?keyword=...&hash=...` tracking query string the URL regex didn't allow) was found and fixed in the same pass.

All three fixes are committed with live-verification evidence in code comments; a regression test locks in fix (2) and (3) against a fixture reproducing both failure shapes (`tests/test_acquisition.py::test_profession_adapter_extracts_real_anchor_and_ignores_trailing_query_string`, `::test_profession_adapter_uses_the_real_search_url_pattern`).

## Known unresolved gap: CVOnlineAdapter

Returned 0 candidates in every run. The assumed `https://www.cvonline.hu/hu/allasok?search={query}` URL 404s; `/hu/allashirdetesek` (the real listings root) returns facet/category links, not individual postings, and the true search entrypoint was not identified within this round's live-verification budget. The adapter fails open (returns `[]`) rather than guessing another wrong pattern, documented in-code as a known gap for the next slice. This does not block acceptance of this experiment since profession.hu alone already exceeds the falsification threshold, but it means current coverage is single-portal.

## What this does and does not prove

The **acquisition architecture** (persona-driven query planning, pre-flight hard budgets, metadata-only cheap filter before any paid call, portal-native-first with Firecrawl demoted to capped fallback, freshness-aware dedupe) behaved exactly as designed: zero paid calls were made, and once the query mechanism was correct, real relevant candidates were found without spending any Firecrawl/Gemini budget.

This is a bounded, single-portal, metadata-only result -- it does not yet include LLM ranking (deliberately, per the decision doc's falsification design), detail-page enrichment, or a full-run cost/budget demonstration under `mock_mode=False`'s actual entrypoint. A fuller end-to-end run (including analyzer scoring and notification) is the next natural verification step, not yet performed.

## Next required step

1. Identify cvonline.hu's real search mechanism live (same method as profession.hu: inspect the actual search form, don't guess a URL).
2. Run a fuller live experiment including LLM ranking and notification, still within the decision doc's request/cost budget, to demonstrate the complete pipeline end-to-end.
