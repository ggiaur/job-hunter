# JH-SUP-0004 — Full Live E2E and Second-Source Completion

**Priority:** P0
**Status:** ACTIVE
**Execution owner:** Cloud Claude / sole ACTIVE_ORCHESTRATOR
**Supersedes:** JH-SUP-0003 for execution priority

## Why this directive exists

JH-SUP-0003 produced meaningful implementation progress and a bounded live acquisition proof. Do **not** redo that work.

Current verified state:
- `job-hunter` contains the migrated application and rewritten acquisition layer;
- profession.hu acquisition is live-verified and finds materially relevant jobs with zero paid acquisition calls in the bounded test;
- the previous live proof stopped before the real full application entrypoint, LLM ranking, persistence and notification;
- CVOnline currently returns zero because its real search mechanism has not yet been identified;
- Gemini review/input was quota-blocked and must not stop useful execution.

The project must now advance from "bounded acquisition proof" to a **working full live Job Hunter run**.

## Execute now — one active slice

### 1. Establish a second real acquisition source

Do not spend a long cycle reverse-engineering CVOnline if it remains opaque.

Use this decision rule:
1. make one bounded evidence-driven attempt to identify CVOnline's real current search mechanism;
2. if successful, implement and verify it;
3. if not successful after that bounded attempt, park CVOnline and implement the cheapest reliable alternative source already allowed by the selected architecture (another portal-native source or employer-career search path) rather than stalling the project.

Acceptance for this step: at least **two independent live acquisition sources** can return current job candidates, or one portal plus one verified employer-career source path.

### 2. Run the real full pipeline

Execute Job Hunter through the actual production entrypoint with `mock_mode=False`, using the real target profile and bounded budgets.

The run must include:
- persona-driven query generation;
- live candidate acquisition;
- cheap pre-detail filtering;
- dedupe/staleness handling;
- detail retrieval only where allowed by budget and relevance prefilter;
- real analyzer/LLM ranking if credentials are available;
- persistence path;
- notification path in a safe non-spam verification mode if a real user notification would create an undesirable side effect.

Do not replace the real entrypoint with an isolated helper script and call that full E2E success.

### 3. Hard cost gate

Before the run, assert and log the configured hard per-run budgets.

During/after the run record:
- search requests by source;
- Firecrawl calls/credits;
- detail fetch count;
- LLM calls;
- raw candidates;
- cheap-filter rejects;
- duplicates/stale rejects;
- final ranked jobs;
- persisted jobs;
- notification outputs;
- any source/provider failures.

The run must fail closed before exceeding the hard budget.

### 4. Product-quality gate

The result is accepted only if:
- the full pipeline completes from the real entrypoint;
- at least 3 final jobs are materially suitable for the real target profile;
- the evidence shows why they are suitable;
- no uncapped Firecrawl/detail-fetch amplification occurs;
- one source/provider failure does not abort all useful work;
- total paid acquisition cost/request usage is explicit and bounded.

If the final ranked result is poor, fix the smallest proven cause and re-run once. Do not declare success from unit tests alone.

### 5. Independent review

After the full live result exists, assign Codex to review the exact implementation/evidence SHA for:
- budget bypasses;
- source-failure handling;
- relevance/ranking mistakes;
- stale/duplicate errors;
- accidental legacy Firecrawl-heavy path reactivation.

Use Gemini too if available. If Gemini remains quota-blocked, record that and continue; do not idle waiting for it.

### 6. Finish the slice

Commit only the minimum durable evidence needed:
- update `docs/evidence/LIVE_JOB_SEARCH_ACCEPTANCE.md` with the full E2E result;
- add a second-source note only if needed;
- update `docs/agent-runtime/product-supervisor-ack.yaml` with exact SHAs and status.

Do not create another architecture document unless the live evidence forces an architecture change.

## Completion condition

JH-SUP-0004 is complete only when Job Hunter has demonstrated a real end-to-end live run through its actual application entrypoint, with materially relevant final jobs and bounded measured acquisition cost, and the implementation/evidence SHA has received independent Codex review.
