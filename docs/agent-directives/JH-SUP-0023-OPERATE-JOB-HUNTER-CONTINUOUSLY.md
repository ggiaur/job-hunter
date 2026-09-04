# JH-SUP-0023 — Operate Job Hunter Continuously

## Authority / priority

P0. Product Owner explicitly objects that the Job Hunter work stopped after MVP PASS. The system must now move from one-shot MVP proof to actual unattended operation.

## Current fact base

JH-SUP-0022 is already PASS. The runnable pipeline exists under `apps/job-hunter-mvp/`, the SerpApi acquisition path is proven, and the twice-weekly systemd unit/timer definitions already exist but were deliberately not enabled.

Do not return to search-mechanism research. Do not redesign the working acquisition path unless a real failure forces it.

## Product outcome

1. Run the current Job Hunter pipeline immediately using the latest committed persona and learned preferences.
2. Produce a current shortlist of **7–15 genuinely relevant, currently reachable job advertisements** if that many suitable roles exist.
3. Prioritize the Product Owner's explicit positive pattern: Pillér-like roles — IT/digitalization project leadership, cross-functional coordination, planning, resources/deadlines/risks, status reporting, decision support, institutional/large-enterprise/public-service context.
4. Preserve classical IT-leadership roles too, but do not let senior-IC or merely technical-lead titles outrank better-fit Pillér-like roles without real management/project-lead scope.
5. English rule: intermediate/B1/B2/good/communicative English is allowed; mandatory advanced/fluent/negotiation-level/native-level English is a hard reject.
6. Install and enable the existing unattended twice-weekly schedule on the on-prem server so routine operation does not stop waiting for a new chat directive.

## Search coverage

Use the proven SerpApi Google engine. Expand focused queries enough to cover both leadership and Pillér-like project/program roles, including at minimum:

- `IT vezető állás Budapest`
- `informatikai vezető állás Budapest`
- `IT osztályvezető állás Budapest`
- `infrastruktúra vezető állás Budapest`
- `IT projektmenedzser állás Budapest`
- `informatikai projektvezető állás Budapest`
- `digitalizációs projektmenedzser állás Budapest`
- `digitalizációs vezető állás Budapest`
- `IT szolgáltatásmenedzser állás Budapest`
- relevant public-sector / nonprofit / institutional IT project-management query if useful

Budapest + agglomeration + hybrid/remote remain in scope. Nearby roles such as Székesfehérvár may be included when strongly relevant.

## Verification requirements

For every accepted job:
- verify that an individual current job-detail page is reachable;
- extract title, company, location/work mode, language requirement, key responsibilities, posting/validity dates when available, and direct detail/application URL;
- reject expired/closed/unreachable ads;
- do not present category/search pages as jobs;
- do not invent missing facts;
- deduplicate semantically duplicate ads.

## Ranking requirements

Score against `profile/persona.md` and `profile/learned_preferences.md`.

Explicitly boost:
- Pillér-like IT/digitalization project roles;
- cross-functional stakeholder coordination;
- decision-support / executive reporting;
- institutional, public-service, nonprofit, utility, financial, healthcare or mature-enterprise environments;
- infrastructure/cloud/digitalization overlap with the Product Owner's background;
- real management or program/project leadership scope.

Explicitly demote or reject:
- senior developer / senior individual-contributor roles without management responsibility;
- technical lead titles that are primarily hands-on engineering;
- non-IT management;
- pure helpdesk / junior support;
- mandatory advanced/fluent/negotiation-level/native English.

Intermediate English is NOT a rejection condition.

## Immediate evidence

Update/create:
- `docs/evidence/REAL_JOB_HUNTER_CURRENT_RUN.md`
- `docs/evidence/real-job-hunter-current-run.json`

The human-readable evidence must contain the 7–15 best current suitable ads if available, direct links, ranking, and concise fit rationale, plus rejected examples and reasons.

If fewer than 7 suitable current ads exist after the full focused search, return the real lower number and document why; do not weaken the filters or invent fillers.

## Unattended operation

Install and enable the existing systemd service/timer under `apps/job-hunter-mvp/schedule/` for approximately twice-weekly execution, Monday and Thursday around 08:00 local server time. Verify:
- timer enabled;
- next scheduled run visible;
- same tested pipeline is called;
- secrets remain outside git;
- no direct automated `google.com/search` traffic from corporate egress.

Routine scheduled runs must not require a new Product Owner chat message or manual browser action.

## Finish condition

Update `docs/agent-runtime/product-supervisor-ack.yaml` with:
- `JOB_HUNTER_OPERATIONAL_PASS` when immediate current run succeeds and the unattended timer is enabled and verified; or
- one precise blocker if actual server permissions/runtime prevent activation.

This directive operationalizes the working MVP. Do not stop at documentation or another design review.