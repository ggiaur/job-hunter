# JH-SUP-0016 — Google Search Best-Practice Research

## Authority / priority

Product Owner / PRODUCT_ARCHITECT_ORCHESTRATION_SUPERVISOR. P0. Execute immediately.

## Goal

Find the **cheapest safe, legitimate, production-grade solution** for the Job Hunter need for approximately two automated Google searches per week and genuine Google-result title+URL output, given that Playwright Chromium triggered Google's unusual-traffic challenge from both cloud and the verified on-prem corporate network.

This is a research/decision task. Do not generate any new automated Google Search traffic from the corporate network or any Job Hunter browser.

## Mandatory independent work — Claude, Codex, Gemini

**Claude, Codex and Gemini MUST each research independently before reconciliation. Gemini is mandatory.** Claude must explicitly ask Gemini the Product Owner's question: **"What is the cheapest good solution for automated Google search at roughly two runs per week, returning real Google result title+URL, without risking the corporate IP or using anti-bot bypass?"**

Do not anchor one agent on another agent's conclusion.

## Mandatory questions each agent must answer

1. What is the **lowest real monthly cost** for the requirement, not enterprise-scale theoretical CPM?
2. Compare at minimum, using current published pricing:
   - Google Web Search Service API;
   - Gemini API / Vertex AI Grounding with Google Search;
   - SerpApi;
   - Serper.dev;
   - SearchAPI.io;
   - Zenserp;
   - any cheaper credible SERP API discovered in research.
3. For each candidate state:
   - exact free quota / trial quota;
   - minimum monthly payment or minimum top-up;
   - effective cost at only ~8-10 searches/month;
   - whether results expose organic title + destination URL;
   - whether results are actually Google-derived;
   - Hungarian location/language support;
   - account/API-key/card requirements;
   - operational and ToS/legal risk;
   - whether it risks the organization's public IP.
4. Resolve Google Web Search Service API pricing as precisely as possible. Distinguish:
   - official currently published pricing (if any);
   - partner-only commercial terms;
   - reported planned terms such as $15/1,000 and $30,000 monthly minimum, clearly labeling anything not published on the official pricing page.
5. Evaluate **Gemini Grounding with Google Search** carefully. Current Google pricing appears to include thousands of Google Search grounding queries free per month on eligible paid Gemini tiers. Determine whether grounding metadata can reliably expose the actual source URLs/titles needed by Job Hunter and whether it can preserve a result-list semantics close enough for the Product Owner's requirement. Do not assume this equals a normal SERP.
6. Explain technically why a normal human Incognito Google search works but Playwright headed Chromium can still be challenged. Inspect current Playwright Chromium launch behavior and identify observable automation/session differences without proposing evasion.
7. Answer explicitly: **Is a Google account required?** Does logging in materially solve this? Is using a dedicated Google account a recommended production design, or does it merely add account-risk? The Product Owner observes that normal Incognito Search works without asking for an account.
8. Evaluate a real stock Chrome GUI / persistent profile worker only as a legitimate architecture, not as stealth. State whether controlling Chrome via CDP/WebDriver still leaves automation signals and whether it is reliable enough for unattended production.
9. Do not recommend CAPTCHA solving, fingerprint spoofing, stealth plugins, proxy rotation, residential proxies, account farming or similar anti-bot circumvention.

## Critical distinction

Separate:

A. Cheapest good solution for the **business need**: automated current Google-derived search result title+URL about twice/week.

B. Cheapest solution that **literally reproduces google.com browser SERP**.

If A is inexpensive but B is fundamentally unsupported/fragile, say so plainly. Recommend a Product Owner requirement amendment rather than forcing a brittle architecture.

## Safety invariant

JH-SUP-0014 remains in force:

- ZERO new automated `google.com/search` requests from corporate/on-prem egress;
- no retry/browser variants against Google Search;
- no CAPTCHA solve automation;
- no proxy/VPN/residential proxy rotation;
- no stealth/fingerprint evasion;
- no paid purchase without Product Owner approval.

Documentation/web research and non-Google vendor pricing research are allowed.

## Required outputs

Create:

- `docs/design/CLAUDE_GOOGLE_SEARCH_BEST_PRACTICE.md`
- `docs/design/CODEX_GOOGLE_SEARCH_BEST_PRACTICE.md`
- `docs/design/GEMINI_GOOGLE_SEARCH_BEST_PRACTICE.md`
- `docs/design/GOOGLE_SEARCH_BEST_PRACTICE_DECISION.md`

The decision document must contain a ranked table **cheapest first**, including the exact cost at ~8-10 queries/month, and conclude with one recommended path.

Update supervisor ACK with `GOOGLE_SEARCH_BEST_PRACTICE_RESEARCH_COMPLETE` only when all three independent reports exist.
