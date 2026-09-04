# Codex independent adversarial review — JH-SUP-0026 (2026-09-04)

**Reviewed commit:** `4a74e58` (`JH-SUP-0026: real vacancy-detail classification, direct Profession acquisition, regional queries, canaries, stage evidence, causal-miss protocol`).

## Scope and method

Read the directive and the Pillér reconciliation before review. I inspected the committed snapshot rather than the local modified `run.mjs`; the worktree was already dirty before review, so `git pull --rebase` was safely refused and I did not stash or overwrite another worker's changes. `HEAD` was nevertheless exactly `4a74e58` at review start.

I ran the committed Node test suite: 8 test files passed. That is not treated as proof. I also created and ran an isolated adversarial HTML fixture containing realistic non-Profession company-career, job-feed, and Hungarian job-alert links ahead of genuine details; it exercises the production `extractJobLikeLinks` and `classifyJobPath`, not a reimplementation.

## Findings

### 1. High — active generic fallback reintroduces the exact cap-exhaustion failure

`classifyJobPath` uses broad substring hints for every non-Profession host: any pathname containing `allas`, `job`, `vacancy`, `career`, etc. is `DETAIL` unless it happens to contain one of seven exclusion substrings. This is not real detail classification and is active whenever SerpApi supplies a non-Profession listing page.

Evidence:

- [`apps/job-hunter-mvp/lib/links.mjs:37`](../../apps/job-hunter-mvp/lib/links.mjs) describes this as a generic fallback; [`links.mjs:43-44`](../../apps/job-hunter-mvp/lib/links.mjs) define the broad positive/limited negative substring lists; [`links.mjs:62-68`](../../apps/job-hunter-mvp/lib/links.mjs) turns those hints directly into `DETAIL`.
- [`apps/job-hunter-mvp/lib/links.mjs:127-128`](../../apps/job-hunter-mvp/lib/links.mjs) applies the cap immediately after that classification.

Fixture results, with base `https://careers.example.hu/jobs` and cap 3:

| Fixture link | Production classification |
|---|---|
| `/companies/acme-careers-1001` | `DETAIL` |
| `/job-feed/latest-1002` | `DETAIL` |
| `/allasfigyelo/feliratkozas-1003` | `DETAIL` |

Placed before three genuine `/allas/genuine-vacancy-<id>` links, these three non-vacancy links occupied all three queued slots (`totalDetailLinksFound: 6`, `queuedCount: 3`, `filteredNonJobCount: 0`); no genuine detail was queued. This is a direct adversarial reproduction of the cap-consumption class, merely on the fallback source route. The current tests only exercise Profession paths.

For the current observed Profession paths, `/allas/<ascii-slug>-<numeric-id>` is a meaningful structural signal and the saved real fixture passes. However, [`links.mjs:22`](../../apps/job-hunter-mvp/lib/links.mjs) plus [`links.mjs:54-60`](../../apps/job-hunter-mvp/lib/links.mjs) would also accept any future Profession utility/company/feed endpoint placed in that namespace (for example `/allas/company-profile-acme-kft-1003`) before fetch/schema verification. I did **not** find evidence that the live site currently exposes such a route; this is a boundary risk, not a claim about a current live URL.

### 2. High — persisted listing coverage falsely reports zero fetched and zero confirmed on every page

The coverage row is constructed before detail fetches, with default counters of zero, and it is never updated or rebuilt after the second-level crawl. Therefore a future run cannot truthfully report the directive's required per-listing real-detail / queued / fetched / confirmed funnel.

Evidence:

- [`apps/job-hunter-mvp/lib/stage-evidence.mjs:36-45`](../../apps/job-hunter-mvp/lib/stage-evidence.mjs) defaults `fetchedCount` and `confirmedCount` to 0.
- [`apps/job-hunter-mvp/run.mjs:202-205`](../../apps/job-hunter-mvp/run.mjs) creates the initial listing row without counts; [`run.mjs:237-238`](../../apps/job-hunter-mvp/run.mjs) does the same for pagination rows.
- The actual fetch/confirmation occurs later at [`run.mjs:256-281`](../../apps/job-hunter-mvp/run.mjs), with no connection back to `listingCoverage`.
- The generated run evidence already proves the consequence: `docs/evidence/job-hunter-runs/2026-09-04T16-55-11-338Z.json` has every `listingCoverage[].fetchedCount` and `.confirmedCount` as 0 despite nonzero pipeline activity.

This violates directive §§1.2, 3 and 7.3 and makes a future miss look like a listing was never traversed even when it was.

### 3. High — candidate-level stage evidence is not sufficient to explain a miss without reconstruction

The required evidence is represented as a scalar summary, not the candidate-level lineage the directive asks for:

- SerpApi provides `position` at [`apps/job-hunter-mvp/lib/serpapi.mjs:16-21`](../../apps/job-hunter-mvp/lib/serpapi.mjs), and the row has `serpRank` at [`stage-evidence.mjs:15-16`](../../apps/job-hunter-mvp/lib/stage-evidence.mjs), but `run.mjs` never assigns it. The persisted snapshot has `serpRank: null` throughout.
- The same URL found by multiple searches loses earlier query/rank evidence: [`run.mjs:137-149`](../../apps/job-hunter-mvp/run.mjs) stores only scalar `e.query` and overwrites it on each result. It cannot meet “search query and organic rank for **each** SerpApi result.”
- A SerpApi + direct-Profession merge loses provenance: [`run.mjs:170-172`](../../apps/job-hunter-mvp/run.mjs) records the direct source only when the scalar `discoveredVia` is empty, and the analogous Serp assignment is guarded at [`run.mjs:146-148`](../../apps/job-hunter-mvp/run.mjs). A merged candidate has only one source and usually only one query.
- The listing rows preserve counts but neither the extracted detail URL list nor traversal order. [`stage-evidence.mjs:36-49`](../../apps/job-hunter-mvp/lib/stage-evidence.mjs) has no such field; [`run.mjs:222-224`](../../apps/job-hunter-mvp/run.mjs) creates second-level candidates only from the capped queue. In particular, a genuine detail beyond the cap is represented only by an aggregate number, not a URL/position/explicit per-candidate disappearance reason.
- `titleDomainGate` is initialized at [`stage-evidence.mjs:21`](../../apps/job-hunter-mvp/lib/stage-evidence.mjs) but never assigned. The title/domain decision is calculated at [`run.mjs:321-331`](../../apps/job-hunter-mvp/run.mjs); every evidence row keeps `null`.

As a result, a reviewer cannot answer “where did this URL disappear?” for an unqueued detail, nor recover all discovery sources/ranks for a merged URL, from the persisted run alone. This is the directive's central “without reconstruction” requirement.

### 4. Medium — final evidence labels below-threshold results as `visible`

Every non-hard-excluded scored record gets `e.outcome = 'visible'`, before its real visibility is known. A score below 60 correctly sets `e.visible = false`, but the conflicting outcome remains `visible` and feeds the funnel summary.

Evidence: [`apps/job-hunter-mvp/run.mjs:340-342`](../../apps/job-hunter-mvp/run.mjs); the summary counts that outcome at [`run.mjs:389-390`](../../apps/job-hunter-mvp/run.mjs) via [`stage-evidence.mjs:56-61`](../../apps/job-hunter-mvp/lib/stage-evidence.mjs).

This violates the required final visible/not-visible decision and makes the top-level funnel misleading exactly for a false-negative investigation.

### 5. Medium — canary status treats fetched-but-never-evaluated as acquired and does not gate the run

The stated invariant is acquire **and evaluate**, yet an URL merely present in `stageEvidence` (added before fetch) receives `ACQUIRED_UNSCORED`; `allCanariesAcquired` treats every status except `NOT_ACQUIRED`, including that failure state, as success. Further, `run.mjs` only prints/persists the result; it never calls the helper or fails acceptance.

Evidence:

- [`apps/job-hunter-mvp/lib/canaries.mjs:26-40`](../../apps/job-hunter-mvp/lib/canaries.mjs) defines acquisition as URL presence and emits `ACQUIRED_UNSCORED`.
- [`canaries.mjs:51-52`](../../apps/job-hunter-mvp/lib/canaries.mjs) accepts that status.
- [`apps/job-hunter-mvp/run.mjs:381-387`](../../apps/job-hunter-mvp/run.mjs) performs reporting only.

Thus a discovered canary whose fetch fails or whose page lacks JobPosting schema can appear “acquired” even though it never reached scoring, contrary to directive §2.

## Conclusion

**FAIL — material findings.** The Profession-only classifier fixes the reproduced Pillér fixture, but the active generic route remains vulnerable to utility/company/feed/alert links consuming the post-classification cap. More importantly, the stage-evidence and listing-coverage implementation does not preserve the required lineage or truthful per-page counts, so a future miss still cannot be explained from the run alone. No fixes were made in this review.
