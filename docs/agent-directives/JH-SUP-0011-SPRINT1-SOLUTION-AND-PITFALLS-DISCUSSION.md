# JH-SUP-0011 — SPRINT 1 SOLUTION AND PITFALLS DISCUSSION

**Priority:** P0 / PRODUCT OWNER REQUEST
**Status:** ACTIVE — DISCUSSION ONLY
**Execution owner:** Cloud Claude / ACTIVE_ORCHESTRATOR
**Supersedes:** JH-SUP-0010 for current execution

## 1. Canonical Sprint 1 — do not reinterpret

The canonical source of truth is repository-root `SPRINT_1.md`.

Sprint 1 means exactly:

> A runnable system takes two short ordinary keywords, submits them to **real Google Search**, reads the **live Google results page**, and exposes real organic results (at least exact title + URL) so the Product Owner can inspect them.

Current truth:

- `SPRINT_1_STATUS: NOT_DONE`
- Profession.hu is NOT Sprint 1.
- Brave Search API is NOT Sprint 1.
- Other search engines or portal adapters are NOT Sprint 1 substitutes.
- The current cloud Playwright application reached Google but received `unusual traffic` / CAPTCHA before any organic result could be read.

## 2. Product Owner request

Discuss **how Sprint 1 can actually be solved**, and examine the **pitfalls exhaustively**, using both the failed JH-SUP-0007/JH-SUP-0008 Google-browser attempts and relevant earlier project experience.

This directive authorizes **discussion and decision only**. The broad development freeze remains in force. Do NOT implement, deploy, retry Google, purchase anything, change production code, or start a PoC under this directive.

The outcome must not be a generic architecture essay. It must identify the smallest credible path to literal Sprint 1 PASS and the failure modes that can make that path fail.

## 3. Required independent participants

### A. Claude independent analysis

Create:

`docs/design/CLAUDE_SPRINT1_SOLUTION_AND_PITFALLS.md`

Claude must answer independently before reading the new Codex answer.

### B. Codex independent analysis

Dispatch the same factual problem statement to Codex without showing Claude's new answer first.

Create:

`docs/design/CODEX_SPRINT1_SOLUTION_AND_PITFALLS.md`

### C. Gemini — optional and strictly non-blocking

If a clean Gemini channel is immediately available, obtain an independent view in:

`docs/design/GEMINI_SPRINT1_SOLUTION_AND_PITFALLS.md`

If not immediately available, record `GEMINI_NOT_AVAILABLE_NONBLOCKING`. Do not wait, repair, or delay for Gemini.

## 4. Mandatory solution candidates to examine

Do not assume the answer in advance. At minimum compare these literal-Sprint-1-capable classes:

1. **User-controlled local browser worker** on a normal non-datacenter network, using a real Chrome/Chromium profile and returning the rendered Google SERP results to Job Hunter.
2. **User-controlled browser extension / local companion** that performs or assists the Google search in the Product Owner's normal browser session and returns the rendered result data.
3. **A different execution environment/network for the existing browser application** where the first gate is simply whether Google returns a normal SERP. Separate network/IP reputation from browser/headless/session factors.
4. **Human-in-the-loop browser session** where ordinary consent or an occasional challenge can be handled manually, but no CAPTCHA solving service, stealth, fingerprint spoofing, proxy rotation, account farming, or evasion is built.
5. Any other legitimate mechanism that still satisfies `SPRINT_1.md` literally — i.e. the system actually submits the two keywords to Google Search and reads the live Google result page.

Also evaluate and explicitly classify technologies that may be useful later but **do not satisfy Sprint 1**, including official search APIs, portal-native adapters, Brave Search, Google programmable/custom search, and Firecrawl. Do not recommend them as Sprint 1 substitutes.

## 5. Mandatory pitfall analysis

Create a concrete pitfall/risk register. At minimum cover all of the following and add anything missing:

### Google / anti-automation / access
- datacenter IP reputation;
- headless/browser fingerprint effects versus network/IP effects;
- CAPTCHA / unusual-traffic challenge behavior;
- consent/interstitial behavior;
- differences between logged-out, logged-in, fresh-profile, and persistent-profile sessions;
- Google account dependence and account-risk if any;
- rate/volume sensitivity;
- locale, language, geolocation and personalization affecting results;
- ranking/result instability across runs;
- terms/policy constraints and what must not be automated or bypassed.

### Local/browser-worker architecture
- machine must be online/awake;
- NAT/firewall/connectivity and secure task dispatch;
- remote-control attack surface;
- protecting browser cookies, Google session and user data;
- preventing arbitrary browser-control commands;
- least-privilege design;
- browser/OS updates breaking selectors or automation;
- session corruption and profile locking;
- parallel/concurrent searches;
- recovery after crashes/reboots;
- human intervention flow when Google presents a challenge;
- whether the Product Owner must be physically present;
- installation/update burden;
- Windows vs Linux/macOS assumptions;
- residential IP changes and ISP behavior;
- VPN/proxy accidentally turning the worker back into a suspicious network origin.

### SERP extraction/product behavior
- selectors/DOM layout change;
- sponsored results vs organic results;
- knowledge panels / featured snippets / job widgets obscuring ordinary organic result extraction;
- Google redirect URLs versus canonical destination URLs;
- duplicate results;
- missing snippets;
- dynamic/lazy-loaded content;
- what exact result evidence must be preserved for acceptance;
- how the Product Owner can inspect the same run and distinguish live results from fabricated/cached data.

### Engineering-process failures — based on what already went wrong
- building an app before validating the fatal external dependency;
- mistaking infrastructure readiness (Chromium installed, CPU/RAM OK) for product feasibility;
- redefining Sprint 1 after a technical path fails;
- allowing useful Profession.hu results to substitute for the explicitly requested Google behavior;
- overproducing governance/design documents instead of running the cheapest falsification gate;
- accepting PASS without owner-visible product evidence;
- retrying a falsified architecture without changing the causal variable.

For every pitfall, state:
- likelihood;
- impact;
- earliest/cheapest detection method;
- mitigation;
- whether it is a **hard stop**, **human-operation dependency**, or **acceptable operational risk**.

## 6. Mandatory Gate 0 / cheapest falsification design

The team must define the cheapest possible **Gate 0** for each serious architecture candidate.

The principle is mandatory:

> Do not build the Sprint 1 application around a new environment until that environment has first demonstrated one normal Google SERP for a two-term query.

A good Gate 0 should take minutes, not hours of implementation.

Examples to assess, not blindly adopt:

- one normal Google query from a user-controlled non-datacenter Chrome session;
- one automation-assisted query in that same session with immediate stop on challenge;
- one alternate-host/browser execution where the only evidence required is a normal rendered SERP screenshot/HTML state plus extracted title+URL from at least one organic result.

The discussion must identify which causal variable each Gate 0 actually tests: network origin, headless mode, browser profile, account state, or automation itself.

## 7. Required decision matrix

Each serious candidate must be scored on:

- probability of literal Sprint 1 PASS;
- how closely it reproduces the Product Owner's manual Google action;
- time to first falsification result;
- time to first working Sprint 1 result;
- cash cost;
- engineering complexity;
- ongoing operational burden;
- security/privacy risk;
- Google challenge risk;
- policy/ToS risk;
- human intervention requirement;
- maintainability;
- exact title+URL extraction reliability.

Do not hide uncertainty. Mark assumptions as unverified.

## 8. Required synthesis

After Claude and Codex independent answers exist, create:

`docs/design/SPRINT1_SOLUTION_AND_PITFALLS_DECISION.md`

The top of the synthesis must state, in plain language:

1. **What is the important task?**
2. **Why is Sprint 1 still NOT DONE?**
3. **What did the previous attempt teach us?**
4. **Claude recommends:** ...
5. **Codex recommends:** ...
6. **Gemini recommends / unavailable:** ...
7. **Team primary solution candidate:** ...
8. **Team fallback candidate:** ...
9. **The exact Gate 0 to run first:** ...
10. **The top five pitfalls most likely to kill Sprint 1:** ...
11. **What we explicitly must NOT build/do next:** ...

Then include the detailed comparison and risk register.

## 9. No implementation authorization

This directive does NOT authorize:

- code changes outside these discussion files and ACK/pointer;
- Google retries;
- PoCs;
- local-worker implementation;
- extension implementation;
- deployment;
- Firecrawl work;
- Profession.hu/portal work;
- paid APIs or purchases;
- anti-bot bypass of any kind.

After the discussion is complete, stop and wait for Product Owner authorization of exactly one Gate 0 experiment.

## 10. Completion ACK

Update `docs/agent-runtime/product-supervisor-ack.yaml` with:

- `last_seen_directive_id: JH-SUP-0011`
- `last_accepted_directive_id: JH-SUP-0011`
- `last_applied_directive_id: JH-SUP-0011`
- `status: SPRINT1_SOLUTION_DISCUSSION_COMPLETE`
- `SPRINT_1_SOURCE_OF_TRUTH: SPRINT_1.md`
- `SPRINT_1_STATUS: NOT_DONE`
- evidence paths for Claude, Codex, optional Gemini, and synthesis.

Then stop.