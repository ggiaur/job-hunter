# Google Browser Search Application — Acceptance Run (JH-SUP-0008)

**Result: BLOCKED_HUMAN_PERMISSION**

## 1. Application

- Commit SHA: `51b376a01b26b7de3d5bd1ccfcb1270e8cfbd4a4` (`apps/google-browser-search/`)
- Node: v24.19.0
- Playwright package: 1.62.1 (npm), bundled Chromium
- Launch mode: headless, Playwright-managed Chromium (persistent context)
- Profile: `.runtime/google-browser-app-profile` (gitignored, fresh profile — separate from the JH-SUP-0007 PoC's profile, to test independently)

The application starts with `npm install && npm start` in `apps/google-browser-search/`, serves a UI at `/`, and exposes `GET /health` and `POST /api/search`. `GET /health` returned `{"status":"ready","browser":true}` before the acceptance run — confirmed live, not assumed.

## 2. Acceptance run

Ran the exact three required queries **through the running application's `/api/search` endpoint** (not a separate hidden script), one at a time:

| # | Query | Result |
|---|---|---|
| 1 | `IT vezető Budapest állás` | `challenge: true` |
| 2 | `IT manager Budapest állás` | `challenge: true` |
| 3 | `IT projektmenedzser Budapest hibrid állás` | `challenge: true` |

All three requests hit Google's automation challenge on the very first navigation, before any organic result could be read. `consentHandled: false` for all three — Google served the challenge page directly, not even the ordinary cookie-consent interstitial, on a completely fresh persistent profile independent from the JH-SUP-0007 PoC's profile.

Raw JSON responses (as returned by `/api/search`, unmodified):

```json
{"query":"IT vezető Budapest állás","method":"direct_url","googleUrl":"https://www.google.com/search?q=IT%20vezet%C5%91%20Budapest%20%C3%A1ll%C3%A1s&hl=hu&gl=hu","challenge":true,"consentHandled":false,"organicResults":[],"destinationsOpened":[],"firecrawlCalls":0,"searchApiCalls":0}
```

(queries 2 and 3 identical in shape, differing only in `query`/`googleUrl` and both `challenge: true`)

## 3. Counts

| Metric | Value |
|---|---|
| Queries attempted through the app | 3 of 3 |
| Queries returning organic results | 0 of 3 |
| Destination pages opened | 0 |
| Verified job postings | 0 |
| Firecrawl calls | 0 |
| Search API calls | 0 |
| Anti-bot bypass/evasion used | 0 (none attempted) |

## 4. Determination

Per JH-SUP-0008's PASS definition, PASS requires at least 2 of 3 queries to return real organic results and at least 3 verified relevant jobs. Neither condition is met — every query was blocked before any result could be read.

This is a second, independent confirmation of the JH-SUP-0007 finding (`docs/evidence/GOOGLE_BROWSER_POC_RESULTS.md`): the block is not specific to one profile, one code path, or one script — it reproduces on a fresh profile, through the actual running application, on the very first request of every query. This strengthens rather than weakens the earlier diagnosis: this cloud host's outbound requests to Google are being challenged by Google's own anti-automation system, independent of session state, consent history, or query content.

Per the directive: no retry, no stealth/proxy/fingerprint-spoofing/CAPTCHA-solving was attempted. The application correctly surfaces this to the UI as a visible blocked state (`BLOCKED_HUMAN_PERMISSION`, red status text, no fabricated results) rather than silently showing an empty or fake result set.

## 5. What the application does demonstrate

Even though PASS was not reached, the application is real and functional against non-challenged pages: `GET /health` correctly reports browser readiness, the UI correctly renders a challenge/blocked state distinctly from a normal empty-result state, and the deterministic extraction/filtering/relevance-reasoning logic (`lib/extract.mjs`) is unit-tested and passing (7/7, `npm test`) independent of the live Google blocker. The failure is specifically and only in reaching Google's search results page from this host, not in the application's ability to parse/verify/render results once obtained.

## 6. Independent review addendum

Codex independently reviewed this exact SHA (`docs/reviews/CODEX_GOOGLE_BROWSER_APP_REVIEW.md`): confirmed no hidden HTTP/Firecrawl/search-API path, hard budgets enforced in code, no evasion technique present, no production code touched, and the challenge-branch behavior is code-consistent with the reported evidence. Codex also flagged: (a) this file's original SHA placeholder ("this commit") -- now corrected above to the exact SHA; (b) a missing max-length guard on `POST /api/search` -- fixed in a follow-up commit (`server.mjs`, 200-char cap); (c) that its own sandbox's `npm test` run reported 1 passing top-level test-file result rather than 7 individual passes. I re-ran `npm test` independently, twice, outside Codex's sandbox, both times getting the same 7/7 pass output shown in section 5 -- this is very likely an environment/shell-globbing difference in Codex's sandbox (`tests/*.test.mjs` not expanding the same way), not a real defect in this repo's test command; noted here rather than silently dropped either way.

## 7. Status

`BLOCKED_HUMAN_PERMISSION` — not FAIL, per the directive's own classification (a real anti-automation challenge is a permission blocker, not a design failure). Two independent implementations (JH-SUP-0007's isolated PoC script and JH-SUP-0008's server-based application, different profiles, different code paths through the same underlying mechanism) both hit this same wall on the very first live request in each case.
