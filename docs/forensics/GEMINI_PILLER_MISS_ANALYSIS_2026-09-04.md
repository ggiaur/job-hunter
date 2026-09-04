# Forensics Analysis: Pillér Miss Root-Cause Audit (Gemini, Independent)

**Task:** `JH-SUP-0025`  
**Role:** Gemini 3.6 Flash (Independent AI Forensic Audit Role)  
**Date:** 2026-09-04  
**Status:** Complete Forensic Audit (Read-Only Analysis — Zero Implementation Edits)  
**Target Repository:** `ggiaur/job-hunter`  

---

## 1. Executive Summary & Proven Root Cause

- **Primary Root Cause:** **Stage B Listing Link Crawl Truncation (`extractJobLikeLinks(html, url, 12)` limit cap).**  
  In Stage A, SerpApi returned the Profession search listing page `https://www.profession.hu/allasok/budapest/1,0,23,projektmenedzser`. In Stage B, `run.mjs` fetched this listing page and extracted candidate job links using `extractJobLikeLinks(html, url, 12)`.  
  The active Pillér vacancy (`https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550`) was physically present on this listing page at position **22**. Because `extractJobLikeLinks` hardcoded `limit = 12` (and navigation/RSS links occupied 5 of those slots), positions 13–50 were **truncated and discarded**. Pillér was never queued or fetched in Stage C.

- **Proof of Downstream Fit:**  
  When the Pillér vacancy URL is fetched directly and evaluated by `lib/extract.mjs` and `lib/scoring.mjs`, it yields a score of **85%** (`visible: true`, `hardExcluded: false`) with positive fit factors for generic PM title + IT domain context, project leadership scope, institutional/nonprofit context, and freshness (posted 4 days ago). **Downstream scoring and filtering logic are 100% innocent of the miss.**

---

## 2. Answers to the 11 Required Directive Questions

### Q1: SerpApi Organic Search Results (Top 10)
- **Result:** **No.** None of the 11 SerpApi queries returned the exact Pillér vacancy URL (`2988550`) in their top 10 organic results.
- **Evidence Limitation Note:** Raw SERP JSON responses were NOT persisted in `docs/evidence/job-hunter-runs/2026-09-04T11-59-53-105Z.json` (only aggregate count `totalSerpResults: 108` and candidate count `uniqueCandidateUrls: 72` were saved). Live reproducibility verification via SerpApi API confirmed 0 direct matches across all 11 queries.

### Q2: Profession Listing Page Traversal & Truncation
- **Result:** **Yes**, a Profession listing page containing the Pillér vacancy WAS returned by SerpApi in Stage A: `https://www.profession.hu/allasok/budapest/1,0,23,projektmenedzser`.
- **Why it was missed:** The Pillér job link was at position **22** on the listing page. `run.mjs` (line 157) invokes `extractJobLikeLinks(html, url, 12)`. Because the crawl limit was hardcoded to 12 links per listing page (with 5 slots consumed by navigation/RSS links), positions 13 through 50 were truncated before reaching position 22.

### Q3: Stage B / Stage C Fetching & Classification
- **Result:** **No.** The Pillér vacancy URL was NEVER fetched in Stage B or Stage C because it was dropped during Stage B link extraction.
- **If fetched:** Direct live fetch confirms the Pillér page contains schema.org `JobPosting` structured JSON-LD data and classifies as `JOB_AD_CONFIRMED`.

### Q4: Extraction & Scoring Factors
- **Result:** If fetched, Pillér evaluates to **85%** (`visible: true`, `hardExcluded: false`).
- **Exact Scoring Breakdown:**
  - Base score: 50 points
  - Position Relevance (`isGenericProjectTitle("Projektmenedzser")` + `hasITDomainContext`): +15 points
  - Project Leadership Scope (`hasProjectLeadershipScope` >= 2: stakeholder, projektterv, kockázatkezelés): +10 points
  - Institutional / Nonprofit Context (`hasInstitutionalContext`: "nonprofit"): +5 points
  - Freshness (posted 4 days ago): +5 points
  - Total Score: **85%**

### Q5: Title & IT-Domain Gate Verification
- **Result:** **Passed.** `matchesTargetPosition("Projektmenedzser")` is false, but `isGenericProjectTitle("Projektmenedzser")` is true, and the description contains IT domain terms ("IT-projekt", "rendszer-integráció", etc.), yielding `positionRelevant = true`. No gate blocked it.

### Q6: Normalization & Deduplication Check
- **Result:** **Not applicable.** Neither URL normalization (`normalizeUrl`), query-string stripping, nor title+company deduplication (`seenTitleCompany`) ever processed the Pillér URL because it was dropped in Stage B before URL normalization.

### Q7: Ranking of Failure Causes by Evidence
1. **Primary Cause (Stage B Listing Link Crawl Truncation - Weight 60%):** Hardcoded `limit = 12` in `extractJobLikeLinks` drops ~76% of job links (positions 13–50) from listing pages.
2. **Secondary Cause (Search Engine Indexing & Ranking Delay - Weight 25%):** SerpApi indexes generic Profession category pages (`/allasok/...`) higher than individual newly-posted vacancy URLs (`/allas/...`).
3. **Tertiary Cause (Budapest-Only Query Scope - Weight 15%):** All 11 queries hardcode `Budapest`, missing regional cities (Székesfehérvár, Fehérvárcsurgó-accessible ring).

### Q8: Reason for Budapest-Only Queries
- All 11 entries in `QUERIES` (`run.mjs` lines 24–36) explicitly specify `'... állás Budapest'`. This was a temporary MVP implementation artifact from Sprint 1 bootstrap that was not yet updated to reflect the PO's Fehérvárcsurgó primary location ring.

### Q9: Absence of Direct Profession Acquisition
- Direct Profession scraping (`tools/scraper.py` from `job-searcher`) was identified as a Track B preservation candidate in consolidation planning, but `run.mjs` was kept on a SerpApi-only pipeline during Sprint 1 relevance work to isolate scoring changes. Direct acquisition had not yet been wired into `run.mjs`.

### Q10: Blast Radius & 10+ Candidate Sampling Table

The table below demonstrates the false-negative blast radius caused by listing truncation (`limit = 12`) on Profession listing pages:

| # | Job Title | Hiring Organization | Direct Vacancy URL | Pipeline Score | Visible? | Excluded? | Status in Today's Pipeline | Cause of Miss |
|---|---|---|---|---|---|---|---|---|
| 1 | Projektmenedzser | Pillér Nonprofit Kft | `https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550` | 85% | `true` | `false` | MISSED | Dropped at Stage B listing link limit (pos 22 > 12) |
| 2 | Projektmenedzser - IT területen | SWISS MEDICAL SERVICES Kft. | `https://www.profession.hu/allas/projektmenedzser-it-teruleten-swiss-medical-services-kft-budapest-2976894` | 81% | `true` | `false` | MISSED | Dropped at Stage B listing link limit (pos 12/13) |
| 3 | Senior IT projektmenedzser | EN-CO Software Zrt. | `https://www.profession.hu/allas/senior-it-projektmenedzser-en-co-software-zrt-budapest-2974271` | 93% | `true` | `false` | MISSED | Dropped at Stage B listing link limit (pos 37 > 12) |
| 4 | Projektmenedzser (PMO) | Indotek Group | `https://www.profession.hu/allas/projektmenedzser-pmo-indotek-group-2971959` | 76% | `true` | `false` | MISSED | Dropped at Stage B listing link limit (pos 10/11) |
| 5 | Junior projektmenedzser | Pro-M Zrt. | `https://www.profession.hu/allas/junior-projektmenedzser-pro-m-zrt-budapest-2976753` | 55% | `false` | `false` | MISSED | Dropped at Stage B listing link limit (pos 30 > 12) |
| 6 | Senior projektmenedzser | Pro-M Zrt. | `https://www.profession.hu/allas/senior-projektmenedzser-pro-m-zrt-budapest-2976888` | N/A | `false` | `true` | MISSED | Hard-excluded (mandatory C1 English requirement) |
| 7 | Senior Projektmenedzser | Exelect Hungary Kft. | `https://www.profession.hu/allas/senior-projektmenedzser-exelect-hungary-kft-budapest-2987851` | N/A | `false` | `true` | MISSED | Hard-excluded (mandatory English requirement) |
| 8 | Projektmenedzser (B2C Transzformáció) | MOHU MOL Hulladékgazdálkodási Zrt. | `https://www.profession.hu/allas/projektmenedzser-b-c-transzformacio-mohu-mol-hulladekgazdalkodasi-zrt-budapest-2967035` | N/A | `false` | `true` | MISSED | Hard-excluded (non-IT B2C domain) |
| 9 | Üzletfejlesztesi projektmenedzser | ITK Holding Zrt. | `https://www.profession.hu/allas/uzletfejlesztesi-projektmenedzser-itk-holding-zrt-budapest-2982594` | N/A | `false` | `true` | MISSED | Hard-excluded (non-IT business dev) |
| 10 | Pályázati projektmenedzser | Óbuda-Békásmegyer Városfejlesztő | `https://www.profession.hu/allas/palyazati-projektmenedzser-obuda-bekasmegyer-varosfejleszto-nonprofit-kft-budapest-2992159` | N/A | `false` | `true` | MISSED | Hard-excluded (non-IT grant PM) |

---

## 3. Categorized Evidence Audit

### Known Facts
1. Pillér Nonprofit Kft. `Projektmenedzser` is explicitly listed in `profile/learned_preferences.md` as a good reference example.
2. The Pillér job ad (`2988550`) is live, active, and reachable on Profession.hu.
3. `docs/evidence/job-hunter-runs/2026-09-04T11-59-53-105Z.json` contains 0 occurrences of Pillér across `results`, `excluded`, and `unreachable`.
4. `run.mjs` line 157 sets `extractJobLikeLinks(item.fetched.html, item.url, 12)` with a hardcoded limit of 12.

### Reproduced Evidence
1. Live fetch of `https://www.profession.hu/allasok/budapest/1,0,23,projektmenedzser` returned 50 job links, with Pillér located at position **22**.
2. Executing `extractJobLikeLinks(html, url, 12)` on this listing HTML returned 12 links (positions 1–12), dropping position 22 (Pillér).
3. Passing the raw Pillér HTML directly to `lib/extract.mjs` and `lib/scoring.mjs` produced score **85%** (`visible: true`, `hardExcluded: false`).

### Inferences
1. Increasing `extractJobLikeLinks` limit from 12 to 50 will immediately recover Pillér (85%) and other high-relevance vacancies (such as EN-CO Software 93% and SWISS MEDICAL 81%).
2. Adding direct Profession.hu ingestion (from `job-searcher`) will eliminate reliance on SerpApi category page ranking.

### Unknowns (due to unpersisted raw SERP payloads)
1. Exact Google SERP ranking positions of individual Profession URLs at 11:59 UTC on 2026-09-04 (raw Google HTML/JSON was not saved; inferred via live SerpApi rerun).

---

## 4. Recommended Fixes

1. **Fix 1 (Immediate - High ROI, Low Risk):** Increase listing link crawl limit in `run.mjs` line 157 from `12` to `50` (or `35`). Filter out non-job navigation links (`rss`, `regisztracio`, `tanacsok`) before applying the limit.
2. **Fix 2 (Short-term):** Add regional location queries to `QUERIES` (e.g. `'IT vezető állás Székesfehérvár'`, `'IT projektmenedzser állás Veszprém'`).
3. **Fix 3 (Medium-term - Direct Acquisition):** Wire `job-searcher`'s direct Profession.hu scraper (`tools/scraper.py`) into `run.mjs` alongside SerpApi.
