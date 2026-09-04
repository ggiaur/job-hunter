# Job Hunter — business-model review (Claude, independent)

Task: JOB-HUNTER-BUSINESS-MODEL-REVIEW-001. Business clarification only — no
implementation, no canonical file rewrite, no scheduling change. Written
without reading any Codex or Gemini review of the same brief.

Evidence used: `profile/persona.md`, `profile/exclusions.yaml`,
`profile/preferred_companies.yaml`, `profile/learned_preferences.md`,
`docs/evidence/REAL_JOB_HUNTER_CURRENT_RUN.md` +
`real-job-hunter-current-run.json`, `docs/agent-runtime/product-supervisor-ack.yaml`,
`apps/job-hunter-mvp/run.mjs` scoring block (lines ~220-294),
`apps/job-hunter-mvp/lib/extract.mjs`, `SPRINT_1.md`.

## 1. Business model as I understand it (restated)

Job Hunter exists to save the Product Owner (a 20+ year IT professional,
currently IT department head at a public library) from manually trawling
Hungarian job boards. The system should: acquire candidate postings from
real Hungarian job sources; verify each is a genuine individual vacancy
(not a listing/category page); score/rank by fit against the PO's actual
profile; present results for PO review; remember PO feedback so future runs
improve; eventually help produce tailored application materials. It should
run unattended, roughly twice a week, without the PO manually operating it.

That is the model I can reconstruct from committed evidence. It is **not**
what the codebase currently optimizes for. The codebase (and its own
acceptance evidence) optimizes for a narrower, different target: *return
some number of postings, within a target count range, that pass a set of
hard exclusion/inclusion gates and a scoring formula, drawn from Google via
SerpApi.* Nothing in the current pipeline is instrumented against "would
the PO actually apply to this," which is the PO's own stated bar. That gap
is the central finding of this review.

## 2. Material ambiguities, hidden assumptions, contradictions

1. **The acceptance criterion silently conflates volume with quality.**
   JH-SUP-0022/0023 evidence repeatedly frames success as "N accepted job
   ads (target range 7–15)" — a count target, not a quality target. Nothing
   in the directive chain or the evidence docs defines what fraction of
   accepted results the PO should actually find worth applying to. The PO's
   own signal this round — 1/13 — reveals that a pipeline satisfying its
   own written acceptance criteria can still deliver ~8% real usefulness.
   The count-range acceptance criterion was never actually the right proxy
   for the real goal, and nobody wrote down what the right proxy is.

2. **No positive salary/seniority-fit signal exists, despite persona stating
   both.** `persona.md` states a salary floor (700 000 Ft+ gross) and a
   ranked position-tier preference. Neither is used anywhere in
   `run.mjs`'s scoring. Hungarian job ads on the sources SerpApi surfaces
   (profession.hu, LinkedIn, company career pages) very often omit
   `baseSalary` from their `JobPosting` schema entirely, so this may be
   partly unanswerable from source data — but that unanswerability itself
   is never surfaced to the PO; a listing with unknown salary is scored
   identically to one confirmed to meet the floor. Same for seniority: the
   scoring rewards "management scope" and "project leadership scope" as
   binary/near-binary signals, but never asks whether the *level* of a
   given management role is a step up, lateral, or step down from the PO's
   current 6-person-team IT-department-head role at VMK — a Mobile
   Data Services group-lead role at a telco (rank 9, score 75) and an
   E&P IT Operations Manager role at a multinational energy company
   (rank 1, score 115) are structurally very different career moves, and
   the scoring formula cannot tell them apart beyond generic
   "institutional/large-enterprise" and "project-leadership-language"
   bonuses.

3. **All scoring signals are positive/additive; there is no explicit
   negative signal for "generic/unconvincing fit."** Reading the current
   accepted list (`REAL_JOB_HUNTER_CURRENT_RUN.md`), several entries read
   as plausible-sounding IT-management titles that matched the domain and
   language gates and picked up institutional/project-leadership bonus
   points, without anything in the pipeline asking whether the role is
   *distinctively* a fit for this specific persona versus generically IT
   management. The exclusion list (`exclusions.yaml`) has exactly one
   entry (`BadCompanyKft`, presumably a placeholder/test value, not a real
   exclusion learned from feedback) and `preferred_companies.yaml` is
   empty. The learned-preferences file captures negative title patterns
   (bare "senior/lead" isn't management) and one positive example
   (Pillér Nonprofit) but nothing about company reputation, sector fit, or
   what specifically made 12 of 13 accepted results *not* worth an
   application from the PO's actual perspective — because that feedback
   was never solicited or recorded per-result, only in aggregate ("1/13
   good enough").

4. **The retrieval mechanism (SerpApi + Google-indexed job pages) is a
   secondary channel to the sources the PO actually named.** The new
   directive explicitly names Profession and CV Online as the intended
   sources. The current pipeline queries Google via SerpApi with Hungarian
   search phrases and accepts whatever domain surfaces (profession.hu,
   linkedin.com, company career pages, cvonline.hu incidentally if
   Google indexes it) — it is not a direct Profession/CV Online
   integration, and there is no evidence anyone checked what fraction of
   each named source's actual current listings this indirect approach
   surfaces versus misses. Google's own index freshness/coverage of these
   two sites is an unverified assumption, not a proven acquisition
   channel.

5. **SPRINT_1.md is not just stale, it describes an abandoned architecture
   as the current requirement.** It still defines Sprint 1 entirely as
   literal Google-SERP browser automation (explicitly excluding "relevance
   scoring against persona.md" and "profession.hu / cvonline.hu portal-
   native discovery" as non-goals) — the opposite of what has actually been
   built and is now running (SerpApi + persona scoring + portal-hosted
   postings). This file was flagged as STALE_OR_CONFLICTING in the parallel
   PORTFOLIO-AUDIT-001 audit; I am not rewriting it per this task's own
   instruction, but any Sprint 1/2 draft below should be read as *replacing*
   its content pending PO confirmation, not extending it.

6. **"Retain prior decisions" and "learn from feedback" have no data model
   yet.** `learned_preferences.md` is a hand-edited prose file the PO or an
   agent updates manually after the fact; there is no per-result
   accept/reject/apply feedback loop, no structured record of *why* the PO
   would or wouldn't apply to a specific result. Without that, "learning"
   can only happen through someone manually re-deriving a pattern from
   PO commentary each round, which is what happened across JH-SUP-0022/
   0023 and is not a scalable definition of the "learn from feedback"
   goal.

7. **No web UI exists yet**, despite being named as part of the business
   objective; results are currently Markdown + JSON evidence files read by
   an agent, not something the PO browses directly. Not a contradiction,
   but worth naming since it's in scope for "presented in a web UI" and
   absent from every sprint so far.

## 3. Concrete questions for the Product Owner

Ranked by how much they'd change scope/acceptance criteria:

1. **What specifically made the 12 rejected-in-practice results wrong?**
   For at least a few of the 13, a short PO note (wrong seniority tier?
   wrong company type? role sounds good but scope is unclear from the
   ad? salary probably too low? sector mismatch?) would let us replace
   guesswork with an actual signal to add to scoring — this is the single
   highest-value piece of missing information.
2. **Is a numeric score/count target ever the right acceptance criterion
   for this product, or should acceptance instead be phrased as "the PO
   marks at least N of the shown results as apply-worthy"?** If the latter,
   should there be a PO-facing accept/reject action per result that feeds
   `learned_preferences.md` (or a structured successor) automatically?
3. **Salary: since most source postings won't state it, should Job Hunter
   (a) exclude/penalize salary-silent postings, (b) leave them neutral as
   now, or (c) attempt a secondary signal (company/role/level heuristic)
   for likely salary range?**
4. **Seniority/step calibration: relative to the PO's current role (IT
   department head, 6-person team, multi-site, public-institution), what
   makes a candidate role clearly a step up vs. lateral vs. a step down?**
   Team size floor? Budget/scope language? Industry tier? This is the
   single biggest missing scoring dimension identified above.
5. **Source fidelity: is indirect Google/SerpApi discovery of
   profession.hu/LinkedIn/career-page postings an acceptable proxy for
   "Profession and CV Online," or does the PO want direct
   Profession/CV Online integration (if they have a stable, ToS-compliant
   access path) as a distinct, higher-priority acquisition channel?**
6. **What should be hard-excluded (never shown) vs. merely penalized
   (shown lower)?** Currently only company blacklist and mandatory-advanced-
   English are hard exclusions. Is there a hard-exclude case among the
   12 non-apply-worthy results this round that scoring alone can't catch?
7. **When should the web UI / notification / feedback-loop work start**
   relative to fixing relevance precision? Is showing more, better-targeted
   results via the current Markdown/JSON evidence acceptable for another
   round, or is the UI itself now a precondition for the PO to give
   per-result feedback (per Q1/Q2 above)?

## 4. Draft Sprint 1 / Sprint 2 outcomes — DRAFT ONLY, not approved scope

**Draft Sprint 1 (relevance-precision correction):** Given the PO's answers
to Q1–Q4 above, add the missing scoring dimension(s) they identify (most
likely: seniority/step-fit and/or salary-plausibility) and re-run against
the same profile with a PO-reviewed acceptance bar defined as "the PO
marks at least 3 of the shown results as genuinely apply-worthy," replacing
the current count-range criterion. No new source integration in this draft
Sprint 1 — same acquisition mechanism, sharper scoring only.

**Draft Sprint 2 (feedback loop + UI, if PO confirms priority):** A minimal
per-result PO decision capture (apply-worthy / reject + one-line reason)
feeding a structured preferences store, plus a basic web UI to review
results without reading Markdown/JSON evidence files. Direct
Profession/CV Online integration (Q5) would also belong here or later,
depending on the PO's answer.

Both are explicitly drafts for discussion — not implemented, not activated,
not a redefinition of `SPRINT_1.md` without PO sign-off.
