# SPRINT 1 — GOOGLE SEARCH: TWO KEYWORDS → REAL RESULTS

**Authority:** Product Owner
**Status:** DEFINED / NOT YET ACCEPTED
**This file is the canonical Sprint 1 source of truth.**

## 1. Sprint 1 goal

Sprint 1 is intentionally minimal in search behavior, but it must prove the intended operating model.

The system must be able to do the same basic action the Product Owner can do manually:

1. open Google Search in a real browser/search session;
2. enter **two ordinary keywords / a two-term short query** into Google;
3. submit the search;
4. read the **real Google result page**;
5. expose the returned results so the Product Owner can inspect them.

That is the search behavior of Sprint 1.

The Product Owner has additionally clarified the operating requirement: this capability is intended to run automatically roughly **twice per week**, therefore the final Sprint 1 solution **must not depend on the Product Owner's personal computer being on, the Product Owner being physically present, or the Product Owner manually initiating each search**.

A test on the Product Owner's personal computer may be used only as a diagnostic experiment to isolate a cause. It is **not Sprint 1 completion and not an acceptable production operating model**.

Sprint 1 is **not** a job-ranking sprint, not a portal-integration sprint, not a Firecrawl sprint, not a notification sprint, and not a full Job Hunter workflow sprint.

## 2. Required user-visible behavior

Given two short search terms, for example:

`IT vezető`

or another two-term query chosen for acceptance, the running system must return the real Google results visible to the Product Owner.

At minimum each visible result must contain:

- result title;
- destination URL;
- visible snippet/domain when Google exposes it.

The result list must come from the live Google search result page. Synthetic fixtures, mocks, cached hand-written examples, portal-native results, or another search engine do not satisfy Sprint 1.

## 3. Required operating behavior

The final Sprint 1 mechanism must be capable of running from a **dedicated environment independent of the Product Owner's personal workstation**.

It must support the intended low-volume autonomous operating pattern: approximately two scheduled search runs per week, without requiring the Product Owner to start Chrome, keep a personal PC awake, click an extension, solve an ordinary interaction for every run, or manually submit the query.

A human may still be needed for exceptional operational blockers such as a genuine Google challenge, but such a challenge is a blocked run, not normal operating behavior and not a PASS substitute.

The dedicated environment may be cloud, on-premises, office/site-hosted, a dedicated appliance/mini-PC, or another legitimate architecture — but it must be evaluated on actual ability to receive a normal Google SERP without anti-bot circumvention.

## 4. Definition of Done

Sprint 1 is PASS only when all of the following are true in live acceptance evidence:

1. A runnable application/system exists.
2. The acceptance runner supplies two short search terms.
3. The system submits those terms to **Google Search**.
4. Google returns a normal result page without an unresolved CAPTCHA / unusual-traffic / mandatory-login blocker.
5. The system reads the live results from that Google result page.
6. At least one real organic result is exposed with exact title + URL; the acceptance evidence should preserve several first-page results when available.
7. The Product Owner can inspect the results produced by the running system.
8. No fake/synthetic result is used to satisfy the acceptance gate.
9. The accepted mechanism runs from a dedicated environment that is **not the Product Owner's personal computer and does not require the Product Owner to initiate the search**.
10. The architecture demonstrably supports unattended low-volume scheduling for the intended approximately twice-weekly operation; normal runs must not require a person to be present.

If the browser/application launches but Google results cannot be read, Sprint 1 is **NOT DONE**.

If Google results can be read only by using the Product Owner's personal browser/workstation interactively, Sprint 1 is also **NOT DONE** because the required operating model has not been proven.

## 5. Explicit non-goals for Sprint 1

The following are outside Sprint 1 and must not be used to redefine or inflate it:

- finding 3 relevant jobs;
- opening job detail pages;
- profession.hu / cvonline.hu portal-native discovery;
- relevance scoring against `profile/persona.md`;
- deduplication across sources;
- LLM ranking;
- Firecrawl;
- Telegram/email notifications;
- saved searches;
- employer/ATS adapters;
- full production Job Hunter integration;
- broad multi-source acquisition architecture.

These may belong to later work, but **none of them is required to complete Sprint 1**.

## 6. What does NOT count as a substitute

The Sprint 1 product requirement is specifically about **Google Search results in the required autonomous operating model**.

Therefore these do NOT satisfy Sprint 1 unless the Product Owner later changes the requirement explicitly:

- Profession.hu results, even if useful;
- Brave Search API results;
- Google Programmable Search / another Google API that does not expose the actual required Google Search result behavior;
- another search engine;
- a manually copied list of Google results;
- browser automation that reaches only a CAPTCHA/challenge page;
- a solution that works only on the Product Owner's personal computer;
- a solution that requires the Product Owner to manually start each search or keep their personal browser/session continuously available.

A technology may be useful later without satisfying Sprint 1.

## 7. Current evidence and current status

The committed `apps/google-browser-search/` application was run against Google from the current cloud host. The acceptance evidence shows that Google returned an `unusual traffic` / CAPTCHA challenge before organic results could be read.

A later discussion proposed a Product-Owner-local browser worker / extension as a diagnostic route. The Product Owner clarified that this is **not an acceptable final operating model**, because the real system must run automatically about twice per week without depending on the Product Owner's own computer.

Therefore the current status is:

**SPRINT 1 = NOT DONE**

## 8. Direction for all next-step engineering

Every proposed next step must answer **both** questions:

> **A. Will this get us from two short keywords entered into Google to real, inspectable Google results?**

> **B. Can it do so autonomously from a dedicated environment, approximately twice per week, without depending on the Product Owner's personal computer or physical presence?**

If either answer is no, that work cannot be the Sprint 1 solution.

Before any substantial implementation, run the smallest possible live falsification test of the proposed **final operating environment**. Do not build an application around a mechanism until that environment has first demonstrated that it can obtain a normal Google result page.

A Product-Owner-local test may still be used to diagnose network-versus-automation causes, but it must never be mistaken for evidence that the final Sprint 1 operating model works.

Portal-native adapters and other discovery sources may be evaluated later, but they must not replace or redefine this Sprint 1 goal.
