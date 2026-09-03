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

## Redelivery addendum (2026-09-03T23:27) — cheapest-cost + incognito/account questions

The directive was redelivered requiring a cost-first ranking and answers to
new questions. Everything above stands; this section adds the new material.
Zero new Google traffic; all findings from public pricing/documentation
research.

### Cheapest-first cost table at ~8-10 queries/month

| Candidate | Free quota | Min. paid entry | Effective cost at 8-10/month | Google-derived | Account/card needed | Corporate-IP risk |
|---|---|---|---|---|---|---|
| **SerpApi** | 250 searches/month, free plan, no expiry | $25/mo (Starter) — not needed at this volume | **$0** — stays inside the always-free plan | Yes (scrapes real Google SERP) | Email signup, no card for free plan | None — vendor infra, not Job Hunter's IP |
| **Serper.dev** | 2,500 one-time signup credits, no card | $50 top-up when exhausted | **$0** for ~20+ years at this volume (2,500 ÷ 10/mo) | Yes | Email signup, no card | None — vendor infra |
| **Gemini Grounding w/ Google Search (Gemini 3.x)** | 5,000 free grounded prompts/month | Requires a billing-enabled ("paid tier") API project to unlock the free grounding quota per Google's own forum guidance — not a pure no-account option | **$0** if billing account already exists/acceptable | Yes, but see caveat below — not a raw SERP list | Google Cloud/AI Studio account + billing enabled | None — Google's own infra |
| SearchAPI.io | Limited/trial only | ~$40/month minimum plan | ~$40/month (below free-tier ceiling of options above) | Yes | Signup + card | None |
| Zenserp | 50 free (trial only, not monthly) | $49.99/month (5,000 searches) | ~$49.99/month | Yes | Signup + card | None |
| Google Web Search Service API | Unknown/unpublished | **No published self-service price found.** A figure of "$15/1,000 + $30,000/month minimum" is sometimes cited but I could not verify it against Google's official pricing page — flagging it explicitly as **unconfirmed/reported, not officially published**, per the directive's own instruction to distinguish these. | Unknown — likely far above the alternatives if the reported minimum is real, and inaccessible regardless (partner-gated) | Yes, genuine | Partner agreement + `client_id`, no self-service | None |
| Custom Search JSON API | 100/day (existing customers only) | $5/1,000 beyond free | Moot — closed to new customers, EOL 2027-01-01 | Partial (configured PSE, not full web) | Existing customer only | None |

**Cheapest good solution for the business need (Question A): a free-tier
commercial SERP API — SerpApi or Serper.dev — costs literally $0/month at
this volume**, requires no partner approval, no card, and sends zero traffic
from Job Hunter's own IP (the vendor's infrastructure makes the request, not
ours). This is cheaper and faster to obtain than pursuing WSS partner access,
though it carries the same category of caveat as any third-party SERP vendor
(see prior section — the vendor's own terms don't constitute Google's
authorization; the risk is transferred to a third party with mature
infrastructure, not eliminated). Gemini Grounding is also effectively free at
this volume but returns AI-synthesized answers with citation metadata, not a
guaranteed ordered raw-SERP result list — treat as a materially different
data shape, not a drop-in equivalent, per the directive's own caution.

### Google Web Search Service API pricing — precision per directive instruction

No officially published self-service price was found on Google's own WSS
documentation pages during this research. The commonly-cited "$15/1,000
queries, $30,000/month minimum" figure appears in third-party discussion but
was not independently confirmed against an official Google pricing page in
this research pass — stated here explicitly as **unconfirmed/reported**, not
as a verified fact, in line with the directive's explicit instruction not to
conflate reported terms with officially published ones.

### Why does human Incognito Search work but Playwright headed Chromium gets challenged?

Grounded in the JH-SUP-0015 forensic analysis (same evidence, same repo) plus
Playwright's documented launch defaults. A real Incognito session in a
user-installed, branded Chrome differs from the Gate 0 Playwright run in
every one of these observable ways simultaneously:

- **Browser build**: Incognito uses the real signed Google Chrome binary;
  Playwright's default is its own managed "Chrome for Testing" build.
- **Automation transport**: Playwright launches with a CDP
  (`--remote-debugging-pipe`) connection and a cluster of test-oriented
  Chromium switches (`--no-sandbox` by default, `--disable-background-
  networking`, `--no-first-run`, `--password-store=basic`, etc., per direct
  Playwright source inspection in JH-SUP-0015). A manually opened Incognito
  window has none of these.
- **Session/profile history**: a real user's browser — even in Incognito —
  runs inside a Chrome installation with genuine prior browsing history,
  installed extensions/sync state, and a long-lived machine/browser identity.
  The Gate 0 context is a brand-new, disposable, cookie-less profile with zero
  history, created fresh milliseconds before the one request.
- **Display/rendering environment**: a real desktop vs. a virtual Xvfb
  framebuffer inside Docker — a detectable environment difference in some
  fingerprinting techniques (screen metrics, GPU/render string).
- **Human interaction signal**: a real Incognito search is preceded by real
  mouse/keyboard/timing signals a browser session normally has; Gate 0 issues
  one bare `page.goto` with no interaction at all.

None of these alone is proven as *the* cause (see JH-SUP-0015 reconciliation
— Google's exact decision weighting is not observable). But collectively they
explain, without needing to invoke evasion, why an ordinary human Incognito
search and a fresh Playwright/Chromium Docker session are not equivalent
requests from Google's perspective even before considering IP history.

### Is a Google account required? Does logging in help?

No evidence supports this as a fix, and it is **not recommended**. Nothing in
Google's public documentation or in the JH-SUP-0015 evidence ties the
"unusual traffic" interstitial to a missing login — the Product Owner's own
observation that ordinary Incognito search works with no account is correct
and consistent with account state being unrelated to this signal. Logging in
a dedicated automation account adds a new risk class instead of removing one:
that specific Google account itself becomes linkable to automated traffic and
can be flagged/restricted/require re-verification, and its credentials become
a secret Job Hunter must store and rotate. **Recommendation: do not add a
Google account to this architecture; it doesn't address the demonstrated
cause and only adds attack surface and operational fragility.**

### Real stock Chrome GUI / persistent-profile worker — legitimate architecture or not?

Evaluated strictly as architecture, not stealth, per the directive. Even
using a genuine, user-installed Chrome binary instead of Playwright's
managed Chromium, **controlling it via CDP or WebDriver still exposes
automation signals** — the CDP/WebDriver control channel itself is what
Playwright/Selenium use to drive any browser, branded or not, and that
control channel is a distinct, detectable layer from "which browser binary is
running." Swapping the binary removes only one of the several stacked signals
identified above (browser build), not the automation-transport, fresh-profile,
or no-human-interaction signals. It is **not reliable enough for unattended
production** on its own; it would need to be combined with a genuinely
long-lived, organically-used profile and real interaction timing to meaningfully
change the fingerprint picture, which is no longer "just point Playwright at
real Chrome" — it becomes a much larger, still-unproven engineering effort for
an architecture that remains a Google ToS violation regardless.

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
