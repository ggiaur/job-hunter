# JH-SUP-0008 — WORKING GOOGLE-BROWSER APPLICATION

**Priority:** P0 / PRODUCT OWNER DECISION
**Status:** ACTIVE
**Execution owner:** Cloud Claude / sole ACTIVE_ORCHESTRATOR
**Supersedes:** JH-SUP-0007 for current execution

## Product Owner decision

The Product Owner does not want another design document or a throwaway PoC as the primary deliverable. He wants to **see and use a working application**.

Claude's accepted Google-browser approach remains the technical basis, but the deliverable is now a runnable minimal application with a visible user interface that performs real Google-in-browser job search and shows the resulting jobs.

The earlier broad development freeze remains in force for unrelated Job Hunter work. This directive authorizes development only of this narrowly scoped application and the minimum code needed to run and verify it.

## Required deliverable

Build a runnable application in the canonical `ggiaur/job-hunter` repository, preferably under:

`apps/google-browser-search/`

The application must have a simple browser UI. It must not require the Product Owner to run scripts or inspect JSON manually to see whether it works.

### Minimum UI

One page containing:

- a text input for the Google search query;
- a `Search` button;
- visible search status/progress;
- a result list showing for each Google result:
  - rank;
  - title;
  - domain;
  - snippet when available;
  - clickable destination URL;
- a clearly separate `Verified jobs` section containing:
  - exact job title;
  - company;
  - location/hybrid text when available;
  - exact URL;
  - short factual relevance reason;
  - verification state/reason;
- visible error/blocker state if Google returns CAPTCHA, unusual traffic, login, consent problem, timeout or parse failure.

The interface may be intentionally minimal. Functionality and truthfulness matter more than styling.

## Runtime architecture

Use the already accepted Claude design:

- Node.js;
- Playwright;
- Playwright-managed Chromium;
- dedicated persistent logged-out browser profile outside tracked source;
- first implementation may run headless;
- Google search primary path: browser navigation to `https://www.google.com/search?q=<encoded query>&hl=hu&gl=hu`;
- one recorded UI-search-box fallback is allowed only when primary fails without a challenge;
- extract rendered Google results from Playwright page state, not with `requests`, `curl`, Firecrawl or another HTTP scraper;
- semantic/ARIA/heading/link extraction preferred; minimal structural `a > h3` fallback allowed;
- open only bounded promising destinations in the same browser context;
- no Google search API;
- no Firecrawl discovery;
- no stealth plugins, proxy rotation, fingerprint spoofing, CAPTCHA solving or anti-bot evasion.

CAPTCHA / unusual traffic / mandatory login / human verification => application must visibly return `BLOCKED_HUMAN_PERMISSION` and stop further Google actions.

## Application contract

Implement a minimal server + UI with at least:

- `GET /` — application UI;
- `GET /health` — reports process/browser readiness without performing Google search;
- `POST /api/search` — accepts one short human-readable query and performs the bounded Google-browser search;

A single search request may:

- read max 10 first-page organic Google results;
- open max 5 promising destination pages;
- use zero pagination;
- use zero Firecrawl calls;
- use zero search-API calls;
- make no automatic retry after an anti-automation challenge.

Do not add authentication, database, scheduler, Telegram, Firestore, cloud deployment, or the old Job Hunter pipeline in this slice unless strictly necessary to start the app. Keep this application independently runnable.

## Candidate relevance

Use canonical `profile/persona.md` as the relevance contract. Do not rewrite the persona to make results look better.

Important target roles include:

- IT vezető / informatikai vezető / IT manager;
- IT osztályvezető / infrastruktúra vezető / IT operations leadership;
- IT projektmenedzser;
- CIO / digitalizációs vezető;
- AI / transformation leadership.

Canonical exclusions still apply, including pure helpdesk, pure non-lead software development, non-IT management, and explicitly required advanced/negotiation/native-level English.

## Required first real acceptance run

After the application starts successfully, use the application itself — not a separate hidden script — to run these three queries, one at a time:

1. `IT vezető Budapest állás`
2. `IT manager Budapest állás`
3. `IT projektmenedzser Budapest hibrid állás`

Preserve the exact application output/evidence.

## PASS definition

The application is not accepted because it starts or renders a page.

PASS requires all of the following:

1. the application starts from the committed repo using documented commands;
2. the UI is reachable and accepts a free-text search query;
3. at least 2 of the three fixed queries display real first-page Google organic results;
4. at least **3 distinct current concrete job postings** are actually reached from Google results;
5. those jobs are plausibly relevant under `profile/persona.md` after exclusions;
6. the UI visibly shows exact title + company + URL for the accepted jobs;
7. Firecrawl discovery calls = 0;
8. search API calls = 0;
9. no anti-bot bypass/evasion occurred;
10. Codex independently reviews the exact application/evidence SHA and confirms the claims.

If fewer than 3 relevant current jobs are produced, status is FAIL even if the app and browser automation technically work.

## Required repository artifacts

Do not produce more architecture documents unless needed to explain a concrete implementation choice. Required artifacts are implementation-first:

- `apps/google-browser-search/package.json`
- application source files under `apps/google-browser-search/`
- a minimal `apps/google-browser-search/README.md` containing only install/run commands and operational limits;
- tests for deterministic extraction/filter/helper logic where practical;
- `docs/evidence/GOOGLE_BROWSER_APP_RESULTS.md` containing the real application acceptance run;
- `docs/reviews/CODEX_GOOGLE_BROWSER_APP_REVIEW.md` from independent Codex review.

The evidence file must include:

- exact application commit SHA;
- actual Node / Playwright / Chromium versions;
- actual launch mode;
- exact three queries;
- captured Google titles/URLs;
- destination pages opened;
- final verified jobs with exact title/company/URL;
- challenge state;
- Firecrawl/search-API call counts;
- PASS / FAIL / BLOCKED_HUMAN_PERMISSION.

## Execution rule

**WRITE AND RUN THE APPLICATION. DO NOT SPEND THIS SLICE WRITING ANOTHER DESIGN.**

Claude may delegate implementation or review to Codex, but Claude remains accountable for running the exact committed application and examining its real output.

Do not wait for Gemini.

## Completion / ACK

Update `docs/agent-runtime/product-supervisor-ack.yaml` to JH-SUP-0008 with one of:

- `APPLICATION_COMPLETE_PASS`
- `APPLICATION_COMPLETE_FAIL`
- `BLOCKED_HUMAN_PERMISSION`

Reference exact application SHA, evidence file, and Codex review.

After evidence and review are pushed, stop. Do not expand into the broader Job Hunter product until the Product Owner reviews the working application.