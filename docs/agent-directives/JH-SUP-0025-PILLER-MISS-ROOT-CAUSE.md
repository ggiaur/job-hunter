# JH-SUP-0025 — Pillér miss root-cause roundtable

**Priority:** P0
**Mode:** evidence-first read-only/falsification audit; do not redesign or implement until the miss is explained
**Product Owner question:** Why did today's Job Hunter harvest fail to include the still-active Pillér Nonprofit Kft. `Projektmenedzser` vacancy, even though this vacancy is already stored in `profile/learned_preferences.md` as a specifically good positive reference? If this one was missed, what other genuinely relevant jobs are likely being missed for the same reason?

## Ground truth to reproduce

1. Positive reference already committed in `profile/learned_preferences.md`: Pillér Nonprofit Kft. `Projektmenedzser` is explicitly a good example.
2. Current vacancy URL: `https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550`
3. As checked by the Product Supervisor on 2026-09-04, the advert is currently reachable and contains the expected IT-project-management duties; Profession states `Nem kell nyelvtudás` and lists conversational English only as an advantage.
4. Today's persisted run `docs/evidence/job-hunter-runs/2026-09-04T11-59-53-105Z.json` did not contain Pillér in visible, scored, excluded, or unreachable records.
5. Current live acquisition code uses 11 fixed Budapest queries and `SerpApi num=10` per query, then only a limited second-level listing crawl.

## Required independent answers

Claude ACTIVE_ORCHESTRATOR must obtain three independent analyses before reconciliation:

### A. Claude analysis
Trace the Pillér vacancy through every stage the current pipeline could have used and identify the earliest stage at which it disappeared.

### B. Codex falsification analysis
Independently reproduce/inspect the miss and challenge Claude's explanation. Look for hidden false-negative mechanisms in acquisition, listing traversal, JobPosting verification, title/domain gates, English handling, deduplication, scoring, and visible threshold.

### C. Gemini independent acquisition/relevance analysis
Independently determine why a live, known-good reference vacancy was absent and whether source/query coverage is structurally capable of finding Pillér-like roles.

Do not let one agent's hypothesis seed the others before their independent notes are committed.

## Questions every analysis must answer

1. Did any of today's 11 SerpApi queries return the exact Pillér vacancy in the top 10 organic results? Prove from persisted/raw evidence where possible; if raw SERP payload was not persisted, state that limitation explicitly and perform only a bounded reproducibility check via approved SerpApi/direct Profession access.
2. If the exact vacancy was not in the top 10, did a Profession listing/category/company page containing it appear? If yes, was the Pillér link among the first 12 `extractJobLikeLinks()` links crawled? If not, show why.
3. Was the vacancy ever fetched by Stage B or Stage C? If fetched, did it contain schema.org `JobPosting` and how was it classified?
4. If it reached extraction/scoring, what would its current score and exclusion state be? Show the exact factors.
5. Did the `Projektmenedzser` title + IT-domain logic accept it? If not, identify the exact gate.
6. Did any URL normalization, query-string dedup, title/company dedup, or tracking parameter logic remove it incorrectly?
7. Is the main failure query coverage, search-depth/ranking, source coverage, listing traversal depth/order, verification strictness, or downstream scoring/filtering? Rank causes by evidence.
8. Why did the system search Budapest in all 11 queries despite the canonical location rules naming Fehérvárcsurgó-accessible regional cities as primary?
9. Why is direct Profession acquisition not active even though `SPRINT_1.md` and the consolidation decisions explicitly identify the `job-searcher` Profession work as a preservation candidate?
10. What is the likely false-negative blast radius? Perform a bounded comparison against current Profession results for relevant project/IT leadership terms and identify at least 10 current plausible candidates the present pipeline either did not acquire or did not surface. Do not claim completeness; this is a sampling test.
11. Separate `known facts`, `reproduced evidence`, `inference`, and `unknown because evidence was not persisted`.

## Required artifacts

- `docs/forensics/CLAUDE_PILLER_MISS_ANALYSIS_2026-09-04.md`
- `docs/forensics/CODEX_PILLER_MISS_ANALYSIS_2026-09-04.md`
- `docs/forensics/GEMINI_PILLER_MISS_ANALYSIS_2026-09-04.md`
- `docs/forensics/PILLER_MISS_RECONCILIATION_2026-09-04.md`

The reconciliation must contain:

- the proven earliest miss stage for Pillér;
- a stage-by-stage acquisition funnel with where Pillér was/was not present;
- all material false-negative mechanisms found;
- the 10+ candidate sampling table and whether today's pipeline saw each one;
- concrete prioritized fixes, with expected coverage gain and risk/cost;
- a recommendation for the smallest next live experiment that would prove the fix finds Pillér plus other Pillér-like vacancies.

## Constraint

This directive is an audit/falsification slice serving the existing Sprint 1 relevance goal. Do not silently alter production search behavior before the root cause is reconciled. No direct automated `google.com/search` traffic. SerpApi and direct legitimate job-source access are allowed. Do not fabricate historical SERP contents that were not persisted.
