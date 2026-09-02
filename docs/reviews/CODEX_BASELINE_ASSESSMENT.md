# Codex baseline assessment — `job-searcher`

Independent read-only review of legacy commit `03b269e` and the committed
baseline evidence. The live zero-result symptom is presently explained by the
two reproduced Firecrawl 402s (`docs/baseline/LIVE_FAILURE_REPRODUCTION.md`),
but the following mechanisms remain independently actionable.

## 1. Why selection is unsound

### Irrelevant jobs can survive

- Listing extraction and the agent each use a small title blacklist, not a
  positive definition of the target role. Worse, either accepts an excluded
  title when it also contains a broad token such as `it`, `vezető`, or
  `manager` ([`scraper.py:313-340`](/srv/projects/job-searcher/tools/scraper.py:313);
  [`job_search_agent.py:72-77`](/srv/projects/job-searcher/agents/job_search_agent.py:72)). Thus a non-target
  management/retail/logistics role can pass on title wording alone.
- The final gate is a single LLM-generated score against a concatenated
  free-text persona and a threshold of 60; there is no deterministic role,
  seniority, location, employment-type, or hard-skill requirement enforced at
  this point ([`analyzer.py:184-231`](/srv/projects/job-searcher/tools/analyzer.py:184);
  [`job_search_agent.py:155-180`](/srv/projects/job-searcher/agents/job_search_agent.py:155)). LLM scoring variance therefore changes delivery decisions.
- Company exclusion is exact, case-sensitive string equality and depends on a
  company value that discovery often leaves blank, so aliases/casing and
  missing extraction evade it ([`analyzer.py:117-142`](/srv/projects/job-searcher/tools/analyzer.py:117);
  [`scraper.py:250-257`](/srv/projects/job-searcher/tools/scraper.py:250)).

### Relevant jobs can be missed

- Discovery is a fixed seven listing URLs plus three hard-coded Hungarian
  queries, rather than a profile-derived source/query plan
  ([`scraper.py:152-160`](/srv/projects/job-searcher/tools/scraper.py:152);
  [`scraper.py:203-207`](/srv/projects/job-searcher/tools/scraper.py:203)). This excludes many employers, roles, languages, locations, and sources by construction.
- URL admission is brittle: portal jobs must match only three portal patterns
  ([`scraper.py:22-29`](/srv/projects/job-searcher/tools/scraper.py:22)), and employer pages require two path segments and a non-generic final slug
  ([`scraper.py:50-75`](/srv/projects/job-searcher/tools/scraper.py:50)). A valid changed, single-segment, or otherwise unmodelled URL is silently discarded. Listing-page parsing applies the three-portal regex even more strictly
  ([`scraper.py:356-368`](/srv/projects/job-searcher/tools/scraper.py:356)).
- A URL saved once becomes a duplicate indefinitely; there is no last-seen,
  close/reopen, or expiry state. The agent skips it before re-analysis
  ([`storage.py:87-101`](/srv/projects/job-searcher/tools/storage.py:87);
  [`job_search_agent.py:67-70`](/srv/projects/job-searcher/agents/job_search_agent.py:67)). A revised/reopened relevant job at the same URL is missed.
- One Gemini quota error terminates the remaining candidate loop, so later
  relevant jobs are unscored and undelivered ([`job_search_agent.py:126-146`](/srv/projects/job-searcher/agents/job_search_agent.py:126)).
- The language exclusion runs after the detail-fetch decision and is a
  heuristic over possibly truncated/empty content, creating both false
  exclusions and unnecessary enrichment ([`job_search_agent.py:79-87`](/srv/projects/job-searcher/agents/job_search_agent.py:79);
  [`job_search_agent.py:116-122`](/srv/projects/job-searcher/agents/job_search_agent.py:116)).

## 2. Firecrawl quota amplification (separate from current 402)

- Every run spends on all configured listing URLs, then all search queries,
  before deduplication or relevance is known: seven + three by default
  ([`scraper.py:152-166`](/srv/projects/job-searcher/tools/scraper.py:152);
  [`scraper.py:228-230`](/srv/projects/job-searcher/tools/scraper.py:228);
  [`job_search_agent.py:34-42`](/srv/projects/job-searcher/agents/job_search_agent.py:34)). There is no pre-run call/token budget or source freshness cache.
- Any nonduplicate with a description below 200 characters receives another
  Firecrawl detail scrape *before* deterministic language filtering or LLM
  relevance evaluation ([`job_search_agent.py:67-87`](/srv/projects/job-searcher/agents/job_search_agent.py:67)). The only brake is three **consecutive failures**, not a cap on successful calls, so successful low-value candidates can fan out to the 100-item limit
  ([`scraper.py:11`](/srv/projects/job-searcher/tools/scraper.py:11);
  [`job_search_agent.py:97-106`](/srv/projects/job-searcher/agents/job_search_agent.py:97)).
- The cost check is retrospective: it estimates only listing-page count and
  candidate count after calls have occurred, omits search and detail fetches,
  and merely notifies ([`job_search_agent.py:186-199`](/srv/projects/job-searcher/agents/job_search_agent.py:186)). It cannot prevent spend.

## 3. Minimal corrective architecture

| Legacy component | Decision | Minimum disposition |
|---|---|---|
| `tools/scraper.py` | **REWRITE** acquisition flow; **KEEP** small pure URL/response-normalization helpers only after tests are retained | Define source adapters and a profile-derived, versioned query plan; cache source snapshots; normalize candidates and canonical URLs; use source-specific parsers rather than generic markdown links/URL heuristics. Detail fetch must be an explicit, budgeted enrichment stage. Keep `BaseScraper`, mock seam, validation, and Firecrawl client isolation only if reshaped behind an acquisition interface. |
| `tools/analyzer.py` | **KEEP WITH FIXES** | Retain structured-output parsing and the rate-limit/client boundary. Make deterministic normalized hard filters authoritative before any LLM call; use the LLM only for bounded evidence extraction/explanation and ranking. Normalize company aliases; validate score range/schema; cache by content fingerprint and record model/prompt version. Per-item failures must yield a retryable status, never a pipeline-wide decision. |
| `tools/storage.py` | **KEEP WITH FIXES** | Retain Firestore repository/run-log boundary and URL hash as one index. Store canonical URL plus content fingerprint, first/last seen, source, posted/closing state, analysis version, and notification state; expire/recheck stale records and allow changed/reopened jobs. Make duplicate/claim and save atomic; do not represent unavailable storage as successful persistence ([`storage.py:117-123`](/srv/projects/job-searcher/tools/storage.py:117)). |
| `agents/job_search_agent.py` | **REWRITE** orchestration | Orchestrate: plan with per-run budgets → discover/cache → canonicalize/dedupe → deterministic eligibility → capped priority enrichment → extraction/ranking → persistence/notification. Enforce hard caps before each external call, report attempted/succeeded/skipped calls, and continue independent candidates after recoverable provider failures. Retain only dependency injection, metrics/run ID, and notification hand-off concepts. |

**KEEP AS-IS:** no complete legacy module; the narrowly reusable seams are
identified above. **DISCARD:** the fixed URL/query lists, generic markdown-link
scraping and URL-shape eligibility as business policy (`scraper.py:152-160`,
`203-207`, `309-368`), blacklist-plus-override relevance policy
(`job_search_agent.py:72-77`), and LLM-score-as-sole-final-gate
(`job_search_agent.py:155-180`).

The decisive change is ordering: filter and deduplicate cheap metadata first;
only then spend a separately capped detail-fetch budget on candidates that can
still qualify. This fixes quota amplification without relying on Firecrawl
credits being available.
