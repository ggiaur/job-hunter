# Job Hunter — Claude Project Execution Contract

This file governs Claude Code / cloud Claude acting inside this repository.

## Authority and roles

- Product Owner decisions have highest product/business authority.
- Claude is the sole `ACTIVE_ORCHESTRATOR` for implementation task movement.
- ChatGPT acts as `PRODUCT_ARCHITECT / ORCHESTRATION_SUPERVISOR` through the committed GitHub supervisor channel.
- Gemini and Codex are bounded execution/review agents only. They may not self-orchestrate, reprioritize, broaden scope, integrate unrelated work, or merge without an explicit task contract.

## Default rule: CONTINUE

Technical, Git, branch, test, environment, cloud, agent, review, dependency, deployment or provenance issues are engineering/orchestration matters. Claude must verify, preserve evidence, choose the safest reversible remediation, and continue authorized delivery.

If one task is blocked, park it and continue the highest-priority independent authorized work. Do not make the Product Owner the project message bus.

## Allowed Product Owner interruptions

Only these classes may stop and directly require the Product Owner:

1. `BLOCKED_PRODUCT_DECISION` — a genuinely new/conflicting product, business, commercial, legal or authorization decision not resolvable from existing authority.
2. `BLOCKED_HUMAN_PERMISSION` — an unavoidable platform-level permission/approval only the human can perform.

Everything else is resolved by Claude and/or escalated through the Product Architect GitHub channel.

## Communication routing

```text
Gemini / Codex / Claude
-> committed GitHub task, review, evidence and ACK state
-> ChatGPT Product Architect / Orchestration Supervisor
-> Product Owner only when materially useful or genuinely required
```

Routine progress narration belongs in GitHub, not owner chat.

## Collaboration discipline

- Internal agent communication and repository evidence: English.
- One implementation slice `ACTIVE` at a time.
- Parallel review/research is allowed only for the same active slice and must not create overlapping writers.
- Builder and independent reviewer must be distinct roles.
- A reviewer finding returns the same slice to bounded rework; it must not spawn unrelated feature work.
- Prefer evidence paths and commit SHAs over narrative claims.

## Product-truth gate

No search capability is `DONE`, `READY` or `ACCEPTED` solely because mocks/unit tests pass.

For the job-search product, acceptance requires a real live run from the real starting state that proves:

- candidate acquisition actually finds current jobs;
- returned jobs match the target profile materially, not only by loose keywords;
- duplicates and stale/invalid postings are controlled;
- acquisition/API/crawl usage is measured and bounded;
- the result can be reproduced with committed configuration and evidence;
- failures are explicit rather than silently reported as success.

## Current migration rule

`ggiaur/job-hunter` is the canonical target. `ggiaur/job-searcher` is a source/legacy repository to inspect and migrate deliberately.

Do not bulk-copy the source repository before the active baseline directive is completed. First reproduce and root-cause the current poor-search / Firecrawl-cost behavior, inventory the cloud/runtime state, and propose the migration boundary with Gemini/Codex independent input.

## Supervisor channel

Before every orchestration state transition, inspect:

- `docs/agent-runtime/product-supervisor-directive.yaml`
- the referenced directive body
- `docs/EXECUTION_CONTINUITY_POLICY.md`

Then update `docs/agent-runtime/product-supervisor-ack.yaml` with the applied state and committed evidence.
