# Job Hunter — one-repo consolidation audit (Claude, independent)

Task: JOB-HUNTER-CONSOLIDATION-001 (Track B of
JOB-HUNTER-PO-CLARIFICATION-AND-CONSOLIDATION-001). Analysis/planning only.
**No merge, archive, delete, rename, service/scheduler disable, or code move
was performed.** No retirement of any repository is recommended here — only
a manifest of what would need to move first.

Canonical target (already-decided, not re-litigated here, per
`portfolio-audit/CLAUDE.md` and the PO's confirmation): **`ggiaur/job-hunter`**.

Scope inspected: `job-hunter` (local checkout), `job-searcher` (local
checkout), `allas-figyelo` (shallow clone this session,
`git@github.com:ggiaur/allas-figyelo.git`, HEAD at clone time), `cv-linkedin`
(confirmed empty again this session — `git ls-remote` returns zero refs,
matching the prior portfolio audit; no further action needed, not included
in the matrix below).

## Confirmed: job-hunter and job-searcher share literal history, not just a naming coincidence

`job-hunter/bot_service.py` and `job-searcher/bot_service.py` are **byte-
identical** (`diff` exit 0, 137 lines both). Same for the file set
`Dockerfile.bot` / `cloudbuild-bot.yaml` present in both repos' roots. This
confirms the portfolio audit's tentative finding (`portfolio-audit/CLAUDE.md`
§7) — `job-hunter` was forked from or copied out of `job-searcher` at some
point, then diverged: the bot-service files were carried over unchanged,
while the actual currently-operating pipeline (`apps/job-hunter-mvp/`,
JH-SUP-0022/0023) was built as an entirely separate, newer subsystem that
does not use `bot_service.py` at all (not referenced by `run.mjs` or
`schedule/run-job-hunter-mvp.sh`, confirmed by inspection). **The bot-service
files in `job-hunter` are currently dead code relative to the active
pipeline** — present but unused.

`profile/persona.md` also shares ~90% content between the two repos;
`job-hunter`'s copy is the more evolved one (more precise English-level
rule, refined this session). `job-searcher`'s `profile/learned_preferences.md`
is still an unfilled template (`[Title 1] ok: Rossz`, literal placeholder
text) — it was never actually used in practice, unlike `job-hunter`'s, which
has real content from this session's JH-SUP directives.

## Migration/retirement readiness matrix

| Asset | Location | Classification | Evidence | Notes |
|---|---|---|---|---|
| Bot-service files (`bot_service.py`, `Dockerfile.bot`, `cloudbuild-bot.yaml`) | `job-searcher` (canonical/live) vs. `job-hunter` (stale copy) | **OBSOLETE_OR_DUPLICATED** in `job-hunter` | Byte-identical diff; not referenced by the active `apps/job-hunter-mvp/` pipeline | `job-hunter`'s copy should probably be removed once the PO confirms the Telegram-bot channel itself is superseded (see feedback-loop item below) — not deleted in this task. |
| Telegram-bot feedback capture (`tools/feedback.py`, `notifier.py` Telegram card + button flow) | `job-searcher` only | **KEEP_AND_MIGRATE (candidate)** | `README.md` architecture diagram: Telegram card → button click → `feedback.py` saves decision | Directly answers a gap all three Track A reviews independently flagged: job-hunter has no per-result PO feedback capture UI yet. `job-searcher`'s Telegram flow is a working (if unused) implementation of exactly that pattern. |
| Active-learning auto-promotion (2× DISLIKE → `exclusions.yaml`; 2× LIKE/STAR → `preferred_companies.yaml`) | `job-searcher` only (`DONE.md` §3, `tools/feedback.py`) | **KEEP_AND_MIGRATE (candidate)** | `DONE.md`: "Ugyanaz a cég 2x DISLIKE... automatikusan bekerül... exclusions.yaml" | This is exactly the "learn from feedback" mechanism named in the PO's Track A objective and flagged as MISSING by all three Track A reviews. The *mechanism* is real and tested (35/35 tests passing per `DONE.md`); the *data* is not — `job-searcher/profile/feedback_history.json` is `[]`, empty. Nothing to migrate except code/design, no accumulated history. |
| Firestore run-log (`tools/storage.py`) | `job-searcher` only | **PO_DECISION_REQUIRED** | `DONE.md` §4 | Depends on a live GCP Firestore project/credentials — external runtime dependency not represented in git (see below). Useful pattern (run status/counts persisted per run) but adds a GCP dependency job-hunter doesn't currently have. |
| Direct Profession.hu scraping (`tools/scraper.py`, Firecrawl-based) | `job-searcher` only | **KEEP_AND_MIGRATE (candidate)** | `DECISIONS.md` §3: live validation extracted 20 real ads directly from a `profession.hu` search URL, no Google/SerpApi intermediary | Directly relevant to a Track A gap all three reviews flagged: job-hunter currently only reaches Profession.hu indirectly via Google/SerpApi indexing, with unverified coverage. `job-searcher`'s scraper is a working direct-ingestion alternative, though it depends on Firecrawl (external paid API, see below) and needs the two dependency fixes already recorded in `DECISIONS.md` (`V1FirecrawlApp` import, `google-genai` package rename) re-verified as current. |
| Circuit breaker / rate-limit hardening (`agents/job_search_agent.py`) | `job-searcher` only | **KEEP_AS_REFERENCE_HISTORY** | `DONE.md` §1, `DECISIONS.md` §2 | Good defensive pattern (10s timeout, 3-failure circuit breaker, Gemini API rate limiting with backoff) worth reusing as a reference if/when job-hunter adds a scraping-heavy source, but not urgent to migrate now since job-hunter's current SerpApi-only pipeline doesn't scrape third-party pages directly at the same volume. |
| `job-searcher` test suite (35 tests, `tests/`) | `job-searcher` only | **KEEP_AS_REFERENCE_HISTORY** | `DONE.md`: "35 teszteset... 100% PASS" | Valuable as a template for whatever of the above gets migrated (especially the two real-dependency-mismatch regression tests in `DECISIONS.md` §4), not a direct migration target itself since it tests job-searcher-specific code paths. |
| Jooble API source adapter (`fetch_jobs.py`) | `allas-figyelo` only | **KEEP_AND_MIGRATE (candidate)** | `README.md`: Jooble aggregator API, `KEYWORDS`/`LOCATIONS`/`RADIUS_KM` config | A genuinely different acquisition channel (job-aggregator API, not Google-index-dependent) covering overlapping but not identical geography (Székesfehérvár/Győr/Várpalota/Tata/Tatabánya/Veszprém, i.e. PO's home region, vs. job-hunter's Budapest-centric queries) and role criteria. Worth evaluating as an additional source per Track A's "source coverage" question, not a like-for-like duplicate. |
| GitHub Pages result web UI (`docs/jobs.json` + static page) | `allas-figyelo` only | **KEEP_AND_MIGRATE (candidate)** | `README.md` step 5 | A real, already-working, zero-cost web presentation layer — directly relevant to Track A's identified gap that job-hunter has no web UI yet, and a much smaller lift than building one from scratch. Not a full replacement for the richer UI Track A's draft Sprint 2 envisions (no per-result feedback capture here), but a usable interim pattern or reference. |
| Email digest notification | `allas-figyelo` only | **KEEP_AS_REFERENCE_HISTORY** | `README.md` step 3-4 (Gmail app-password SMTP) | Simple, working notification channel; lower priority than the UI/feedback items above but cheap to reuse if the PO wants email alerts alongside or instead of a web UI. |
| `allas-figyelo`'s own cron/output history (`docs/jobs.json` accumulated runs) | `allas-figyelo` | **PO_DECISION_REQUIRED** | Last commit `884bbab`, 2026-09-03, "Állások frissítve" | This is live output data, not code — whether any of its accumulated result history has standalone value (e.g., as a second opinion on the same time period job-hunter was also searching) is a PO question, not something this audit can decide. |

## External runtime dependencies / data not safely represented in git

1. **`job-searcher`**: Firestore project credentials (for `tools/storage.py`'s run-log), Telegram bot token/chat ID, Gemini API key, Firecrawl API key — all referenced via `.env`/environment variables per its `README.md`, none committed (correctly). If any of `job-searcher`'s code is migrated, these external service identities/credentials need a PO decision on whether to provision fresh ones under job-hunter's existing secret-handling convention (`/home/dockeruser/.job-hunter-secrets/`, established this session) or reuse job-searcher's existing ones.
2. **`allas-figyelo`**: Jooble API key, Gmail app password, recipient email — stored as GitHub Actions repository secrets (per its `README.md` step 4), not visible to this audit at all (GitHub Actions secrets are not readable via git). Their current validity/ownership cannot be confirmed from evidence available to this session.
3. **`job-searcher`**: deployed via Google Cloud Build (`cloudbuild.yaml`, `cloudbuild-bot.yaml`) — an active GCP project/billing relationship that this audit cannot inspect (no `gh`/GCP credentials available this session). Whether this deployment is still live, billed, and who owns it is a PO question, not inferable from the repo alone.

## Summary

- **Top migration candidates (highest value, in Track A's own identified gap order):** job-searcher's Telegram feedback-capture + active-learning auto-promotion mechanism (answers "learn from feedback"); allas-figyelo's GitHub Pages web UI pattern (answers "present in a web UI"); job-searcher's direct Profession.hu scraper (answers "direct Profession/CV Online ingestion" question raised independently by all three Track A reviews).
- **Confirmed duplicated, not complementary:** the bot-service file trio in `job-hunter`'s root (dead code relative to the active pipeline).
- **Genuinely complementary, not purely duplicative:** allas-figyelo's Jooble source and its home-region geography — this is additional coverage, not a redundant rebuild of job-hunter's existing Google/SerpApi Budapest-centric queries.
- **No retirement of `job-searcher`, `allas-figyelo`, or their live services (Cloud Build deployment, GitHub Actions cron, Telegram bot) is recommended by this audit.** Per the task's own constraint, retirement cannot be recommended until the migration candidates above are either actually migrated or the PO explicitly decides to keep them as reference-only, and until job-hunter has PO-confirmed acceptance evidence (which Track A establishes is not yet the case — see the count-vs-quality gap).
- **Open PO decisions this audit surfaces, beyond Track A's list:** whether to migrate job-searcher's Telegram-bot channel specifically (vs. building a new web UI as Track A's draft Sprint 2 proposes — these may be alternatives, not both needed); ownership/disposition of the three external service dependencies listed above; whether allas-figyelo's Jooble source and non-Budapest geography should be added to job-hunter's scope or intentionally left out.
