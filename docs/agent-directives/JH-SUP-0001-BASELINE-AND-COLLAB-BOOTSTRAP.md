# JH-SUP-0001 — Baseline, Collaboration Bootstrap and Migration Truth

**Priority:** P0  
**Status:** ACTIVE  
**Authority:** PRODUCT_ARCHITECT_ORCHESTRATION_SUPERVISOR  
**Execution owner:** Cloud Claude / ACTIVE_ORCHESTRATOR

## Objective

Before migrating or redesigning Job Hunter, establish verified truth about the legacy `ggiaur/job-searcher` implementation, the cloud runtime, the current collaboration channel, and the actual product failure reported by the Product Owner.

## Mandatory actions

1. **Bootstrap the GitHub collaboration channel** for `ggiaur/job-hunter`:
   - verify `CLAUDE.md`, `COLLAB.md`, runtime YAML and continuity policy;
   - install/activate the supervisor watcher against `origin/main` in the real cloud environment;
   - prove that a committed supervisor directive reaches the real Claude orchestrator and that Claude can commit/push an ACK back.

2. **Inventory the actual cloud/runtime state** relevant to both repositories:
   - repository/worktree paths and branches;
   - dirty/untracked/unpushed changes;
   - active tmux/screen/Claude/Codex/Gemini sessions;
   - containers/services/schedulers/watchers;
   - deployed Cloud Run/Cloud Build or equivalent runtime identifiers;
   - configuration variable names and secret locations **without committing secret values**.

3. **Audit `ggiaur/job-searcher` as evidence, not as trusted documentation**:
   - map the real search acquisition path end-to-end;
   - identify every Firecrawl call site and the conditions that trigger it;
   - measure request/crawl amplification per search run;
   - map Gemini/API calls and retry behavior;
   - map ranking/filtering/deduplication and user-profile inputs;
   - reconcile historical `DONE.md` / `DECISIONS.md` claims against current code and live behavior.

4. **Reproduce the Product Owner failure** with a bounded live run:
   - show what jobs are returned for the real target profile;
   - show which expected/relevant jobs are missed where this can be established;
   - record counts for acquisition candidates, detail fetches, filtered jobs, duplicates, relevant jobs and external API/crawl calls;
   - fail closed if live access is unavailable; do not substitute mocks and call it success.

5. **Obtain independent technical assessments** from both Codex and Gemini after the baseline is collected:
   - each receives the same evidence package;
   - each independently identifies root causes and proposes a bounded acquisition/ranking architecture;
   - neither may edit/integrate code in this phase unless Claude assigns a specific non-overlapping evidence task.

6. **Produce one migration decision package** committed in `ggiaur/job-hunter` containing:
   - KEEP / REWRITE / DISCARD classification for major legacy components;
   - target architecture for acquisition, normalization, ranking, persistence and notification;
   - explicit Firecrawl policy and hard cost/request budgets;
   - first live E2E acceptance fixture;
   - proposed first implementation slice only.

## Hard constraints

- Do **not** bulk-copy `job-searcher` into `job-hunter` before this directive is accepted.
- Do **not** start multiple implementation branches.
- Do **not** let Firecrawl brute-force discovery during baseline reproduction; use bounded calls and measure them.
- Do **not** report mock/unit-test success as product success.
- Do **not** ask the Product Owner routine technical questions.
- No secret values in GitHub.

## Required evidence paths

Create and commit at minimum:

- `docs/baseline/CLOUD_RUNTIME_INVENTORY.md`
- `docs/baseline/LEGACY_SEARCH_PATH_AUDIT.md`
- `docs/baseline/LIVE_FAILURE_REPRODUCTION.md`
- `docs/reviews/CODEX_BASELINE_ASSESSMENT.md`
- `docs/reviews/GEMINI_BASELINE_ASSESSMENT.md`
- `docs/architecture/MIGRATION_DECISION.md`

## Completion gate

`JH-SUP-0001` is APPLIED only when:

- the GitHub -> cloud Claude -> GitHub ACK loop is proven;
- runtime inventory is verified;
- legacy search/cost path is mapped from code;
- a bounded live reproduction exists;
- Codex and Gemini assessments are committed independently;
- Claude commits one integrated migration recommendation;
- `docs/agent-runtime/product-supervisor-ack.yaml` references the exact evidence paths and HEAD SHA.

No feature implementation is authorized by this directive beyond collaboration-channel bootstrap and evidence instrumentation strictly necessary to reproduce/measure the existing system.
