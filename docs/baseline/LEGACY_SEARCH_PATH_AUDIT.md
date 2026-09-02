# Legacy Search Path Audit — job-searcher (JH-SUP-0002 STEP D)

Source: `ggiaur/job-searcher` @ `03b269e`. Read-only code inspection, no live run.

1. **Entrypoint**: `main.py` → `JobSearchAgent().run()` (`agents/job_search_agent.py:27`).

2. **Query generation**: two independent, both hardcoded, no query-planning logic:
   - `scrape_jobs()` uses a fixed list of 7 target listing-page URLs (`tools/scraper.py:152-160`), overridable only via `TARGET_URLS` env var (whole-list replacement, not per-run planning).
   - `search_jobs()` uses 3 fixed Hungarian query strings (`tools/scraper.py:203-207`), not parameterized by profile/persona content.

3. **Discovery source**: Firecrawl (`firecrawl-py`, `V1FirecrawlApp`) is the only acquisition backend — both the fixed-URL scrape and the general web search go through the same Firecrawl API key (`tools/scraper.py:108-109, 230`).

4. **Firecrawl call sites**:
   - `scrape_url()` once per target URL in `scrape_jobs()` — `tools/scraper.py:166`.
   - `search()` once per query in `search_jobs()` — `tools/scraper.py:230`.
   - `scrape_url()` again per job needing detail enrichment in `scrape_job_detail()` — `tools/scraper.py:291`, invoked from `agents/job_search_agent.py:87` whenever `len(description) < 200`.

5. **Firecrawl calls per normal run**: 7 (fixed listing scrapes) + 3 (search queries) = 10 fixed calls, **plus one detail-page scrape per short-description job** — up to `MAX_JOBS_LIMIT=100` (`tools/scraper.py:11`) more, bounded only reactively by a 3-consecutive-failure circuit breaker (`agents/job_search_agent.py:104-106`), not by a pre-run budget. This is the dominant, uncapped cost driver.

6. **Pages fetched before relevance is known**: all 7 fixed listing pages and all 3 search-result sets are fetched unconditionally every run, before any relevance scoring. Detail-page fetches happen before Gemini scoring too — relevance is only ever known *after* the Firecrawl spend for that job.

7. **Gemini call site**: `JobAnalyzer.analyze_job()` (`tools/analyzer.py:115`), called once per surviving candidate from `agents/job_search_agent.py:126`, to produce a 0-100 relevance score + summary via structured JSON output.

8. **Scoring/ranking**: Gemini score (0-100) against `RELEVANCE_THRESHOLD=60` (`agents/job_search_agent.py:13,172`); `preferred_companies.yaml` gives a flat +10 bonus (`tools/analyzer.py:225-227`); `exclusions.yaml` company match short-circuits to score 0 without calling Gemini (`tools/analyzer.py:137-142`). Ordering (not filtering) also applies a title-keyword "priority" pass before analysis (`agents/job_search_agent.py:49-60`).

9. **Profile/preferences applied**: `profile/persona.md` (static rules) + `profile/learned_preferences.md` (feedback-derived) concatenated into every Gemini prompt (`tools/analyzer.py:15-31,184`); `profile/exclusions.yaml` / `profile/preferred_companies.yaml` for the deterministic company gate; a code-level Hungarian-vs-high-English-requirement filter runs before Gemini is even called (`agents/job_search_agent.py:116-122`, `tools/language_filter.py`).

10. **Duplicate/stale handling**: `JobStorage.is_duplicate()` — SHA-256 of the URL as Firestore doc ID in the `jobs` collection (`tools/storage.py:87-101,168-170`), checked once per candidate before analysis (`agents/job_search_agent.py:67-70`) and again defensively inside `save_job()` (`tools/storage.py:109`). No staleness/expiry logic — a URL once saved is a duplicate forever, and no re-check of whether a previously-seen listing is still open.

11. **Mechanism that can cause good jobs to be missed**:
    - Fixed 7-URL + 3-query universe covers only profession.hu/cvonline.hu/nofluffjobs.com plus whatever those 3 static queries surface — no LinkedIn/Indeed/employer-career-page discovery despite those domains being recognized in `JOB_BOARD_DOMAINS` (`tools/scraper.py:36-47`).
    - `is_job_detail_url()`'s "≥2 path segments, last segment not a generic word" heuristic (`tools/scraper.py:50-75`) can reject legitimate single-segment or generically-named employer job pages.
    - A single `GeminiQuotaExceededError` aborts the **entire remaining run** (`agents/job_search_agent.py:129-146`) — every candidate after the one that trips quota is never scored, regardless of relevance, for that run.

12. **Mechanism that can cause irrelevant jobs to survive**:
    - The pre-Gemini keyword filter is a narrow blacklist with an IT/vezető override that can under-fire (`agents/job_search_agent.py:74-77`).
    - Final relevance gate is Gemini's own subjective 0-100 judgment against a persona prompt — no deterministic hard requirements beyond language and the company exclusion list, so scoring drift/hallucination directly controls what "survives."

13. **Firecrawl quota amplification mechanism**: `search_jobs()`'s general web search frequently returns portal *category/listing* pages rather than individual postings (documented in-code, `tools/scraper.py:238-249`) — each such page, if not filtered by `is_job_detail_url()`, would have consumed a further detail-scrape + Gemini call. The detail-enrichment path (`scrape_job_detail()`, called for **any** candidate with a short description, up to 100/run) is the largest single amplifier: it is proportional to candidate count, not to relevance, since relevance isn't known until after Gemini scores the enriched text.
