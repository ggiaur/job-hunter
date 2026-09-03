# JH-SUP-0012 — SPRINT 1 AUTONOMOUS OPERATING MODE DISCUSSION

**Priority:** P0 / PRODUCT OWNER CORRECTION
**Status:** ACTIVE — DISCUSSION / DECISION ONLY
**Execution owner:** Claude ACTIVE_ORCHESTRATOR
**Supersedes:** JH-SUP-0011

## Product Owner correction

The prior JH-SUP-0011 recommendation was incomplete because it optimized for a diagnostic test on the Product Owner's own computer. That can help isolate a cause, but it does not prove the required operating model.

Canonical Sprint 1 is now clarified in repository-root `SPRINT_1.md`:

- two short keywords;
- real Google Search;
- live Google SERP;
- real organic title + URL exposed to the Product Owner;
- AND the final mechanism must run autonomously from a dedicated environment independent of the Product Owner's personal workstation;
- intended normal operation is low volume, approximately two scheduled search runs per week;
- the Product Owner must not need to keep their own PC/browser awake, manually start each search, or be physically present for normal runs.

A local test on the Product Owner's personal computer can be diagnostic evidence only. It cannot satisfy Sprint 1.

## Freeze

Full broad development freeze remains active. This directive authorizes **discussion and decision artifacts only**.

Do NOT:

- implement a worker;
- run a new Google PoC;
- retry the current cloud Google-browser path;
- deploy anything;
- purchase a proxy/service;
- use Firecrawl;
- work on Profession.hu/portal adapters;
- integrate production Job Hunter code;
- use CAPTCHA solving, stealth, fingerprint spoofing, proxy rotation, residential proxy evasion, account farming, or other anti-bot circumvention.

## Required independent analyses

### A. Claude

Write `docs/design/CLAUDE_SPRINT1_AUTONOMOUS_OPERATING_MODE.md` independently.

### B. Codex

Dispatch the same factual problem statement to Codex without showing Claude's new answer first. Codex writes:

`docs/design/CODEX_SPRINT1_AUTONOMOUS_OPERATING_MODE.md`

### C. Gemini

Optional and non-blocking only. If immediately available, obtain an independent answer in:

`docs/design/GEMINI_SPRINT1_AUTONOMOUS_OPERATING_MODE.md`

Otherwise record `GEMINI_NOT_AVAILABLE_NONBLOCKING`. Do not wait or repair Gemini tooling.

## Exact problem to solve

Find the most credible legitimate architecture that can achieve literal Sprint 1 **and** the autonomous twice-weekly operating mode without depending on the Product Owner's personal computer.

The discussion must explicitly distinguish:

1. **diagnostic environment** — useful only to isolate why Google blocks;
2. **final operating environment** — where the twice-weekly autonomous searches would really execute.

Do not recommend a diagnostic test as though it were the final solution.

## Candidate classes that must be evaluated

At minimum, compare these seriously:

1. **Dedicated always-on physical worker on a normal non-datacenter connection**
   - e.g. dedicated mini-PC/appliance, not the Product Owner's personal computer;
   - home/office/site-hosted ordinary ISP or business broadband;
   - outbound-only secure control from Job Hunter.

2. **Dedicated organization/site workstation or server with ordinary business internet egress**
   - physically or virtually dedicated to this job;
   - not a hyperscaler/cloud datacenter exit;
   - unattended scheduled operation.

3. **Managed remote browser / browser-compute service**
   - only legitimate documented services intended for browser automation;
   - explicitly analyze what network class/egress they actually provide and whether they are likely to reproduce the same Google block;
   - no residential-proxy-evasion assumption.

4. **Alternate cloud/provider environment**
   - evaluate honestly whether this merely repeats the same datacenter-IP failure mode;
   - a different VPS/cloud IP is not a meaningful solution unless there is evidence that the causal variable changes.

5. **Human-in-the-loop/local extension approaches**
   - classify correctly as diagnostic/fallback/manual modes if they cannot meet autonomous twice-weekly operation;
   - do not present them as Sprint 1 completion.

6. Any other legitimate architecture that actually satisfies both literal Google SERP access and autonomous operation.

Official search APIs, portal adapters, Brave, Profession.hu, Firecrawl, or other search engines may be mentioned for contrast but are **not Sprint 1 substitutes**.

## Mandatory pitfall analysis

For every serious final-operating candidate, provide a risk register with:

- likelihood;
- impact;
- cheapest early detection;
- mitigation;
- HARD_STOP / HUMAN_OP_DEPENDENCY / ACCEPTABLE_RISK classification.

At minimum cover:

### Google / external access
- datacenter IP reputation;
- residential/business ISP reputation;
- automation/headed/headless/session effects;
- fresh vs persistent profile;
- logged-out vs logged-in account dependence;
- account safety and lock risk;
- CAPTCHA/unusual-traffic recurrence;
- volume/rate sensitivity even at only ~2 runs/week;
- locale/geography/personalization/ranking variability;
- consent/interstitial behavior;
- Google SERP DOM changes;
- ads/organic distinction;
- redirect/canonical URL handling;
- Google terms/policy uncertainty.

### Dedicated autonomous worker operations
- machine availability, sleep/reboot/power loss;
- unattended browser lifecycle;
- secure scheduling/task dispatch;
- NAT/firewall strategy;
- no public CDP/debug port;
- authentication between cloud and worker;
- patching/browser updates;
- profile corruption/locking;
- cookies/session storage and leakage;
- secrets/Google-account handling;
- logging/evidence without leaking private session data;
- crash recovery without automatic duplicate Google retries;
- single-flight/rate caps;
- monitoring when a run becomes `BLOCKED_HUMAN_PERMISSION`;
- cost and maintenance burden of physical hardware/site placement.

### Engineering/process failures based on our actual history
- building before testing the fatal external dependency;
- infrastructure readiness mistaken for product feasibility;
- retrying the same causal environment under a different implementation;
- diagnostic PASS mistaken for operating-model PASS;
- redefining Sprint 1 after a path fails;
- alternative search sources substituted for literal Google SERP;
- PASS claimed without Product-Owner-visible live evidence;
- optimizing for a one-time demo while ignoring twice-weekly autonomous operation.

## Gate 0 requirement — for the FINAL environment

This is the central requirement.

For every serious candidate final operating environment, specify the **cheapest pre-build Gate 0** that can be run in minutes or with near-zero engineering to answer:

> Can this exact environment obtain one normal Google SERP for a two-keyword query without anti-bot circumvention?

No application/service is to be built before this exact environment passes Gate 0.

A Gate 0 on the Product Owner's own laptop does not validate a dedicated mini-PC, office worker, managed browser provider, or alternate cloud environment. Each final environment must be tested as itself.

Where a candidate cannot be Gate-0 tested without first paying, provisioning hardware, or creating an account, say that explicitly and quantify the prerequisite as precisely as possible.

## Decision matrix

Score or compare candidates on:

- probability of literal Sprint 1 PASS;
- probability of autonomous twice-weekly operation;
- independence from Product Owner's personal PC/presence;
- time to cheapest falsification;
- time to first real result;
- cash cost;
- implementation complexity;
- operational burden;
- security/privacy risk;
- Google challenge risk;
- ToS/policy uncertainty;
- maintainability;
- failure recovery;
- ability to preserve exact live title+URL evidence.

Separate **verified facts** from **assumptions**.

## Required synthesis

After Claude + Codex answers exist, write:

`docs/design/SPRINT1_AUTONOMOUS_OPERATING_MODE_DECISION.md`

Top section must answer plainly:

1. What is the real Sprint 1 operating requirement now?
2. Why the Product Owner-local approach is not an acceptable final solution.
3. Claude's primary recommendation.
4. Codex's primary recommendation.
5. Team recommendation for the final operating environment.
6. Exact cheapest Gate 0 to run **in that final environment**.
7. What prerequisite, if any, the Product Owner would need to provide or approve.
8. Top 10 pitfalls that could still kill the solution.
9. Exact stop conditions.
10. **NO IMPLEMENTATION AUTHORIZATION**.

Do not optimize for the easiest demo. Optimize for a credible unattended low-volume operating mode that literally uses Google Search.

## Completion

Update `docs/agent-runtime/product-supervisor-ack.yaml` with:

- `last_seen_directive_id: JH-SUP-0012`
- `last_accepted_directive_id: JH-SUP-0012`
- `last_applied_directive_id: JH-SUP-0012`
- `status: SPRINT1_AUTONOMOUS_MODE_DISCUSSION_COMPLETE`
- `SPRINT_1_STATUS: NOT_DONE`
- evidence paths for Claude, Codex, optional Gemini, synthesis.

Then stop and wait for Product Owner review.
