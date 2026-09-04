# SPRINT 1 — REAL RELEVANT VACANCIES

**Authority:** Product Owner  
**Status:** APPROVED / IMPLEMENTATION AUTHORIZED  
**Canonical Sprint 1 source of truth:** this file  
**Supporting PO decisions:** `docs/product/PO_DECISIONS_2026-09-04.md`

## 1. Sprint goal

Produce a live, inspectable set of **real current vacancies that are relevant to the Product Owner's actual profile**, with an explainable 0–100 relevance score.

The search technology is not the product goal. The team may choose the most effective legitimate acquisition mix available in Hungary. Google/SerpApi is acceptable when it produces useful vacancies; direct job portals, aggregators, company career pages and reusable acquisition work from earlier repositories are also acceptable when they improve results.

The sprint must optimise for **genuine apply-worthiness**, not result count or architecture completion.

## 2. Required business rules

Implement the approved rules in `docs/product/PO_DECISIONS_2026-09-04.md`, including:

- leadership/group-lead/project-lead work is preferred;
- project leadership does not require direct reports when the role genuinely directs people, suppliers, delivery or development;
- developer, helpdesk, one-person-IT and pure non-lead individual-contributor roles are excluded;
- mandatory advanced/fluent/native-level English is excluded; intermediate/basic/no requirement or English merely as an advantage is allowed;
- salary omission is neutral; confirmed salary below HUF 700,000 gross receives only a small/moderate penalty;
- location is evaluated from Fehérvárcsurgó accessibility and work arrangement, not by a rigid Budapest-only rule;
- newer active adverts receive a freshness advantage; older still-active adverts are not excluded solely by age;
- employer type is not a hard exclusion;
- operations, infrastructure, projects, applications and digitalisation/AI-transformation leadership may all be relevant.

## 3. Acquisition requirement

Use the best current source mix that produces real relevant jobs. Source choice is an engineering responsibility, not a PO configuration exercise.

Before building new acquisition infrastructure, compare and reuse valuable existing assets where appropriate:

- current live JS pipeline: `apps/job-hunter-mvp/run.mjs`;
- dormant/internal Python acquisition work: `tools/acquisition/*.py`;
- `job-searcher` acquisition/feedback assets, including the direct Profession.hu work;
- `allas-figyelo` Jooble/regional acquisition and lightweight result presentation;
- other sources only where evidence shows they materially improve relevant coverage.

Do not delay useful results merely to unify architecture first. Reconciliation and migration may proceed in parallel, but Sprint 1 acceptance depends on live relevant output.

## 4. Relevance scoring

Every accepted real vacancy must receive an explainable score from 0 to 100.

All results scoring **60% or above must be visible to the Product Owner**.

The score must not be an unexplained LLM opinion. It must be traceable to explicit factors such as:

- IT/role-family fit;
- leadership/coordination scope;
- seniority/step fit;
- responsibilities matching the PO's experience;
- English requirement;
- location/commute/work arrangement;
- salary when explicitly known;
- freshness;
- explicit exclusions and penalties.

The explanation must identify both positive matches and material weaknesses.

## 5. Required visible output

For every shown 60%+ vacancy, expose at minimum:

- position title;
- employer;
- location;
- work arrangement when known;
- salary only when actually stated;
- direct vacancy/application URL;
- relevance percentage;
- concise reasons for the score — what fits;
- concise reasons for the score — what does not fit / is uncertain;
- PO decision field: APPLY / DO_NOT_APPLY;
- room for a short PO reason.

A lightweight browsable HTML/static result page is acceptable for Sprint 1. Do not overbuild a full application shell before relevance is proven.

Every live run must persist its result set so the exact candidates can be reviewed later; a result list must not disappear after the run.

## 6. Definition of Done

Sprint 1 is PASS only when all of the following are true:

1. A real live search is executed against current vacancy sources.
2. Results are genuine individual job adverts, not synthetic fixtures or category/listing pages.
3. Relevant results are scored 0–100 using the approved business rules.
4. Every result at or above 60% is made inspectable with the required fields and explanation.
5. Mandatory advanced-English and excluded role types are demonstrably filtered correctly without confusing preferred/incidental wording with mandatory requirements.
6. The exact live result set is durably persisted for later PO review.
7. At least **one real result is judged by the Product Owner as genuinely apply-worthy**. One is the minimum gate; more is better.
8. The evidence includes the acquisition source(s), scoring breakdown and direct vacancy links so the run is auditable.

A run with many technically valid ads but zero PO-apply-worthy jobs is **NOT Sprint 1 PASS**.

## 7. Non-goals for Sprint 1

Do not block Sprint 1 on:

- a perfect final multi-source architecture;
- retiring or deleting `job-searcher` or `allas-figyelo`;
- migrating every useful legacy component;
- a complete long-term learning engine;
- CV rewriting/generation;
- motivation/cover-letter generation;
- a polished production-grade web application;
- arbitrary result-count targets.

## 8. Parallel consolidation constraint

The Product Owner has decided the final job-search product must live in exactly one repository: `ggiaur/job-hunter`.

During Sprint 1, the team must continue the evidence-backed inheritance audit and migrate only useful assets that improve the product. Do not archive/delete/disable old repositories or live services until their unique useful assets are migrated or explicitly retained as reference and the replacement behavior is validated.

The two internal acquisition implementations already present inside `job-hunter` must also be reconciled technically so future work does not continue along duplicate hidden paths.

## 9. Next direction after Sprint 1

After relevance is proven, the next product direction is a repeatable review/learning workflow: structured per-result feedback and history, manual + scheduled runs, a practical web review surface, and continued source expansion where it improves real-job coverage. This is direction only until separately approved as Sprint 2 scope.