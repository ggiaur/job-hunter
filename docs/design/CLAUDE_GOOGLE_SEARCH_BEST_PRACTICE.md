# Claude — Google Search Best-Practice Research (JH-SUP-0016)

Independent research. Zero new Google Search traffic generated; all findings are
from public documentation/web research (WebSearch/WebFetch), performed 2026-09-03.

## Self-correction — an earlier draft of this analysis was wrong about the WSS API

An earlier pass of this research fetched the bare URL
`developers.google.com/web-search-service` (no path), got HTTP 404, and
concluded the "Web Search Service API" does not exist. That conclusion was
**wrong** — it tested an incomplete URL, not the real documentation tree.
Codex's independent research (below/in `CODEX_GOOGLE_SEARCH_BEST_PRACTICE.md`)
found the real docs under `developers.google.com/web-search-service/docs/...`,
and I independently re-verified three of those exact sub-paths directly via
fetch after seeing the discrepancy between the two reports:

- `docs/overview` — real page, title "Web Search Service API | Google for
  Developers," opens: *"The Web Search Service API allows programmatic partners
  to develop websites and applications that retrieve and display Google Search
  results."*
- `docs/reference/rest/v1/TopLevel/search` — real REST reference for
  `GET https://websearchservice.googleapis.com/v1:search`, documented response
  fields include `title`, `displayUrl`, `snippet`, `htmlTitle`, `htmlSnippet`,
  `shortenedDisplayUrl`, `mimeType`, `fileFormat`, plus `searchDuration`,
  `totalResults`, `correctedQuery`.
- `docs/introduction` — confirms access requires an API key plus a
  partner-agreement-issued `client_id` sent with every request via
  `ClientContext`; no self-service signup, pricing, or provisioning path is
  documented.

**Corrected conclusion: the Web Search Service API is real.** It is gated behind
a Google partner agreement and an assigned `client_id` — there is no evidence of
ordinary self-service access, published pricing, or confirmed Hungarian
availability. This is the single most important finding in this whole
directive, and I am flagging my own initial error explicitly rather than
letting the earlier wrong claim stand: **always resolve the full documented
sub-path before declaring a Google product nonexistent from a bare-domain 404.**

## 1. Google's official guidance on automated/unusual Search traffic

Google's Terms of Service explicitly prohibit accessing Search "through the use
of any automated means (such as robots, spiders, or scrapers)" without Google's
express advance permission; this is described as deliberately broad, covering
rank-checking scrapers and general automated access alike. Google's Search
Central "Spam policies for Google Web Search" documentation separately treats
automated/abusive access as a policy violation, independent of any specific
technical detection mechanism. Google is also currently in active litigation
against at least one commercial SERP-scraping API provider (SerpApi) on these
grounds. **Conclusion: browser automation of consumer `google.com/search` is not
an ambiguous gray area — it is explicitly against Google's own terms, and the
JH-SUP-0013 challenge is consistent with policy enforcement working as intended,
not a bug or a fixable technical glitch.**

## 2. Web Search Service API

Real (see correction above). `GET https://websearchservice.googleapis.com/v1:search`
returns genuine Google Search results as JSON, with `title`, `displayUrl`,
`snippet`, plus HTML variants and metadata (`totalResults`, `searchDuration`,
`correctedQuery`). Access requires a Google Cloud project, an API key, and a
partner-agreement-issued `client_id` sent with every request — there is no
documented self-service signup, published pricing, or confirmed Hungarian
availability; those must be obtained in writing from Google, not assumed. The
request format accepts ISO-3166 region codes (`HU` is syntactically valid),
which is not the same as confirmed regional support/eligibility.

## 3. Google Programmable Search / Custom Search JSON API — current status

This is Google's actual official current programmatic search product, and its
status materially affects the decision:

- Closed to **new customers** since 2025.
- Google announced in January 2026 that it will be **discontinued entirely on
  January 1, 2027**.
- Even while active, it does not search the open web by default — it searches a
  configured "Programmable Search Engine" (a defined set of sites/domains) unless
  specifically configured for whole-web search, and even then it is not
  guaranteed to return identical results/ranking to consumer `google.com/search`.
- Historically: ~100 free queries/day, ~$5/1000 queries beyond that, hard cap
  10,000/day — technically far more than Job Hunter's ~2x/week need, but this is
  moot given the Jan 2027 shutdown.

**Conclusion: not a viable foundation for a new integration being built now** —
committing to a product with a public, dated end-of-life inside the next ~16
months is a bad platform bet regardless of the JH-SUP-0013 challenge question.

## 4. Is browser automation of consumer Google Search a recommended production integration?

No. There is no Google-sanctioned production pattern for this. It is explicitly
against Google's Terms of Service (see §1), independent of whether any given
request is technically detected. No stealth/fingerprint-hiding, CAPTCHA-solving,
or proxy rotation is proposed here or should ever be proposed as "best practice"
— those would only reduce detection probability while increasing the severity of
the ToS violation and the corporate/legal risk if discovered (see JH-SUP-0015
reconciliation: the actual on-prem corporate IP was already flagged once).

## 5. Managed browser/browser-compute vendors (Browserbase, Bright Data, etc.)

These vendors provide legitimate, well-documented infrastructure for browser
automation in general (cloud Chrome/Chromium, Playwright/Puppeteer-compatible).
However: using them to automate `google.com/search` does not change the
underlying policy question — it is still consumer Google Search automation
without Google's permission, now additionally run through a third party whose
own infrastructure is a common target of Google's anti-abuse systems (datacenter/
proxy IP ranges are, if anything, *more* likely to carry pre-existing negative
reputation than an ordinary organizational IP, which is itself consistent with
this project's own JH-SUP-0011/0012 working hypothesis before JH-SUP-0013's
result). I could not find public terms-of-service language from either vendor
that specifically authorizes or blesses Google Search scraping as a permitted use
case — their general acceptable-use policies typically defer legality/compliance
of the target site's terms to the customer. **Conclusion: this is a
detection-evasion optimization dressed as infrastructure, not a policy fix. It
does not resolve the core issue and is not recommended.**

## 6. Persistent real Chrome profile / GUI worker / human-in-loop

These reduce (do not eliminate) automation-fingerprint detection risk by looking
more like a real user session, but:

- Still violate the same ToS clause if unattended/scripted.
- Introduce new operational risk classes: a persistent logged-in Google account
  tied to automation risks that specific account being flagged/restricted; an
  unattended GUI worker is fragile (session expiry, UI changes, silent breakage)
  and requires ongoing human maintenance to stay working.
- A genuinely human-in-the-loop process (a person manually running ~2
  searches/week and recording results) is not "automation" in the ToS sense at
  all — it is a person using Search normally. This is the **only approach in this
  entire evaluation that is unambiguously compliant with Google's terms**, at the
  cost of not being autonomous.

**Conclusion: not production best practice as an unattended system; the
human-in-the-loop variant is the only compliant version of this family, and it
is manual by definition.**

## 7. Decision matrix

| Option | Returns genuine Google results | ToS-compliant | Available to ordinary org now | Durable (not sunsetting) | Autonomous |
|---|---|---|---|---|---|
| Web Search Service API | Yes, documented | Yes, if partner-approved | **Conditional — partner agreement + assigned `client_id` required, no self-service** | Yes (current, actively documented) | Yes |
| Programmable Search / Custom Search JSON API | Partial (configured-site search, not full open web by default) | Yes | No — closed to new customers | **No — EOL 2027-01-01** | Yes |
| Literal automated Google browser (current approach) | Yes, when not challenged | **No — explicit ToS violation** | Technically yes, functionally unreliable (JH-SUP-0013) | N/A | Yes, unreliably |
| Managed browser vendor running the same automation | Yes, when not challenged | **No — same underlying violation** | Yes (paid) | N/A | Yes, unreliably, added cost |
| Manual/human-in-the-loop Google Search | Yes | **Yes** | Yes | Yes | No |
| Non-Google search provider (Bing/Brave/etc. API) as fallback | No — not genuine Google results | Yes (per that provider's own terms) | Yes | Varies by provider | Yes |

## Critical distinction (A vs B)

**A — best-practice technical solution for the actual business need** (genuine
Google title+URL, ~2x/week, automatically): **the Web Search Service API is the
correct target architecture**, conditional on Google granting Job Hunter partner
access and a `client_id`. Nothing else evaluated here is both compliant and
reliably automated. Until/unless that access is granted, there is no fully
compliant, fully automated fallback — the nearest fully-compliant option without
WSS access is manual human search, which is not automated.

**B — does this satisfy literal `SPRINT_1.md`** ("live Google SERP in a
browser"): No. WSS returns structured JSON via a Google Cloud API call, not a
rendered browser SERP. Only literal-browser-automation and managed-browser-vendor
rows satisfy B's literal wording, and both fail A on ToS-compliance and
reliability grounds (JH-SUP-0013).

**A and B conflict, and the conflict is now sharper than before this
correction**: the best real technical answer (WSS) satisfies A cleanly but
cannot satisfy B's literal browser-SERP wording at all, even in principle. My
recommendation: take this to the Product Owner as an explicit decision — pursue
WSS partner access and amend `SPRINT_1.md`'s literal wording to an outcome
requirement, rather than continuing to build/retry against literal browser
automation while a real, compliant, Google-documented path exists to pursue in
parallel. See reconciliation doc for the team's joint recommendation on how to
frame that decision.

## Top pitfalls (partial list — see reconciliation for the merged top 10)

1. Treating "not currently detected" as "compliant" — it is a ToS violation
   regardless of detection rate.
2. Betting a new integration on Custom Search JSON API without accounting for
   its Jan 2027 shutdown.
3. Assuming a managed browser vendor changes the policy question rather than
   just the infrastructure.
4. Escalating toward stealth/fingerprint evasion after a challenge — increases
   legal/policy exposure without changing the underlying violation.
5. Continuing to run any variant of this from the verified real corporate IP
   after JH-SUP-0013/0014 without new, explicit Product Owner risk acceptance.
6. Declaring a Google product nonexistent from a single bare-domain 404 without
   checking its documented sub-paths (the exact mistake self-corrected above).
