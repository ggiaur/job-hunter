# JH-SUP-0011 — SPRINT 1 EXACT GOOGLE SOLUTION DISCUSSION

**Priority:** P0 / PRODUCT OWNER REQUEST
**Status:** ACTIVE — DISCUSSION / ENGINEERING DECISION ONLY
**Execution owner:** Cloud Claude / ACTIVE_ORCHESTRATOR
**Canonical product source:** `SPRINT_1.md`
**Supersedes:** JH-SUP-0010 for the current task

## Product Owner request

Discuss Sprint 1 again from scratch, using the corrected canonical product requirement. The purpose is not to propose a different job-search strategy. The purpose is to determine how to satisfy Sprint 1 exactly, and to identify the failure modes before any more implementation is authorized.

Sprint 1 is exactly:

> A runnable system accepts two short keywords, submits them to real Google Search, reads the live Google Search result page, and exposes the real organic results so the Product Owner can inspect them.

`SPRINT_1.md` is authoritative. Current status: **NOT_DONE**.

The broad development freeze remains in force. This directive authorizes discussion/evidence files only. **No implementation, Google retry, browser retry, deployment, proxy purchase, API integration, portal-adapter work, Firecrawl work, or production integration is authorized.**

## Facts from previous attempts that must be carried forward

1. The cloud-host Playwright application was real and runnable.
2. It reached Google but all acceptance searches received a real `unusual traffic` / CAPTCHA challenge before any organic result could be read.
3. The same failure was reproduced with a separate fresh browser profile / independent implementation path.
4. That evidence is sufficient to stop treating the current cloud-host browser path as an implementation bug to polish blindly.
5. It does **not** prove with certainty that IP reputation is the only cause; do not overstate the diagnosis.
6. No CAPTCHA solving, stealth, fingerprint spoofing, proxy rotation, or anti-bot evasion is authorized.
7. Profession.hu, Brave Search, APIs, grounding, and other search engines may be useful later, but they do not satisfy Sprint 1 because Sprint 1 explicitly requires the live Google Search result page.

## The important task

Answer this engineering question:

> What is the smallest legitimate architecture/environment in which two short keywords can be submitted to real Google Search and the live organic result page can actually be read and shown, without first building a large system around an unvalidated assumption?

Do not optimize for future Job Hunter architecture yet. Optimize for proving Sprint 1 with the least wasted work.

## Required independent analyses

### A. Claude

Write `docs/design/CLAUDE_SPRINT1_EXACT_GOOGLE_SOLUTION.md` independently.

### B. Codex

Dispatch the same factual problem statement to Codex **without showing Claude's new answer first**. Codex writes `docs/design/CODEX_SPRINT1_EXACT_GOOGLE_SOLUTION.md`.

### C. Gemini

Optional and non-blocking only. If immediately available, write `docs/design/GEMINI_SPRINT1_EXACT_GOOGLE_SOLUTION.md`. If not immediately available, record `GEMINI_NOT_AVAILABLE_NONBLOCKING` and continue. Do not wait or repair Gemini tooling.

## Candidate solution classes that must be evaluated

Do not assume any candidate is the answer. At minimum evaluate:

1. **Current cloud host + browser automation** — primarily to state what has already been falsified and what, if anything, remains diagnostically untested. Do not recommend another blind retry.
2. **User-controlled local/non-datacenter browser worker** — normal Chrome/Chromium on a machine/network controlled by the Product Owner, with a visible browser and no stealth/evasion.
3. **Browser extension / local in-browser helper** — a minimal Chrome/Chromium extension or equivalent that uses the user's real browser session to submit the two terms and read the rendered Google SERP.
4. **Local Playwright or CDP-connected real Chrome** — a local agent controlling a normal installed browser/profile rather than a cloud-hosted headless browser.
5. **Human-in-the-loop local browser session** — whether one normal visible session with explicit human challenge handling and persistent state could satisfy Sprint 1 without automating challenge resolution.
6. **Remote browser / residential-network service** — discuss only as a risk/cost candidate. Distinguish legitimate remote execution from using residential proxies specifically to defeat Google's controls; the latter must not be recommended as an evasion strategy.
7. Any other legitimate mechanism that still satisfies the exact `SPRINT_1.md` requirement.

APIs, Brave, portal adapters, grounding, and Google PSE may be mentioned only to explain why they do or do not satisfy Sprint 1. They must not be smuggled in as replacements.

## Required pitfall analysis — be exhaustive and evidence-based

Each independent answer must explicitly cover the following pitfalls, using the previous failed work as evidence where applicable:

### 1. External-service viability before application build

The previous major process error was validating Node/Playwright/Chromium availability before validating the actual external dependency: whether Google would return a normal SERP from the chosen environment. The next proposal must define **Gate 0**: the cheapest possible live test of the environment before any app/extension/worker is built.

### 2. Network-origin / anti-abuse uncertainty

The current host is challenged. Do not assume a local/residential connection will be permanently safe. Define what one successful query proves and what it does not prove. Specify the minimum number/type of checks needed to distinguish a one-off success from a viable Sprint 1 environment without turning the validation into bulk automation.

### 3. Headless vs headed vs real-user browser

Explain what is actually known and unknown. Do not claim that switching to headed mode will fix the current host unless evidence supports it. Compare a Playwright-managed browser with the user's normal installed browser/profile.

### 4. Google account / cookie / persistent-profile risks

Assess whether login is required (do not assume it is), risks of storing Google credentials/cookies, account challenge/lockout risk, profile corruption, consent dialogs, localization, SafeSearch, and how to avoid copying sensitive browser state into cloud storage.

### 5. CAPTCHA / unusual-traffic behavior

Define the only acceptable behavior if Google presents a challenge: visible stop / human action. No CAPTCHA solver, stealth, fingerprint spoofing, proxy rotation, or automated challenge bypass. Discuss whether a human manually completing a challenge in a user-controlled visible browser is operationally acceptable for Sprint 1 and what this would imply for repeatability.

### 6. Google SERP DOM instability

The solution must not assume one brittle selector. Discuss semantic extraction, `h3`/link relationships, sponsored results, AI overviews, local packs, rich results, consent pages, experiments/A-B variants, language/region differences, and how to distinguish organic results from ads or widgets.

### 7. URL correctness

Google may expose redirect/tracking URLs. Define how exact destination URLs will be preserved/normalized and how this is verified without opening an unbounded number of result pages.

### 8. User-visible acceptance

Do not confuse technical readiness with Product Owner acceptance. Sprint 1 PASS must be demonstrated through a running system with the Product Owner's two-term query and visible real results. A health endpoint, parser unit tests, screenshots of CAPTCHA, or mock HTML are not acceptance.

### 9. Scope drift

Do not turn Sprint 1 into job relevance ranking, portal acquisition, dedupe, Firecrawl, LLM scoring, notifications, deployment, scheduling, or production integration. These are later concerns.

### 10. Diagnostic path vs product path

Separate tests that merely diagnose the current cloud failure from an architecture that could satisfy Sprint 1. For example, a manual Google search from a home connection may prove the network differs, but it is not itself the runnable Sprint 1 system.

### 11. Local-worker security and operations

If proposing a local worker/extension: explain machine availability, startup/reconnect, browser lifecycle, update burden, secure task dispatch, localhost-only vs cloud communication, secrets, access to the user's normal browser profile, and the minimal safe permissions required. For Sprint 1, avoid building remote orchestration if localhost-only can prove the requirement.

### 12. Platform dependence

State what environments are supported for the smallest test (Windows/macOS/Linux/Android if relevant). Do not assume the Product Owner has a permanently-on desktop unless required; identify that as an owner decision if it becomes necessary.

### 13. Cost and vendor dependence

Identify cash cost, ongoing maintenance, paid browser/proxy costs if any, and vendor lock-in. Prefer zero-cost falsification before paid infrastructure.

### 14. Terms/policy risk

Assess the risk of automated interaction with Google even from a local browser. Do not treat a residential IP as permission. Distinguish ordinary user-controlled automation from intentional anti-abuse evasion. Flag any requirement that would require Product Owner acceptance of ToS/operational risk.

### 15. Repeatability and volume

Sprint 1 needs two keywords and visible results, not bulk crawling. Define a low-volume acceptance test. Do not infer that one successful search authorizes high-frequency future automation.

### 16. Previous governance/process failures

Explicitly identify how to prevent a repeat of these mistakes:

- building an application before proving the external path;
- mistaking a technical component for the Product Owner's actual Sprint goal;
- replacing the requirement with an easier alternative (Profession/Brave/etc.);
- overstating root-cause certainty;
- claiming progress without owner-visible real results;
- spending time on architecture/docs after a cheap falsification test could answer the key question.

## Required output from each agent

Each answer must include:

1. Exact interpretation of Sprint 1.
2. What is already falsified.
3. Top 2 candidate architectures that **still satisfy Sprint 1**.
4. The single cheapest Gate-0 live test for each candidate.
5. Expected evidence from the test.
6. PASS/FAIL/STOP criteria.
7. Full pitfall table: probability, impact, detectability, mitigation.
8. What owner input/permission/hardware/account is actually required, if any.
9. What must NOT be built before Gate 0 passes.
10. One recommendation and one fallback.

## Synthesis

After Claude and Codex exist, write:

`docs/design/SPRINT1_EXACT_GOOGLE_SOLUTION_DECISION.md`

It must contain:

- Claude recommendation;
- Codex recommendation;
- Gemini result or non-blocking absence;
- agreement/disagreement matrix;
- ranked candidate list;
- exact Gate-0 tests;
- pitfall/risk register;
- the recommended next action **without implementing it**;
- explicit owner decisions needed before execution;
- confirmation that `SPRINT_1.md` remains unchanged.

## Completion / ACK

Update `docs/agent-runtime/product-supervisor-ack.yaml` with:

- `last_seen_directive_id: JH-SUP-0011`
- `last_accepted_directive_id: JH-SUP-0011`
- `last_applied_directive_id: JH-SUP-0011`
- `status: DISCUSSION_COMPLETE`
- `SPRINT_1_STATUS: NOT_DONE`
- evidence paths for Claude, Codex, optional Gemini, and synthesis.

Then stop. No implementation is authorized.