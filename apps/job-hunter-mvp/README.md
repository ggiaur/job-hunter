# Job Hunter MVP

Minimal end-to-end pipeline: live SerpApi Google search (per the
JH-SUP-0016/0017/0020/0021-proven mechanism) → job-detail verification via
`schema.org/JobPosting` structured data → hard exclusions from
`profile/persona.md` and `profile/exclusions.yaml` → transparent scoring →
best-first shortlist.

## Run

Uses `SERPAPI_API_KEY` from the process environment, or from
`/home/dockeruser/.job-hunter-secrets/serpapi.env` (outside the repo, not committed).
Without a key the independent Profession acquisition still runs, explicitly
marked as reduced coverage. Each SerpApi request has a 30-second timeout.

```bash
cd apps/job-hunter-mvp
node run.mjs
```

Writes `docs/evidence/real-job-hunter-current-run.json`, a dated run snapshot,
`docs/evidence/current-cv-results.html`, and `CURRENT_RESULTS.md` in the same run.
The readable reports link back to the immutable snapshot and preserve CV evidence,
uncertainties and prior PO rejections. A scoring threshold is not a manual approval.
The existing cron wrapper runs this same entry point; no extra presentation command
is needed and no messages/applications are sent automatically.

## CV evidence (2026-09-16)

`profile/candidate.json` contains the professional facts and two course-completion
certificates supplied by the user. Each fact must quote evidence in
`profile/cv-source-2026-09-16.md`; loading fails if that evidence is absent.
The original HTML's visual English indicator is not converted to a CEFR level.
The informatics degree is documented and never causes automatic rejection.

Both the full search and targeted recheck use `lib/vacancy-review.mjs`.
Scoring now receives the candidate: ten previously unconditional baseline points
are replaced with 0–10 CV-topic overlap points (2 per non-leadership matching fact,
capped at 10). The existing people/project leadership bonuses require the
corresponding CV facts. Matches retain both the CV excerpt and job excerpt.
Unverified named specialist skills are flagged, never invented or automatically
excluded. This remains rule-based matching, not a validated probability of fit.

Exact employer/title feedback from `learned_preferences.md` populates the prior
PO decision with its original reason. A previous rejection stays in All Scored
but is absent from the initial candidate view; an explicit URL-keyed PO decision
can supersede it. This does not implement automatic generalization of all prose
preferences. Portal extraction, language and role interpretation still need review.

Recheck previously discovered jobs without a new SerpApi search, from repo root:

```bash
node apps/job-hunter-mvp/review.mjs INPUT_RUN.json OUTPUT_REVIEW.json [EXTRA_URL ...]
```

This writes a JSON and HTML report marked as a limited recheck, not a new full-market
search. Existing source snapshots are preserved. Reports contain the candidate
source version and SHA-256 so a later profile edit cannot silently change history.

## Layout

- `run.mjs` — orchestrator
- `lib/serpapi.mjs` — SerpApi Google search
- `lib/profile.mjs` — loads `profile/*` (persona, exclusions, preferred companies)
- `lib/extract.mjs` — `schema.org/JobPosting` parsing, English/management/
  position-relevance keyword checks
- `lib/links.mjs` — extracts candidate job-detail links from listing pages
- `schedule/` — systemd service+timer definition for twice-weekly unattended
  runs (not installed by default — see `schedule/README.md`)

## Design notes

- Classification of "is this a real individual job ad" relies on
  `schema.org/JobPosting` structured data, not text heuristics — this was a
  deliberate fix after an earlier heuristic version misclassified job-board
  category/listing pages as individual advertisements.
- Position relevance is a hard gate: a job title must contain an
  IT-leadership keyword and not match an unrelated-domain term (recruiting,
  marketing, customer service) to be accepted at all — otherwise every job
  posting on a matched company's career page would pass through regardless
  of relevance.
- No browser automation. No requests to `google.com/search`. Ordinary HTTP
  fetch of public job-board/company pages, same class of access any browser
  or crawler uses to read a public page.
