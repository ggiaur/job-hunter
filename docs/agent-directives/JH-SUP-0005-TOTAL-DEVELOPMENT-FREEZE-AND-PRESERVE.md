# JH-SUP-0005 — TOTAL DEVELOPMENT FREEZE AND PRESERVE

**Priority:** P0 / PRODUCT OWNER STOP
**Status:** ACTIVE
**Execution owner:** Cloud Claude / sole ACTIVE_ORCHESTRATOR
**Supersedes:** JH-SUP-0004 and every earlier Job Hunter implementation directive for execution

## Product Owner decision

The Product Owner has explicitly determined that the work currently being executed is **NOT Sprint 1**.

Therefore, effective immediately:

> **STOP ALL DEVELOPMENT WORK. DO NOT CONTINUE IMPLEMENTATION, SEARCH-ARCHITECTURE WORK, ADAPTER WORK, MIGRATION WORK, E2E EXPANSION, REVIEW LOOPS, OR NEW AGENT TASKS.**

This is an explicit Product Owner stop decision and overrides the normal `CONTINUE` rule in the execution-continuity policy.

## Only authorized activity: PRESERVE CURRENT STATE

Claude must perform only the minimum actions required to prevent loss of work and leave the project in a fully recoverable repository state.

### 1. Stop task execution

- Do not start any new implementation task.
- Do not start or continue JH-SUP-0004 work.
- Do not dispatch new work to Codex, Gemini, or any other agent.
- Tell currently active Job Hunter Codex/Gemini/Claude sub-sessions to stop after preserving any unsaved output.
- Do not continue review/fix loops.
- Do not run new live searches, Firecrawl calls, Gemini calls, scraping experiments, deployments, or production changes.
- If a command is already in-flight and cannot be safely interrupted, let only that command terminate; do not begin its next step.

### 2. Preserve every piece of current work

Inventory every Job Hunter / Job Searcher worktree, branch, session, and pending change.

For each relevant repository/worktree record:
- filesystem path;
- branch;
- HEAD SHA;
- dirty/untracked files;
- unpushed commits;
- stash state if any.

Nothing may be discarded.

### 3. Push all durable work to GitHub

The goal is that no useful development work exists only on the cloud host.

- Commit and push all current durable `job-hunter` work to `ggiaur/job-hunter`.
- Do **not** invent extra code merely to make a clean commit.
- Preserve incomplete work honestly as incomplete/frozen.
- If there are local experimental changes that should not land on `main`, preserve them on clearly named safety branches such as `freeze/<date>-<topic>` and push those branches.
- If `job-searcher` itself contains uncommitted/unpushed changes created during this effort, preserve them non-destructively on a safety branch in `ggiaur/job-searcher`; do not merge them.
- Never commit secret values, `.env` secrets, credentials, tokens, or generated sensitive data.

### 4. Record the freeze state in the canonical repository

Create/update:

`docs/agent-runtime/FROZEN_STATE.md`

It must contain only factual state:
- timestamp;
- canonical `job-hunter` main HEAD;
- all preserved safety branches and SHAs;
- any relevant `job-searcher` preserved branch/SHA;
- active sessions stopped;
- unfinished tasks and exactly where their work is preserved;
- whether any local-only state remains (must be `NONE` before freeze completion, except ignored secrets/runtime caches);
- explicit statement: `SPRINT 1 DEFINITION: NOT AUTHORIZED / TO BE REDEFINED BY PRODUCT OWNER`.

### 5. ACK and become idle

Update `docs/agent-runtime/product-supervisor-ack.yaml` with:
- `last_seen_directive_id: JH-SUP-0005`
- `last_accepted_directive_id: JH-SUP-0005`
- `last_applied_directive_id: JH-SUP-0005`
- `status: FROZEN_BY_PRODUCT_OWNER`
- exact preservation branch/commit SHAs and `docs/agent-runtime/FROZEN_STATE.md` as evidence.

Commit and push that ACK.

After the ACK is pushed, remain idle. Do not resume development until a later explicit Product Owner-authorized supervisor directive defines the real Sprint 1.

## Hard prohibitions during freeze

- No new architecture proposal.
- No new adapter/source work.
- No new migration work.
- No new tests except a command strictly necessary to verify preservation integrity.
- No deployment.
- No Firecrawl/Gemini paid or live search activity.
- No cleanup that deletes branches, worktrees, commits, artifacts, or agent output.
- No interpretation of previous directives as continuing authority.
- Do not declare any prior work to be Sprint 1.

## Completion condition

This directive is APPLIED only when:
1. all development activity is stopped;
2. all current durable work is committed/pushed or preserved on pushed safety branches;
3. no relevant uncommitted/unpushed work remains on the cloud host;
4. `FROZEN_STATE.md` records the exact recoverable state;
5. the ACK says `FROZEN_BY_PRODUCT_OWNER` and references exact SHAs;
6. Claude and execution agents remain idle pending a new Product Owner-authorized Sprint 1 definition.
