# Causal miss-analysis protocol

Established by JH-SUP-0026, from the Pillér Nonprofit Kft. false-negative
investigation (JH-SUP-0025, `docs/forensics/PILLER_MISS_RECONCILIATION_2026-09-04.md`).
Applies to any future search-quality incident in this project: a real,
specific job/reference that should have been acquired/scored but wasn't
(or the reverse — a real, specific false positive).

## Required steps

1. **Name the specific missing reference URL/job.** Not "some jobs are
   missing" — the exact vacancy, exact URL, exact date checked.
2. **Trace it through the real pipeline stage-by-stage.** Use the actual
   unmodified production code against the actual persisted evidence and, if
   needed, a bounded live reproduction — never a reimplementation or a
   theoretical description of what the code "should" do.
3. **Identify the first proven disappearance stage.** The earliest point at
   which the item is verifiably no longer present, with evidence at every
   preceding stage showing it was present.
4. **For every proposed cause, run a causal contradiction check:** *if this
   cause were true, can it actually explain this concrete case?* A real
   system weakness that does not survive this check for the specific case
   at hand is not the cause of that case — even if it should still be fixed
   as a separate issue.
5. **Separate `proven`, `reproduced`, `inference`, and `unknown because not
   persisted`** for every claim. Do not blur these categories together in
   either direction — do not claim "unknown" for something actually
   reproduced, and do not claim "proven" for something only inferred.
6. **Do not elevate a general system weakness to the cause of a specific
   miss without stage evidence.** A real, separate gap discovered during the
   investigation should still be reported and fixed — just not conflated
   with the causal explanation for the specific incident that triggered the
   investigation.
7. **Before declaring a fix PASS, re-run the known-positive reference
   through the live path and perform a bounded source-recall sample.** A fix
   that passes only its own unit tests, without a live re-run of the actual
   failing case, is not accepted as PASS.

## Canonical counterexample: the Budapest-only-scope non-cause

JH-SUP-0026's own drafting flagged a real risk: an earlier framing treated
"all 11 acquisition queries are hardcoded to Budapest" as *the* explanation
for the Pillér miss. This is a real, separate coverage gap (Fehérvárcsurgó-
region cities were never added to the query set after PO_DECISIONS_2026-09-04.md
defined them) — but it **cannot** be the cause of missing a Budapest-based
vacancy, because query coverage for Budapest was never the problem: Stage A
found the correct listing page on the very first query, rank 1 of 10.

Applying step 4 (causal contradiction check) immediately falsifies this
explanation: *if Budapest-only query scope were the cause, Pillér — a
Budapest vacancy discoverable by a Budapest-scoped query — would not have
been found at Stage A either.* It was. So this cannot be the cause.

The actual proven cause (JH-SUP-0025's reconciliation, independently
confirmed by Claude, Codex, and Gemini via different evidentiary paths) was
Stage C's link-extraction cap classifying company-profile/RSS/alert/advice
links as equal to real vacancy links, exhausting the traversal budget before
reaching Pillér's real position.

Use this example as the standing test for step 4: any future proposed cause
that would, if true, also have prevented Stage A from succeeding — when
Stage A is independently confirmed to have succeeded — fails the causal
contradiction check and must not be reported as the cause, however real the
underlying weakness it points to may be.
