# JH-SUP-0002 — Repository Identity and Exact Execution Start

**Priority:** P0
**Status:** ACTIVE
**Execution owner:** Cloud Claude / sole ACTIVE_ORCHESTRATOR
**Supersedes:** JH-SUP-0001 where this directive is more specific

## 1. Do not confuse the two repositories

There are TWO different repositories with TWO different purposes.

### `ggiaur/job-searcher` = LEGACY SOURCE / BROKEN REFERENCE

This is the old implementation.

Use it only to:
- inspect existing code;
- run bounded diagnostics/tests;
- identify reusable components;
- prove why current search quality/cost behavior fails;
- copy/cherry-pick selected code only after an explicit migration decision.

Do NOT:
- treat `job-searcher` as the project being developed;
- continue feature development there;
- use its `DONE.md` as proof that the product works;
- deploy new Job Hunter work from it;
- commit the new collaboration/governance system there.

### `ggiaur/job-hunter` = CANONICAL TARGET / NEW PRODUCT REPOSITORY

This is the repository you are orchestrating now.

ALL of the following belong here:
- project governance;
- task state;
- ACKs and supervisor communication;
- baseline reports;
- architecture decisions;
- migrated/rebuilt production code;
- new tests;
- final deployment configuration.

Unless an explicit task says otherwise, ALL NEW COMMITS MUST GO TO `ggiaur/job-hunter`.

## 2. Product mission

The Product Owner wants the useful parts of `job-searcher` moved/rebuilt into `job-hunter`, but the current search implementation is not acceptable because it fails to find sufficiently relevant jobs and can burn Firecrawl quota quickly.

Therefore the job is NOT "continue job-searcher" and NOT "copy job-searcher".

The job is:

> Build `job-hunter` into the working replacement, using `job-searcher` only as evidence and a selective source of reusable code.

## 3. Exact first execution sequence

Do these steps in this order. Do not stop to ask the Product Owner routine questions.

### STEP A — Establish repository truth

1. Locate/fetch both repositories in the cloud runtime.
2. Record for BOTH:
   - filesystem path;
   - branch;
   - HEAD SHA;
   - dirty/untracked state;
   - unpushed commits.
3. Confirm that your WRITE TARGET is `job-hunter`.
4. Do not modify `job-searcher` during baseline work unless temporary local instrumentation is strictly required; any durable instrumentation/report belongs in `job-hunter`.

### STEP B — Prove the supervisor channel works

From `job-hunter`:
1. read `CLAUDE.md`;
2. read `COLLAB.md`;
3. read `docs/EXECUTION_CONTINUITY_POLICY.md`;
4. read `docs/agent-runtime/product-supervisor-directive.yaml`;
5. read this directive;
6. update `docs/agent-runtime/product-supervisor-ack.yaml` to mark `JH-SUP-0002` as SEEN/ACCEPTED and commit+push that ACK to `job-hunter`.

This ACK is the first proof that ChatGPT -> GitHub -> Cloud Claude -> GitHub works.

### STEP C — Inventory active runtime before launching more agents

Record:
- active Claude/Codex/Gemini sessions;
- tmux/screen sessions;
- containers/services;
- schedulers/watchers;
- deployed Job Searcher/Hunter services;
- relevant cloud build/run resources;
- config/secret VARIABLE NAMES only, never secret values.

Commit to:
`docs/baseline/CLOUD_RUNTIME_INVENTORY.md`

### STEP D — Understand the OLD system, without redesigning yet

Audit `job-searcher` end-to-end and answer with code references:

1. What exact entrypoint starts a search run?
2. How are search queries generated?
3. Which service/source actually discovers candidate jobs?
4. Where is Firecrawl called?
5. How many Firecrawl calls can one normal run generate?
6. Which pages are fetched before relevance is known?
7. Where is Gemini called and why?
8. How are jobs scored/ranked?
9. Which profile/preferences/exclusions are applied?
10. How are duplicates/stale jobs handled?
11. Which mechanism can cause good jobs to be missed?
12. Which mechanism can cause irrelevant jobs to survive?
13. Which mechanism causes Firecrawl quota amplification?

Commit to:
`docs/baseline/LEGACY_SEARCH_PATH_AUDIT.md`

### STEP E — Bounded live reproduction

Run the smallest safe live experiment that can reproduce the current product failure.

Measure at minimum:
- queries issued;
- raw candidates found;
- detail pages fetched;
- Firecrawl calls/credits if observable;
- Gemini calls;
- duplicates removed;
- jobs surviving filters;
- jobs judged actually relevant.

Hard rule: do NOT run a broad/unbounded Firecrawl search merely to collect evidence.

Commit to:
`docs/baseline/LIVE_FAILURE_REPRODUCTION.md`

### STEP F — Independent agents, same evidence, no cross-contamination

Only AFTER Steps C-E have produced an evidence package:

Assign Codex and Gemini separately.

Codex must independently inspect the code/evidence and identify concrete technical root causes + minimal corrective architecture.

Gemini must independently analyze acquisition/relevance strategy and propose a high-quality low-cost search flow.

They must not see each other's conclusions before submitting their own.

Save results in `job-hunter`:
- `docs/reviews/CODEX_BASELINE_ASSESSMENT.md`
- `docs/reviews/GEMINI_BASELINE_ASSESSMENT.md`

Neither agent may self-orchestrate or start unrelated implementation.

### STEP G — Claude decides the migration architecture

Reconcile:
- repository/code evidence;
- live reproduction;
- Codex assessment;
- Gemini assessment.

Produce one decision in:
`docs/architecture/MIGRATION_DECISION.md`

For each major legacy component classify exactly one:
- KEEP AS-IS
- KEEP WITH FIXES
- REWRITE
- DISCARD

Then specify one exact first implementation slice for `job-hunter`.

## 4. Stop conditions

Do NOT stop because of ordinary technical choices, Git state, test failures, missing binaries, architecture choices within approved scope, or agent disagreements. Resolve them and continue.

Only stop for:
- `BLOCKED_PRODUCT_DECISION`
- `BLOCKED_HUMAN_PERMISSION`

## 5. Definition of success for this directive

This directive is complete only when `job-hunter` contains and has pushed:

1. ACK for JH-SUP-0002;
2. cloud runtime inventory;
3. legacy search-path audit;
4. bounded live failure reproduction;
5. independent Codex assessment;
6. independent Gemini assessment;
7. one Claude-owned migration decision;
8. one exact next implementation slice.

Do not report `job-searcher` as the target project. Do not develop the replacement in `job-searcher`.
