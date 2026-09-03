# JH-SUP-0010 — SPRINT 1 PRODUCT-TRUTH CORRECTION

**Priority:** P0 / PRODUCT OWNER CORRECTION
**Status:** ACTIVE — PRODUCT DEFINITION ONLY
**Execution owner:** Cloud Claude / sole ACTIVE_ORCHESTRATOR
**Supersedes:** JH-SUP-0009 as current product truth

## Product Owner correction

The Product Owner has already defined Sprint 1 clearly. Previous statements that Sprint 1 was undefined were incorrect.

The canonical Sprint 1 definition is now committed at repository root:

`SPRINT_1.md`

All agents must treat that file as the source of truth.

## Sprint 1 in one sentence

**Enter two short keywords into Google Search and read/show the real Google search results.**

No broader job-search outcome may replace this requirement.

## Immediate correction to the JH-SUP-0009 recommendation

The JH-SUP-0009 recommendation to re-verify the Profession.hu portal adapter may be useful for later Job Hunter discovery, but it is **NOT Sprint 1** and must not be presented as progress toward Sprint 1 completion.

Likewise Brave Search API, portal-native adapters, employer ATS adapters, job relevance scoring, and multi-source discovery do not satisfy Sprint 1 unless the Product Owner explicitly changes the Sprint 1 requirement.

## Current Sprint 1 status

`NOT DONE`.

Reason: `apps/google-browser-search/` reached Google from the cloud host but all acceptance queries hit Google's unusual-traffic/CAPTCHA challenge and exposed zero organic Google results.

A launched browser, challenge page, mock result, Profession.hu result, or alternative search-engine result does not count as Sprint 1 PASS.

## Scope of this directive

This directive **does not authorize new implementation yet**. The broad development freeze remains in force.

Its purpose is to repair product truth so no agent continues in the wrong direction.

Before any next implementation directive is proposed, Claude must acknowledge the canonical Sprint 1 definition and ensure future proposals are evaluated against exactly this question:

> Can this proposed mechanism take two short keywords, submit them to Google Search, and return real inspectable Google results?

If not, it is not Sprint 1 work.

## Required ACK

Update `docs/agent-runtime/product-supervisor-ack.yaml` to acknowledge `JH-SUP-0010` and state:

- `SPRINT_1_SOURCE_OF_TRUTH: SPRINT_1.md`
- `SPRINT_1_STATUS: NOT_DONE`
- `PROFESSION_ADAPTER_IS_NOT_SPRINT_1: true`
- no implementation started under this directive.

Then stop pending Product Owner authorization of the next Sprint 1 experiment.