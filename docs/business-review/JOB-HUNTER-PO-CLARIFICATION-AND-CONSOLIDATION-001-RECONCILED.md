# Job Hunter — combined PO reconciliation (Track A: business model, Track B: one-repo consolidation)

Task: `JOB-HUNTER-RECONCILE-REVIEWS-001` (refines
`JOB-HUNTER-PO-CLARIFICATION-AND-CONSOLIDATION-001`). Analysis only — no
code changed, no service/scheduler touched, no repository merged/archived/
deleted, no canonical file rewritten, no PO preference invented.

**Independent inputs this reconciles**, each written before its author read
any other's (source files, all in this directory unless noted):
`JOB-HUNTER-BUSINESS-MODEL-REVIEW-001-{CLAUDE,CODEX,GEMINI}.md`,
`JOB-HUNTER-BUSINESS-MODEL-REVIEW-001-RECONCILED.md` (Track A detail),
`JOB-HUNTER-CONSOLIDATION-001-{CLAUDE,GEMINI,CODEX}.md` (Track B; Codex's
environment could not commit/push for this repo, same read-only-`.git`
sandbox limitation seen throughout this session, and could not reach
`allas-figyelo` at all due to a separate sandbox SSH restriction — its
content is committed by Claude on its behalf, transparently noted).

## Part 0 — New finding this reconciliation surfaced: job-hunter already has an internal, unreconciled duplicate acquisition system

Codex's Track B inspection (going deeper into `job-hunter`'s own source tree
than either Claude's or Gemini's Track B passes did) found a **second,
independent acquisition pipeline already inside `job-hunter` itself**:
`tools/acquisition/{orchestrator,adapters,budget,filtering,planner}.py`, a
Python/Firecrawl-based system, built under directive `JH-SUP-0003`
("Actual Migration Goal and Search Repair" — explicitly tasked with
migrating `job-searcher`'s useful functionality into `job-hunter`), last
touched **2026-09-02**.

Verified directly (Claude, this reconciliation): this Python system is
**not** what actually runs. The installed crontab
(`0 8 * * 1,4 .../schedule/run-job-hunter-mvp.sh`) and that script's own
content (`exec /usr/bin/node run.mjs`) confirm the live, scheduled pipeline
is `apps/job-hunter-mvp/run.mjs` — the JS/SerpApi system built one to two
days later under `JH-SUP-0022`/`JH-SUP-0023` (2026-09-03/04), which is what
every prior evidence document in this session (including both Track A and
the rest of Track B) describes and reviews. **Codex's report should be read
with this correction: `tools/acquisition/` exists and is real work, but it
is not "canonical" in the sense of being the operating system today — it
is a separate, apparently abandoned-in-place migration attempt that was
superseded by a fresh rebuild days later, without evidence either was
reconciled against the other.**

This is exactly the failure mode the whole multi-AI governance exercise
exists to catch — duplicate, overlapping work with unclear ownership — and
it was invisible to repo-level portfolio scanning because both systems live
inside the one "canonical" repository. It was only caught because Codex's
Track B pass, working from a different independent starting point, read
further into the source tree than the other two Track B passes did — worth
noting as a concrete example of why independent multi-agent review finds
things a single reviewer misses, not just a redundancy check.

**This changes what "migrate job-searcher into job-hunter" can mean**: some
of what Codex's inventory below classifies as "already covered in canonical"
may only be covered in the *dormant* Python system, not the *live* JS one —
this needs the Product Owner's attention before any Track B migration work
begins, not just the job-hunter-vs-siblings question Part 2 covers.

---

## Part 1 — Agreed business model (Track A)

All three independent reviewers (Claude, Codex, Gemini), without seeing each
other's work, converged on the same diagnosis:

**The written acceptance criterion — "7 to 15 accepted job ads" — measures
throughput, not the real business objective ("would the PO actually apply").**
The JH-SUP-0023 run technically passed (13 results, in range) while only
1 of the 13 was apply-worthy by the PO's own judgment. That gap is not a
scoring bug to patch quietly — it means the acceptance criterion itself was
measuring the wrong thing.

Contributing, independently-confirmed causes:
- No use of the persona's stated HUF 700,000+ salary floor; salary-silent
  postings (the majority) scored identically to confirmed-above-floor ones.
- No scoring dimension for seniority/organizational-scale fit relative to
  the PO's actual current role (IT department head, 6-person team,
  multi-site, public institution).
- Purely additive scoring (bonuses only, no real penalty signal for a
  plausible-but-not-distinctive match); `exclusions.yaml`/
  `preferred_companies.yaml` are effectively empty.
- Indirect source discovery (Google/SerpApi indexing) rather than direct
  integration with the PO's named sources (Profession, CV Online).
- `SPRINT_1.md` is stale/actively contradictory (describes an abandoned
  browser-Google-search architecture) — noted by all three, deliberately
  left untouched per this task's own scope limit.
- No structured feedback loop (`learned_preferences.md` is hand-edited
  prose) and no PO-facing web UI yet.

Codex additionally found two specific, checkable boundary violations worth
flagging on their own: the accepted list includes on-site Székesfehérvár and
Nyíregyháza results despite the persona stating
Budapest/agglomeration + remote/hybrid only; and the mandatory-English gate
cannot currently distinguish a *requirement* from a *preference* or
incidental mention in the description text.

No material disagreement exists between the three reviews — only
differences of granularity. Full detail and the complete 10-question
Track A list: `JOB-HUNTER-BUSINESS-MODEL-REVIEW-001-RECONCILED.md`.

---

## Part 2 — Agreed one-repo consolidation findings (Track B)

Claude and Gemini's independent audits (Codex's pending) converged closely,
down to the same specific evidence:

**`job-hunter` and `job-searcher` share literal history.** Their
`bot_service.py` files are byte-identical (137 lines, `diff` exit 0), as are
`Dockerfile.bot`. None of this is used by `job-hunter`'s actual operating
pipeline (`apps/job-hunter-mvp/run.mjs`) — it is dead code sitting in
`job-hunter`'s root, carried over from a fork/copy of `job-searcher`.

**`job-searcher` and `allas-figyelo` each contain a working implementation
of a gap Track A independently flagged as missing in `job-hunter`:**

| Track A gap | Where a working implementation already exists |
|---|---|
| No structured feedback loop / learning mechanism | `job-searcher`: Telegram 1-click feedback (`tools/feedback.py`) + auto-promotion (2× DISLIKE → exclusion, 2× LIKE → preferred company). Mechanism tested (35/35), but **no accumulated data** — `feedback_history.json` is empty. |
| No direct Profession.hu/CV Online integration | `job-searcher`: `tools/scraper.py`, Firecrawl-based, validated live (20 real ads extracted directly from a Profession.hu URL, no SerpApi/Google intermediary). |
| No PO-facing web UI | `allas-figyelo`: working GitHub Pages presentation (`docs/jobs.json` + static page), zero cost, already deployed. |
| (Bonus, not a named Track A gap but relevant) source coverage outside Budapest | `allas-figyelo`: Jooble aggregator API covering the PO's home region (Székesfehérvár/Győr/Várpalota/Tata/Tatabánya/Veszprém) — a genuinely different, complementary channel, not a duplicate of job-hunter's Budapest-centric Google queries. |

`cv-linkedin` is confirmed empty (zero commits, verified independently twice
this session) — nothing to migrate, no further action needed on it.

**No retirement of `job-searcher` or `allas-figyelo` (or their live
services — Cloud Build deployment, GitHub Actions cron, Telegram bot) is
recommended.** Per this task's own constraint, retirement cannot be
considered until the migration candidates above are either actually ported
or the PO explicitly decides to keep them as reference-only, and until
`job-hunter` has PO-confirmed acceptance evidence — which Part 1 establishes
is not yet the case.

External dependencies not represented in git that a migration decision
would need to account for: `job-searcher`'s Firestore/Telegram/Firecrawl
credentials and its GCP Cloud Build deployment; `allas-figyelo`'s Jooble/
Gmail credentials stored as GitHub Actions secrets. None of these could be
inspected directly this session (no `gh`/GCP access) — their current
validity/ownership is itself a fact only the PO can confirm.

Full detail and complete matrices:
`JOB-HUNTER-CONSOLIDATION-001-CLAUDE.md`,
`JOB-HUNTER-CONSOLIDATION-001-GEMINI.md`.

---

## Part 3 — Combined prioritized Product Owner questions

*(Question 0 is new from this reconciliation pass (Part 0) and is placed
first because it changes what "done" means for several items below. Track A
questions 1–4 are the next-highest-leverage — they would resolve or sharply
narrow most of what follows. Full Track A list of 10 is in the Track A
reconciliation file; this list adds the Track B-specific questions Part 2
raises.)*

0. **Internal duplication inside job-hunter itself (Part 0).** `job-hunter`
   contains two unreconciled acquisition systems: `tools/acquisition/*.py`
   (JH-SUP-0003, 2026-09-02, not scheduled/live) and
   `apps/job-hunter-mvp/run.mjs` (JH-SUP-0022/0023, 2026-09-03/04, the one
   actually cron-scheduled and evidenced). Was the Python system meant to be
   abandoned in favor of the JS rebuild, or does it contain work that should
   have carried forward and didn't? Should it be deleted, kept as reference,
   or does it need its own reconciliation pass before any Track B migration
   work (which may currently be evaluated against the wrong "canonical"
   system) proceeds?
1. **Label the evidence.** Of the 13 JH-SUP-0023 results, mark each *apply*
   / *review later* / *not for me* / *uncertain*, with the decisive reason —
   especially for the one apply-worthy result. Highest-value single answer
   available.
2. **Redefine the acceptance criterion** from a count range to a PO-judged
   outcome (e.g. "at least N marked apply-worthy per run"). What should N
   be?
3. **Seniority/step calibration** relative to your current role — what
   makes a listing a step up vs. lateral vs. step down?
4. **Salary policy**: hard floor, negotiable target, or conditional? How
   should salary-silent postings (the majority) be treated?
5. **Feedback channel choice (Track B-driven):** should PO feedback be
   captured via Telegram (porting `job-searcher`'s already-working
   mechanism) or a local/web UI (porting or rebuilding on
   `allas-figyelo`'s GitHub Pages pattern), or both?
6. **Ingestion channel choice (Track B-driven):** should direct
   Profession.hu scraping (`job-searcher`'s `tools/scraper.py`) and/or the
   Jooble aggregator + home-region coverage (`allas-figyelo`'s
   `fetch_jobs.py`) be added alongside the current SerpApi source?
7. **Migration authorization:** if any of the above are approved, should
   Claude/Codex/Gemini port the specific selected modules into `job-hunter`
   as a scoped migration sprint, with the source repos kept running
   unchanged until the port is validated?
8. **External dependency disposition:** for whichever modules get approved
   for migration, should their external service credentials
   (Firestore/Telegram/Firecrawl for job-searcher; Jooble/Gmail for
   allas-figyelo) be provisioned fresh under job-hunter's existing secret
   convention, or reused from the source repos?
9. Remaining itemized Track A questions (hard-exclude/penalty
   classification, location boundary, source-coverage trade-off, role-
   family priority, web UI timing) — see full list in
   `JOB-HUNTER-BUSINESS-MODEL-REVIEW-001-RECONCILED.md`.

---

## Part 4 — Draft Sprint outcomes (DRAFT — not approved scope)

**DRAFT Sprint 1 — relevance-precision correction.** Same acquisition
architecture (SerpApi, no redesign yet). Add PO-specified scoring
dimensions from questions 3–4 (seniority/step-fit, salary policy). Replace
the count-range acceptance criterion with a PO-judged outcome per question 2.
No new source integration in this draft.

**DRAFT Sprint 2 — feedback loop, presentation, and source expansion,
contingent on questions 5–8.** Migrate the specific modules the PO selects:
most likely `job-searcher`'s active-learning/feedback mechanism (question 5)
and, if approved, its direct Profession.hu scraper and/or `allas-figyelo`'s
Jooble adapter and web-UI pattern (question 6). Each ported module gets its
own validated acceptance run before the source repo it came from is
considered for retirement — retirement itself remains a separate, later,
explicit PO decision, not part of this draft.

Both drafts are for Product Owner discussion only — neither is approved,
neither has been implemented, and no repository action has been taken.
