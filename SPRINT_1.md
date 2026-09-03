# SPRINT 1 — GOOGLE SEARCH: TWO KEYWORDS → REAL RESULTS

**Authority:** Product Owner
**Status:** DEFINED / NOT YET ACCEPTED
**This file is the canonical Sprint 1 source of truth.**

## 1. Sprint 1 goal

Sprint 1 is intentionally minimal.

The system must be able to do the same basic action the Product Owner can do manually:

1. open Google Search in a real browser/search session;
2. enter **two ordinary keywords / a two-term short query** into Google;
3. submit the search;
4. read the **real Google result page**;
5. expose the returned results so the Product Owner can inspect them.

That is Sprint 1.

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

## 3. Definition of Done

Sprint 1 is PASS only when all of the following are true in one live acceptance run:

1. A runnable application/system exists.
2. The Product Owner or acceptance runner supplies two short search terms.
3. The system submits those terms to **Google Search**.
4. Google returns a normal result page without an unresolved CAPTCHA / unusual-traffic / mandatory-login blocker.
5. The system reads the live results from that Google result page.
6. At least one real organic result is exposed with exact title + URL; the acceptance evidence should preserve several first-page results when available.
7. The Product Owner can inspect the results produced by the running system.
8. No fake/synthetic result is used to satisfy the acceptance gate.

If the browser/application launches but Google results cannot be read, Sprint 1 is **NOT DONE**.

## 4. Explicit non-goals for Sprint 1

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

## 5. What does NOT count as a substitute

The Sprint 1 product requirement is specifically about **Google Search results**.

Therefore these do NOT satisfy Sprint 1 unless the Product Owner later changes the requirement explicitly:

- Profession.hu results, even if useful;
- Brave Search API results;
- Google Programmable Search / another Google API that does not expose the actual required Google Search result behavior;
- another search engine;
- a manually copied list of Google results;
- browser automation that reaches only a CAPTCHA/challenge page.

A technology may be useful later without satisfying Sprint 1.

## 6. Current evidence and current status

The committed `apps/google-browser-search/` application was run against Google from the current cloud host. The acceptance evidence shows that Google returned an `unusual traffic` / CAPTCHA challenge before organic results could be read.

Therefore the current status is:

**SPRINT 1 = NOT DONE**

The existing application proves that the application can launch and reach Google, but it does **not** satisfy the Sprint 1 Definition of Done because it produced zero readable Google organic results.

## 7. Direction for all next-step engineering

Every proposed next step must answer one question first:

> **Will this get us from two short keywords entered into Google to real, inspectable Google results?**

If the answer is no, that work is not Sprint 1 work.

Before any substantial implementation, run the smallest possible live falsification test of the proposed environment/architecture. Do not build an application around a mechanism until that mechanism has first demonstrated that it can obtain a normal Google result page.

Portal-native adapters and other discovery sources may be evaluated later, but they must not replace or redefine this Sprint 1 goal.
