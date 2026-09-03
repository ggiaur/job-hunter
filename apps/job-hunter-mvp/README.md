# Job Hunter MVP

Minimal end-to-end pipeline: live SerpApi Google search (per the
JH-SUP-0016/0017/0020/0021-proven mechanism) → job-detail verification via
`schema.org/JobPosting` structured data → hard exclusions from
`profile/persona.md` and `profile/exclusions.yaml` → transparent scoring →
best-first shortlist.

## Run

Requires `SERPAPI_API_KEY` in `/home/dockeruser/.job-hunter-secrets/serpapi.env`
(outside the repo, not committed).

```bash
cd apps/job-hunter-mvp
node run.mjs
```

Writes `docs/evidence/real-job-hunter-mvp-live-run.json`. See
`docs/evidence/REAL_JOB_HUNTER_MVP_LIVE_RUN.md` for the human-readable
writeup of the most recent run.

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
