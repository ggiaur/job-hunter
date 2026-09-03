# JH-SUP-0016 — Google Search Best-Practice Research (Codex)

**Status:** independent research report; 2026-09-03  
**Scope:** approximately two unattended searches per week, returning current Google web-result title and URL for Job Hunter. This report did not request `google.com/search`, any Google Search endpoint, or run a browser against Google Search. It also did not inspect any Claude-authored material.

## Executive conclusion

The best-practice answer to the business need is the newly documented **Google Web Search Service API (WSS API)** *if and only if Google admits Job Hunter as a programmatic partner and supplies the required designated `client_id`*. It is an official Google API that expressly returns Google Search results, including title, destination URL, and snippet. It eliminates the unsupported consumer-SERP automation path and is the only researched option that directly promises genuine Google results in a programmatic integration.

It is not immediately usable by an ordinary organization merely by creating an API key: Google's public documentation requires a partner agreement and a designated client ID. The public material found gives no self-service enrollment path, eligibility criteria, commercial price, or published WSS country-coverage list. Treat Hungarian production availability and commercial terms as **unconfirmed pending Google's written partner response**, not as an assumed feature. The documented request accepts ISO-3166 two-letter region codes, so `HU` is syntactically valid; that is not proof of contractual availability.

If Google declines, does not respond, or cannot meet the needed timeline, do not replace it with browser scraping. Use a non-Google search API only as an explicitly labeled fallback after Product Owner approval; it is not equivalent to current Google results.

## Verified official findings

### 1. Consumer Google Search automation is not a supported production interface

Google Search Help says that automated Search traffic includes searches sent by robots, computer programs, automated services, and search scrapers. Its advice to network administrators is to locate and block the sources of automated traffic, rather than tune the automation. [Google Search Help: unusual traffic](https://support.google.com/websearch/answer/86640?hl=en)

Google's general Terms also prohibit using automated means to access content from its services in violation of machine-readable instructions, and prohibit hiding or misrepresenting identity to violate the terms. [Google Terms of Service](https://policies.google.com/terms)

Accordingly, Playwright/Selenium navigation to `google.com/search` is neither a documented production integration nor made legitimate by low volume, a headed GUI, a stored profile, a new IP, or a commercial browser provider. The observed unusual-traffic interstitial is consistent with Google's published description. No evasion or retry strategy is recommended.

### 2. Google Web Search Service API is real and materially different

The directive's URL is real. Google's documentation, last updated 2026-09-03, exposes `websearchservice.googleapis.com` and `GET /v1:search`. [WSS REST reference](https://developers.google.com/web-search-service/docs/reference/rest)

Google describes WSS as enabling **programmatic partners** to retrieve and display **Google Search results** in JSON. Its prerequisites are an active Google Cloud project, API key, and a designated `client_id` associated with the partner agreement. [WSS overview](https://developers.google.com/web-search-service/docs/overview) [WSS introduction](https://developers.google.com/web-search-service/docs/introduction)

The method reference calls it a “full web search” and documents `searchResults[]` with `title`, `displayUrl` (the full destination URL), and `snippet`; it supports 1–20 results, pagination, language/region restrictions, SafeSearch, and date restrictions. It requires an end-user IP for regional routing and abuse prevention. [WSS search method and schema](https://developers.google.com/web-search-service/docs/reference/rest/v1/TopLevel/search)

What is confirmed versus not confirmed:

| Question | Evidence-based answer |
| --- | --- |
| Genuine Google web results? | Yes. Google expressly says “Google Search results”; the method performs a full web search. |
| Title, URL, snippet? | Yes: `title`, `displayUrl`, `snippet` are documented result fields. |
| Ordinary self-service availability? | No evidence of it. The required designated partner client ID and partner agreement are an immediate access gate. |
| Price / commercial prerequisites? | Partner agreement is explicit; pricing and commercial thresholds are not published in the documentation located. Obtain them in writing. |
| Hungary / Hungarian support? | Request accepts `regionCode` and region restriction as ISO-3166 codes; `HU` therefore fits the documented format. No WSS coverage/eligibility promise specific to Hungary was found. |
| Privacy / end-user data | The end-user IP is required. Perform privacy, retention, and legal review before transmitting real candidate/user IP data; do not substitute fabricated addresses. |

The smallest safe inquiry is a non-traffic commercial/partner contact to Google asking whether Job Hunter can obtain WSS partner access, an assigned client ID, Hungary support, pricing/minimums, result-display/storage terms, and a written confirmation that the intended two-query/week server use is permitted. It sends no consumer Search traffic and needs no trial purchase.

### 3. Programmable Search / Custom Search JSON API is a legacy transition path, not the answer for a new integration

Google's current Custom Search JSON API overview says the API is **closed to new customers** and existing customers must transition by **2027-01-01**. Only existing customers retain the stated 100 free queries/day, $5/1,000 additional-query pricing (up to 10,000/day) until discontinuation. [Custom Search JSON API overview](https://developers.google.com/custom-search/v1/overview)

It programmatically returns results from a configured **Programmable Search Engine**, not an entitlement to reproduce a normal consumer `google.com` SERP. Programmable Search is configured around a specified collection of sites/pages; it is suited to a publisher's/site owner's search experience. [Programmable Search overview](https://developers.google.com/custom-search/docs/overview) Its JSON results can include title, link, and snippet, but that data contract does not remove the product/configuration distinction. [JSON API result schema](https://developers.google.com/custom-search/v1/reference/rest/v1/Search)

An existing eligible customer could use it only as a temporary, separately approved bridge. Job Hunter should not design a new dependency around a closed product with a fixed retirement date.

### 4. Other real official Google search-related products are not an interchangeable SERP API

* **Gemini API Grounding with Google Search** is an official, current programmatic product. It has the model decide whether/how to search and returns a synthesized answer with citations and search-suggestion metadata. It is valuable for answer generation/research, but it does not promise a deterministic ordered list of raw Google web results for a supplied query. Its terms impose display/storage requirements, so it is not a drop-in collector for this job. [Grounding documentation](https://ai.google.dev/gemini-api/docs/google-search) [Additional terms](https://ai.google.dev/gemini-api/terms)
* **Vertex AI Search** is Google's suggested alternative for searching up to 50 domains when Custom Search JSON API is unavailable. It is a domain-scoped enterprise search option, not full-web Google-result retrieval. [Custom Search transition notice](https://developers.google.com/custom-search/v1/overview)

## Candidate assessment and decision matrix

Ratings: **Yes** means it can meet the named criterion with the stated prerequisite; **No** means it cannot; **Conditional** means it requires an external approval or does not establish equivalence.

| Candidate | Genuine current Google title+URL automatically | Supported/legitimate production path | Meets literal “live Google SERP in browser” | Key gate/risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Official WSS API | Yes, documented | Conditional: Google partner agreement + assigned client ID | No | Access, commercial terms, `HU` coverage, IP/privacy and display/storage terms must be confirmed | **Preferred** for the actual business requirement |
| Programmable Search / Custom Search JSON API | Conditional, configured PSE output rather than normal SERP | No for a new customer; retiring 2027-01-01 | No | Closed to new customers; scope/configuration and deprecation | Do not start new work; temporary bridge only if already entitled |
| Playwright/Selenium against consumer Google Search | It may render results until challenged | No: Google's automated-traffic guidance conflicts | Superficially yes, but not sustainably or supportably | Challenge/block, ToS/policy, corporate-IP reputation | Reject |
| Managed browser/browser-compute (e.g., Browserbase) | Conditional technically | No independent Google authorization | It can render a browser, but does not cure policy | Third-party provider cannot grant Google permission | Reject as a Google-integration solution |
| Managed SERP/proxy vendor (e.g., Bright Data) | Vendor advertises it | Conditional at vendor level, not confirmed permissible by Google | No Job Hunter browser SERP | Proxy/identity-routing nature conflicts with the safety invariant; target-site rights remain customer responsibility | Reject for this task |
| Persistent real Chrome profile / GUI worker / human session | Manual: yes; unattended: unreliable | Human manual use is distinct; unattended automation remains unsupported | Manual yes; unattended only apparently | Account/IP reputation, challenge/CAPTCHA, credential/session loss, no auditability | Diagnostic/manual only, not production automation |
| Non-Google search provider API | No | Yes, subject to that provider's terms | No | Different index/ranking/coverage; Product Owner must accept non-equivalence | Fallback only |

### Managed-vendor finding

Browserbase supplies browser infrastructure and a separate search API, but its published terms require lawful use and do not supply a Google Search license or an exception to Google's policies. [Browserbase Search docs](https://docs.browserbase.com/platform/search/overview) [Browserbase Terms](https://www.browserbase.com/terms-of-service) A managed browser changes execution location and operations, not Google's treatment of automated consumer-Search requests.

Bright Data explicitly markets a SERP API that extracts Google results and offers options to represent a browser type. [Bright Data SERP API](https://brightdata.mintlify.app/api-reference/rest-api/serp/serp-api) That is a separate commercial service, not evidence that Google supports the activity. Bright Data's agreement keeps the customer responsible for third-party rights and permits suspension where use may adversely affect a third party; its compliance review can be required. [Bright Data agreement](https://brightdata.com/license) Its policy also forbids illegal/non-compliant activity and SEO manipulation. [Bright Data AUP](https://brightdata.com/acceptable-use-policy)

Neither vendor's terms located says that Google has authorized Job Hunter's automated consumer SERP collection without a bypass. Bright Data's product is expressly designed around anonymized redirected communication and browser representation, which makes it particularly unsuitable under this directive's no-proxy/no-stealth invariant. Do not use either as a workaround for Google's block.

### Persistent profile and human-in-loop finding

A persistent real-Chrome profile can be useful to diagnose a human user's normal access or allow an authorized human to perform an occasional search. It is not a production solution for unattended collection: a saved session neither turns a program into a human nor grants a programmatic entitlement. It creates account credential exposure, session expiry, MFA/consent and CAPTCHA interruptions, account/IP reputation consequences, and nondeterministic operation. CAPTCHA completion must remain human and must never be automated; it is a stop condition, not an operations queue. A GUI worker with scheduled clicks is still consumer Search automation.

## Answers to the directive's two distinct questions

**A — Best technical solution for the business need:** pursue WSS partner access, then integrate the approved API with request logging, rate limits well below the authorized quota, failure-stop behavior, and a data-handling review for the required end-user IP. This satisfies the underlying need without consumer SERP scraping. Until access is granted, use a clearly non-Google fallback only if the Product Owner accepts the changed data source.

**B — Does that satisfy a literal Sprint 1 requirement for a browser displaying a live Google SERP?** No. An official JSON service delivers the result data, not a live browser SERP. Conversely, an automated browser may appear to meet that wording while being a fragile, challenged, unsupported architecture. These are in conflict.

The Product Owner should amend `SPRINT_1.md` from a literal automated live-browser Google SERP requirement to an outcome requirement such as: “obtain current Google web-search result title and canonical destination URL through a Google-authorized service, preserving the required provenance.” The amendment should name WSS only after Google approves the partner arrangement. This is a Product Owner decision, not an implementation workaround.

## Safe next action and controls

1. Obtain Product Owner approval to contact Google commercially/through the WSS partner channel; do not create a trial, send an API query, or use a consumer Search URL.
2. Ask for written confirmation of eligibility, partner/client-ID provisioning, costs/minimums, permitted use/display/storage, `HU`/Hungarian support, expected SLA/quotas, and requirements for end-user IP.
3. If approved, build only against the authorized WSS test/production arrangement and use a non-sensitive, lawfully obtained end-user IP consistent with Google's written instructions. A 401/403 or unavailable partner status is a stop-and-escalate result; do not fall back to browser scraping.
4. If the business cannot wait, ask the Product Owner to explicitly accept a named non-Google provider and the resulting non-equivalence, or make the process human-operated.

## Principal pitfalls to carry into the decision

1. Mistaking public API documentation for self-service eligibility.
2. Treating `HU` as supported merely because it is an ISO country code.
3. Sending corporate or candidate IP data without a privacy/legal review.
4. Assuming JSON title/URL results reproduce a consumer SERP's rank, modules, ads, or personalization.
5. Building against Custom Search JSON API despite its new-customer closure and 2027-01-01 discontinuation.
6. Calling Gemini Search grounding a deterministic SERP-results API or ignoring its display/storage terms.
7. Letting a vendor's marketing/terms stand in for Google's authorization.
8. Treating proxy routing, browser-type representation, or profile persistence as a policy fix.
9. Automating CAPTCHA or turning human solves into an unattended service dependency.
10. Preserving literal browser-SERP wording and thereby incentivizing an unsupported architecture instead of obtaining a Product Owner requirement decision.

## Evidence trail

All evidence above was gathered by documentation/web research only. Primary Google evidence is linked inline: [unusual-traffic guidance](https://support.google.com/websearch/answer/86640?hl=en), [Google Terms](https://policies.google.com/terms), [WSS overview](https://developers.google.com/web-search-service/docs/overview), [WSS API method](https://developers.google.com/web-search-service/docs/reference/rest/v1/TopLevel/search), [Custom Search status](https://developers.google.com/custom-search/v1/overview), and [Gemini grounding](https://ai.google.dev/gemini-api/docs/google-search). No request was sent to a Google Search endpoint during this research.
