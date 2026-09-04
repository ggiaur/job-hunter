# Job Hunter — Business Model Review (Gemini, Independent)

**Task:** `JOB-HUNTER-BUSINESS-MODEL-REVIEW-001`  
**Role:** Gemini 3.6 Flash (Independent AI Research & Business Analysis Role)  
**Date:** 2026-09-04  
**Scope:** Business clarification and requirement reconciliation only. No implementation, no canonical file modifications (`SPRINT_1.md` left untouched), no cron/scheduling changes.  
**Evidence Inspected:** `profile/persona.md`, `profile/exclusions.yaml`, `profile/preferred_companies.yaml`, `profile/learned_preferences.md`, `docs/evidence/REAL_JOB_HUNTER_CURRENT_RUN.md`, `docs/evidence/real-job-hunter-current-run.json`, `docs/agent-runtime/product-supervisor-ack.yaml`, `apps/job-hunter-mvp/run.mjs`, `apps/job-hunter-mvp/lib/extract.mjs`, `SPRINT_1.md`.

---

## 1. Business Model & Core Value Proposition (Restated)

The primary goal of **Job Hunter** is to eliminate manual job hunting for the Product Owner (PO)—a 20+ year IT veteran currently serving as IT Department Head at the Vörösmarty Mihály Library, managing a 6-person team across multiple sites.

### Key Capabilities Required:
1. **Automated Discovery:** Periodically (twice weekly) discover genuine Hungarian IT vacancies from legitimate job sources.
2. **Strict Exclusion Filtering:** Hard-exclude irrelevant roles (helpdesk, purely junior roles, pure non-lead developer roles, non-IT management, or roles requiring fluent/native English).
3. **Seniority & Fit Scoring:** Rank openings by alignment with the PO's persona (IT Department Head, CIO, IT Director, IT Project Manager, AI Transformation Lead).
4. **Actionable Presentation:** Deliver a curated, highly relevant list of openings that the PO would genuinely consider applying to.
5. **Feedback Loop:** Capture PO evaluations (apply-worthy vs. rejected) to refine scoring rules continuously.

### The Central Gap:
The current codebase (`run.mjs`) and acceptance documents (`JH-SUP-0022/0023`) optimize for **quantity** ("return 7–15 listings passing heuristic gates") rather than **actionable relevance** ("return listings the PO actually wants to apply to"). In the latest operational run (`REAL_JOB_HUNTER_CURRENT_RUN.md`), 13 listings were accepted by the pipeline, but only **1 listing** was deemed genuinely apply-worthy by the PO (~7.7% conversion rate). This discrepancy is the core business problem to solve.

---

## 2. Material Ambiguities, Hidden Assumptions & Contradictions

### 1. Count-Based Metric vs. Quality-Based Acceptance
Current directives define success as *"7–15 accepted job ads"*. This creates a false proxy for success: a run that returns 13 listings where 12 are irrelevant still technically passes the acceptance criteria. The business model requires a **precision metric** (e.g., "at least 3 apply-worthy results per run") rather than a raw count range.

### 2. Missing Seniority-Fit & Salary Signal
- **Salary Floor:** `persona.md` specifies a 700,000 HUF gross salary floor. However, Hungarian job boards frequently omit salary data in Schema.org `JobPosting` structured data. The scoring code treats salary-silent listings identically to listings meeting the floor, without attempting salary range estimation based on role/company scale.
- **Seniority Calibration:** Current scoring awards bonus points for generic management keywords ("osztályvezető", "projektvezető") without evaluating organizational scale. As a result, a solo IT coordinator or small agency project manager can score higher than a multi-site IT leadership role.

### 3. Additive-Only Scoring & Absence of Negative Penalty Signals
The scoring algorithm in `run.mjs` is purely additive (adding points for keyword matches and institutional contexts). It lacks **negative penalty signals** for out-of-domain management, generic IT roles, or unappealing organizational structures. Additionally, `exclusions.yaml` and `preferred_companies.yaml` are essentially empty, leaving the system reliant on a hand-edited `learned_preferences.md` file.

### 4. Direct Acquisition vs. Search Engine Indexing
The PO's core request names **Profession.hu** and **CV Online** as primary job sources. However, the current MVP retrieves postings indirectly via SerpApi (Google Search index). This introduces dependency on Google's indexing freshness and coverage, which may miss brand-new listings or include expired/stale postings.

### 5. Architectural Staleness of `SPRINT_1.md`
`SPRINT_1.md` still mandates literal browser DOM scraping of `google.com/search`. This directly contradicts:
- Security policy `JH-SUP-014` (hard stop on automated Google traffic from corporate egress).
- Reconciled technical decisions (`GEMINI_GOOGLE_SEARCH_BEST_PRACTICE.md`, `CHEAPEST_GOOGLE_SEARCH_COST_DECISION.md`) adopting SerpApi.
- The actual working codebase (`apps/job-hunter-mvp/`).

### 6. Un-Automated Feedback Loop & Missing Web UI
`learned_preferences.md` is currently updated manually in prose by AI agents after PO comments. There is no structured data schema (e.g., `feedback.json`) or PO-facing web UI to record per-listing feedback (Apply / Save / Reject + Reason).

---

## 3. Concrete Questions for the Product Owner

Ranked by impact on system scope and acceptance criteria:

1. **Relevance Target:** Should acceptance criteria be updated from a count target (7–15 listings) to a precision target (e.g., *"at least 3 results per run marked as apply-worthy by the PO"*)?
2. **Rejection Rationale:** What specific factors made the 12 non-chosen listings from the latest run unappealing (e.g., salary unstated/too low, team size too small, lateral/step-down role, unappealing industry/sector)?
3. **Seniority Hierarchy:** Relative to your current role (IT Department Head, 6-person team, multi-site public library), how should the scoring engine rank:
   - Head of IT / CIO at a large/medium enterprise (Step Up)
   - IT Manager / Department Head at a similar institution (Lateral)
   - Senior IT Project Manager / Delivery Lead (Alternative Track)
   - Solo IT Coordinator / Group Leader at a small agency (Step Down)
4. **Salary-Silent Postings:** When salary is missing from a job ad, should Job Hunter:
   - (A) Treat it as neutral (current behavior)?
   - (B) Estimate salary range based on company size, title, and location?
   - (C) Penalize/demote salary-silent listings?
5. **Native Portal Ingestion:** Is indirect discovery via SerpApi acceptable for Sprint 1/2, or is direct native ingestion of Profession.hu and CV Online required for MVP acceptance?
6. **Web UI & Feedback Capture:** Should a simple local web UI (or CLI feedback tool) for 1-click PO feedback (Apply / Save / Reject + Reason) be built in Sprint 2 to replace manual `learned_preferences.md` editing?

---

## 4. Draft Sprint 1 / Sprint 2 Outcomes (Draft Only — Awaiting PO Approval)

> **Note:** These are draft proposals for discussion and do NOT constitute approved code changes or modifications to `SPRINT_1.md`.

### Draft Sprint 1: Scoring Precision & Seniority Calibration
- **Goal:** Refine `run.mjs` scoring to improve precision without changing the acquisition architecture (same SerpApi source).
- **Deliverables:**
  - Add relative seniority level scoring (separating IT Department Head / CIO from solo IT PM roles).
  - Add negative penalty keywords for generic/out-of-domain management roles.
  - Implement heuristic salary range estimation for salary-silent postings.
- **Acceptance Criteria:** PO evaluates run results and marks at least **3 listings as genuinely apply-worthy**.

### Draft Sprint 2: PO Feedback Loop & Lightweight Web UI
- **Goal:** Build an automated feedback capture loop and user interface.
- **Deliverables:**
  - Create a lightweight local web UI (or CLI review tool) displaying candidate job cards.
  - Add 1-click actions: `Apply`, `Save`, `Reject` (with structured reason tags).
  - Persist feedback into a structured `profile/feedback_history.json` file that automatically adjusts scoring weights for future runs.
