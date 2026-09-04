# Job Hunter business-model review 001 — Codex

**Status: independent review for Product Owner discussion. Not an approved
roadmap, specification, or implementation instruction.**

## Evidence and boundary

This review is based only on the profile and preference files, the JH-SUP-0023
current-run evidence and JSON, the product-supervisor acknowledgement, and the
current retrieval/extraction/scoring code. It does not treat a technical
acceptance result as evidence that the Product Owner would apply. It also makes
no claim about unrecorded preferences.

## 1. Business model as evidenced

Job Hunter is a decision-support product for one Hungarian IT professional. Its
valuable output is not a large list of technically valid job pages; it is a
small, current, explainable shortlist on which the Product Owner can decide
whether to submit a CV.

The candidate profile is an experienced (20+ years) IT leader with infrastructure,
operations, digitalisation, supplier/budget, multi-site and AI-adoption
experience. The ordered target role families are IT leadership first, then
infrastructure/department leadership, IT project management, digital/CIO roles,
and AI-focused leadership. Budapest/agglomeration and remote/hybrid work are
acceptable; stated salary expectation is gross HUF 700,000+. The profile also
states a small set of hard exclusions, notably pure helpdesk, most junior roles,
non-managerial software development, non-IT management, and a *mandatory*
advanced/fluent/negotiation/native-equivalent English requirement. The learned
preferences refine this: a title alone is not leadership; actual people,
organisation, budget, service, or decision responsibility matters. Substantial
IT project leadership is valuable even without line management, but must not be
misrepresented as a people-management role.

Operationally, the product searches Hungarian-relevant sources through SerpApi,
requires a reachable page with `schema.org/JobPosting`, extracts fields, applies
a small number of hard gates, then ranks survivors with keyword-based bonuses.
It should present the result with reasons, preserve prior decisions, learn from
feedback, and later support CV/motivation-letter adaptation. The evidence shows
the first portion operating: JH-SUP-0023 produced 13 accepted, currently
reachable and schema-verified pages, within its written 7–15 target. The PO's
reported practical outcome is substantially different: only one of the 13 was
good enough to submit a CV for. Therefore, the proven part is acquisition and
mechanical filtering, not yet high-precision application decision support.

## 2. Material ambiguities, assumptions, contradictions, and missing criteria

### Outcome definition and measurement

1. **“Relevant” has three incompatible meanings.** The run calls pages
   “genuinely relevant” after title/domain/English/company checks; the product
   objective requires relevance to this individual's CV; the PO's observed
   standard is “would submit a CV.” These need separate names and states. The
   present accepted set is evidence that the first definition is too broad for
   the third.
2. **The 7–15 target is a throughput constraint, not a quality criterion.** It
   can be met while 12/13 results are not actionable. No minimum precision,
   application-intent rate, top-N quality, or maximum false-positive rate is
   defined.
3. **No labelled feedback dataset or evaluation protocol exists.** One positive
   Pillér example and a Mortoff warning are useful signals, but they do not
   define how a result is labelled, who labels it, how disagreements/uncertain
   cases are handled, or when scoring is deemed improved.
4. **No distinction is specified among “apply now,” “worth reviewing,” “keep
   watching,” and “reject.”** A single ordered list asks a score to stand in for
   several different decisions.

### Profile fit is under-specified

5. **The HUF 700,000+ salary expectation is not used.** No salary is extracted,
   no treatment of undisclosed salary is defined, and no rule says whether a
   known sub-threshold salary excludes, penalises, or merely warns.
6. **Location is a bonus, not an acceptance boundary.** The stated geographic
   scope is Budapest/agglomeration plus remote/hybrid, yet the accepted list
   includes Székesfehérvár and Nyíregyháza. Whether commute, relocation, or a
   role with a non-local site is acceptable is not evidenced or specified.
7. **The desired balance between leadership, project management and specialist
   service/operations work is not quantified.** Project-management roles remain
   in scope but should sit behind leadership unless separately requested. The
   scorer can nevertheless give a +20 project-leadership bonus, and a marker
   match can make a role competitive without proving its priority category.
8. **The AI-focused target family has no fit rubric.** The profile names several
   AI leadership forms but does not say which minimum domain, technical depth,
   people scope, or business-transformation responsibility makes one viable.
9. **Company preference is incomplete.** There is one excluded company and no
   preferred companies. The learned preference says institutional, public,
   nonprofit, utility, and large-enterprise contexts are advantageous, but it
   does not say whether any are required, how they trade off against role fit,
   or whether sector-specific constraints exist.
10. **The profile is rich but not operationalised into evidence requirements.**
    There is no rule for matching particular experience (team size, vendor and
    budget responsibility, infrastructure, public/institutional environment,
    AI adoption) against a vacancy, nor for identifying a material experience
    gap.

### Current gate and score semantics

11. **Hard exclusion is inconsistently represented.** Persona says pure
    helpdesk, junior (subject to management override), software development
    without management, and non-IT management are zero-point exclusions. The
    shown acceptance path instead chiefly uses title/domain relevance, excluded
    company, and an English regex. It does not visibly apply separate explicit
    gates for all listed persona exclusions.
12. **Mandatory English is not actually tested for mandatory wording.**
    `checkAdvancedEnglishRequired` searches for advanced-English phrases in the
    full description, then excludes. It does not establish whether that phrase
    was a requirement, a preference, a benefit, or incidental text. Conversely,
    absence from extracted text becomes “not specified,” not evidence that the
    job has no such requirement.
13. **Keyword presence is treated as proof of scope.** Management and project
    leadership each use a small positive marker list. A marker can occur in a
    context that does not assign ownership to the candidate. There is no
    criterion requiring a supporting excerpt, a minimum combination of
    responsibilities, or a confidence level.
14. **Institutional/large-enterprise scoring conflates distinct concepts.** The
    code's markers identify several sectors (for example bank, hospital,
    energy) but not “large enterprise” as such. The evidence nevertheless
    describes the bonus as institutional/public-service/utility/large-enterprise.
    This is an interpretive leap that needs an approved definition.
15. **Scores are not calibrated to a human decision.** Query priority contributes
    to the numerical score; the score is not a stated probability of fit,
    application recommendation, or comparable scale. No threshold maps score
    to an action, and score components can double-count correlated language.
16. **Explanations are insufficiently decision-oriented.** The JSON provides a
    short duty excerpt and occasional scoring note, but not a consistent
    “why apply / why not,” matched evidence, missing evidence, key concern,
    location/salary/English confidence, or a clear role category.
17. **“Current” and “reachable” are not the same as still open.** Schema
    verification and `validThrough` when provided improve evidence, but no
    business rule defines freshness, expired-posting handling, reposts, or the
    status to show when dates are absent or stale.
18. **Deduplication can merge distinct vacancies.** Title+company deduplication
    may collapse separate locations, teams, requisitions, or employment types;
    the business rule for what constitutes the same opportunity is absent.

### Coverage, product experience, and learning

19. **Source coverage is not an outcome criterion.** The stated objective names
    Profession and CV Online among relevant Hungarian sources. The accepted
    JH-SUP-0023 list contains Profession, LinkedIn, and Karrierhub URLs; no CV
    Online accepted result is evidenced. No source list, source-level coverage
    target, refresh cadence, failure policy, or rule for sources that cannot
    expose JobPosting schema is agreed.
20. **A `schema.org/JobPosting` requirement is a technical reliability policy,
    not a business requirement.** It may exclude a good current job from an
    important source solely because its page is marked up differently. The
    acceptable trade-off between verification confidence and recall is not
    specified.
21. **The web UI requirement is not expressed as user outcomes.** There are no
    acceptance criteria for sorting, filters, review queue, decision capture,
    duplicate/expired handling, explanation visibility, or an efficient route
    to the source and application.
22. **Retention and learning are only goals, not policies.** No data model or
    user-visible rule defines which decisions/reasons are retained, how a
    preference becomes a hard rule versus a ranking adjustment, how it can be
    corrected, or how historical feedback is protected from accidental
    overfitting.
23. **CV and motivation-letter adaptation lacks boundaries and quality gates.**
    It is unclear when adaptation is offered, what verified vacancy evidence it
    may use, whether it may claim unrecorded experience, what PO review is
    required, and how versions relate to a decision.
24. **Operational status is not product success.** The supervisor acknowledgement
    reports `SPRINT_1_STATUS: NOT_DONE` while declaring an operational pass.
    This is compatible only if “operational” means pipeline execution rather
    than the Sprint/business outcome; the acceptance authority and the
    definition of done should be made explicit.

## 3. High-value questions for the Product Owner

The following questions should be answered with examples from the 13 accepted
ads if possible. That will turn subjective intent into testable behaviour.

1. Of the 13 JH-SUP-0023 ads, please label each **apply**, **review later**,
   **not for me**, or **uncertain**, and give the one or two decisive reasons.
   Which is the single apply-worthy role? This is the highest-value calibration
   input.
2. What is the minimum condition for “truly relevant”: would you submit a CV
   now, would you spend time researching it, or merely is it within a broad
   search domain? Should Job Hunter display these as separate result buckets?
3. In priority order, how should actual people/organisation leadership,
   IT-project leadership, IT service management, hands-on infrastructure work,
   and AI/digital-transformation leadership trade off? Are any categories
   currently unwanted even when the title matches?
4. Which concrete signals make a manager title substantive enough: direct
   reports, hiring/performance responsibility, budget, suppliers, service
   ownership, strategic decision rights, or something else? Which are required
   versus merely positive?
5. For project management, what combination makes a role apply-worthy rather
   than acceptable-but-secondary? Does the Pillér example represent a target
   role family, a desirable fallback, or an exception?
6. Please classify each candidate rule as **hard exclude**, **strong penalty**,
   **small penalty**, or **show with warning**: outside Budapest/agglomeration;
   on-site Székesfehérvár; on-site Nyíregyháza; salary known below HUF 700,000;
   salary not disclosed; advanced English stated as preferred; advanced English
   stated as mandatory; pure IC service-management work; a senior IC role;
   agency/recruiter postings; and unknown employer/location.
7. Does “remote/hybrid acceptable” mean any Hungarian location when remote is
   mentioned, a specific on-site travel limit, or a specific number of office
   days? Is relocation ever in scope?
8. Is HUF 700,000+ a firm floor, a negotiable target, or a minimum only when
   another part of the role is weaker? How should an undisclosed salary be
   treated?
9. Which English wording is genuinely disqualifying in practice, and does the
   distinction depend on use frequency or job duties? Should “advanced English
   preferred” remain eligible? Is any other language a constraint?
10. Which company/sector attributes are positive, neutral, or unacceptable?
    Is the current institutional/public/nonprofit/utility/large-enterprise
    preference equally strong across all of those categories?
11. What sources must be covered for a useful service, especially Profession
    and CV Online? Is missing a good vacancy from one source worse than showing
    a questionable extra vacancy, and by how much?
12. What weekly outcome would make the product successful: a maximum number of
    candidates requiring manual review, a minimum share marked apply-worthy,
    no missed roles, time saved, or another measure? What is an acceptable
    result when there are genuinely zero apply-worthy vacancies?
13. What must a result explanation show for you to trust it, and which unknown
    facts must be surfaced rather than inferred?
14. When you reject a role, which reusable reason choices would you actually
    use? May the system promote a repeated reason to a hard exclusion only
    after confirmation, or must every such change be explicitly approved?
15. Before any application-material adaptation, what source CV is authoritative,
    what claims are permitted, and what mandatory PO review/approval should
    occur before anything is used?

## 4. DRAFT outcome proposals for PO discussion only

### DRAFT Sprint 1 outcome: trusted vacancy decision shortlist

**Proposed outcome:** The PO can review a small, current shortlist of
Hungary-relevant vacancies and quickly identify the ones worth applying to,
with enough evidence to understand both match and risk.

**Draft discussion acceptance criteria (not approved):**

- The PO first approves a decision taxonomy (at least apply, review, reject,
  and unknown/needs-check) and a hard-exclude versus penalty policy covering
  role scope, English, salary, location, company, and data uncertainty.
- Results are grouped by that taxonomy and role family rather than represented
  only by one undifferentiated score. Every item has source URL, observed
  freshness/status, location, salary when available, English evidence/status,
  explicit matched evidence, explicit concerns/unknowns, and a clear reason
  for its placement.
- The result set is evaluated against PO labels on an agreed, recorded sample.
  Success is defined by an agreed top-list precision/review-burden measure,
  not by producing 7–15 accepted pages. A zero-result shortlist is acceptable
  when it truthfully reflects the market and shows why.
- Coverage requirements name the required sources and an explicit policy for
  unavailable, non-schema, expired, and duplicate listings. “Current” has a
  PO-approved definition.
- The PO can record a decision and structured reason per vacancy, and prior
  decisions remain visible. No feedback-derived hard exclusion takes effect
  without the PO-approved policy.

### DRAFT Sprint 2 outcome: feedback-calibrated search and application support

**Proposed outcome:** Repeated PO decisions measurably improve shortlist
quality, and a PO-approved apply decision can start a truthful, reviewable
application-material workflow.

**Draft discussion acceptance criteria (not approved):**

- The system uses recorded decisions/reasons to propose transparent ranking or
  filtering changes, each traceable to feedback and reversible. It is evaluated
  on new labelled vacancies against the Sprint 1 baseline, using the PO's
  agreed quality measure.
- The UI lets the PO inspect history, correct a decision or preference, and
  distinguish a permanent hard rule from a one-off rejection.
- For an apply-approved vacancy only, the product can prepare a vacancy-grounded
  CV/motivation-letter draft using only the authoritative profile/CV evidence.
  It highlights gaps and never invents qualifications.
- The PO reviews and explicitly approves every material draft before use;
  vacancy, source facts, feedback, and generated-document versions remain
  traceable.

## Decision requested

Before a delivery plan is approved, the PO should resolve the taxonomy and
hard-exclude/penalty questions above, label the JH-SUP-0023 set, and choose a
quality metric that reflects “would actually apply.” Until then, an accepted
count can show that the pipeline runs but cannot demonstrate that the business
objective is met.
