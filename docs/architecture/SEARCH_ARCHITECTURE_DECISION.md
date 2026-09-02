# Search Architecture Decision (JH-SUP-0003 section 3)

## Inputs

- Claude proposal: `CLAUDE_SEARCH_PROPOSAL.md` (written independently, before Codex's).
- Codex proposal: `CODEX_SEARCH_PROPOSAL.md` (written independently, before seeing Claude's).
- Gemini proposal: **not obtained**. The `gemini-freshcheck` tmux session reported "Individual quota reached" both times it was checked during this directive's execution (~10h reset window). Per `docs/EXECUTION_CONTINUITY_POLICY.md` this is parked, not a stop condition — proceeding on two independent proposals that converged strongly, not one.

Both proposals agree on every major axis independently: portal-native metadata fetch as primary, Firecrawl demoted to a capped last-resort enrichment step, profile-derived query generation replacing hardcoded strings, metadata-only filtering before any paid detail fetch, freshness-aware dedupe replacing "URL seen once = duplicate forever," and a small pre-flight request budget enforced before calls (not estimated after). Codex's proposal is more concrete (specific caps, specific dedupe schema) and is adopted as the binding spec below.

## Decision

- **Query generation**: parse `profile/persona.md` into a versioned query plan (role families + seniority + location facets + rotating evidence facets), not fixed strings. Persona edits must observably change the next plan. Cap: 8 distinct queries/run (4 fixed priority families, 4 rotating).
- **Discovery sources and order**: (1) portal-native adapters (Profession, CVonline, No Fluff Jobs) via direct HTTP fetch + source-specific extraction, metadata only; (2) non-Firecrawl web search restricted to `site:`-scoped queries against known portals + a small employer-domain watchlist; (3) direct fetch of a shortlisted candidate's own employer/ATS page when metadata is insufficient.
- **PRIMARY acquisition path**: portal adapters (source 1 above). No Firecrawl dependency, no per-page cost.
- **FALLBACK acquisition path**: the web-search step (source 2). Used only when primary yield is low for a role family.
- **Firecrawl's exact role**: last-resort enrichment only, for a candidate that (a) passed the metadata eligibility filter, (b) is not a current duplicate, (c) has no usable direct-fetch detail response (rendering-required page), and (d) is within the 2-call/run Firecrawl cap. A 402/timeout skips that one candidate; the run continues on other sources. Firecrawl is never the listing or search backend.
- **Pre-detail cheap relevance filter**: deterministic rules against listing-card metadata only (role family/seniority, IT/AI/digital scope, location, salary if present, company exclusion list, hard disqualifiers e.g. mandatory advanced English) — same rule set as the legacy language/exclusion checks, moved earlier and made authoritative. No detail fetch and no LLM call happens before this filter runs.
- **When a detail page may be fetched**: only for the highest-ranked survivors of the cheap filter whose metadata is still insufficient for a decision, capped at 4/run.
- **Final relevance evaluation**: LLM (Gemini) extracts evidence and ranks within the survivors of the hard filters; it may never override a hard exclusion (e.g. an excluded company or a disqualifying language requirement), only rank/explain among eligible candidates. Cap: 10 LLM evaluations/run.
- **Dedupe/staleness strategy**: identity = `(source, source_job_id)` after URL canonicalization (strip tracking params, resolve portal canonical IDs); cross-source near-duplicate key = normalized `(employer, title, location)` + description fingerprint. Store `first_seen`/`last_seen`/`posted_at`/`closing_at`/open-closed-unknown state. An unseen job is marked stale after 14 days (or its closing date) and dropped from active consideration; rediscovery re-opens it. An unchanged already-notified posting is suppressed; a changed/reopened one is re-evaluated.
- **Request/cost budget per run** (enforced pre-flight, hard stop per call type, not a post-hoc estimate): ≤20 total acquisition HTTP requests (≤8 portal, ≤4 web-search, ≤4 employer/watchlist, ≤4 direct-detail); ≤60 normalized candidates; ≤15 cheap-filter survivors; ≤4 Firecrawl-eligible detail enrichments; ≤2 Firecrawl calls total (0 is the normal case); ≤10 LLM evaluations; 10s timeout/request; a source is skipped for the rest of the run after 2 consecutive failures.
- **Failure behavior**: a capped-out or failing source is skipped and logged with attempted/succeeded/blocked-by-budget counts; the run continues on remaining sources. A single provider failure (Firecrawl 402, Gemini quota, one portal down) must never abort evaluation of already-acquired candidates from other sources — this replaces the legacy behavior where one `GeminiQuotaExceededError` aborted the entire remaining candidate loop (`agents/job_search_agent.py:129-146` in job-searcher).

## Why this fixes the reported failure

The legacy failure was two coupled problems: (1) discovery breadth was capped by 7 fixed URLs + 3 fixed queries regardless of profile content, and (2) cost was proportional to raw candidate count (every short-description candidate got a paid detail fetch) rather than to filtered relevance. This design decouples them: discovery breadth scales with the profile-derived query plan (free, portal-native), and paid calls (Firecrawl, LLM) only ever apply to a small, metadata-filtered, budget-capped survivor set. It also fixes the credit-exhaustion single point of failure demonstrated live in `docs/baseline/LIVE_FAILURE_REPRODUCTION.md`: the primary path has zero Firecrawl dependency, so a 402 no longer means zero jobs found — it only means zero *enrichment*.

## Smallest live falsification (adopted from Codex, point 10)

Run once with 2 portal pages + 2 generated web queries, no employer watchlist, no direct details, Firecrawl disabled. Capture exact queries, raw/unique/current candidates, cheap-filter rejections, and the top-15 ranked candidates. Falsified if this zero-paid-call run produces fewer than 3 candidates a human judges plausibly relevant from title/employer/location/excerpt alone.

## Next implementation slice

Per JH-SUP-0003 section 1/4: migrate `profile/`, `tools/feedback.py`, `tools/notifier.py`, `bot_service.py`, `models/job.py` into `job-hunter` largely as-is (MIGRATE); port `tools/storage.py` and `tools/analyzer.py` with the fixes named above (KEEP WITH FIXES); build a new `tools/acquisition/` package implementing this decision in `job-hunter` (REWRITE, replacing `tools/scraper.py` + the orchestration in `agents/job_search_agent.py`). This is tracked as the active implementation slice — see `docs/agent-runtime/product-supervisor-ack.yaml`.
