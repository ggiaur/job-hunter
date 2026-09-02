# JH-SUP-0003 section 4 — build slice 1

Implemented the migrated profile, feedback store, Telegram notifier, bot
service, job model, deployment artifacts, and requirements. `feedback_history`
is intentionally absent; `FeedbackStore` creates an empty history on first use.

The legacy permanent URL duplicate implementation (`job-searcher/tools/storage.py:87-109`)
is replaced by source/source-job identity, canonical URLs, content fingerprints,
first/last-seen timestamps, posted/closing fields, state transitions, 14-day
staleness, and re-open-on-rediscovery handling.

The legacy Firecrawl-first scraper and aborting agent loop
(`job-searcher/agents/job_search_agent.py:27-202`, especially `129-146`) are
replaced by `tools/acquisition/`: persona-driven plans (max eight queries),
portal-native adapters, hard pre-flight budgets, metadata-only deterministic
filtering, capped direct-detail/Firecrawl enrichment, and candidate-isolated
LLM ranking failures. All provider/client interfaces are injected in tests and
the default mock path refuses unconfigured network calls.

Test command: `MOCK_MODE=true pytest -q`

Result: **10 passed**.

Deviation: the binding decision describes a non-Firecrawl web-search fallback,
while the implementation uses the explicitly requested Firecrawl-backed
fallback search capped to two calls per run. Firecrawl detail enrichment shares
that same two-call cap, so fallback use leaves no additional Firecrawl spend.

Commits could not be created: this environment exposes `.git` read-only, and
`git commit` fails creating `.git/index.lock`. No push was attempted.
