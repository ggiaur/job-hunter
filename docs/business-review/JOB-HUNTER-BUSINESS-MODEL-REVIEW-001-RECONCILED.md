# Job Hunter — Track A reconciliation: Claude, Codex, Gemini independent business-model reviews

Task: JOB-HUNTER-BUSINESS-MODEL-REVIEW-001, step 5/6 (reconciliation
explicitly authorized for this task, unlike the earlier MULTI-REPO-DESIGN-001
task where synthesis was forbidden). Inputs, each written independently
before any agent read another's:
`JOB-HUNTER-BUSINESS-MODEL-REVIEW-001-CLAUDE.md`,
`-CODEX.md`, `-GEMINI.md` (all in this directory).

## Where all three independently agree

All three reviews, written without seeing each other, converged on the same
root diagnosis without prompting toward it:

1. **The written acceptance criterion (7–15 accepted job ads) measures
   throughput, not the actual business objective ("would the PO apply").**
   This is the central finding across all three. The 1/13 apply-worthy
   result is not a scoring bug in isolation — it is evidence that the
   acceptance criterion itself was never the right proxy.
2. **The persona's stated salary floor (HUF 700,000+) is never used by the
   scorer**, and salary-silent postings (the majority, since Hungarian
   `JobPosting` schema rarely includes `baseSalary`) are scored identically
   to confirmed-above-floor postings.
3. **No scoring dimension calibrates seniority/scale fit relative to the
   PO's actual current role** (IT department head, 6-person team, multi-site,
   public institution). Bare management/project-leadership keyword matches
   cannot distinguish a lateral or step-up move from a step-down one.
4. **Scoring is purely additive** — bonuses for institutional context,
   project-leadership language, location — with essentially no penalty
   signal for a role that is plausible but not distinctively fitting. The
   only real hard-exclusion machinery is company blacklist (one placeholder
   entry) and the mandatory-English gate.
5. **The pipeline reaches Profession.hu, LinkedIn, and similar sources
   indirectly through Google/SerpApi indexing, not through the PO's directly
   named sources (Profession, CV Online) as a first-class integration.**
   Coverage/freshness of this indirect path versus the named sources is
   unverified.
6. **`SPRINT_1.md` is stale/actively contradictory** — describes an
   abandoned browser-Google-search architecture as the current requirement.
   All three note this but, per this task's explicit instruction, none
   rewrote it.
7. **"Retain prior decisions" / "learn from feedback" has no real data
   model** — `learned_preferences.md` is hand-edited prose updated
   reactively by an agent after PO commentary, not a structured per-result
   feedback loop.
8. **No PO-facing web UI exists yet** — results are Markdown/JSON evidence
   files, not something the PO browses directly.

## Where the reviews add distinct value beyond the shared core

- **Codex** is the most granular on scoring-mechanism precision and
  surfaced two concrete, checkable findings the others did not: (a) the
  accepted JH-SUP-0023 list includes **Székesfehérvár and Nyíregyháza**
  results despite the persona stating Budapest/agglomeration plus
  remote/hybrid only — a literal boundary violation, not just an
  ambiguity; (b) `checkAdvancedEnglishRequired` cannot distinguish a
  *mandatory* requirement from a *preferred* or merely-mentioned one in the
  description text, so both false-exclude and false-include risk exist
  from the same gate. Codex also flagged that title+company deduplication
  can silently collapse genuinely distinct openings (different
  location/team/requisition), and that `SPRINT_1_STATUS: NOT_DONE`
  co-existing with `status: JOB_HUNTER_OPERATIONAL_PASS` in the same ack
  file is a terminology conflict worth the PO's explicit resolution, not
  just an internal inconsistency to shrug off.
- **Gemini** produced the cleanest, most directly actionable draft
  acceptance-criterion rewrite ("PO marks at least 3 results apply-worthy
  per run" replacing the count-range target) and was explicit that
  `exclusions.yaml`/`preferred_companies.yaml` being nearly empty leaves
  the system over-reliant on the one hand-maintained prose file.
- **Claude** grounded the seniority-fit gap in a specific comparative
  example from the current accepted list (rank 1, MOL Group E&P IT
  Operations Manager, a multinational energy company, vs. rank 9, a mobile
  operator's group-lead role) to make the missing "step up vs. lateral vs.
  step down" dimension concrete rather than abstract, and separately
  surfaced the Track B-relevant fact that job-searcher already has a
  working (if data-empty) implementation of the missing feedback-loop
  mechanism — see `JOB-HUNTER-CONSOLIDATION-001-CLAUDE.md`.

No material disagreement exists between the three reviews — differences are
in granularity and framing, not in conclusion.

## Consolidated, prioritized Product Owner questions (deduplicated)

1. **Label the evidence.** Of the 13 JH-SUP-0023 accepted ads, please mark
   each as *apply* / *review later* / *not for me* / *uncertain*, with the
   one or two decisive reasons for each — especially the single apply-worthy
   one. This single answer would resolve or sharply narrow most of the
   questions below and is the highest-value input available.
2. **Redefine the acceptance criterion.** Should Job Hunter's success measure
   change from a count range (7–15 results) to a PO-judged outcome (e.g.
   "at least N results marked apply-worthy per run")? If so, what should N
   be, and is a truthful zero-result run (an honestly empty market) an
   acceptable outcome?
3. **Seniority/step calibration.** Relative to your current role (IT
   department head, 6-person team, multi-site, public institution), how
   should the system rank a clear step-up (e.g. CIO/Head of IT at a larger
   organization) versus lateral versus a step-down move (e.g. a small-team
   group-lead role)? What signals in a job ad indicate which category?
4. **Salary policy.** HUF 700,000+ — is this a hard floor, a negotiable
   target, or conditional on role strength? Since most Hungarian ads omit
   salary, should Job Hunter (a) leave silence neutral as now, (b) attempt
   a heuristic estimate from role/company/location, or (c) penalize/flag
   salary-silent postings?
5. **Location boundary.** The persona states Budapest/agglomeration plus
   remote/hybrid, but the current accepted list includes on-site
   Székesfehérvár and Nyíregyháza roles. Is any on-site location outside
   Budapest/agglomeration acceptable, and under what conditions (commute
   distance, relocation, hybrid-with-travel)?
6. **Hard-exclude vs. penalize, itemized.** For each of the following,
   please classify as hard-exclude / strong penalty / small penalty / show
   with warning: on-site outside Budapest/agglomeration; salary confirmed
   below floor; salary undisclosed; advanced English stated as preferred
   (vs. mandatory); pure IC/service-management role; senior IC without
   management scope; agency/recruiter-posted listings; unknown
   employer/location.
7. **Source coverage.** Is indirect discovery via Google/SerpApi indexing
   of Profession.hu/LinkedIn/career pages an acceptable proxy for "Profession
   and CV Online," or is direct integration with those two sources required?
   How should a missed good listing be weighed against showing a marginal
   one?
8. **Role-family priority.** How should IT leadership, IT project
   management, IT service management, hands-on infrastructure work, and
   AI/digital-transformation leadership trade off against each other when
   a listing could plausibly fit more than one bucket? Is the Pillér
   Nonprofit project-manager example a target pattern or an acceptable
   fallback?
9. **Feedback mechanism.** Should Job Hunter capture structured per-result
   PO decisions (apply/save/reject + reason) instead of relying on manually
   edited `learned_preferences.md`? `job-searcher` already has a working
   (if never-used) implementation of exactly this pattern — see the
   parallel `JOB-HUNTER-CONSOLIDATION-001` audits — is reusing/adapting
   that preferable to building new?
10. **Web UI timing and shape.** Should a review UI be built now (as a
    precondition for collecting the per-result feedback needed for
    questions 1 and 9), or can another round proceed on Markdown/JSON
    evidence review first?

## Consolidated DRAFT Sprint outcomes — not approved scope

**DRAFT Sprint 1 — relevance-precision correction** (all three reviews
converge on this shape): keep the current acquisition architecture
(SerpApi, no redesign); add the PO-specified scoring dimension(s) from
questions 3–6 above (most likely seniority/step-fit and a salary
plausibility/undisclosed policy); replace the count-range acceptance
criterion with a PO-judged outcome per question 2. No new source
integration in this draft.

**DRAFT Sprint 2 — feedback loop and presentation** (all three converge):
structured per-result PO decision capture feeding scoring adjustments
(question 9 — potentially adapting `job-searcher`'s existing Telegram/
active-learning mechanism rather than building fresh, per the parallel
Track B consolidation audit), plus a minimal web UI or review surface
(question 10), and — contingent on question 7's answer — direct
Profession/CV Online integration if indirect discovery proves insufficient.

Both remain drafts for Product Owner discussion; neither is approved scope,
and neither has been implemented.
