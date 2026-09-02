# Cloud Runtime Inventory (JH-SUP-0002 STEP C)

Captured: 2026-09-02T13:19:42Z

## Repositories

| Repo | Path | Branch | HEAD | Dirty | Unpushed |
|---|---|---|---|---|---|
| `ggiaur/job-hunter` (canonical) | `/srv/projects/job-hunter` | main | `a0aeae2` | clean | none |
| `ggiaur/job-searcher` (legacy) | `/srv/projects/job-searcher` | main | `03b269e` | clean | none |

`job-hunter` had no local checkout before this session; cloned fresh via SSH (`git@github.com:ggiaur/job-hunter.git`).

## Sessions / processes

- tmux `codex`: idle at prompt, last cwd `/srv/projects/it-lens-audit-system` (unrelated prior task). Reusable for JH-SUP-0002 STEP F.
- tmux `gemini-freshcheck`: **blocked** — CLI showed "Individual quota reached... Resets in ~10h" at inspection time. Not usable for STEP F until quota resets or an alternate Gemini session/credential is available.
- tmux `agy-ai`: present, not yet inspected for job-hunter relevance.
- Other tmux sessions (`claude-retry-*`, `webarch*`, `claude-ai`): unrelated to Job Hunter/Job Searcher.
- No `job-hunter`/`job-searcher`-related Docker containers running.
- No systemd services or crontab entries reference job/Firecrawl/Gemini job-search work.

## Config/secret variable names (job-searcher/.env.example — names only, no values read)

`GCP_PROJECT_ID`, `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `MOCK_MODE`, `GEMINI_USE_VERTEX`, `GCP_LOCATION`, `GEMINI_MODEL`, `GEMINI_MIN_INTERVAL_SEC`, `MAX_DAILY_COST_USD`, `TARGET_URLS`.

`job-hunter` has no `.env`/`.env.example` yet — not created during this baseline step.

## Known blocker for STEP F

Gemini CLI session is quota-blocked. Codex session is available now. STEP F will proceed with Codex first; Gemini's independent assessment is parked until quota resets or an alternate path is authorized — this is recorded, not silently skipped.
