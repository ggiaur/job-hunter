# Codex proposal: bounded Google browser discovery

## Decision

Use **Node.js 20+ with Playwright (`playwright` npm package) and its bundled Chromium**, run as one short-lived, single-process discovery worker per scheduled/manual Job Hunter run. The worker uses one persistent, logged-out browser profile and normal Google UI interaction: load `https://www.google.com/`, type a plain-language query into the visible search field, and press Enter.

This is a design proposal only. Availability of Node.js, Playwright, Chromium, a writable profile location, and a usable display server are assumptions to verify in an authorized PoC; none are assumed preinstalled here.

Google is the discovery surface. Firecrawl and portal APIs are neither required nor used as the primary discovery path. This is deliberately a low-volume assistant workflow, not a crawler.

## 1. Exact technology and runtime topology

| Concern | Proposed choice |
| --- | --- |
| Language/runtime | Node.js 20 LTS or later |
| Browser control | Playwright for Node (`playwright`) |
| Browser | Playwright-managed Chromium, pinned to the Playwright package version |
| Process model | One Job Hunter-owned Node worker per run; one browser context; one query active at a time |
| Browser data | A dedicated persistent Chromium user-data directory, outside version-controlled source (for example a deployment data volume at `var/browser-profiles/google-discovery`) |
| Result interpretation | Playwright ARIA locators/snapshots plus small DOM reads; no OCR, coordinate clicking, browser extensions, or “stealth” packages |
| Evidence | Structured event log and redacted screenshot/HTML reference only for errors or human-blocker review |

The orchestrator invokes the worker through the existing acquisition-adapter boundary. It does not create a second scheduler, queue, ranking service, or storage pipeline. A per-run process contains crashes and prevents orphaned browser state; a lock on the profile permits only one worker to use it at once.

## 2. Browser mode and session choice

The operational default is **headed Chromium with a persistent profile**, displayed through the host’s approved interactive display mechanism (for example a locally administered Xvfb/VNC desktop where that is an accepted deployment choice). This most closely represents the requested manual-browser interaction and allows a permitted operator to inspect and resolve a consent screen when needed.

There must be a deployment-mode switch:

- `headed`: the normal production candidate when a display is available and an authorized human may review it.
- `headless`: allowed only as a separately measured PoC/runtime mode when no display exists. It uses the same Playwright APIs, profile, budgets, and stop rules—never altered headers, fingerprints, or stealth measures to compensate for headless operation.
- `persistent-session`: required in both modes using `chromium.launchPersistentContext(userDataDir, options)`.

Headless is not an anti-bot workaround and must not be selected merely because Google challenges it less or more. If a host cannot support the chosen mode reliably, record an infrastructure failure and use a human-operated browser session as the next evaluation option; do not add evasion tooling.

## 3. Session creation and preservation

On first authorized run, the worker creates a dedicated, least-privilege profile directory with restrictive filesystem permissions. It launches exactly one persistent context against that directory and remains logged out of Google by default. Cookies, consent preference, local storage, and ordinary browser state persist across runs.

Operational rules:

- Never share this profile with another application or user, and never commit, copy, or expose it in logs.
- Acquire an exclusive profile lock before launch; failure to obtain it returns a retriable `BROWSER_SESSION_BUSY` result.
- Retain the profile after normal worker exit. Rotate/reset it only through an explicit operator maintenance action, not as an automatic response to a challenge.
- Do not sign in to Google automatically. A Google login page is a human-decision state; the adapter cannot enter credentials or proceed on its own.

## 4. Opening Google and submitting a query

For each query, the worker navigates to `https://www.google.com/` using ordinary browser navigation, waits for a stable document, then finds the search control through its semantic role/name (for example Playwright `getByRole('combobox', { name: /search/i })`; a controlled fallback may use an accessible textbox locator). It focuses the visible field, fills a single normal query string, and presses `Enter` on that field.

Queries are short, human-readable search phrases generated from the existing candidate profile, such as `site:boards.greenhouse.io "data analyst" "Berlin"`. The planner must not emit huge Boolean expressions, query fan-out, encoded endpoint calls, or query parameters intended to evade detection. The query string is recorded before submission for auditability.

After submission, the worker verifies that the browser reached a Google results view by observing a visible results landmark/content and a changed results URL or document title. It never calls an undocumented Google endpoint, uses a search API, or fabricates result data.

## 5. Identifying organic results without brittle scraping

Primary extraction uses the browser’s accessible structure, not Google’s volatile obfuscated class names:

1. Obtain an ARIA snapshot or enumerate accessible links/headings in the main/results region.
2. Identify a candidate only where a user-visible heading is associated with an outbound HTTP(S) link.
3. Read visible nearby text as a snippet only when it belongs to that accessible result grouping.
4. Canonicalize the destination URL by resolving Google redirect links in-browser; retain the original displayed link for evidence.

Classification is conservative. Exclude links that are clearly navigation, search refinements, Google-owned controls, cached/translated copies, or ad/sponsored groups. Ads are rejected based on visible/accessible sponsorship labelling and result grouping, not by assumptions about class names. When the structure cannot distinguish an item safely, mark it `UNCLASSIFIED_RESULT` and skip it rather than guessing.

The extraction result is limited to title, destination URL, displayed snippet, ordinal rank, and query. It should use a small, versioned set of semantic heuristics with fixture tests from saved, sanitized result-page samples. A Google markup change therefore yields a detectable parse degradation, not silent broad scraping.

## 6. Opening and verifying destinations

Before visiting, a local cheap filter ranks candidates using the existing profile’s keywords, location, domain allow/deny policy, title, and snippet. The worker opens selected URLs in a new foreground tab in the *same* persistent context, waits only for normal network/document settling within a bounded timeout, and keeps the Google tab intact.

A destination becomes a verified job candidate only when all applicable checks succeed:

- its final URL is HTTP(S), non-Google, and not an error/blocked/interstitial page;
- it presents a job-detail signal: JSON-LD or microdata declaring `JobPosting`, **or** visible, semantically coherent job-detail evidence (job title plus employer/organization and application/responsibility/location or posted-date information);
- it is not visibly an index/category/search-results page, generic company careers landing page, application-login wall, expired/closed posting, or a clearly unrelated article;
- recency/availability evidence, where exposed, does not say the role is closed or no longer accepting applications.

Structured data is strong evidence but not mandatory, because many legitimate employer pages omit it. The verifier assigns a reason code (`JOBPOSTING_SCHEMA`, `VISIBLE_JOB_DETAIL`, `EXPIRED`, `NOT_JOB_DETAIL`, `LOGIN_REQUIRED`, etc.) and does not claim certainty beyond the observed page. It closes each destination tab after extracting the bounded candidate fields.

## 7. Consent, CAPTCHA, and login: exact stop condition

The worker may perform one ordinary, explicit consent action per profile only when the page presents a standard consent choice and the configured policy has authorized the choice (normally clicking the visible “Accept all”/equivalent button). It records `CONSENT_ACCEPTED` and continues. If policy does not authorize a choice, it stops for human permission.

The following are unconditional stop conditions for the entire Google-discovery invocation:

- CAPTCHA, reCAPTCHA, “unusual traffic,” “verify you are human,” or any comparable anti-automation challenge;
- Google account sign-in, phone/email verification, or other authentication request;
- a consent page requiring a non-preconfigured substantive choice;
- a browser-level certificate/security warning requiring user judgment.

On a stop condition, immediately stop sending Google searches and opening new results, close the browser cleanly, and return `BLOCKED_HUMAN_PERMISSION` with blocker type, current URL, query count, and a redacted screenshot reference. Do **not** retry; wait; solve/outsourcing a CAPTCHA; use an extension; rotate proxies; change IPs; spoof user agents/fingerprints; inject stealth scripts; or create a fresh profile to get around it. A human may later resolve the state in the approved headed session and explicitly initiate a new run.

Destination-site CAPTCHA/login has the same no-bypass rule for that destination: mark that candidate `BLOCKED_HUMAN_PERMISSION`, close its tab, and continue other already-budgeted candidates. It escalates to a whole-run stop only if the Google search surface itself is challenged or authenticated.

## 8. Hard budgets

Budgets are enforced before actions, recorded as counters, and cannot be increased by an automatic retry:

| Limit | Per run |
| --- | ---: |
| Google queries submitted | 3 maximum |
| Google result pages | first page of each query only; no pagination or infinite-scroll expansion |
| Organic results inspected/extracted | 10 maximum per query |
| Destination pages opened | 5 maximum per query; 15 maximum per run |
| Browser tabs | Google tab plus one destination tab at a time |
| Google query timeout | 20 seconds per query, one attempt |
| Destination load/verification timeout | 20 seconds per page, one attempt |
| Total browser discovery wall time | 8 minutes maximum |

Opening a consent, challenge, or login view counts as an observed page event but never permits extra searches/clicks. Failed page loads count against their corresponding page-click budget.

## 9. Failure handling

The worker returns a run report containing successes, skipped candidates, and per-query/page failure records. It uses isolated `try/finally` handling around each query and each destination tab:

- Query timeout, parse failure, zero results, or unexpected non-challenge Google page: record `QUERY_FAILED`/`QUERY_EMPTY`, release its resources, and continue the next planned query if budget remains.
- One redirect loop, timeout, malformed URL, TLS error, portal outage, or non-job destination: record it against that candidate and continue the next selected candidate.
- Browser crash/context loss: mark the remaining work `BROWSER_UNAVAILABLE`, preserve completed candidates, and end the run safely.
- Whole-run human blocker: stop as defined above; preserve all results already acquired before the blocker but do not continue browsing.

There is no automatic replay of failed Google queries in the same run. A later scheduled run may attempt newly planned queries only if no blocker state is outstanding.

## 10. Integration with the existing acquisition-adapter interface

This is an adapter implementation, not a parallel workflow. Its discovery method returns the existing minimal candidate shape (names adjusted only to the actual interface when implementation is authorized):

```ts
type DiscoveryCandidate = {
  source: string;       // e.g. "google_browser"
  url: string;
  title: string;
  description: string;  // Google visible snippet, then optionally verified page summary
};
```

It may attach non-contract metadata—`query`, `rank`, `domain`, verification reason, and discovery timestamp—to the adapter’s existing evidence/metadata envelope. URL normalization and de-duplication occur through the same shared acquisition mechanisms used by other sources. The existing candidate filter, enrichment, ranking, persistence, notifications, and audit trail consume these records unchanged.

The intended flow is:

`existing query planner -> GoogleBrowserDiscovery adapter -> existing candidate normalization/dedupe -> existing cheap filter -> existing enrichment/ranking/persistence`

Verification can be part of the adapter’s bounded discovery work only to prevent obvious non-job links; it must return the same candidate records and must not independently rank, notify, or persist jobs. If browser discovery is disabled or blocked, the orchestrator records that adapter outcome and proceeds with other configured adapters under its normal policy.

## 11. Minimum authorized PoC acceptance test

Do not run this under the present design-only task. A future, explicitly authorized PoC passes only if all of the following are demonstrated in a controlled environment:

1. Verify the assumptions: Node.js and the pinned Playwright package/browser can launch; the selected headed or headless mode works; and the persistent profile directory is writable and survives a process restart.
2. Start from a dedicated logged-out persistent profile, open Google, and submit three ordinary UI-entered queries. No Firecrawl, portal search API, browser extension, proxy rotation, stealth option, or CAPTCHA-solving service is used.
3. For at least one query, extract at least one first-page organic result through semantic/accessible structure rather than Google class-name selectors, and produce its title, URL, and visible snippet.
4. Open at least one bounded result in a new tab and verify at least one genuine, currently open job-detail page using `JobPosting` structured data or the documented visible-detail fallback. The test fixture should include a known public job URL so the finding can be manually checked.
5. Demonstrate persistence by restarting the worker and confirming the same profile is reused (including previously accepted consent state, if any), without automatic login.
6. Demonstrate resilience with a deliberately invalid/unreachable destination: record its failure and still return candidates from another query/page.
7. Demonstrate the human-blocker path using a non-live local fixture or test seam representing a CAPTCHA/login page: it must halt Google discovery, emit `BLOCKED_HUMAN_PERMISSION`, and make zero retry/evasion actions.
8. Confirm budget logs show no more than three Google queries, ten results inspected per query, five destinations opened per query, and no pagination.

Success is evidence that the bounded design can discover and normalize a real job posting through a normal browser flow. It does not establish that Google automation will remain available indefinitely; any real challenge is a valid, visible operational blocker rather than a prompt to circumvent it.
