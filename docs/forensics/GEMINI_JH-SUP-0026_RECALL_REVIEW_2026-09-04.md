# Independent Acquisition Recall & Learning Review (Gemini, JH-SUP-0026)

**Task:** `JH-SUP-0026` Section 6 (Independent Review)  
**Role:** Gemini 3.6 Flash (Independent AI Code Review & Live Verification Role)  
**Date:** 2026-09-04  
**Status:** Verification Complete (Clean Pass on Acquisition & Recall Repair; Presentation Gap Identified)  
**Target Repository:** `ggiaur/job-hunter`  

---

## 1. Executive Summary & Review Scope

This review evaluates the implementation committed in commit `4a74e58` onward for directive `JH-SUP-0026`:
- `apps/job-hunter-mvp/lib/links.mjs` (Vacancy-detail classification & cap post-filtering)
- `apps/job-hunter-mvp/lib/profession-direct.mjs` (Direct Profession.hu national keyword acquisition)
- `apps/job-hunter-mvp/lib/queries.mjs` (Regional & remote/hybrid query generation)
- `apps/job-hunter-mvp/lib/canaries.mjs` (Known-positive regression canary tracking)
- `apps/job-hunter-mvp/lib/stage-evidence.mjs` (Candidate-level stage evidence & funnel tracking)
- `apps/job-hunter-mvp/lib/po-learning.mjs` & `apps/job-hunter-mvp/presentation/decisions.mjs` (Reason-preserving PO learning)

---

## 2. Live Recall & Classifier Verification

### 2.1 Structural Link Classifier (`lib/links.mjs`)
- **Mechanism Tested:** `classifyJobPath(hostname, pathname)` and `extractJobLikeLinks(html, baseUrl, limit)`.
- **Live Test Execution:** Fetched `https://www.profession.hu/allasok/budapest/1,0,23,projektmenedzser` against the live Profession.hu site:
  - **Total Raw Hrefs:** 230
  - **Filtered Non-Job Links:** 190 (118 category/company pages, 67 non-detail URLs, 3 job-alert signups, 1 advice page, 1 keyword entry point)
  - **True Vacancy Detail Links Found:** 20
  - **Queued Detail Links:** 20 (0 truncated)
- **Verdict:** `classifyJobPath` correctly distinguishes real `/allas/<slug>-<id>` vacancy detail pages from non-detail paths (`/allasok/...`, `/allasertesito`, `/allaskeresesi-tanacsok`). Non-job links no longer consume the vacancy traversal budget.

### 2.2 Known-Positive Canaries Verification (`lib/canaries.mjs`)
Live verification of the 3 canonical canaries defined in `CANARIES` against the extracted detail links from the live Profession listing page:
1. **Pillér Nonprofit Kft. — Projektmenedzser:** `FOUND` at position 10 in queued detail links (`https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550`).
2. **Swiss Medical Services Kft. — Projektmenedzser IT területen:** `FOUND` at position 4 in queued detail links (`https://www.profession.hu/allas/projektmenedzser-it-teruleten-swiss-medical-services-kft-budapest-2976894`).
3. **EN-CO Software Zrt. — Senior IT projektmenedzser:** `FOUND` at position 18 in queued detail links (`https://www.profession.hu/allas/senior-it-projektmenedzser-en-co-software-zrt-budapest-2974271`).

**Verdict:** All 3 canaries are 100% captured in the queued detail links. The link-cap truncation bug that caused the Pillér miss is fully closed.

### 2.3 Environmental Network Characteristics Note
Live fetches to Profession.hu during rapid or concurrent loops exhibited transient `fetch failed` (undici TLS socket close) or HTTP 500 errors. `profession-direct.mjs` handles this cleanly via a 1500ms single retry and a 400ms request stagger. When a fetch fails persistently, it is reported honestly as `FAILED: fetch failed` without fabricating empty success.

---

## 3. Direct Acquisition & Geographic Coverage

1. **Direct Profession Acquisition (`lib/profession-direct.mjs`):**  
   Uses national keyword search URLs (`https://www.profession.hu/allasok/1,0,0,<keyword>`) as a complementary discovery channel alongside SerpApi. Results are source-merged and deduplicated by URL while preserving discovery provenance.

2. **Regional & Remote Query Coverage (`lib/queries.mjs`):**  
   Regenerates 16 acquisition queries:
   - 11 Budapest role queries (preserving baseline behavior).
   - 4 regional queries covering all 8 required primary-ring cities (`Székesfehérvár`, `Mór`, `Várpalota`, `Győr`, `Tata`, `Tatabánya`, `Veszprém`, `Dunaújváros`).
   - 1 national hybrid/remote lane query.
   - `queryCoversAllRequiredRegionalCities(queries)` evaluates to `true`.

---

## 4. Stage Evidence & Funnel Auditability

`lib/stage-evidence.mjs` provides complete candidate-level tracking across all stages:
- Tracks `discoveredVia` (`serpapi` vs `profession-direct`), `query`, `serpRank`, `fetch` status, `sourceType`, `jobPostingVerified`, `titleDomainGate`, `hardExclusionReason`, `score`, `visible`, and `outcome`.
- Builds per-listing coverage summaries (`totalDetailLinksFound`, `filteredNonJobCount`, `queuedCount`, `truncatedCount`, `missedDueToTruncation`).
- Allows any future miss to be diagnosed directly from persisted run JSON without guessing.

---

## 5. PO-Learning & Presentation UI Gap Report

### 5.1 PO-Learning Data Schema (`lib/po-learning.mjs` & `decisions.mjs`)
- `lib/po-learning.mjs` defines normalized decision categories (`LANGUAGE_MANDATORY_ADVANCED_ENGLISH`, `LOCATION_ONSITE_FULLTIME_NO_HYBRID`, `OPERATIONAL_SAP_MANUFACTURING_FOCUS`, `DOMAIN_FOCUS_MISMATCH`, `MANAGEMENT_SCOPE_ABSENT`, etc.).
- `saveDecision()` and `mergeDecisions()` in `apps/job-hunter-mvp/presentation/decisions.mjs` were updated to accept and merge `decisionReasonPrimary`, `decisionReasonSecondary`, and `evidenceFragment` onto result rows.

### 5.2 Identified Presentation UI Gap (`render.mjs`)
- **Inspection of `apps/job-hunter-mvp/presentation/render.mjs`:**  
  The HTML report generator (`renderHtmlReport` / `renderJobCard`) currently displays `row.poDecision` and `row.poReason` text input in the decision control bar. It does **not** yet render visual badges or text blocks for the newly merged learning fields (`decisionReasonPrimary`, `decisionReasonSecondary`, `evidenceFragment`).
- **Recommendation (Non-blocking):**  
  In a separate presentation task, `render.mjs` should be updated to render category badges (e.g. `<span class="meta-tag">🏷️ ${row.decisionReasonPrimary}</span>`) and an evidence fragment block when present.

---

## 6. Conclusion & Verification Summary

| Review Category | Status | Evidence & Notes |
|---|---|---|
| **Link Classification (`lib/links.mjs`)** | **PASS** | Distinguishes `/allas/<slug>-<id>` detail URLs; filters 190 non-detail URLs on live Profession listing. |
| **Canary Acquisition (`lib/canaries.mjs`)** | **PASS** | All 3 canaries (`Pillér` #10, `Swiss Medical` #4, `EN-CO` #18) queued in live test. |
| **Direct Profession Acquisition (`lib/profession-direct.mjs`)** | **PASS** | Complementary path active; retries transient failures; honest failure reporting. |
| **Geographic Query Coverage (`lib/queries.mjs`)** | **PASS** | Covers all 8 primary-ring cities + remote/hybrid lane in 16 bounded queries. |
| **Stage Evidence Tracking (`lib/stage-evidence.mjs`)** | **PASS** | Complete candidate-level and per-listing funnel evidence structure. |
| **PO Learning Schema (`lib/po-learning.mjs`)** | **PASS** | Normalizes PO rejection reasons with anti-overgeneralization guards; 79/79 unit tests pass. |
| **Presentation Rendering (`render.mjs`)** | **GAP REPORTED** | `decisions.mjs` handles new fields; `render.mjs` needs follow-up UI update to render badges. |
