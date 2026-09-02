# Claude proposal — Job Hunter search architecture

Written independently, before reading Codex's proposal.

1. **Discovery**: parse `profile/persona.md` into a structured taxonomy (target roles + synonyms, seniority, industry, exclude-terms) at startup; generate portal category URLs and search queries programmatically from it — never hardcoded strings.
2. **PRIMARY acquisition**: direct HTTP GET + per-portal HTML parser (not Firecrawl) against known static-HTML job portals (profession.hu, cvonline.hu) — these are server-rendered listing pages, so a paid markdown-conversion API is unnecessary for this step. Zero acquisition cost per listing page.
3. **FALLBACK acquisition**: Firecrawl `search()` for broader/employer-career-page discovery only when the primary path yields too few candidates, capped at ≤2 queries/run.
4. **Where Firecrawl is used at all**: (a) the capped fallback search, and (b) enrichment-only detail-page fetch for a small, capped set of candidates that already passed the cheap pre-filter and are still ambiguous. Never for routine listing scraping.
5. **Avoiding paid detail-crawl before relevance is known**: apply deterministic filters (profile-derived role/keyword match, language filter, company exclusion list) against listing-page title+snippet only, before any detail fetch. Rank survivors by a cheap heuristic; only top-N get a detail fetch.
6. **Query generation**: from the parsed persona taxonomy, not fixed strings — one query set per target role/seniority combination present in the profile.
7. **Combining sources**: portal direct-fetch first → Firecrawl general search second → no consumer-search-engine scraping, no ToS-violating aggregation.
8. **Stale/duplicate control**: keep URL-hash dedupe but add `first_seen`/`last_seen`; a URL absent from listings for >14 days is treated closed and dropped. Add a content fingerprint to catch reposts at a new URL.
9. **Hard budgets per run**: generous cap on free direct-fetch portal pages; ≤2 Firecrawl search() calls; ≤10 Firecrawl detail fetches chosen only after the cheap pre-filter; enforced by a pre-flight counter that hard-stops, not just logs.
10. **Smallest live falsification**: 1 direct-fetch of 1 known portal category page (0 Firecrawl calls, isolates discovery-breadth) + 1 Firecrawl `search()` call (isolates Firecrawl-availability, already shown blocked today by 402).
