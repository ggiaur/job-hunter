# JH-SUP-0026 — Recall repair + durable learning from the Pillér miss

**Priority:** P0  
**Mode:** reconcile first, then implement, independently falsify, then live E2E  
**Product Owner intent:** Development must continue in a way that visibly learns from the Pillér failure. Fixing one constant is not enough; the acquisition system and the team's reasoning process must both become resistant to the same class of false negative.

## 0. Mandatory reconciliation gate before code changes

Claude ACTIVE_ORCHESTRATOR must first finish and commit `docs/forensics/PILLER_MISS_RECONCILIATION_2026-09-04.md` using the already-committed independent Claude, Codex and Gemini reports.

The reconciliation must explicitly distinguish:

- **Pillér-specific proven cause:** acquisition/listing traversal lost the job before detail-page scoring; Claude and Gemini reproduced the 12-link truncation on the live Profession listing, while Codex independently localized the miss to pre-detail acquisition under its environment limits.
- **Separate real coverage problem, not causal for Pillér:** all 11 search queries are Budapest-only despite the canonical Fehérvárcsurgó-accessible location rules.
- **Do not repeat the earlier reasoning error:** `Budapest-only query scope` cannot explain why a Budapest vacancy was missed. This contradiction must be recorded as a process-learning example.

No implementation commit may precede this reconciliation commit.

## 1. Acquisition recall repair — required implementation

### 1.1 Replace broad link-hint truncation with real job-detail extraction

Current failure mechanism: `extractJobLikeLinks(html, url, 12)` counts utility/navigation/company/listing links against the cap because it only looks for broad path substrings such as `allas`/`job`/`career`.

Implement a safer extractor that, for Profession and other supported listing pages where possible:

- identifies **actual vacancy detail links** separately from company profiles, category pages, pagination, RSS, alerts, advice pages and navigation;
- applies any safety/cost cap **after** non-vacancy links are filtered, never before;
- records how many raw links, plausible detail links, filtered non-job links and queued detail links were observed;
- never silently treats `12 broad path matches` as `12 jobs`.

Do not solve this only by changing `12` to `50`; the over-inclusive classification must be corrected as the primary fix. A bounded cap may remain after true vacancy-detail classification.

### 1.2 Listing depth and pagination

For supported job-board listing pages, traverse enough real result cards/pages to prevent a lower-ranked legitimate vacancy from disappearing solely because it is below an arbitrary DOM-order cutoff.

Requirements:

- bounded, auditable maximum pages/jobs per source;
- stop conditions documented;
- duplicates removed without consuming the discovery budget;
- per-page coverage counters persisted.

### 1.3 Activate a direct Profession acquisition path

The repository already documents direct Profession acquisition as a preservation candidate. Integrate or safely adapt the useful existing implementation so Profession inventory does not depend only on SerpApi returning a listing/category page.

SerpApi remains a useful discovery channel; the new system should use **multiple complementary acquisition paths**, not replace one brittle single path with another.

At minimum for this slice:

- direct Profession discovery is active and produces real detail URLs;
- SerpApi and Profession results are merged/deduplicated before scoring;
- source provenance is preserved per candidate.

### 1.4 Fix geographic acquisition drift

Generate acquisition queries from the canonical location/work-arrangement rules rather than eleven hard-coded Budapest strings.

Required first-round coverage must include at least:

- Székesfehérvár
- Mór
- Várpalota
- Veszprém
- Tata
- Tatabánya
- Győr
- optionally Dunaújváros
- Budapest
- a national hybrid/remote search lane for otherwise distant Hungarian locations

Do not create a combinatorial explosion. Use a compact role-family × location strategy with cost accounting and deduplication.

## 2. Known-positive regression canaries

Create a durable `known-positive` acceptance mechanism.

### Pillér canary

While the current Pillér Nonprofit Kft. `Projektmenedzser` vacancy remains live and unchanged enough to match the approved profile:

- the live E2E must acquire its direct detail URL;
- it must reach the scoring stage;
- it must remain visible if its score is >=60 and no new hard-exclusion evidence appears;
- the evidence must show which source/path found it.

Do **not** hard-code the Pillér result into output. The test is discovery through real acquisition, not injection.

### Generalized canaries

Add at least 2 additional current Pillér-like reference candidates from the forensic sample (for example the live EN-CO `Senior IT projektmenedzser` and SWISS MEDICAL `Projektmenedzser - IT területen`) as temporary discovery canaries after verifying their current content and language requirements. A canary may legitimately become excluded after full scoring; the required invariant is that it is **acquired and evaluated**, not that it is forced visible.

## 3. Persist the acquisition funnel so future misses are explainable

Every run must persist candidate-level stage evidence sufficient to answer `where did this URL disappear?` without reconstructing history from guesses.

Persist at minimum:

- search query and organic rank for each SerpApi result;
- source URL and source type (detail/listing/category/company/etc.);
- listing page -> extracted vacancy detail links in traversal order;
- filtered/non-job link counts and reasons;
- fetch attempt + HTTP/error status;
- JobPosting verification result;
- title/domain relevance gate result;
- hard-exclusion reason;
- score + fit/mismatch factors;
- final visible/not-visible decision;
- dedup parent/kept record when a duplicate is collapsed.

This evidence may be compact JSON; full raw HTML need not be persisted unless necessary.

## 4. PO-feedback learning must be reason-preserving

The Product Owner's 2026-09-04 live review is now persisted in `profile/learned_preferences.md`. Implementation must consume the **reason**, not just the binary decision.

Required schema/behavior:

- `poDecision`: APPLY / DO_NOT_APPLY
- `poReason`: human-readable exact reason
- `decisionReasonPrimary`: stable normalized reason category
- `decisionReasonSecondary`: optional
- evidence text/source fragment when the reason comes from the vacancy itself (especially language/work-arrangement requirements)

Do not overgeneralize one rejection:

- CAIP means `far + full-time/on-site + no meaningful hybrid/remote`, not `Nyíregyháza always excluded`.
- Emerson's rejection does not mean all cross-functional program/project leadership is bad; Pillér-like cross-functional IT project leadership remains positive.
- Siemens rejection is primarily SAP/manufacturing-IT operational focus, not a universal ban on any vacancy mentioning SAP.
- Iron Mountain's primary blocker is likely significant active business English; people-management absence is secondary.

## 5. Reasoning-quality guardrail — learn from the team's wrong explanation

Create `docs/quality/CAUSAL_MISS_ANALYSIS_PROTOCOL.md` and apply it to future search-quality incidents.

Required protocol:

1. Name the specific missing reference URL/job.
2. Trace it through the real pipeline stage-by-stage.
3. Identify the **first proven disappearance stage**.
4. For every proposed cause, run a **causal contradiction check**: `If this cause were true, can it actually explain this concrete case?`
5. Separate `proven`, `reproduced`, `inference`, and `unknown because not persisted`.
6. Do not elevate a general system weakness to the cause of a specific miss without stage evidence.
7. Before declaring a fix PASS, re-run the known-positive reference through the live path and perform a bounded source-recall sample.

The protocol must use the failed statement `Budapest-only scope caused the Pillér miss` as the canonical counterexample: it is a real system weakness but cannot be causal for a Budapest vacancy.

## 6. Tests and independent falsification

### Builder tests

Add regression tests for at least:

- utility/company/category links do not consume vacancy-detail cap;
- Pillér-like detail link below raw DOM position 12 is still queued;
- pagination/detail-card traversal reaches later real vacancies within configured safety limits;
- source merge deduplicates the same vacancy without dropping provenance;
- stage evidence is complete for acquired, excluded, unreachable and deduplicated candidates;
- location query generator contains canonical regional coverage and a hybrid/remote lane;
- PO reason fields survive persistence/history rendering.

### Independent review

After Claude integration:

- **Codex** must adversarially test false negatives and prove the new extractor cannot be defeated by utility/company/profile links consuming the cap. It must also challenge evidence completeness.
- **Gemini** must independently review acquisition recall against live Profession pages and the known-positive canaries, and check that the UI/result data exposes the PO decision reasons.

Neither review may merely inspect passing unit tests; both must use real examples or adversarial fixtures derived from the failure.

## 7. Live acceptance experiment

Run a fresh live E2E after fixes.

Minimum evidence required:

1. Current active Pillér vacancy is discovered through a legitimate real acquisition path and reaches scoring.
2. At least 2 additional Pillér-like live candidates from the forensic sample are acquired and evaluated, even if later excluded for truthful reasons.
3. On the Profession project/IT-management listing used in the forensic audit, report:
   - number of real detail links present/observed;
   - number queued;
   - number fetched;
   - number confirmed;
   - number excluded/scored;
   - any missed detail links and explicit reason.
4. Demonstrate regional acquisition outside Budapest with at least one real candidate search result from the Fehérvárcsurgó-accessible ring, if current sources return one.
5. Show all >=60 results with complete decision fields and language/work-arrangement evidence.

**No PASS** if Pillér is still active and the system again fails to acquire it without an explicit, evidence-backed source failure.

## 8. Definition of Done for JH-SUP-0026

PASS only when all are true:

- SUP-0025 reconciliation is committed before implementation;
- real vacancy-detail extraction no longer wastes the cap on non-job links;
- listing traversal is depth-safe and bounded;
- direct Profession acquisition is active alongside SerpApi;
- acquisition queries cover the canonical regional strategy, not Budapest only;
- candidate-level stage evidence is durably persisted;
- known-positive canary mechanism exists and live Pillér is acquired if still active;
- PO decision reasons are persisted as structured learning data;
- causal-miss analysis protocol is committed;
- builder tests pass;
- Codex independent falsification passes or material findings are fixed;
- Gemini independent live recall review passes or material findings are fixed;
- final live run is inspectable and shows the Product Owner exactly what changed in recall and why.

Do not claim that `more results` alone means improvement. The metric is: **fewer unexplained false negatives + truthful relevance + auditable reasons + real apply-worthy candidates.**
