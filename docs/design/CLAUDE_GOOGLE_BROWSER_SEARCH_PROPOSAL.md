# Claude proposal — Google-in-browser acquisition for Job Hunter

Written independently. I read ChatGPT's proposal first (permitted, as integration owner) but reached my own conclusions from direct inspection of this cloud host, not by echoing it -- where we agree it's because the same constraints (no anti-bot evasion, no CAPTCHA bypass) leave few defensible designs, not because I copied the answer.

## Verified runtime facts (checked directly on this host, not assumed)

- No system Chrome/Chromium binary, but `npx playwright` resolves (v1.62.1) and Playwright's own browser cache already contains a downloaded Chromium (`~/.cache/ms-playwright/chromium-1234` and a `chromium_headless_shell-1234` variant) -- Playwright is a real, low-friction option here, not a hypothetical.
- No display server / `Xvfb` presence was checked and not confirmed present -- headed Chrome cannot be assumed to work on this host without further verification. This must be treated as **unverified**, not assumed working, until checked in a later PoC step.
- 8 CPUs, 30GB RAM, ~13GB available -- resource headroom is not the constraint here.

## Browser technology and runtime topology

**Playwright (Node.js), Chromium channel, headless.** Reasons: it's already cached on this host (lowest setup risk of the candidates), it exposes an accessibility-tree/ARIA snapshot API (`page.accessibility.snapshot()` / Playwright's own structured locator model) that lets result extraction key off semantic roles (`role=link`, `heading`) rather than brittle CSS selectors -- directly answering "how are organic results identified without brittle scraping." Headless is the only mode I can currently claim works on this host; headed mode requires a verified display server, which is not yet confirmed. Do not choose headed until that's checked.

Process topology: a single, short-lived Node.js process per run, launched by the Job Hunter orchestrator (not a long-lived daemon) -- this matches the low query volume this task actually needs (a handful of queries per run, not continuous browsing) and keeps failure blast radius to one process.

## Session creation and persistence

Use Playwright's persistent context (`launchPersistentContext` with a fixed `userDataDir`) so Google's consent cookie and any session state survive between runs -- this avoids re-triggering the EU cookie-consent interstitial on every single run, which is itself a form of "looking like a bot" if hit repeatedly. The profile directory is a plain filesystem path under the job-hunter checkout, gitignored, never committed (it's session state, not code).

## How Google is opened and a query is submitted

Navigate directly to `https://www.google.com/search?q={query}` rather than driving the search box UI (typing character-by-character, clicking submit). This is a deliberate difference from ChatGPT's proposal, which drives the on-page search box. My reasoning: `?q=` is the exact same URL Google's own search box submits to when a human presses Enter -- it is not a hidden/undocumented API, it's the literal HTTP GET the browser makes. Using it directly removes several UI-brittleness failure modes (search-box selector changing, autocomplete dropdown intercepting Enter) without doing anything a human's browser doesn't already do. If this turns out to visibly differ from box-driven submission in practice (e.g. different result set, different consent trigger), that is exactly the kind of thing the PoC should measure -- I flag it as a testable disagreement with ChatGPT's proposal, not a settled point.

## Organic result identification

Google's results page marks organic results with a consistent `id="search"` container and each result as a heading-role element wrapping a link; ads are in visually and structurally distinct containers (`data-text-ad` / a distinct top/bottom block). Extract via Playwright locators scoped to `#search` and role `heading`/`link`, not full-page CSS scraping -- this is more resilient to Google's frequent class-name churn (their class names are obfuscated and change often; role/landmark structure changes far less).

## Opening links and verifying job pages

Open each candidate URL in a **new tab** within the same persistent context (not by navigating away from the results page), so the results page remains available for the next candidate without re-querying. A job-detail verification pass is a separate, cheap, deterministic step: does the destination page contain machine-readable job-posting signals (schema.org `JobPosting` structured data, present on the large majority of real job boards and increasingly on ATS pages) or, failing that, a title/date/company-shaped text block. If neither signal is found, treat as "not verified as a job page" and drop it before any LLM call -- this is the single cheapest, most reliable filter available and should run before ChatGPT's "cheap local relevance pass," not after.

## Consent/CAPTCHA/login behavior

Logged out by default (no Google account) -- matches ChatGPT's proposal and avoids account-risk entirely. On the cookie-consent interstitial: click "Accept" once per fresh profile (this is not evasion, it's the same action a human takes, and it's why the profile is persistent -- so it only happens once, not every run). On any CAPTCHA/"unusual traffic" interstitial: stop immediately, do not retry, do not rotate anything, classify as `BLOCKED_HUMAN_PERMISSION` and surface the exact page/screenshot for a human to resolve manually if they choose. No automatic retry loop against a challenge -- repeated automatic retries against a challenge page is itself a form of the automation behavior this directive explicitly forbids.

## Request/query/click limits

Matches ChatGPT's proposed order of magnitude, stated as hard pre-flight budget (not a post-hoc estimate, consistent with the acquisition-budget pattern already built for JH-SUP-0003's portal adapters): ≤3 queries/run, first results page only (no pagination), ≤10 organic results read per query, ≤5 destination pages opened per query. These are deliberately small -- this is a discovery aid at Job Hunter's actual volume, not a crawler.

## Failure handling

Any single query's failure (timeout, unexpected page structure, 0 organic results parsed) must not abort the run -- log it, skip to the next query, continue. This mirrors the fix already made to `job-searcher`'s orchestrator for Gemini quota errors (JH-SUP-0003): one provider hiccup should never zero out an entire run's other candidates.

## Integration with Job Hunter while keeping browser acquisition replaceable

Same acquisition interface contract already established in `tools/acquisition/`: a discovery step returns raw candidate records (`source`, `source_job_id`/URL, `title`, `description`/snippet), which then go through the existing `CheapFilter` → capped enrichment → LLM ranking pipeline unchanged. `GoogleBrowserSearch` becomes one more adapter behind that same interface, not a parallel pipeline -- this is the concrete point where this design plugs into the already-built (frozen) JH-SUP-0003 work rather than replacing it.

## Minimum PoC acceptance test

Not run now (freeze in force; this is design only). When later authorized:
1. Confirm headless Chromium actually launches on this exact host (`npx playwright install --with-deps chromium` if needed, then a trivial `page.goto('https://example.com')` smoke test) -- this single step resolves my one unverified assumption above.
2. One real query end-to-end: persistent profile created, consent handled once, `?q=` navigation, ≥1 organic result extracted via role-based locators, ≥1 destination opened, job-detail signal (schema.org `JobPosting` or equivalent) checked.
3. Success: at least 1 of 3 test queries surfaces at least 1 destination page carrying a genuine job-posting signal, with zero CAPTCHA encountered and zero Firecrawl calls. Failure (CAPTCHA hit, or 0/3 queries produce a verified job page) is recorded honestly, not retried with any evasive change.
