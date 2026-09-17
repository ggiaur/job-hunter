# Job Hunter Sprint 1 — result contract

This is the exact schema `run.mjs` writes to
`docs/evidence/real-job-hunter-current-run.json` (latest run) and to
`docs/evidence/job-hunter-runs/<timestamp>.json` / `latest.json` (durable
history, via `lib/run-history.mjs`, never overwritten between runs).
Gemini's presentation layer should read this contract, not `run.mjs` or
`lib/scoring.mjs` directly.

## Top-level shape

```jsonc
{
  "generatedAt": "2026-09-04T12:00:00.000Z",
  "queries": ["..."],
  "resultContractVersion": 1,
  "visibleThreshold": 60,
  "results": [ /* ResultRow, see below — every scored, non-excluded candidate */ ],
  "visibleCount": 3,          // results.filter(r => r.visible).length
  "reviewCandidateCount": 2, // above threshold, excluding prior DO_NOT_APPLY
  "searchCredentialAvailable": true,
  "searchAcquisitionLog": [ /* {query, ok, resultCount? , error?} */ ],
  "candidateProfileVersion": "2026-09-16",
  "candidateSourceSha256": "...",
  "githubRunUrl": null,     // populated only for GitHub Actions
  "excluded": [ /* ExcludedRow, see below */ ],
  "unreachable": [ /* { url, reason, fromListing? } */ ]
}
```

## `ResultRow` (one per scored candidate)

Per SPRINT_1.md §5, every field required for a >=60% result is present on
**every** row regardless of score, so the presentation layer never has to
special-case low scores — just filter on `visible`.

| field | type | notes |
|---|---|---|
| `title` | string | |
| `company` | string | |
| `url` | string | direct vacancy/application URL |
| `source` | string | hostname |
| `locationText` | string \| null | raw location text from the ad, if any |
| `workArrangement` | `"remote/hibrid"` \| null | only set when explicitly detected |
| `salary` | string \| null | only set when a real HUF figure was found in the ad text; **never fabricated** |
| `relevancePercent` | number (0-100) | the explainable score |
| `visible` | boolean | `relevancePercent >= visibleThreshold` — the presentation layer's primary filter |
| `fitReasons` | string[] | concise reasons the row scored well (Hungarian) |
| `mismatchReasons` | string[] | concise reasons it scored lower / risks (Hungarian) |
| `englishRequirement` | string | human-readable label, e.g. "basic/intermediate (not disqualifying)" |
| `educationNote` | string \| null | informational comparison with the actual degree; no degree exclusion or penalty |
| `candidateReview` | object | CV source version/hash; paired CV and job excerpts, bounded overlap points, unverified specialist terms |
| `priorFeedback` | array | exact employer/title PO decisions with original reasons; no inferred blanket rejection |
| `candidateProfileVersion` | string | the CV facts version used in this assessment |
| `candidateSourceSha256` | string | SHA-256 of the supplied CV professional-text source, including certificate additions |
| `descriptionText` | string | extracted description and requirements retained for later audits |
| `employmentType` | string | from schema.org, or `"unknown"` |
| `datePosted` | string (ISO) \| null | |
| `validThrough` | string | from schema.org, or `"unknown"` |
| `keyDuties` | string | first 500 chars of the job description |
| `matchedQuery` | string | which search query surfaced this candidate |
| `poDecision` | `"APPLY"` \| `"DO_NOT_APPLY"` \| null | PO-owned; initialized from an exact prior employer/title decision, otherwise null; explicit URL-keyed saved decisions override in presentation |
| `poReason` | string \| null | original PO reason; never fabricated by scoring |

The default candidate view also requires `poDecision !== 'DO_NOT_APPLY'`.
Rejected scored rows retain their score and remain available in All Scored.
Full runs and targeted rechecks record `reviewCandidateCount` separately from `visibleCount`:
the former omits prior rejected rows, the latter counts all rows above threshold.
Neither count means manually approved applications or guaranteed unique jobs.

## `ExcludedRow`

Same base fields as `ResultRow` minus the scoring fields, plus:

| field | type | notes |
|---|---|---|
| `exclusionReason` | string | why this candidate was hard-excluded (mandatory English, IC/developer role, one-person IT, excluded company, not position-relevant) |

## Writing back a PO decision

Current implementation: the static HTML's Save button persists only in the
current browser's localStorage, with explicit wording. It is not uploaded to the
search profile. Such decisions are restored and filtered on page load; storage
failure never reports success. Saved URL-keyed `docs/evidence/po-decisions.json`
records are applied by the report publisher without modifying the source snapshot.
The initial counts refer to the generated report and do not update as browser-only
decisions are changed. No notification or automatic application is sent.

## Automatic reports

`run.mjs` calls `publishCurrentReports` after persisting the immutable snapshot.
Both manual and existing cron runs refresh `CURRENT_RESULTS.md` and
`docs/evidence/current-cv-results.html`. Each report links to the exact source
snapshot, not merely the mutable `latest.json`. GitHub Markdown instead links to
the generating Actions run, whose evidence artifact includes the HTML and JSON;
it does not link to uncommitted files in the remote repository.

Search-key absence skips SerpApi and is shown as reduced coverage; the independent
Profession path still executes. The old fake fallback key is no longer sent.
An HTML/Markdown generation failure causes the pipeline to fail. A GitHub live
pipeline failure must not republish pre-existing checked-in results as a new run.

## Original Sprint 1 scope

The result contract intentionally does not define a write-back mechanism —
Sprint 1's Definition of Done only requires the decision to be *capturable*,
not a full round-trip system (that's explicitly Sprint 2, see SPRINT_1.md
§9). If Gemini's presentation layer needs to persist `poDecision`/`poReason`
edits, coordinate the storage location (e.g. a sibling
`docs/evidence/job-hunter-runs/<timestamp>.decisions.json` keyed by `url`)
as a separate, additive file rather than mutating the immutable run
snapshot in place.
