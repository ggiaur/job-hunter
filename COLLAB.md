# Job Hunter — AI Collaboration Board

## Canonical project state

- **Canonical target repository:** `ggiaur/job-hunter`
- **Legacy/source repository:** `ggiaur/job-searcher`
- **Product Owner:** human Product Owner
- **Product Architect / Orchestration Supervisor:** ChatGPT via committed GitHub supervisor channel
- **Sole ACTIVE_ORCHESTRATOR:** Claude running in the cloud execution environment
- **Execution / review agents:** Gemini and Codex

## Current state

`ggiaur/job-hunter` was empty at collaboration bootstrap. `ggiaur/job-searcher` contains the existing implementation and historical decisions, including Firecrawl/Gemini integration, Cloud Build files, agent code and prior test claims.

The existing implementation is **not assumed production-correct merely because historical tests passed**. The current Product Owner problem statement is that the system does not reliably find suitable jobs and can consume Firecrawl quota excessively. Therefore migration must start with evidence and live product-outcome validation, not a blind repository copy.

## Authority model

```text
PRODUCT OWNER
  -> ChatGPT PRODUCT_ARCHITECT / ORCHESTRATION_SUPERVISOR
      -> committed GitHub directive
          -> Cloud Claude ACTIVE_ORCHESTRATOR
              -> Gemini / Codex bounded builder-review tasks
              -> integration / test / live E2E
          -> committed ACK + evidence
      -> ChatGPT reviews repository evidence and issues next directive
```

Claude is the only actor allowed to move implementation work between task states. Gemini and Codex may implement or review only within explicit bounded task contracts. They must not self-prioritize, merge unrelated work, broaden scope, or act as project managers.

## One-active-slice rule

Only one implementation slice may be `ACTIVE` at a time.

Independent review, falsification and research may run in parallel **only when they serve the same active slice and do not create overlapping writers**.

## Required delivery gate

```text
PRODUCT INTENT
-> BASELINE / FACT VERIFICATION
-> BOUNDED TASK CONTRACT
-> BUILDER
-> INDEPENDENT REVIEWER
-> SECURITY / COST / FAILURE-MODE REVIEW when relevant
-> LIVE E2E / FALSIFICATION
-> ACCEPT / REWORK
-> MERGE / DEPLOY
```

A task is not DONE because unit tests pass. For search behavior, acceptance requires real search results from the true user starting state, relevance evidence, duplicate/cost accounting, and a reproducible live run.

## Communication files

- `CLAUDE.md` — project execution contract for the cloud orchestrator
- `docs/EXECUTION_CONTINUITY_POLICY.md` — no-idle / escalation policy
- `docs/agent-runtime/orchestrator.yaml` — machine-readable role and routing state
- `docs/agent-runtime/product-supervisor-directive.yaml` — ChatGPT -> Claude command pointer
- `docs/agent-runtime/product-supervisor-ack.yaml` — Claude -> ChatGPT ACK/status/evidence channel
- `docs/agent-directives/` — immutable/bounded directive bodies
- `scripts/watch_product_supervisor_directive.sh` — GitHub-to-cloud Claude notification watcher

## Current active work

**Directive:** `JH-SUP-0001`

**Goal:** bootstrap the collaboration channel and produce a verified baseline of `job-searcher` before migration into `job-hunter`.

No blind code migration and no new search architecture implementation is authorized until the baseline report is committed and the current failure mode is reproduced with evidence.

## Product-level failure to resolve

The system must ultimately solve both conditions together:

1. it finds jobs that materially match the user's actual target profile;
2. it does so with a bounded and explainable acquisition cost, without burning Firecrawl quota through low-value crawling.

Search acquisition, ranking/relevance and cost control are therefore one product outcome chain, not three disconnected component projects.
