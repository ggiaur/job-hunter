# Codex proposal — bounded, metadata-first job acquisition

**Outcome:** find current, suitable leadership jobs without making paid page
crawling the discovery mechanism. This replaces the legacy order of seven
listing scrapes plus three searches before relevance is known
(`tools/scraper.py:152-166`, `tools/scraper.py:203-230`), and its short-text
detail fan-out (`agents/job_search_agent.py:79-106`).

## 1. Discovery

Run source-specific adapters against public, first-party job-listing search
results: title, employer, location, posted/closing date, salary, source job ID,
URL, and result-card excerpt. Do not parse arbitrary Markdown links or decide
that an employer URL is a job from its shape; both are brittle in the legacy
implementation (`tools/scraper.py:309-368`, `tools/scraper.py:50-75`). Normalize
those fields into a candidate record, then deduplicate and cheaply score it.

## 2. PRIMARY acquisition path

Use the native search/listing endpoints of a small, measured set of Hungarian
portals that expose current result cards (initially Profession, CVonline, and
No Fluff Jobs), with direct HTTP/structured data or source-specific lightweight
HTML extraction. Each adapter must return metadata only; pagination stops at
the source and run caps. This is the broadest current-job inventory per request
and has no Firecrawl dependency.

## 3. FALLBACK path

Use a non-Firecrawl web-search provider for the profile-generated queries,
restricted to `site:` searches for known portals and named employer career/ATS
domains. Treat results as candidate metadata, not proof of a live job. For a
promising result, retrieve its canonical employer/ATS page directly only when
the result card does not supply enough evidence. If a provider or site is
unavailable, record it and continue with other sources; do not substitute an
unbounded crawl.

## 4. Firecrawl's exact role

Firecrawl is **not** a listing-page or web-search backend. It is the last
enrichment option for a candidate which: (a) passed metadata eligibility,
(b) is not a current unchanged duplicate, (c) has no usable direct detail
response because the page requires rendering, and (d) is inside the two-page
Firecrawl cap. A 402/timeout skips that candidate for this run and leaves the
other sources running. The account currently returns 402 even for a two-call
diagnostic, so it cannot be a required path (`docs/baseline/LIVE_FAILURE_REPRODUCTION.md:17-37`).

## 5. No paid detail crawling before relevance

Before any detail fetch, use only result-card metadata to apply deterministic
rules: target-role family/seniority, IT/AI/digital scope, Budapest/agglomeration
or remote/hybrid, salary when present, company exclusions, and explicit
disqualifiers (pure helpdesk, non-managerial development, non-IT management,
and mandatory advanced English). The profile supplies these requirements
(`profile/persona.md:32-50`). Rank survivors by role-family priority plus
leadership, infrastructure/cloud, digital/AI, and location evidence. Fetch at
most the highest-ranked candidates whose metadata is insufficient for a final
decision; an LLM may then extract evidence/rank, never override a hard
exclusion. Legacy instead fetches whenever the description is under 200
characters before language filtering (`agents/job_search_agent.py:79-120`).

## 6. Profile-derived queries

Parse the persona into a versioned query plan, rather than reusing the three
fixed Hungarian strings (`tools/scraper.py:203-208`). Generate one query per
role family and language variant, combining:

- priority titles: `IT vezető`, `informatikai vezető`, `IT manager`,
  `IT osztályvezető`, `infrastruktúra vezető`, `IT projektmenedzser`, `CIO`,
  `digitalizációs vezető`, `AI Lead`, `AI Product Manager`, `Head of AI`;
- location facet: `Budapest` / `hibrid` / `remote`;
- rotating evidence facets from the profile: infrastructure/cloud/M365/Azure
  and digital/AI transformation.

Cap the plan at eight distinct queries per run: four highest-priority role
families every run, four rotating families/facets. Keep the generated query,
persona version, source, and result counts in the run record so a profile edit
changes the next plan observably.

## 7. Combining portals, careers, and web search

1. Portal adapters supply the primary broad inventory and result-card metadata.
2. General search supplies incremental discovery of employer/ATS postings and
   portal postings missed by adapters; de-duplicate it against portal results.
3. Employer career/ATS pages are the authority for the shortlisted candidate's
   status and fuller requirements, not a site-wide crawl. Maintain a small
   employer-domain watchlist only from companies that have previously yielded
   relevant jobs or explicit user preferences; refresh one rotating watchlist
   source per run.

This preserves portal breadth while using first-party pages for confirmation.

## 8. Stale jobs and duplicates

Canonicalize URLs (remove tracking parameters, follow known portal canonical
IDs) and use `(source, source_job_id)` as the primary identity, with normalized
`(employer, title, location)` plus a description fingerprint as a cross-source
near-duplicate key. Store `first_seen`, `last_seen`, `posted_at`, `closing_at`,
`open/closed/unknown`, fingerprint, and notification fingerprint. Suppress an
unchanged open posting already notified; re-evaluate and notify a changed or
reopened posting. Mark unseen jobs stale after 14 days (or their passed closing
date), then recheck only if rediscovered. This fixes the legacy URL-as-forever-
duplicate behaviour (`tools/storage.py:87-101`) while retaining a durable
identity index.

## 9. Hard per-run limits

Enforce before each request, not as the legacy retrospective estimate does
(`agents/job_search_agent.py:186-199`):

- 20 total acquisition HTTP requests: at most 8 portal listing/search pages,
  4 web-search requests, 4 employer/watchlist listing pages, and 4 direct
  detail pages;
- 60 normalized candidates; 15 cheap-filter survivors; 4 detail enrichments;
  10 LLM evaluations (only after hard filters);
- 2 Firecrawl calls, exclusively within the four enrichments; zero is normal;
- stop on each cap, timeout each request at 10 seconds, and stop a failing
  source after two failures. Emit attempted/succeeded/blocked-by-budget counts
  and Firecrawl calls/credits. No successful-call fan-out is permitted; legacy
  has a 100-job cap but no successful detail-call cap (`tools/scraper.py:11`,
  `agents/job_search_agent.py:97-106`).

## 10. Smallest falsifying live experiment

Run once against the real persona with **two portal result pages, two generated
web queries, no employer watchlist, no direct details, and Firecrawl disabled**.
Capture the exact queries, raw/unique/current candidates, cheap rejections, and
the top 15 metadata-ranked candidates. The design is falsified if this bounded,
zero-paid run produces fewer than three current candidates that a human judges
plausibly relevant from title/employer/location/excerpt. If it passes, repeat
with the four direct-detail and two-Firecrawl ceilings to measure precision
gain; do not widen discovery until those measurements justify it.
