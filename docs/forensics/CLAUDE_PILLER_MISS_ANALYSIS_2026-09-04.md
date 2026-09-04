# Claude — Pillér miss root-cause analysis (2026-09-04)

Independent analysis, written before reading any Codex or Gemini analysis of the same question.

Evidence is labeled throughout as **KNOWN FACT** (already documented/committed before this analysis), **REPRODUCED EVIDENCE** (verified live by me during this analysis, with the exact command/output), **INFERENCE** (reasoned from code + evidence but not independently re-verified), or **UNKNOWN** (the persisted run does not record enough to determine this).

## 1. Proven earliest miss stage

**Stage C — second-level link extraction from a listing page (`extractJobLikeLinks` in `apps/job-hunter-mvp/lib/links.mjs`), called with `limit = 12` from `run.mjs` line 157.**

This is not inference. I reproduced the actual pipeline funnel end-to-end for this one vacancy:

1. **REPRODUCED EVIDENCE.** Live SerpApi call for query 5, `"IT projektmenedzser állás Budapest"` (identical params to `run.mjs`/`serpapi.mjs`: engine=google, hl=hu, gl=hu, num=10), returned the Profession.hu category listing page `https://www.profession.hu/allasok/budapest/1,0,23,projektmenedzser` as organic result **#1 of 10**. So Stage A (query coverage) is **not** the miss point for this vacancy — the listing page containing Pillér was found, on the first try, at rank 1.

2. **REPRODUCED EVIDENCE.** I fetched that exact listing page live (same UA header pattern as `fetchWithTimeout`). It contains zero `JobPosting` schema.org markup and 130 links matching the job-path-hint patterns (`allas`, `job`, `career`, `karrier`, etc.), so Stage B's `classify()` would correctly route it to `LISTING` (needs only `>=3` job-like links; got 130). Stage B classification is correct.

3. **REPRODUCED EVIDENCE — the actual bug.** I ran the real, unmodified `extractJobLikeLinks(html, url, 12)` from `links.mjs` against this exact fetched HTML (not a reimplementation — the literal production function). The Pillér job-ad link (`.../allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550`) is **rank 22 of 130** in the raw link stream, and does **not** appear in the first-12 output the pipeline actually uses.

   **Root mechanism**: the job-path-hint check (`href path includes 'allas'/'job'/'career'/'karrier'/...`) matches far more than job-ad links. On this page, every job card emits **two** matching links — the ad itself (`/allas/<slug>-<id>`) and a link to the **company's own profile/listing page** (`/allasok/<company-slug>/...`), which also contains `allas` in its path and is deduplicated by `origin+pathname`, so it consumes its own cap slot. In addition, several **navigation/utility links** at the top of the page match the same hints and are encountered before any real job card: an RSS feed link (`/allasok?rss`), a second city-filter pagination link, a job-alert signup link (`/allasertesito/regisztracio`), and a "job search tips" page (`/allaskeresesi-tanacsok`). Together these consume 5 of the 12 slots before the first real job ad is even reached, and each subsequent real job card costs 2 slots (ad + company link) instead of 1. Net effect: the fixed 12-link cap captures roughly **5 real job ads** per listing page, not 12 — Pillér, the 6th distinct real job ad on the page (10th counting company-profile duplicates), falls just outside.

4. **REPRODUCED EVIDENCE.** I fetched the real Pillér ad page directly and ran the actual `extractJobPostingSchema` / `fieldsFromJobPostingSchema` / `matchesTargetPosition` / `isGenericProjectTitle` / `hasITDomainContext` / `computeRelevanceAssessment` from the unmodified production code against it. Result: valid `JobPosting` schema present; title "Projektmenedzser" (does not match direct target-position keywords, `matchesTargetPosition = false`); `isGenericProjectTitle = true`; description clearly IT-project-management (`hasITDomainContext = true`) → `positionRelevant = true` via the generic-title+domain-context path (exactly the mechanism this session's own SUP-0024 work built for cases like this). Full scoring output: **`score: 85`, `visible: true`, `hardExcluded: false`, zero mismatch reasons**, fit reasons citing genuine leadership responsibility, institutional-employer bonus, hybrid-friendly location, and freshness.

**Conclusion**: every downstream stage (schema verification, title/domain gating, English handling, location scoring, dedup, visibility threshold) is proven correct for this vacancy — if it had reached them, it would have scored 85% and been shown. The vacancy was lost entirely at the link-extraction cap in Stage C, before it was ever fetched. This is a **structural false negative in the acquisition/traversal layer**, not a scoring-logic defect.

## 2. Stage-by-stage funnel for Pillér specifically

| Stage | Result | Evidence |
|---|---|---|
| A. SerpApi query 5 top-10 | Listing page found, rank 1/10 | Reproduced |
| B. Fetch + classify listing page | Correctly classified LISTING (0 schema, 130 job-like links) | Reproduced |
| C. `extractJobLikeLinks(html, url, 12)` | **Pillér excluded — real rank 22/130 among raw matches; 12-cap exhausted by utility links + paired company-profile links** | Reproduced — **MISS POINT** |
| C (hypothetical, if link had been included) | Would be fetched, `JobPosting` schema confirmed | Reproduced (fetched directly) |
| Extraction/scoring (hypothetical) | `score: 85`, `visible: true`, 0 mismatches | Reproduced (ran real scoring code) |

## 3. Was the vacancy ever fetched?

**REPRODUCED EVIDENCE.** No. `grep -i "piller"` across the entire persisted run file (`docs/evidence/job-hunter-runs/2026-09-04T11-59-53-105Z.json`) — which includes `results`, `excluded`, and `unreachable` — returns zero matches. It is not merely unscored or excluded; it was never a fetch candidate at all, consistent with never surviving the Stage C link-cap.

## 4/5. Scoring and title/domain gate outcome if reached

Answered above (§1.4): score 85, visible, `positionRelevant = true` via `isGenericProjectTitle && hasITDomainContext`. Both gates work correctly for this case.

## 6. Dedup / normalization

**Not applicable to this miss** — the vacancy never reached the `results` array, so title/company dedup and query-string normalization never had a chance to act on it. I inspected `normalizeUrl()` (strips hash only) and the title+company dedup key in `run.mjs` (lowercased `title|company`) and found no mechanism that would incorrectly collide "Projektmenedzser" / "Pillér Nonprofit Kft" with anything else present in this run. **INFERENCE**: dedup is not implicated in this specific miss.

## 7. Ranked root causes by evidence strength

1. **Link-extraction over-inclusiveness in `extractJobLikeLinks`/`countJobLikeLinks` (`links.mjs`) — REPRODUCED, primary and sufficient cause.** The path-substring heuristic (`allas`/`job`/`career`/`karrier`/`poz`/`vacancy`/`toborzas`) does not distinguish an actual job-ad detail page from a company-profile page, an RSS link, a pagination link, or a static informational page — all of which live under URL paths containing those same substrings on Profession.hu. This alone fully explains the Pillér miss.
2. **Fixed 12-link cap is too small relative to real per-page job density once non-ad links are (incorrectly) counted against it — REPRODUCED, compounding cause.** Even a smarter link filter would still need either a higher cap or pagination-following to reach every job on a page with 20+ real ads.
3. **No direct Profession.hu category/pagination crawl independent of SerpApi — INFERENCE, secondary/structural gap, not the cause of this specific miss** (Stage A already found the right listing page). `job-searcher`'s existing direct Profession acquisition work (already flagged in the consolidation decisions as a preservation candidate) is not wired into the live pipeline; a direct crawl would be far more resistant to this entire class of bug than depending on SerpApi returning a listing page as an organic result.
4. **All-Budapest query set vs. Fehérvárcsurgó-region canonical location rules — REPRODUCED as a real, separate structural gap, NOT implicated in the Pillér miss itself.** All 11 hardcoded queries in `run.mjs` end in the literal string "Budapest" (`QUERIES` array, lines 25–35) — this predates the PO_DECISIONS_2026-09-04.md location rules and was never updated after they were implemented in SUP-0024. Pillér itself is Budapest-based, so this did not cause the Pillér miss, but it means the pipeline structurally never searches for the region PO_DECISIONS names as primary (Székesfehérvár, Mór, Várpalota, Győr, Tata, Tatabánya, Veszprém, Dunaújváros) — a real, likely large, separate coverage gap worth its own fix.

## 8. Why all 11 queries target Budapest

**REPRODUCED (code inspection).** `apps/job-hunter-mvp/run.mjs` lines 25–35: every one of the 11 `QUERIES` entries ends in the literal string `"Budapest"`. This query list was built earlier (JH-SUP-0022/0023, before this session's timeline) and was **not revisited** when PO_DECISIONS_2026-09-04.md's Fehérvárcsurgó-accessibility location rules were implemented in SUP-0024 — the scoring layer was updated to evaluate location correctly, but the acquisition query layer was not updated to actually search the newly-defined primary region. This is a real gap but, per §7 point 4, is not the cause of the Pillér miss itself.

## 9. Why direct Profession acquisition isn't active

**INFERENCE**, consistent with the consolidation-audit findings already committed in `portfolio-audit/CLAUDE.md`/`docs/business-review/JOB-HUNTER-CONSOLIDATION-001-CLAUDE.md`: `job-searcher`'s direct Profession.hu acquisition code was identified as a preservation candidate but explicitly deferred (SUP-0024 Lane A reconciliation note: "kept SerpApi as sole source this sprint, deferred the real but dormant Python adapter integration to a documented follow-up") to avoid unifying architecture before proving relevance quality first. That was a reasonable sprint-scoping decision at the time; this forensic audit shows a concrete case where the deferred alternative acquisition path would likely have avoided the failure mode entirely (a direct site crawl controls its own traversal depth/order and isn't subject to SerpApi's listing-page/organic-result indirection).

## 10. False-negative blast radius (bounded sample, not a completeness claim)

**REPRODUCED EVIDENCE**, from the exact same listing page that contains Pillér (query 5's rank-1 result) — this is one page out of potentially many similar listing pages returned across the 11 queries, so treat this as a lower bound, not the total:

- The page contains **20 distinct real job-ad links**.
- Running the real `extractJobLikeLinks(html, url, 12)` against it captures only **4 of them** (the rest of the 12 slots go to company-profile/utility links).
- **16 real job ads on this single page were never fetched.** None of the 16 appear anywhere else in the persisted run (spot-checked their company names — Millenia, Exelect, En.Co Software, Beck and Partners, Pro-M — against the full run JSON: zero matches), confirming they were not rescued via any other query.

Sample of 15 of the 16 missed (title/company visible in URL slug; not independently re-scored — this is an acquisition-coverage sample, not a relevance claim about each):

1. `projektmenedzser-b-c-transzformacio-mohu-mol-hulladekgazdalkodasi-zrt` (MOL Hulladékgazdálkodási)
2. `projektmenedzser-beck-and-partners-kft`
3. `epuletvillamossagi-muszaki-ellenor-projektmenedzser-ceh-zrt`
4. `kereskedelmi-projektmenedzser-epitoanyag-szegmens-beck-and-partners-kft`
5. `projektmenedzser-hulladekgazdalkodasi-logisztikai-fejlesztesi-csapat-mohu-mol-hulladekgazdalkodasi-zrt`
6. **`projektmenedzser-piller-nonprofit-kft-budapest` (the confirmed positive reference)**
7. `projektmenedzser-millenia-zrt`
8. `senior-projektmenedzser-exelect-hungary-kft`
9. `senior-projektmenedzser-pro-m-zrt`
10. `junior-projektmenedzser-pro-m-zrt`
11. `palyazati-projektmenedzser-tanacsado-right-direction-tanacsado-kft`
12. `uzletfejlesztesi-projektmenedzser-itk-holding-zrt`
13. `projektmenedzser-lakoingatlan-fejlesztes-beruhazoi-oldal-intergal-development-kft`
14. `senior-it-projektmenedzser-en-co-software-zrt` — title explicitly says "IT projektmenedzser", plausibly a strong candidate worth a follow-up look
15. `tolmacsolasi-projektmenedzser-mkifk-zrt`

I did not run these 16 through the scoring pipeline (would require fetching each individually and is out of scope for a bounded audit slice) — this is an **acquisition coverage sample**, proving the mechanism recurs at scale on a single page, not a claim that all 16 would score >=60%.

## 11. Category summary

- **Known facts**: Pillér is a committed positive reference; its ad is live and reachable; today's persisted run does not contain it anywhere.
- **Reproduced evidence**: full funnel trace (§1–4, §10) — SerpApi query result, listing-page fetch, real `extractJobLikeLinks` execution, real ad-page fetch and scoring, blast-radius sample — all via the actual unmodified production code and live network calls made during this audit.
- **Inference**: dedup non-involvement (§6); the direct-Profession-acquisition deferral reasoning (§9); that the 16 missed candidates would individually score similarly to Pillér (not verified per-item).
- **Unknown because evidence was not persisted**: the raw SerpApi JSON payloads for the other 10 queries were not saved by the run, so I cannot state with certainty whether other queries also surfaced listing pages with the same truncation problem beyond the one I reproduced live just now — only that the mechanism is real, reproduced, and structural, not a one-off fluke.
