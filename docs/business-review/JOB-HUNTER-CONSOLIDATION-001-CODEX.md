# JOB-HUNTER-CONSOLIDATION-001 — Codex independent consolidation inventory

Date: 2026-09-04. Scope is analysis only. The recorded canonical repository is
`ggiaur/job-hunter`; this report neither changes that decision nor performs any
runtime or repository consolidation action.

## Method and limits

- Inspected the checked-out tips: `job-hunter` `70f49a0` and `job-searcher`
  `03b269e` (including tracked source, tests, configuration, and local
  non-versioned `.env` only to enumerate variable *names*, never values).
- Did not read `docs/business-review/JOB-HUNTER-CONSOLIDATION-001-CLAUDE.md`
  or a Gemini review for this brief.
- `git pull --rebase origin main -q` in this repository was attempted first and
  failed: `.git/FETCH_HEAD` is read-only in this sandbox. No pull occurred.
- Attempted the requested shallow clone to `/tmp/allas-figyelo.iqwlYv`. It
  failed before access to the repository because the sandbox SSH configuration
  reports bad owner/permissions for
  `/etc/ssh/ssh_config.d/20-systemd-ssh-proxy.conf`. Consequently there is no
  evidence-based claim about `ggiaur/allas-figyelo` contents.
- `ggiaur/cv-linkedin` is treated as confirmed empty/zero commits, per the
  brief; it has no unique assets to preserve.

Classifications below mean: **KEEP_AND_MIGRATE** = add/adapt into canonical
product; **KEEP_AS_REFERENCE_HISTORY** = preserve provenance but do not make
it an active implementation; **OBSOLETE_OR_DUPLICATED** = already present or
superseded in `job-hunter`; **PO_DECISION_REQUIRED** = a choice or missing
evidence prevents a safe conclusion.

## Executive conclusion

`job-hunter` already contains the newer acquisition architecture, freshness
aware state, profile, identical Telegram bot/feedback code, canonical Cloud
Build target names, and an independent SerpApi MVP. `job-searcher`'s material
unmerged value is principally its regression-test corpus, raw parser fixtures,
and operational history. Its legacy Firecrawl scraper offers useful source
coverage only as a deliberately selected fallback, not as a wholesale
migration: the canonical orchestrator has already retained Firecrawl search
and detail fallbacks while adding budgets and source identities.

`allas-figyelo` is the only unresolved repository. It must be made readable
and audited before any retirement/consolidation execution, because its
acquisition, scheduler, output, and deployed-runtime behavior are unknown.

## `job-searcher`: concrete preservation inventory

| Classification | Concrete item and exact evidence | Finding / required disposition |
| --- | --- | --- |
| KEEP_AND_MIGRATE | `.github/workflows/test.yml`; `requirements-dev.txt`; `pyproject.toml` | The repository has CI and Ruff configuration (`E,F,I,UP`, Python 3.11) that canonical lacks (`job-hunter/pyproject.toml` only configures pytest). Port the intent and update paths; it is the only checked-in automation enforcing the legacy regression suite. |
| KEEP_AND_MIGRATE | `tests/test_scraper.py`, `tests/test_scraper_regex.py`, `tests/fixtures/mock_listings.json`, `tests/fixtures/snapshots/profession_raw.md`, `tests/fixtures/snapshots/cvonline_raw.md` | Preserve and rewrite as adapter-level tests. These supply deterministic markdown/URL parsing evidence for Profession, CVOnline, and NoFluffJobs, Firecrawl V1-compatible client construction, URL/detail validation, and malformed/zero-result paths. Canonical has `tests/test_acquisition.py`, but not these source fixtures or the old parser coverage. The legacy CVOnline fixture should become a regression fixture, not evidence that the source currently works: `job-hunter/tools/acquisition/adapters.py` explicitly records its search URL as unverified/empty. |
| KEEP_AND_MIGRATE | `tests/test_analyzer.py`, `tests/test_notifier.py`, `tests/test_bot_service.py`, `tests/test_feedback.py`, selected portions of `tests/test_storage.py` and `tests/test_integration.py` | Port/adapt the behavioral tests that canonical does not yet cover: Gemini schema/JSON/retry/V1 dependency regression, Telegram formatting/timestamp/button/error behavior, webhook versus polling configuration and callbacks, feedback persistence/pattern recognition, Firestore ISO cutoff/run-log behavior, zero-listing alerts, and quota/error communication. Do **not** port assertions that intentionally demand the old agent's abort-on-quota or old forever-URL duplicate model; canonical intentionally continues after individual analysis failure and has freshness-aware state (`tools/acquisition/orchestrator.py`, `tools/storage.py`). |
| KEEP_AND_MIGRATE | `tools/scraper.py:17-58, 135-371` | Retain as a reference implementation while extracting only validated capabilities missing from canonical: configurable `TARGET_URLS`; Firecrawl list-page markdown extraction; detail call with actual timeout; exact job-detail URL allow-list for Profession/CVOnline/NoFluff; and per-source zero-yield Telegram alert. The canonical pipeline already uses Firecrawl search/detail fallback (`tools/acquisition/orchestrator.py:_firecrawl_search`, `_firecrawl_detail`, `_enrich`) and portal-native Profession extraction, so direct copy would regress bounded, metadata-first behavior. Source expansion to NoFluff/CVOnline requires live validation and is a separate migration task. |
| KEEP_AND_MIGRATE | `README.md:150-171`; `cloudbuild-bot.yaml`; `Dockerfile.bot`; `bot_service.py` | Preserve the operational recipe for the separate Cloud Run Telegram webhook service: webhook URL, `WEBHOOK_URL_PATH`, Cloud Run `$PORT`, the Secret Manager token binding, and the distinction from the batch job. The code/Dockerfile are byte-identical in canonical (`job-hunter/bot_service.py`, `Dockerfile.bot`); canonical's `cloudbuild-bot.yaml` has the renamed Artifact Registry location but does not contain the deploy/service-binding procedure. Validate any live service before changing it. |
| KEEP_AND_MIGRATE | `README.md:175-217`; `.env.example:1-38`; `tools/analyzer.py:40-110` | Carry forward the documented choice between AI Studio key authentication and Vertex AI ADC, required `aiplatform.googleapis.com`/IAM conditions, model/rate-limit controls, and configuration template. Canonical's analyzer has a simpler API-key client (`job-hunter/tools/analyzer.py`) and canonical has no tracked `.env.example`; configuration must be reconciled before switching runtime. |
| KEEP_AND_MIGRATE | `README.md:122-146`; `systemd/job-searcher.service`, `systemd/job-searcher.timer` | Preserve the operational facts that the legacy local service uses its project `.venv`, runs as `bj`, and fires at 08:00/17:00 with persistence. The canonical equivalents already encode the same schedule and user at `systemd/job-hunter.service` and `.timer`; migration work is only a deployment inventory/verification step, not copying active units. |
| KEEP_AS_REFERENCE_HISTORY | `README.md`, `DECISIONS.md`, `DONE.md` | Keep these documents as legacy decision/incident history. They record the Firecrawl V1 client compatibility issue, `google-genai` dependency correction, quota/rate-limit rationale, historical e2-micro proposal, and Cloud Run rollout. Do not treat the README's old architecture diagram or e2-micro material as current product design; it names the retired `tools/scraper.py`/old agent pipeline and itself says the live architecture became Cloud Run Jobs. |
| KEEP_AS_REFERENCE_HISTORY | Git history, especially `03b269e`, `2f7a1ca`, `782bf2d`, `0c40ae7`, `243c8c5` | Retain reachable history/tags (or an immutable exported reference) until the ported tests and runtime cutover are accepted. Recent commits establish bot callback durability, model selection/rate limiting, and notification timestamp behavior. |
| OBSOLETE_OR_DUPLICATED | `bot_service.py`, `Dockerfile`, `Dockerfile.bot`, `models/__init__.py`, `models/job.py`, `tools/feedback.py`, `tools/language_filter.py`, `tools/notifier.py` | Byte-identical to the canonical paths at the inspected tips. No source migration is necessary, although the stronger legacy tests above should accompany the canonical copies. |
| OBSOLETE_OR_DUPLICATED | `agents/job_search_agent.py`, `main.py`, `tools/storage.py`, parts of `tools/analyzer.py` | Superseded by canonical `tools/acquisition/{orchestrator,adapters,budget,filtering,planner}.py`, compatibility import `agents/job_search_agent.py`, and freshness-aware `tools/storage.py`. The old pipeline has unbounded target-page scraping, stops the whole run on quota, and treats a URL as duplicate forever; copying it would reverse explicit canonical improvements. Keep only its tests/operational evidence. |
| OBSOLETE_OR_DUPLICATED | `cloudbuild.yaml`, `cloudbuild-bot.yaml`, `systemd/job-searcher.*` as deployable manifests | Canonical versions already target `job-hunter` images/job names and paths. The legacy manifests are historical references only; do not deploy or activate their old targets. |
| OBSOLETE_OR_DUPLICATED | `profile/persona.md` and `tests/fixtures/mock_firestore.json` | Canonical persona is strictly more explicit on advanced versus intermediate English (`job-hunter/profile/persona.md:50-52`); use canonical. The fixture represents the legacy forever-duplicate storage behavior, superseded by `tests/test_storage_freshness.py`. |
| PO_DECISION_REQUIRED | Legacy fixed URLs in `tools/scraper.py:151-159` — five Profession query URLs, NoFluffJobs IT management, CVOnline IT manager — and `TARGET_URLS` | Decide which sources/query formulations are still desired after live source-contract validation, legal/rate/cost review, and comparison with canonical SerpApi MVP (`apps/job-hunter-mvp`). The code alone cannot show current source accessibility or quality. |
| PO_DECISION_REQUIRED | Legacy cost policy in `agents/job_search_agent.py:189-200`, notifier summary estimates, and `README.md:175-217` | Confirm a canonical cost envelope and the approved Gemini route/model (AI Studio versus Vertex). The old `$0.05` threshold and per-item estimates should not silently become policy. |

## Profiles, feedback, reporting, and product behavior

- **Profile/preferences:** no unique profile content must be copied from
  `job-searcher`. Its `profile/persona.md` is materially covered and clarified
  by canonical `profile/persona.md`; canonical additionally has
  `profile/exclusions.yaml`, `profile/preferred_companies.yaml`, and
  `profile/learned_preferences.md`. Keep the legacy profile only as historical
  provenance.
- **Feedback/history:** source code is identical (`tools/feedback.py` and
  `bot_service.py`). The actual feedback history is not tracked: the legacy
  README diagram names `profile/feedback_history.json`, but it is absent from
  tracked files. Treat existing runtime feedback/Firestore feedback documents
  as data-migration inventory, not as disposable code.
- **UI/reporting:** the interactive Telegram cards/buttons and webhook bot are
  already canonical. The significant canonical-only reporting path is the
  transparent SerpApi MVP output at
  `apps/job-hunter-mvp/run.mjs` and
  `docs/evidence/real-job-hunter-mvp-live-run.json`; legacy does not add a
  separate web UI.
- **Scoring:** legacy analyzer's preferred-company +10, deterministic mock
  categories, persona prompt, JSON schema, retries, and quota exception are
  present or covered by canonical analyzer/orchestrator; canonical applies the
  preferred-company bonus in `tools/acquisition/orchestrator.py`. Its
  richer deterministic rules live in the SerpApi MVP
  (`apps/job-hunter-mvp/lib/extract.mjs` and `run.mjs`). Preserve missing tests,
  not the older scoring control flow.

## External runtime/data inventory — not safely represented in Git

The following must be inventoried and backed up/handed over before any future
cutover. This report did not query, alter, stop, or deploy them.

| Dependency/data | Evidence | Required future check |
| --- | --- | --- |
| Legacy local secrets | A non-tracked `/srv/projects/job-searcher/.env` exists with `GCP_PROJECT_ID`, `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `MOCK_MODE`, and `GEMINI_MODEL`; `.env.example` documents the first six plus optional settings. | Transfer ownership through a secret manager/approved secret process; do not copy secret values to Git. Establish whether keys are shared with canonical or only power legacy. |
| Google Cloud resources | `cloudbuild.yaml` names Artifact Registry `europe-west1-docker.pkg.dev/$PROJECT_ID/job-searcher/job-searcher` and Cloud Run Job `job-searcher`; README names project `job-searcher-503608`, Cloud Scheduler-triggered job, Firestore, and Vertex/API enablement/IAM. | Inventory real project/resource names, schedules, service accounts, Cloud Build triggers, Scheduler jobs, Artifact Registry images, Firestore collections (`jobs`, `feedback`, `run_log`), retention/export, and IAM. None is defined as reproducible infrastructure-as-code here. |
| Deployed Telegram bot | README lines 150-171 specifies Cloud Run Service `job-searcher-bot`, public webhook delivery, Secret Manager token binding, and runtime `WEBHOOK_URL`/path. `cloudbuild-bot.yaml` builds an image but does not deploy it. | Verify whether a bot service/webhook is live; preserve the bot token, webhook URL/path, Cloud Run revision/configuration, and feedback data before any endpoint change. The same source code being present in canonical does not migrate a Telegram webhook automatically. |
| Local scheduler | `systemd/job-searcher.timer` targets 08:00 and 17:00, but its installed/enabled state cannot be inferred from Git. | Determine installed units and any cron/Scheduler duplicates without stopping or modifying them; avoid duplicate sends during a later cutover. |
| Third-party service accounts/quotas | `FIRECRAWL_API_KEY`, Gemini API key or Vertex ADC, Telegram token/chat ID, and SerpApi key documented by canonical `apps/job-hunter-mvp/README.md` outside the repo. | Confirm account ownership, billing/quota, allowed sources, and rotation plan. |

## `allas-figyelo` and final decision gates

| Classification | Exact evidence | Required action before execution |
| --- | --- | --- |
| PO_DECISION_REQUIRED | The requested `git clone --depth 1 git@github.com:ggiaur/allas-figyelo.git /tmp/allas-figyelo.iqwlYv` failed due to sandbox SSH configuration/access; no working tree was available. | Provide a readable checkout, HTTPS/token access, or an exported archive, then inventory source adapters, schedulers, output artifacts, tests, secrets/configuration references, and deployment/runtime identifiers using the same classifications. Do not infer it has no unique assets. |
| PO_DECISION_REQUIRED | There is no repository-visible evidence tying a running service/scheduler to `allas-figyelo`. | Include infrastructure-owner confirmation in the runtime inventory before any future disable/retirement plan. |

## Recommended execution sequence (for a separately authorized implementation)

1. Obtain and audit `allas-figyelo`; inventory all external runtimes and export
   Firestore/feedback state with identifiers and ownership.
2. Port/adapt the selected `job-searcher` regression tests, fixtures, CI/lint,
   configuration template, and operational runbook into `job-hunter`; validate
   source adapters live under explicit budgets.
3. Decide source set, Gemini/cost route, data migration semantics, and Telegram
   webhook/Cloud Run cutover plan. Prove canonical deployment against a
   non-duplicate notification path.
4. Only after acceptance and verified data/runtime handoff, create a separate,
   explicitly authorized retirement plan for duplicate repositories and
   schedulers. This analysis authorizes none of those actions.
