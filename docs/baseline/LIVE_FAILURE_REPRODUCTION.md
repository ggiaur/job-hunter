# Bounded Live Failure Reproduction (JH-SUP-0002 STEP E)

Executed: 2026-09-02, against `ggiaur/job-searcher` @ `03b269e`, `MOCK_MODE=false`, real `FIRECRAWL_API_KEY`/`GEMINI_API_KEY` present. Scope was deliberately minimal — no full `agent.run()` — to respect the "no broad/unbounded Firecrawl search" rule.

## Experiment

Two calls only, made directly against `tools.scraper.JobScraper`:
1. `scrape_jobs()` with `TARGET_URLS` overridden to a single profession.hu listing URL (1 call instead of the default 7).
2. `search_jobs(queries=["IT vezető állás Budapest"])` — 1 query instead of the default 3.

No detail-page fetch, no Gemini call was reached (both acquisition calls failed before any candidate existed to enrich/score).

## Result

| Metric | Value |
|---|---|
| Firecrawl calls issued | 2 (1 `scrape_url`, 1 `search`) |
| Firecrawl calls succeeded | 0 |
| Raw candidates found | 0 |
| Detail pages fetched | 0 |
| Gemini calls | 0 |
| Duplicates removed | 0 (n/a, no candidates) |
| Jobs surviving filters | 0 |
| Jobs judged relevant | 0 |

Both calls returned the same error:

```
Payment Required: Failed to scrape URL. Insufficient credits to perform this request.
Payment Required: Failed to search. Insufficient credits to perform this request.
```

(Firecrawl's own 402 response; `firecrawl-py` surfaced it as a raised exception caught by `tools/scraper.py`'s existing `try/except`, logged as an error, returning an empty list — matches the audited behavior in `LEGACY_SEARCH_PATH_AUDIT.md` point 4/11.)

## Interpretation

This is a **currently-blocking, account-level fact**, separate from and in addition to the code-level defects found in the audit: the Firecrawl account behind `job-searcher`'s `FIRECRAWL_API_KEY` has **zero/insufficient credits right now**. No amount of code correctness in `job-searcher` can produce real candidates while this holds.

This does not invalidate the code-audit findings (fixed 10-call baseline, uncapped detail-scrape fan-out, subjective-only relevance gate, run-aborting quota handling) — those remain real design defects that will reproduce the same failure class again once credits exist, at a different (higher) cost. But it does mean **today's specific symptom (0 jobs found)** is credit exhaustion, not solely a relevance/ranking bug.

## Classification

This is a `BLOCKED_HUMAN_PERMISSION`-adjacent fact for *live full-pipeline* testing (topping up Firecrawl credits is a Product Owner/billing action), but it does **not** block STEP F (Codex/Gemini can review code + this evidence without further live spend) or STEP G (architecture decision can proceed from code evidence + this reproduction). Recorded per `docs/EXECUTION_CONTINUITY_POLICY.md` — parked, not stopped, work continues.
