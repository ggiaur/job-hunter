# JH-SUP-0003 — Actual Migration Goal and Search Repair

**Priority:** P0  
**Status:** ACTIVE  
**Execution owner:** Cloud Claude / sole ACTIVE_ORCHESTRATOR  
**Supersedes:** JH-SUP-0002 for execution priority

## The task, exactly

Do **not** treat `job-hunter` as a greenfield rewrite.

- `ggiaur/job-searcher` is the EXISTING application and SOURCE implementation.
- `ggiaur/job-hunter` is the TARGET repository that must become the maintained, working replacement.

The Product Owner wants the useful/working Job Searcher functionality transferred into Job Hunter, while the broken job-discovery/search path is corrected rather than blindly copied.

The known product failure is specific and central:

1. the current system does not find enough suitable jobs;
2. it can consume Firecrawl quota extremely quickly;
3. therefore the acquisition/search strategy is not acceptable.

The objective is a **working Job Hunter**, not a documentation project and not a full rewrite of everything that already works.

## Immediate rule

Stop broad Firecrawl/live crawling until the replacement search architecture is selected. Diagnostic calls must remain very small and explicitly measured.

## Execution sequence

### 1. Preserve what already works

Using `job-searcher` code and existing audit evidence, classify major components into only two practical groups:

- `MIGRATE`: working functionality that should move to `job-hunter` with minimal change;
- `REPAIR/REPLACE`: functionality proven to be part of the current failure.

At minimum inspect:
- profile/persona/preferences;
- feedback learning;
- analyzer/ranking;
- storage/deduplication;
- notifier/bot;
- deployment/runtime configuration;
- acquisition/search/scraping.

Do not redesign a working component without evidence that it needs redesign.

### 2. Ask the AI team to solve the SEARCH problem before implementing it

Claude must obtain three independent proposals:

- Claude's own proposal;
- Codex proposal;
- Gemini proposal.

Codex and Gemini must work independently and must not receive the other's answer first.

Give each the same concise problem statement and the existing legacy-search audit. Ask each to answer:

1. How should Job Hunter discover current relevant jobs on the internet?
2. What should the PRIMARY acquisition path be?
3. What should the FALLBACK path be?
4. At exactly what point, if any, should Firecrawl be used?
5. How do we avoid paid detail-page crawling before we know a candidate is likely relevant?
6. How should queries be generated from the real user profile instead of fixed hard-coded queries?
7. How should job portals, company career pages and general web search be combined?
8. How do we control stale jobs and duplicates?
9. What hard request/cost limits should exist per run?
10. What is the smallest live experiment that can falsify the proposed design?

The proposals must optimize for the PRODUCT OUTCOME: relevant current jobs found with low and bounded acquisition cost.

Do not let the agents spend time designing governance or unrelated subsystems.

### 3. Claude makes one engineering decision

Claude compares the three proposals and chooses ONE search architecture.

The decision must state concretely:
- query-generation method;
- search/discovery sources and order;
- PRIMARY and FALLBACK acquisition methods;
- whether Firecrawl remains, and only for what;
- pre-detail cheap relevance filter;
- when a detail page may be fetched;
- final relevance evaluation;
- dedupe/staleness strategy;
- request/cost budget;
- failure behavior.

Do not ask the Product Owner to choose between equivalent engineering options. Choose and justify the best option from evidence.

### 4. Build Job Hunter from Job Searcher selectively

Once the search architecture is selected:

1. migrate the working reusable application components from `job-searcher` into `job-hunter`;
2. preserve their behavior and tests where still valid;
3. do NOT activate the legacy Firecrawl-heavy acquisition path as the new production search path;
4. implement the selected replacement acquisition/search layer in `job-hunter`;
5. adapt only the boundaries needed to integrate it with analyzer/storage/notification/profile behavior.

All durable implementation work is committed to `job-hunter`. `job-searcher` remains the source/reference repository.

### 5. Prove the real result

Acceptance is not a unit-test count.

Run a bounded live end-to-end Job Hunter search using the real target profile and record:
- actual search queries;
- sources searched;
- raw candidate count;
- candidates rejected cheaply before detail retrieval;
- detail pages fetched;
- Firecrawl calls/credits if any;
- model calls;
- duplicates/stale jobs removed;
- final relevant jobs;
- examples showing why the final jobs are suitable;
- total acquisition cost/request count.

If the live result still does not produce materially suitable jobs, the task is NOT accepted even if all automated tests pass.

## Role model

- Product Owner: product/business authority.
- ChatGPT: Product Architect / Orchestration Supervisor through GitHub.
- Cloud Claude: sole ACTIVE_ORCHESTRATOR and integration owner.
- Codex/Gemini: bounded independent contributors/reviewers; no self-orchestration.

Claude should delegate real analysis/review work to Codex and Gemini, reconcile disagreement, and keep the project moving.

## Deliverables that matter

Keep documentation minimal. The required durable evidence is:

1. `docs/architecture/SEARCH_ARCHITECTURE_DECISION.md` — three independent proposals summarized + Claude's selected architecture;
2. migrated working application code in `job-hunter`;
3. replacement search implementation in `job-hunter`;
4. tests for the migrated and repaired behavior;
5. `docs/evidence/LIVE_JOB_SEARCH_ACCEPTANCE.md` — measured live product result;
6. ACK with exact implementation/evidence SHAs.

Existing JH-SUP-0002 runtime inventory and legacy code audit may be reused; do not repeat them merely to create more documents.

## Completion condition

This directive is complete only when `job-hunter` is a runnable replacement of the useful `job-searcher` application AND its live search demonstrates materially relevant jobs with a bounded, explainable acquisition cost.

Do not declare completion after analysis alone. Do not leave the project as an empty target repository plus reports.