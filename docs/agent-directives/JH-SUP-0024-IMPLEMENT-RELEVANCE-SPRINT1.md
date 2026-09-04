# JH-SUP-0024 — IMPLEMENT APPROVED RELEVANCE SPRINT 1

**Authority:** Product Owner decisions recorded in `docs/product/PO_DECISIONS_2026-09-04.md`  
**Canonical Sprint:** `SPRINT_1.md`  
**Priority:** P0  
**Mode:** IMPLEMENTATION + LIVE FALSIFICATION

## Objective

Start development immediately toward the approved Sprint 1 product outcome:

> Produce real current vacancies, score them truthfully 0–100, expose every 60%+ result with reasons, persist the exact result set, and reach at least one vacancy the Product Owner judges genuinely APPLY-worthy.

Do not restart generic business-model discussion. Do not optimize for 7–15 result count. Do not spend a cycle on architecture for its own sake.

## Work lanes

### Lane A — Claude / primary orchestrator and integration

1. Treat `SPRINT_1.md` and `docs/product/PO_DECISIONS_2026-09-04.md` as authoritative.
2. Implement/reconcile the scoring and acquisition path needed for truthful live results.
3. Compare dormant `tools/acquisition/*.py` with live `apps/job-hunter-mvp/run.mjs`; preserve unique value, but do not delay live result delivery for architecture unification.
4. Evaluate existing assets from `job-searcher` and `allas-figyelo` before building replacements. Port only useful bounded pieces that improve live coverage/relevance.
5. Source selection is the team's responsibility. Google/SerpApi is allowed; direct Profession/CV Online/Jooble/company sources are allowed when useful.
6. Persist every exact live-run result set in durable evidence so the PO can later retrieve the same candidates.
7. Integrate Gemini's isolated presentation slice after its pushed checkpoint.
8. Use Codex as independent acceptance/falsification reviewer under its current environment limitations.
9. Run live searches early and iteratively; do not wait for a perfect architecture.

### Lane B — Gemini / presentation slice

Gemini owns a non-overlapping minimal browsable result/review surface. It must render persisted results without redefining scoring.

### Lane C — Codex / acceptance and falsification

Codex independently challenges the scorer against the approved PO rules, especially mandatory-vs-preferred English, leadership-vs-IC, location, salary, threshold leakage, duplicates, and durable run persistence. Its current no-network/no-git-write limitation is non-blocking.

## Approved scoring/business constraints

Implement exactly the rules in `docs/product/PO_DECISIONS_2026-09-04.md`. In particular:

- hard exclude developer, helpdesk, one-person IT, and pure non-lead individual-contributor roles;
- allow real project leadership without direct reports when it genuinely directs people/vendors/delivery/development;
- hard exclude only mandatory advanced/fluent/native-level English; allow intermediate/basic/no requirement and English merely preferred;
- salary omitted = neutral; explicit < HUF 700k gross = small/moderate penalty, not exclusion;
- location is accessibility/hybrid-sensitive from Fehérvárcsurgó, not Budapest-only and not blanket hard exclusion;
- fresh active ads gain advantage; older active ads remain eligible;
- no employer-type exclusion;
- mixed IT leadership domains are allowed;
- show every real result >=60% with explanation.

## Required visible result contract

For every 60%+ result expose:

- title;
- employer;
- location;
- work arrangement when known;
- salary only when stated;
- direct vacancy/application URL;
- 0–100 relevance percentage;
- concise positive fit reasons;
- concise mismatch/uncertainty reasons;
- APPLY / DO_NOT_APPLY field;
- short PO reason field.

## Acceptance

Technical/product pre-acceptance requires a live current run with genuine individual job adverts, explainable scores, persisted evidence, and a reviewable 60%+ result list.

Final Sprint 1 Product Owner acceptance requires at least **one** result the Product Owner actually marks APPLY. More is better.

## Repository consolidation constraint

Final job-search repository is `ggiaur/job-hunter`. Do not archive/delete/disable `job-searcher` or `allas-figyelo` during this sprint. First preserve/migrate validated useful assets. `cv-linkedin` is currently evidenced as empty.

## Stop conditions / escalation

Escalate only for a genuinely unavoidable Product Owner decision, paid/material external commitment, destructive action, missing required credential that blocks the best available path, or a conflict in the newly approved rules. Otherwise continue implementation autonomously.

Every substantive checkpoint must be committed and pushed before handoff.