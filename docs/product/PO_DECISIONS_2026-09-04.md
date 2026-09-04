# Job Hunter — Product Owner decisions — 2026-09-04

**Authority:** Product Owner  
**Status:** APPROVED PRODUCT INPUT  
**Purpose:** durable source for the business rules agreed before restarting implementation.

## 1. Product outcome

Job Hunter exists to find **real, current vacancies that the Product Owner would genuinely consider applying to**. Search technology is subordinate to that outcome. A technically elegant system that keeps developing but does not produce usable jobs is a failure.

The source strategy is an engineering/product-team decision. Profession.hu, CV Online, Google/SerpApi, Jooble, company career pages, ATS pages, or other legitimate sources may be used when they improve real relevant results. Google-based discovery is acceptable if it produces useful jobs. Do not make the Product Owner choose the search technology.

## 2. Role fit

Preferred work is leadership / coordination rather than solo execution.

Good target patterns include:
- IT leader / Head of IT / IT manager / IT department or group leader;
- IT group-lead roles;
- IT project / programme leadership;
- development/digitalisation/IT work where the role genuinely directs people, vendors, delivery, projects, or development;
- a project-lead role may be relevant **without direct reports** when it genuinely directs work, people, suppliers, or development.

Hard exclusions:
- developer roles;
- helpdesk roles;
- one-person IT roles where the Product Owner would be expected to carry the IT work alone;
- pure individual-contributor roles that do not contain meaningful leadership/coordination responsibility.

The functional domain may be mixed: operations, infrastructure, projects, applications, digitalisation/AI transformation and related IT leadership can all be relevant.

No employer type is excluded merely because it is public-sector, municipal, nonprofit, private-sector, or commercial.

## 3. English

Hard exclude when the vacancy makes advanced English a **mandatory requirement**, including clearly mandatory fluent/native/upper-level professional English.

Do not hard-exclude when:
- intermediate English is required;
- only basic English is required;
- English is merely an advantage/preference;
- there is no English requirement.

The parser/scorer must distinguish **mandatory** language requirements from preferred/incidental mentions.

## 4. Salary

- Salary omitted from the advert: **neutral; do not penalise it.**
- Confirmed salary below HUF 700,000 gross: **small/moderate penalty only, not exclusion.**
- Do not attempt to turn missing salary into a fabricated estimate for acceptance.

## 5. Location and work arrangement

Primary first-round area is the region reasonably accessible from **Fehérvárcsurgó**, especially:
- Székesfehérvár;
- Mór;
- Várpalota;
- Győr;
- Tata;
- Tatabánya;
- Veszprém;
- optionally Dunaújváros.

The governing principle is not a rigid city list: distance from Fehérvárcsurgó and practical public-transport accessibility matter.

More distant Hungarian locations may still be relevant when attendance is infrequent / hybrid / remote. Even Pécs, Szeged, Szombathely or Sopron distance may be acceptable when, for example, office attendance is roughly weekly. Location must therefore **not be a blanket hard exclusion at this stage**.

## 6. Freshness

A newer advert is a positive signal. An older advert is **not excluded solely because of age** while it remains active.

## 7. Relevance score and visible result set

Each real vacancy receives an explainable **0–100 relevance score**.

The Product Owner wants to see **all results scoring at least 60%**. Do not hide 60%+ results merely to make the list look cleaner.

The score must be explainable. For every shown result, expose at least:
- position title;
- employer;
- location;
- work arrangement when known;
- salary when actually stated;
- direct vacancy/application URL;
- relevance percentage;
- short explanation of why it fits;
- short explanation of material mismatches/risks;
- PO decision field.

## 8. Feedback

The primary PO decision is binary:
- **APPLY / beadom**;
- **DO_NOT_APPLY / nem adom be**.

The valuable signal is not the label alone. Capture the reason: what was good, what was bad, and why the PO accepted or rejected the system's percentage assessment. This evidence should later improve the model in an auditable way.

## 9. Sprint 1 success rule

Sprint 1 is successful only when a live run produces **at least one real vacancy that the Product Owner judges genuinely apply-worthy**. One good result is enough for the minimum acceptance gate; more genuinely apply-worthy results are better.

A raw result count is not a success criterion. The previous 7–15 result target is retired as a Product Outcome measure.

## 10. Repository consolidation decision

Desired end-state: **exactly one repository owns the job-search product: `ggiaur/job-hunter`.**

Before `job-searcher`, `allas-figyelo`, or any overlapping job-search repository is retired, the team must inventory and validate useful unique assets and migrate what is worth preserving. No destructive repository/service action is authorised merely by this decision.

Known preservation candidates from independent reviews include:
- `job-searcher`: direct Profession.hu acquisition work; structured feedback/active-learning mechanism; useful tests/operational lessons;
- `allas-figyelo`: Jooble acquisition; regional coverage; lightweight web/result presentation; notification patterns;
- `cv-linkedin`: currently evidenced as empty.

`job-hunter` itself contains two unreconciled acquisition implementations (`tools/acquisition/*.py` and the live `apps/job-hunter-mvp/run.mjs`). The engineering team must compare them and preserve any unique value; this is a technical reconciliation decision, not a new Product Owner question.

## 11. Immediate priority

Do not spend another development cycle on architecture for its own sake. The immediate priority is:

> **Produce real current vacancies, score them truthfully, show every 60%+ result with reasons, and get at least one result the Product Owner would actually apply to.**

All implementation, source-selection, migration, and UI decisions in Sprint 1 are judged by whether they advance that outcome.