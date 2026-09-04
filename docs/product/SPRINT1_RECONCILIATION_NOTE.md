# Sprint 1 — acquisition reconciliation note

Per SPRINT_1.md §3/§8 and PO_DECISIONS_2026-09-04.md §10: `job-hunter`
contains two unreconciled acquisition implementations. This is the engineering
reconciliation decision for Sprint 1.

## What exists

- **Live path**: `apps/job-hunter-mvp/run.mjs` — Node, SerpApi (Google)
  organic-results search → schema.org JobPosting extraction → the new
  Sprint-1 relevance scoring. Proven working end-to-end this sprint (see
  `docs/evidence/job-hunter-runs/2026-09-04T11-15-45-711Z.json`).
- **Dormant path**: `tools/acquisition/*.py` — a real, independently tested
  Python module (`adapters.py`, `budget.py`, `filtering.py`, `orchestrator.py`,
  `planner.py`). `adapters.py`'s `ProfessionAdapter` is verified live
  (per its own code comments, dated 2026-09-02) against the real
  profession.hu search-results page, including two documented, since-fixed
  bugs (a wrong search-URL pattern and a wrong-anchor title/URL mismatch).
  This is genuine, real, valuable work — not a stale prototype.

## Decision for Sprint 1

**Keep SerpApi/`run.mjs` as the sole live path for this sprint. Do not
integrate `tools/acquisition/*.py` into the live run this slice.**

Reasoning:
- SPRINT_1.md explicitly authorizes Google/SerpApi and explicitly says "do
  not delay useful results merely to unify architecture first" (§3) and "do
  not spend another development cycle on architecture for its own sake"
  (PO_DECISIONS §11).
- The two paths are different languages (Node vs Python) with no existing
  bridge; a same-sprint integration would mean either porting
  `ProfessionAdapter`'s regex/anti-fragility logic to JS or shelling out to
  Python from `run.mjs`, both real engineering work with real risk of
  introducing new bugs, for a sprint whose acceptance bar is about relevance
  *scoring*, not source count.
- This sprint's live run already produced a genuinely strong, real,
  Fehérvárcsurgó-ring, apply-worthy-plausible result (IT Manager @ Howmet
  Aerospace, Székesfehérvár, 93%) from SerpApi alone. The scoring rework was
  the actual root cause of the prior "1 good result out of 13" outcome, not
  a shortage of sources.

## Recommended near-term follow-up (not this sprint)

`tools/acquisition/adapters.py`'s `ProfessionAdapter` is a strong integration
candidate for a near-term iteration once relevance scoring is confirmed
sound: it adds direct profession.hu coverage independent of what SerpApi's
Google index surfaces, which could catch real vacancies Google under-indexes.
Two integration paths, for a future decision (not decided here):
(a) port the verified regex/extraction logic to a `lib/profession.mjs`
adapter reusing the same `fetchWithTimeout`/schema-extraction pipeline in
`run.mjs`, or (b) run the Python module as a separate process and merge its
JSON output with the SerpApi results before scoring. (a) is more consistent
with the current single-language pipeline; (b) preserves the already-tested
Python code as-is. No recommendation is made here on which to prefer — that
is an engineering call for whoever picks this up, informed by how much
additional real coverage profession.hu actually adds once measured.

`job-searcher`'s and `allas-figyelo`'s acquisition/adapter code were not
re-examined here beyond what `portfolio-audit/CLAUDE.md` and the Track A/B
business-model/consolidation reviews already covered — see those documents
for the fuller inventory. Nothing found in this reconciliation pass changes
those earlier conclusions.
