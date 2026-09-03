# JH-SUP-0013 — Sprint 1 On-Prem Docker Gate 0 Execution

## Authority

Product Owner / PRODUCT_ARCHITECT_ORCHESTRATION_SUPERVISOR.

## Priority

P0. Execute immediately. This supersedes the discussion-only stop in JH-SUP-0012 for this exact bounded Gate 0 execution.

## Product Owner clarification

An existing **on-premises Ubuntu server** is already available at the organization/site. Claude is running locally in that environment and is the execution channel. The Product Owner does **not** want a separate mini-PC or dependence on the Product Owner's personal workstation.

The first final-environment candidate is therefore:

> existing on-prem Ubuntu server -> Docker -> headed Chromium under virtual X/Xvfb -> ordinary site Internet -> literal Google Search.

Do **not** install a full desktop/X environment on the Ubuntu host merely for this test. Use the containerized Xvfb/browser path already committed unless a concrete runtime incompatibility proves it impossible.

## CRITICAL NETWORK-SAFETY LIMIT

The Product Owner explicitly requires that this test must not create material Google reputation risk for the company's public Internet egress/IP.

Therefore this directive authorizes **ONE AND ONLY ONE Google search attempt in total** from the on-prem corporate egress for JH-SUP-0013.

Hard limits:

- exactly one browser instance for the Gate 0 run;
- exactly one Google Search navigation/query submission in total;
- no retries, automatic or manual, even after timeout or partial load;
- no parallel browser/page/query workers;
- no repeated validation searches;
- no result-page clicking or opening destination pages;
- no scheduled recurrence under this directive;
- no background loop, polling, health-check search, warm-up search or connectivity search against Google;
- no Google account login and no use of an employee/PO authenticated Google session;
- use only the fresh ephemeral browser context created by the Gate 0 probe;
- no proxy, VPN, IP rotation, stealth, fingerprint manipulation or CAPTCHA bypass;
- if Google presents CAPTCHA, unusual-traffic, mandatory login, rate-limit/challenge, or any other anti-abuse signal: **close the browser and STOP immediately**. Do not perform a second Google request to verify it.

Ordinary browser subresource requests needed to render the single SERP are allowed; additional search navigations are not.

Claude must inspect the committed probe before running it and confirm it obeys these hard limits. If the probe could perform more than one search/navigation because of any bug or fallback behavior, **do not run it**; make only the minimum code correction necessary to enforce the one-shot limit, review that correction, then execute once.

## Exact task

Run the Sprint 1 authoritative Gate 0 **on the actual on-prem Ubuntu server where Claude is running**.

Use the committed probe:

- `apps/google-browser-search/gate0-onprem.mjs`
- `apps/google-browser-search/Dockerfile.gate0`
- `apps/google-browser-search/run-gate0-onprem.sh`

Before execution:

1. `git pull` / otherwise ensure the local checkout contains the current `main` commit.
2. Confirm the command is running on the on-prem Ubuntu host, not on a cloud/VPS runner.
3. Confirm Docker is usable on that host.
4. Inspect `gate0-onprem.mjs` and verify there is no retry/fallback/second Google search path.
5. Confirm no other Job Hunter process is concurrently querying Google from the corporate egress.

Then execute exactly once:

```bash
bash apps/google-browser-search/run-gate0-onprem.sh "IT vezető"
```

Do not execute that command a second time under JH-SUP-0013, regardless of outcome.

## Gate 0 constraints

This is an environment falsification test, not broad application development.

Mandatory constraints:

- literal `google.com` normal Search SERP;
- exactly one two-term query: `IT vezető`;
- headed Chromium executed under Xvfb inside Docker;
- no query retry;
- no fallback search engine;
- no portal/API reinterpretation;
- no proxy;
- no stealth/fingerprint evasion;
- no CAPTCHA bypass;
- no Firecrawl;
- no paid purchase;
- no unrelated deployment or feature development.

Consent handling is allowed if Google's normal consent UI appears, but it must not cause a second search submission/navigation. If consent handling cannot be completed without a second search attempt, stop and record the condition instead.

## PASS

Gate 0 PASS requires all of the following from this exact on-prem Docker environment:

1. Google returns a normal live SERP without unresolved CAPTCHA / unusual-traffic / mandatory-login blocker.
2. At least one genuine organic result is extracted with exact title + destination URL; preserve several first-page results when available from that same single SERP only.
3. Evidence identifies the host and the query and is inspectable by the Product Owner.
4. The evidence JSON and screenshot are preserved under the Gate 0 evidence path.

A PASS here proves the **environment/browser path** is viable. It does not authorize additional Google runs or broad Sprint 1 feature expansion; after PASS, report evidence and await/obey the next supervisor directive.

## FAIL / blocked behavior

If Google returns CAPTCHA, unusual traffic, mandatory login, rate limit, or no extractable organic result:

- close browser and stop;
- do not retry the query;
- do not perform a second diagnostic Google request;
- do not change providers;
- do not add stealth/proxy/bypass logic;
- preserve the evidence already obtained;
- ACK the exact failure reason.

If Docker itself is unavailable or the committed container cannot start **before any Google request is sent**, diagnose only enough to identify the concrete local runtime prerequisite. A corrected local runtime may then be started once, provided Claude can establish from logs/evidence that no prior Google search request occurred. If there is uncertainty whether a Google search request already left the corporate egress, treat the one-shot budget as consumed and STOP.

Do not silently substitute cloud execution.

## Required repository evidence

Commit and push back to `ggiaur/job-hunter`:

- Gate 0 JSON evidence;
- Gate 0 screenshot evidence if repository policy permits binary evidence; otherwise preserve the local path and commit a textual evidence record containing the exact path/hash/metadata;
- a concise `docs/evidence/SPRINT1_ONPREM_DOCKER_GATE0.md` recording:
  - host identity (non-secret hostname is sufficient);
  - execution time;
  - Docker/browser versions;
  - query;
  - total Google search attempts sent from this test (must be exactly 1 for an executed Gate 0);
  - PASS/FAIL;
  - exact organic title+URL pairs if PASS;
  - exact blocker if FAIL;
  - evidence paths.

Update `docs/agent-runtime/product-supervisor-ack.yaml` with:

- `last_seen_directive_id: JH-SUP-0013`
- `last_accepted_directive_id: JH-SUP-0013`
- `last_applied_directive_id: JH-SUP-0013`
- status `SPRINT1_ONPREM_DOCKER_GATE0_PASS` or `SPRINT1_ONPREM_DOCKER_GATE0_FAIL` / a precise runtime-blocked status
- evidence paths and resulting commit SHA.

## Scope after execution

Stop after evidence + ACK. **No second Google query is authorized by this directive.** Do not broaden development under this directive.
