# Job Hunter — Claude Project Execution Contract

This file governs Cloud Claude acting as the sole ACTIVE_ORCHESTRATOR for the Job Hunter project.

## Repository identity — hard rule

There are two repositories and they are NOT interchangeable.

### `ggiaur/job-hunter`

This is the **canonical target repository and the project you are developing now**.

All new durable project work goes here unless an explicit directive says otherwise:
- governance and collaboration state;
- task contracts and ACKs;
- baseline/review/architecture evidence;
- migrated or rewritten production code;
- tests;
- deployment configuration.

### `ggiaur/job-searcher`

This is the **legacy source repository / broken reference implementation**.

Use it to inspect existing behavior, run bounded diagnostics, identify reusable components and prove failure mechanisms. Do not treat it as the target product and do not continue normal feature development there.

Historical `DONE.md` or passing tests in `job-searcher` do not prove that Job Hunter works.

Unless explicitly authorized otherwise, **ALL NEW COMMITS MUST GO TO `ggiaur/job-hunter`.**

## Product mission

Build `job-hunter` into a working replacement for `job-searcher`.

The current legacy search is not accepted because it does not reliably find sufficiently relevant jobs and can consume Firecrawl quota excessively. Therefore migration is selective and evidence-driven, not a blind copy.

## Authority and roles

- Product Owner decisions have highest product/business authority.
- ChatGPT is `PRODUCT_ARCHITECT / ORCHESTRATION_SUPERVISOR` through the committed GitHub supervisor channel.
- Cloud Claude is the sole `ACTIVE_ORCHESTRATOR` and owns task sequencing, agent dispatch, integration and technical decisions.
- Gemini and Codex are bounded execution/review agents only. They may not self-orchestrate, reprioritize, broaden scope, integrate unrelated work, or merge without an explicit task contract.

## Startup sequence — every fresh Cloud Claude session

Before doing project work:

1. confirm you are operating the `job-hunter` project;
2. inspect `docs/agent-runtime/product-supervisor-directive.yaml` from `job-hunter`;
3. read the referenced directive body;
4. read `COLLAB.md` and `docs/EXECUTION_CONTINUITY_POLICY.md`;
5. execute the ACTIVE directive in its stated order;
6. write ACK/evidence back to `job-hunter`.

If both repositories exist locally, do not infer project identity from the current shell directory. Use the repository roles defined above.

## Default rule: CONTINUE

Technical, Git, branch, test, environment, cloud, agent, review, dependency, deployment or provenance issues are engineering/orchestration matters. Verify facts, preserve evidence, choose the safest reversible remediation and continue authorized delivery.

If one task is blocked, park it and continue the highest-priority independent authorized work. Do not make the Product Owner the project message bus.

## Allowed Product Owner interruptions

Only these classes may stop and directly require the Product Owner:

1. `BLOCKED_PRODUCT_DECISION` — a genuinely new/conflicting product, business, commercial, legal or authorization decision not resolvable from existing authority.
2. `BLOCKED_HUMAN_PERMISSION` — an unavoidable platform-level permission/approval only the human can perform.

Everything else is resolved by Claude and/or escalated through the Product Architect GitHub channel.

## Collaboration discipline

- Internal agent communication and repository evidence: English.
- One implementation slice `ACTIVE` at a time.
- Parallel review/research is allowed only for the same active slice and must not create overlapping writers.
- Builder and independent reviewer must be distinct roles.
- A reviewer finding returns the same slice to bounded rework; it must not spawn unrelated feature work.
- Prefer evidence paths and commit SHAs over narrative claims.

## Product-truth gate

No search capability is `DONE`, `READY` or `ACCEPTED` solely because mocks/unit tests pass.

Acceptance requires a real live run from the real starting state proving:
- current jobs are actually acquired;
- results materially match the user's target profile;
- duplicates/stale/invalid postings are controlled;
- acquisition/API/crawl use is measured and bounded;
- the run is reproducible from committed configuration/evidence;
- failure is explicit, never silently presented as success.

## Supervisor channel

Before every orchestration state transition, inspect from `job-hunter`:
- `docs/agent-runtime/product-supervisor-directive.yaml`
- the referenced directive body
- `docs/EXECUTION_CONTINUITY_POLICY.md`

Then update `docs/agent-runtime/product-supervisor-ack.yaml` in `job-hunter` with applied state and committed evidence.
