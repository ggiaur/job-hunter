# Pillér miss — reconciliation (2026-09-04)

Synthesizes `CLAUDE_PILLER_MISS_ANALYSIS_2026-09-04.md`, `CODEX_PILLER_MISS_ANALYSIS_2026-09-04.md`, and `GEMINI_PILLER_MISS_ANALYSIS_2026-09-04.md`, each written independently before reading the others.

## 1. Proven earliest miss stage

**Stage C — second-level job-link extraction from the Profession.hu listing page, `extractJobLikeLinks(html, url, 12)` in `apps/job-hunter-mvp/lib/links.mjs`, called from `run.mjs` line 157.**

All three independent analyses converge on this, with genuine methodological independence:

- **Claude** reproduced the full funnel live: SerpApi query 5 returned the listing page at organic rank 1/10 (Stage A correct); the listing page was correctly classified (Stage B correct, 0 schema markup, 130 job-path-hint links); the actual unmodified `extractJobLikeLinks(html, url, 12)` was run against the real fetched HTML and Pillér's link — real rank 22 of 130 raw path-matching links — did not survive the first-12 cap.
- **Gemini** independently reproduced the same mechanism via its own live fetch, counting Pillér at position 22 of 50 (a different raw-count methodology — Gemini's link extraction pass evidently pre-filtered some of the raw matches Claude counted, e.g. distinct hrefs vs. all path-substring hits — but both agree the vacancy is well past position 12).
- **Codex**, working under a real environment limitation (its SerpApi wrapper reproduction attempts failed with DNS/`fetch failed` in its sandbox — disclosed honestly, not worked around), could not directly reproduce the listing-page fetch, but independently localized the miss to "before a successfully verified detail page entered extraction" by exhaustively ruling out every downstream stage (title/domain gate, English handling, scoring/visibility, URL normalization, dedup) via direct inspection of `run.mjs`'s stage order and the snapshot's empty `results`/`excluded`/`unreachable` records for Pillér. This is the same conclusion reached by a different evidentiary path — genuine convergence, not one agent anchoring on another.

All three ran the real, unmodified downstream code against the real Pillér page directly (not a reimplementation) and got the same result: **score 85%, visible: true, hardExcluded: false**, with fit factors for generic-title+IT-domain-context, project leadership scope, institutional/nonprofit context, and freshness. Downstream scoring, title/domain gating, English handling, and dedup are proven innocent for this specific vacancy — none of them ever saw it.

## 2. Stage-by-stage funnel for Pillér

| Stage | Result | Evidence |
|---|---|---|
| A. SerpApi query 5 top-10 | Listing page found, organic rank 1/10 | Reproduced (Claude, Gemini) |
| B. Fetch + classify listing page | Correctly classified LISTING | Reproduced (Claude, Gemini) |
| C. `extractJobLikeLinks(html, url, 12)` | **Pillér excluded — real position ~22, past the 12-slot cap, consumed by utility/nav/company-profile links** | Reproduced (Claude, Gemini) — **MISS POINT** |
| C, hypothetical if included | Would fetch, JobPosting schema confirmed | Reproduced (Claude, Gemini) |
| Extraction/scoring, hypothetical | score 85, visible true, 0 mismatches | Reproduced (Claude, Gemini, Codex all ran the real scoring code against the real page independently) |

## 3. All material false-negative mechanisms found

1. **Primary and sufficient cause (proven): link-extraction over-inclusiveness.** `extractJobLikeLinks`'s path-substring heuristic (`allas`/`job`/`career`/`karrier`/etc.) cannot distinguish an actual vacancy detail page from a company-profile page, RSS link, pagination link, job-alert signup, or advice page — all of which share the same path substrings on Profession.hu. On the audited listing page, navigation/utility links and paired company-profile links consumed most of the 12-slot cap before real job ads were counted. This alone fully explains the Pillér miss and is independently reproduced by two of three analyses via live execution of the actual production code.
2. **Compounding cause (proven): the fixed 12-link cap is too small once non-vacancy links count against it.** Even a correct filter would still need either a larger cap or paginated/depth-aware traversal to reach every real job on a page with 15-20+ ads.
3. **Real, separate structural gap — NOT causal for the Pillér miss: all 11 acquisition queries are hardcoded to end in "Budapest".** This predates PO_DECISIONS_2026-09-04.md's Fehérvárcsurgó-accessible-region location rules (built in JH-SUP-0022/0023, never revisited when SUP-0024 implemented the scoring-layer location logic). Pillér itself is a Budapest vacancy, so Query coverage did find its listing page on the first attempt (rank 1/10) — this gap is real and worth its own fix, but it is not what caused this specific miss.
4. **Process/reasoning-quality finding, not a technical mechanism:** the directive itself (JH-SUP-0026 §0) correctly flags that an earlier framing risked treating "Budapest-only query scope" as *the* cause of the Pillér miss. All three independent analyses in this round avoided that error on their own — each explicitly labeled the Budapest-only gap as a separate, non-causal finding, with the reasoning laid out in full (§7 point 4 in Claude's analysis; Q7/Q8 in Gemini's; the entire causal-elimination structure of Codex's analysis). This is recorded here as the canonical counterexample per JH-SUP-0026 §5, not as evidence anyone got it wrong in this round — the discipline held.
5. **Structural gap, inference only:** direct Profession.hu acquisition (identified as a preservation candidate from `job-searcher` in the consolidation audit) was deliberately deferred in SUP-0024 to avoid unifying architecture before proving relevance quality. This forensic audit shows a concrete case where that deferred path would likely have avoided the failure mode, since a direct crawl controls its own traversal order/depth and isn't subject to SerpApi's listing-page indirection. Not implicated as a *cause* of the Pillér miss (Stage A found the listing page fine) but directly relevant to *fixing* the failure class.

## 4. Blast-radius sample (10+ candidates, not a completeness claim)

Both Claude and Codex independently sampled the same or adjacent listing pages and found double-digit numbers of plausible, unacquired candidates. Consolidated sample (deduplicated across both analyses' lists), status against today's persisted run (`docs/evidence/job-hunter-runs/2026-09-04T11-59-53-105Z.json`):

| # | Candidate | Pipeline status | Cause |
|---|---|---|---|
| 1 | Projektmenedzser — Pillér Nonprofit Kft. (confirmed positive reference) | Absent from all partitions | Link-cap truncation, position ~22 |
| 2 | Senior IT projektmenedzser — EN-CO Software Zrt. | Absent | Link-cap truncation, position ~37 (Gemini reproduced score 93% if fetched) |
| 3 | Projektmenedzser - IT területen — Swiss Medical Services Kft. | Absent | Link-cap truncation, near-boundary position |
| 4 | Projektmenedzser (PMO) — Indotek Group | Absent | Link-cap truncation, near-boundary position |
| 5 | D365 Application Manager — HILL International | Absent | Same category-page truncation mechanism (Codex sample) |
| 6 | Incident Management Reliability Engineer — Sanofi | Absent | Same mechanism (Codex sample) |
| 7 | IT szolgáltatásmenedzser — BKM | Absent | Same mechanism (Codex sample) |
| 8 | Senior IT szolgáltatásmenedzser — MVM Informatika | Absent | Same mechanism (Codex sample) |
| 9 | Release Manager & Test Automation Lead — ARM | Absent | Same mechanism (Codex sample) |
| 10 | Automatizáció és MI Business Analyst — BKK | Absent | Same mechanism (Codex sample) |
| 11 | Projektmenedzser — Millenia Zrt. | Absent | Link-cap truncation (Claude sample) |
| 12 | Senior projektmenedzser — Exelect Hungary Kft. | Absent from acquisition; would likely hard-exclude on mandatory English per Gemini's separate check of a same-titled listing | Link-cap truncation, and possibly correctly excludable downstream — not verified per-item |

None of these appear anywhere in the persisted run's `results`, `excluded`, or `unreachable` arrays. This is a lower-bound sample from a small number of listing pages, not a claim of completeness — several candidates (e.g. #12) might correctly exclude once actually scored; their non-*acquisition* is still the discovery-recall defect being audited, independent of what their eventual score would be.

## 5. Concrete prioritized fixes (recommendations; scope and detail already specified in `JH-SUP-0026-RECALL-REPAIR-AND-LEARNING.md`)

Ranked by expected coverage gain relative to implementation risk/cost, consistent with all three analyses' recommendations and the JH-SUP-0026 directive:

1. **Highest priority, highest confidence:** replace the broad path-substring link classifier with real vacancy-detail-link classification, applying any cap only after non-vacancy links (company profiles, RSS, pagination, alerts, advice pages) are filtered out — not before. This directly closes the proven, sufficient cause. Low technical risk (contained to `links.mjs`), high expected recall gain (the sample shows 4 of ~20 real ads survived the current cap on one page).
2. **High priority:** bounded, depth-safe listing traversal/pagination so a correctly-classified vacancy below the current arbitrary DOM-order cutoff is still reached, with persisted per-page coverage counters.
3. **Medium priority, structurally important:** activate direct Profession.hu acquisition (the deferred `job-searcher` asset) as a complementary path alongside SerpApi, with source-provenance-preserving merge/dedup. Reduces single-point-of-failure dependency on SerpApi's listing-page indirection.
4. **Medium priority, separate coverage gap (not causal for Pillér):** regenerate acquisition queries from the canonical Fehérvárcsurgó-accessible region rules rather than 11 hardcoded Budapest strings, per PO_DECISIONS_2026-09-04.md.
5. **Process fix:** commit `docs/quality/CAUSAL_MISS_ANALYSIS_PROTOCOL.md` (JH-SUP-0026 §5) so future search-quality incidents are traced with the same stage-by-stage, fact/reproduced/inference/unknown discipline used in this round, and so a general system weakness (like Budapest-only scope) is never elevated to *the* cause of a specific miss without stage-level proof.

## 6. Smallest next live experiment to prove a fix works

After implementing fix #1 (real vacancy-detail classification) at minimum:

1. Re-run the live pipeline against the same Profession category listing page audited here (`https://www.profession.hu/allasok/budapest/1,0,23,projektmenedzser`).
2. Confirm the Pillér detail URL is queued, fetched, schema-verified, and reaches scoring — through real discovery, not injection.
3. Confirm it scores >=60% and is visible, with fit/mismatch reasons matching the values already reproduced in this audit (score 85, generic-title+IT-domain-context path).
4. Report, for that one listing page: real detail links present vs. queued vs. fetched vs. confirmed vs. excluded/scored — proving the fix recovers coverage on the page, not just the one canary vacancy.
5. Do this before claiming JH-SUP-0026 PASS; a run that finds Pillér by coincidence without fixing the underlying classifier does not satisfy the Definition of Done.
