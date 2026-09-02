# ChatGPT proposal — Google-in-browser acquisition for Job Hunter

## Goal

Replicate the Product Owner's successful manual behavior as closely as practical: open a normal browser, submit an ordinary Google query, inspect the result page, and only then open promising job pages. Google is used as the discovery surface; Firecrawl is not used for broad discovery.

## Proposed primary mechanism

Use Playwright against a real Chromium/Chrome browser session in the cloud, preferably through Playwright MCP/CLI so Claude can operate the browser deterministically through the accessibility tree rather than image coordinates.

Use a persistent browser profile so cookies/consent state survive restarts. Do not use stealth plugins, CAPTCHA bypasses, proxy rotation, fingerprint spoofing, or anti-bot circumvention. If Google presents a consent/CAPTCHA/account action that requires a person, classify it as BLOCKED_HUMAN_PERMISSION.

## Search flow

1. Query planner creates a small set of plain-language Google queries from the real Candidate Profile. These should look like searches a human would actually type, not a giant synthetic Boolean expression.
2. Open Google in the persistent browser session.
3. Enter one query into the Google search box and submit it through normal browser interaction.
4. Read the result page through the browser accessibility/DOM representation.
5. Extract only organic result title, URL and snippet. Ignore ads and unrelated navigation.
6. Apply a cheap local relevance pass using title/snippet/domain/location before visiting any result.
7. Open only the highest-potential candidates in the same browser session.
8. Detect whether the destination is a real current job detail page. Extract enough metadata for ranking.
9. Only after cheap filtering should an LLM perform deeper relevance scoring.
10. Store query -> result -> click -> relevance outcome so future query generation can learn which wording produces useful jobs.

## Why this should be the first design tested

- It matches the Product Owner's proven manual workflow instead of inventing a search provider abstraction first.
- It does not require Firecrawl to discover candidates.
- A browser can access ordinary Google result pages and then follow links exactly as a user does.
- Playwright supports persistent contexts/profiles and Chrome/Chromium browser control, making the session state durable enough for repeated searches.
- The acquisition layer can remain simple: `GoogleBrowserSearch(query) -> SearchResult[]`.

## Hard operating limits

- One browser session; one active query at a time.
- Initial proof: maximum 3 Google queries, first results page only.
- No automated pagination in the first proof.
- No paid crawling during discovery.
- Maximum 10 result links considered per query.
- Maximum 5 destination pages opened per query during the proof.
- Stop immediately on CAPTCHA/automation challenge; do not bypass it.
- No Google account login unless the Product Owner explicitly chooses that operating model.

## Result schema

Each Google result should become a minimal record:

- query
- rank
- title
- snippet
- url
- domain
- discovered_at
- cheap_relevance_score
- opened (bool)
- job_detail_verified (bool)
- final_relevance_score (optional)

## Architecture boundary

Keep Google browser discovery separate from job-detail extraction:

`QueryPlanner -> GoogleBrowserSearch -> CheapCandidateFilter -> JobPageVerifier/Extractor -> RelevanceRanker -> Memory`

This matters because the browser search must remain replaceable if Google browser automation proves operationally unreliable.

## Fallbacks to compare, not silently substitute

1. A second browser-search provider/search engine using the same result contract.
2. An official programmatic search service where available.
3. Direct portal-native search for known high-value job boards.

Google's legacy Custom Search JSON API is not a good new primary dependency in 2026: Google's current developer documentation says it is closed to new customers and existing customers must transition by 2027-01-01. Therefore the four-AI review should not assume that API solves this requirement.

## Questions the four-AI design must settle

1. Is direct Playwright/Chrome interaction with google.com operationally stable enough in the actual cloud runtime?
2. Headed persistent Chrome, Playwright Chromium, or attach-to-existing-Chrome via CDP: which is most reliable here?
3. Can result extraction rely on accessible roles/links rather than brittle CSS selectors?
4. What exact stop behavior is required on consent/CAPTCHA/automation challenge?
5. Should the browser run logged out by default?
6. What query count and click budget gives useful recall without looking like a crawler?
7. What minimal PoC proves that this approach finds the same kind of jobs the Product Owner finds manually?

## PoC acceptance proposal

No production implementation yet. A later explicitly authorized PoC should be considered successful only if, from a clean/persistent normal browser session:

- it submits 3 normal Google queries through the Google UI;
- captures the first-page organic results correctly;
- follows a bounded subset of relevant links;
- finds at least 3 genuinely suitable current job postings that the Product Owner recognizes as plausible matches;
- uses zero Firecrawl calls for discovery;
- records every query/click/result so the run is reproducible;
- encounters no bypass/evasion behavior.
