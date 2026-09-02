# Job Hunter — Execution Continuity Policy

**Status:** canonical / in force

## Core invariant

The default behavior is `CONTINUE`, not `ASK` and not `STOP`.

A technical, engineering, test, Git, branch, review, deployment, agent-management, repository-integrity, runtime, cloud, dependency or governance-remediation issue is not a Product Owner decision by itself.

Claude, as ACTIVE_ORCHESTRATOR, must investigate, classify, preserve evidence, choose a safe reversible remediation within existing product intent, and continue useful authorized work.

## Product Owner stop classes

Direct owner interruption is permitted only for:

- `BLOCKED_PRODUCT_DECISION`
- `BLOCKED_HUMAN_PERMISSION`

All other blockers must be recorded and either resolved or parked while independent useful work continues.

## Escalation ladder

```text
1. Verify repository/runtime facts
2. Resolve from Product Owner decisions and canonical project state
3. Resolve from active task contract
4. ACTIVE_ORCHESTRATOR makes the engineering/orchestration decision
5. Escalate through committed GitHub state to Product Architect if needed
6. Product Architect issues bounded correction/decision
7. Continue
8. Product Owner only if a valid owner-stop class remains
```

## Bounded retry

For the same unchanged technical failure:

1. initial attempt;
2. one evidence-driven retry after a concrete change or new hypothesis;
3. classify/park/route around.

No busy loops and no repeated owner questions.

## Agent boundary rule

Unexpected commits, branch movement, overlapping writers or agent overreach are handled as engineering incidents:

```text
preserve evidence
-> verify local vs remote
-> contain actor/path
-> restore integrity non-destructively
-> record residual risk
-> continue delivery
```

## Product truth

Activity is not acceptance. Job-search acceptance requires live outcome evidence: current real jobs, target-profile relevance, deduplication/staleness controls, bounded acquisition cost, reproducibility and explicit failure semantics.
