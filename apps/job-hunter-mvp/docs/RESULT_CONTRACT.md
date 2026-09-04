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
| `employmentType` | string | from schema.org, or `"unknown"` |
| `datePosted` | string (ISO) \| null | |
| `validThrough` | string | from schema.org, or `"unknown"` |
| `keyDuties` | string | first 500 chars of the job description |
| `matchedQuery` | string | which search query surfaced this candidate |
| `poDecision` | `"APPLY"` \| `"DO_NOT_APPLY"` \| null | **PO-owned field — starts null, presentation layer writes it back** |
| `poReason` | string \| null | **PO-owned field — short free text, starts null** |

## `ExcludedRow`

Same base fields as `ResultRow` minus the scoring fields, plus:

| field | type | notes |
|---|---|---|
| `exclusionReason` | string | why this candidate was hard-excluded (mandatory English, IC/developer role, one-person IT, excluded company, not position-relevant) |

## Writing back a PO decision

The result contract intentionally does not define a write-back mechanism —
Sprint 1's Definition of Done only requires the decision to be *capturable*,
not a full round-trip system (that's explicitly Sprint 2, see SPRINT_1.md
§9). If Gemini's presentation layer needs to persist `poDecision`/`poReason`
edits, coordinate the storage location (e.g. a sibling
`docs/evidence/job-hunter-runs/<timestamp>.decisions.json` keyed by `url`)
as a separate, additive file rather than mutating the immutable run
snapshot in place.
