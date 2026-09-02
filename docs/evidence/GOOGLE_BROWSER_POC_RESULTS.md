# Google Browser PoC Results (JH-SUP-0007)

**Result: BLOCKED_HUMAN_PERMISSION**

## 1. Run metadata

- Timestamp: 2026-09-02T22:23:00Z – 2026-09-02T22:23:02Z
- Code SHA: this commit (PoC code at `poc/google-browser/run.mjs`)
- Node: v24.19.0
- Playwright package: 1.62.1 (npm), Chromium bundled with that Playwright version
- Launch mode: headless, Playwright-managed Chromium ("new headless" mode, no `channel` override)
- Profile: `/srv/projects/job-hunter/.runtime/google-browser-profile` (gitignored, no secret contents — Google cookie/consent state only)

## 2. Queries

Only the first of the three planned queries was attempted; the run stopped immediately on a real challenge, per the directive's hard stop rule (no query is attempted after a challenge is detected).

1. `IT vezető Budapest állás` — **BLOCKED** (see below)
2. `IT manager Budapest állás` — not attempted (run stopped)
3. `IT projektmenedzser Budapest hibrid állás` — not attempted (run stopped)

## 3. What happened

1. Navigated to `https://www.google.com/search?q=IT%20vezet%C5%91%20Budapest%20%C3%A1ll%C3%A1s&hl=hu&gl=hu` via direct URL (primary method, accepted design).
2. A Google cookie-consent dialog appeared and was accepted once via a visible "Összes elfogadása" button (ordinary consent action, not automation evasion) — `consentHandled: true`.
3. After re-navigating to the same URL, the response was **not** a normal Google results page. Automated challenge detection matched on-page text against known challenge markers and confirmed the page was a genuine Google automation-challenge page, not a false positive.
4. Manually re-verified before reporting (not just trusting the automated detector): re-fetched the same URL against the same persistent profile with a small diagnostic script and inspected the raw page content directly. The page is genuinely Google's "unusual traffic" / CAPTCHA interstitial:

   > "Rendszereink az Ön számítógépes hálózatából érkező, szokatlan forgalmat észleltek. Ez az oldal ellenőrzi, hogy valóban Ön küldi a kéréseket, és nem egy robot... ha beírja a fenti CAPTCHA-képen látható szöveget, továbbra is használhatja a szolgáltatásainkat."

   ("Our systems have detected unusual traffic from your computer network... if you enter the text shown in the CAPTCHA image above, you can continue using our services.")

   A screenshot of this exact page is preserved at `poc/google-browser/debug.png`.

5. Per the directive's hard rule, the run stopped immediately: no CAPTCHA solving, no retry, no stealth/fingerprint/proxy/profile-rotation workaround was attempted. The remaining two queries were not run.

## 4. Interpretation

Google is issuing an automation challenge to this specific request pattern (headless Chromium, from this cloud host's IP, on the very first search request in a fresh profile). This is consistent with datacenter/cloud-IP reputation-based rate limiting or bot detection that Google applies independent of query content — the challenge appeared on the very first request, before any query-quality or extraction-logic issue could be evaluated.

## 5. Counts

| Metric | Value |
|---|---|
| Queries attempted | 1 of 3 (run stopped on challenge) |
| Organic results captured | 0 |
| Destination pages opened | 0 |
| Verified job postings | 0 |
| Firecrawl calls | 0 |
| Search API calls | 0 |
| Anti-bot bypass/evasion used | 0 (none attempted) |

## 6. PASS/FAIL/BLOCKED determination

Per JH-SUP-0007 section 6: a Google challenge stops the run and the result is **BLOCKED_HUMAN_PERMISSION**, not FAIL. This is not evidence that the design itself is wrong (no organic-result extraction, cheap filtering, or job-verification logic was ever exercised against real content) — it is evidence that headless automated access to Google from this specific cloud host, at this specific time, triggers Google's own anti-automation defenses on the first request.

## 7. What would unblock this (not performed, listed for the Product Owner)

None of these were attempted; listing them is not a recommendation to proceed without explicit authorization, several are explicitly forbidden by the directive as stated:

- Solve the CAPTCHA manually once, using the human's own browser session, then see if the resulting cookie/session state (loaded into this same profile) allows subsequent automated requests — this is a human action, not automation bypass, but would need explicit Product Owner sign-off since it establishes a human-approved session Playwright would then reuse.
- Run from a different network/IP (e.g. residential vs. datacenter) — changes the operating environment, not the automation technique; still requires Product Owner decision since it changes where this runs from.
- Reduce request rate/pattern further (e.g. add human-like delay before the first request) — untested, may or may not help since the block appeared instantly.

The directive explicitly forbids CAPTCHA-solving services, stealth plugins, fingerprint spoofing, and proxy rotation as ways to route around this — none of those were tried and none are being proposed here.

## 8. Raw evidence

- `poc/google-browser/result.json` — full structured run output
- `poc/google-browser/debug.png` — screenshot of the actual challenge page encountered
- `poc/google-browser/run.mjs` — the executed PoC code
