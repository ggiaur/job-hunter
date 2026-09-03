# Claude — Sprint 1 autonomous operating mode (JH-SUP-0012)

## Real operating requirement

Two keywords → real Google SERP → visible organic results, **and** the mechanism that does this must run unattended, roughly twice a week, from a dedicated environment that is not the Product Owner's personal computer and does not need the PO present or to manually start each search.

## Why the PO-local approach is not a final solution

It answers "can automation reach a normal SERP from a trusted session at all" (diagnostic), not "can this run unattended twice a week without the PO's laptop being on and the PO clicking anything" (operating model). The two questions are independent; JH-SUP-0011 only addressed the first.

## Candidates evaluated

1. **Dedicated always-on physical worker (mini-PC/appliance) on an ordinary home/office connection.** Not the PO's own laptop — a separate small device (e.g. Intel NUC, Raspberry Pi class), living on the same network class the PO's manual searches already succeed from. Outbound-only: the worker polls a task source on a schedule; it never accepts inbound connections, so there is no public CDP/debug port and no NAT/firewall exposure to manage.
2. **Dedicated org/site workstation or server on business internet.** Same architecture as (1), but using existing infrastructure if the Product Owner already has a machine suitable for this, rather than buying new hardware. Whether such a machine exists is an owner fact I do not have.
3. **Managed remote-browser/browser-compute service** (e.g. commercial browser-automation-as-a-service providers). **Unverified, treated with explicit skepticism**: such services are frequently themselves cloud-datacenter-hosted, which would reproduce the exact failure already observed. I do not have current, verified knowledge of any specific provider's actual egress network class, and asserting one from memory would violate this project's own rule against unverified facts. This candidate requires live verification of a concrete provider's network class before it can be seriously recommended — not before, and not from general knowledge.
4. **Alternate cloud/VPS provider.** Rejected as a primary candidate: no evidence exists that a different cloud datacenter would produce a different result than the one already falsified twice. Only worth revisiting with specific evidence that a given provider's IP class differs materially (e.g. a business-ISP-peered cloud offering, if one exists and is verified) — not as a blind retry.
5. **Human-in-the-loop / extension.** Correctly classified as diagnostic/manual-fallback only, per SPRINT_1.md's own updated text. Does not satisfy the autonomous requirement; a human must act each run.

## Pitfall register (final-operating candidates)

### Google / external access

| Pitfall | Likelihood | Impact | Detection | Mitigation | Class |
|---|---|---|---|---|---|
| Datacenter IP reputation (candidates 3/4) | High if the provider is cloud-hosted | High | Live Gate 0 in that exact environment | Verify egress network class before commit; do not assume | HARD_STOP if confirmed datacenter |
| Residential/business ISP reputation (candidates 1/2) | Low-medium, genuinely uncertain | High | Gate 0 in that exact network | Use the PO's own already-proven-working network class | HUMAN_OP_DEPENDENCY (needs the test) |
| Automation/headed/headless/session effects, still unseparated from network | High — this exact ambiguity is why JH-SUP-0011 exists | High | JH-SUP-0011's Gate 0, reused here as a network-class proxy | Run it on the PO's real network before committing to hardware | HUMAN_OP_DEPENDENCY |
| Fresh vs. persistent profile | Medium | Medium | Compare during Gate 0 | Persistent profile once past first-run consent | ACCEPTABLE_RISK |
| Logged-out vs. logged-in account dependence | Low if PO's real account is used, unmodified | Medium if flagged | Gate 0 observation | Do not create a new automation-only account | HUMAN_OP_DEPENDENCY — PO must accept using their real account on an unattended device |
| Account safety/lock risk | Low at 2 runs/week | Medium if it happens | Slow, would show as sudden failures | Keep volume explicitly low; no burst behavior | ACCEPTABLE_RISK |
| CAPTCHA/unusual-traffic recurrence | Will happen occasionally even on a good network | Low if handled | Existing detection code | Stop that run, mark `BLOCKED_HUMAN_PERMISSION`, no retry-in-run | HARD_STOP per-occurrence |
| Volume/rate sensitivity at ~2/week | Very low | Low | N/A | Trivially low volume | ACCEPTABLE_RISK |
| Locale/geo/personalization/ranking variability | Medium | Low-medium | Compare across runs | Use consistent `hl`/`gl`, record raw results per run | ACCEPTABLE_RISK |
| Consent/interstitial | Once per fresh profile | Low | Trivial | Handle once, persist | ACCEPTABLE_RISK |
| SERP DOM changes | Medium over time | Medium | Extraction returns 0 | Reuse existing role/`a>h3` extraction | ACCEPTABLE_RISK |
| Ads/organic distinction | Certain | Medium if unhandled | Already handled | Existing `#search`-scoped extraction | ACCEPTABLE_RISK |
| Redirect/canonical URL handling | Medium | Low-medium | Compare href to final URL | Preserve rendered href, no speculative expansion | ACCEPTABLE_RISK |
| Google terms/policy uncertainty | Genuinely uncertain for any automated interaction | Medium — reputational | Low without legal review | Flag explicitly to PO regardless of which candidate is chosen | HUMAN_OP_DEPENDENCY |

### Dedicated autonomous worker operations

| Pitfall | Likelihood | Impact | Detection | Mitigation | Class |
|---|---|---|---|---|---|
| Machine availability/sleep/reboot/power loss | Medium over months | Medium (missed run, not data loss) | Missed scheduled run, alertable | Disable sleep; a missed run just waits for the next cycle at 2/week volume | ACCEPTABLE_RISK |
| Unattended browser lifecycle | Medium | Medium | Crash leaves no result | Wrap in a simple restart-on-failure supervisor | ACCEPTABLE_RISK |
| Secure scheduling/task dispatch | Low if outbound-only polling | High if inbound control is exposed | Code/architecture review | Worker polls out; never exposes a listening port | HARD_STOP if a listening port is added |
| NAT/firewall strategy | N/A — no inbound needed | N/A | N/A | Outbound-only design avoids this entirely | ACCEPTABLE_RISK |
| No public CDP/debug port | Must be enforced | High if violated (remote-control attack surface) | Code review | CDP, if used at all, bound to localhost only on the worker itself | HARD_STOP if violated |
| Auth between cloud and worker | Low complexity at this scale | High if weak | Code review | A single pre-shared token/key is sufficient for 2 runs/week; no need for a heavier scheme | ACCEPTABLE_RISK |
| Patching/browser updates | Medium over time | Low-medium | Automation stops working | Reuse resilient extraction; periodic manual check acceptable at this volume | ACCEPTABLE_RISK |
| Profile corruption/locking | Low | Medium | Next run fails to launch | Single-instance discipline; no concurrent runs | ACCEPTABLE_RISK |
| Cookies/session storage and leakage | Low if never transmitted off-device | High if leaked | Code review | Only extracted result JSON leaves the worker; profile stays local | HARD_STOP if violated |
| Secrets/Google-account handling | Low — no separate secret beyond the browser's own login state | Medium | Code review | No credentials stored outside the browser profile itself | ACCEPTABLE_RISK |
| Logging without leaking private session data | Medium risk if careless | Medium-high | Code review | Log result metadata only, never full page HTML/cookies | HARD_STOP if violated |
| Crash recovery without duplicate retries | Medium | Low (wasted run, not harmful) | Run-log inspection | One attempt per scheduled slot; no automatic re-attempt after a challenge | HARD_STOP on retry-after-challenge specifically |
| Single-flight/rate caps | Low risk at 2/week | Low | Code review | Trivial to enforce given volume | ACCEPTABLE_RISK |
| Monitoring on `BLOCKED_HUMAN_PERMISSION` | Must exist | Medium if silent | By design | Worker reports run status somewhere the PO/Job Hunter can see it | HUMAN_OP_DEPENDENCY — needs a visible status channel |
| Cost/maintenance of physical hardware/site placement | Low one-time cost, low ongoing | Low | N/A | ~$50-300 one-time for a small appliance; negligible power draw | ACCEPTABLE_RISK |

### Engineering/process failures

| Pitfall | Likelihood | Impact | Detection | Mitigation | Class |
|---|---|---|---|---|---|
| Building before testing the fatal external dependency | Already happened twice | High | Named explicitly, twice now | Gate 0 in the actual final environment before any build | HARD_STOP going forward |
| Diagnostic PASS mistaken for operating-model PASS | This is exactly what JH-SUP-0012 corrects | High | Named explicitly | Never present a PO-laptop test result as Sprint 1 completion | HARD_STOP |
| Retrying the same causal environment under a different implementation | Real risk for candidate 4 | High if attempted | Named explicitly | Do not choose an alternate cloud provider without verified evidence of a different network class | HARD_STOP |
| Optimizing for a one-time demo, ignoring twice-weekly operation | Real risk if candidate 5 is over-favored for being "easiest" | Medium | Named explicitly | Explicitly exclude human-in-the-loop from "final solution" framing | HARD_STOP |

## Gate 0 for the FINAL environment

The honest complication: candidates 1 and 2 cannot be Gate-0 tested as literal dedicated hardware without first either buying a device (candidate 1) or the Product Owner confirming a suitable existing machine exists (candidate 2) — both are real prerequisites, stated explicitly rather than glossed over.

What **can** be tested immediately, at zero cost, and is genuinely informative: the causal variable that matters most for candidates 1/2 is **network/ISP reputation**, which is a property of the network, not the specific device sitting on it. Reusing JH-SUP-0011's already-designed Gate 0 (CDP-attach to a real Chrome on the PO's own current network) as a **network-class proxy test** — explicitly labeled diagnostic only, per SPRINT_1.md's own new allowance — tells us whether *that network* is viable for *any* device placed on it, before spending money on hardware. It does not test the worker-lifecycle/scheduling/dispatch pitfalls above; those can only be tested once real hardware exists.

For candidate 3, Gate 0 requires first identifying and verifying (not assuming) a specific provider's actual egress network class — a research step, not a code step, and must happen before any recommendation, not after.

## Decision matrix

| Dimension | Candidate 1 (dedicated appliance, PO's network) | Candidate 2 (existing org machine) | Candidate 3 (managed browser service) | Candidate 4 (alt cloud) |
|---|---|---|---|---|
| Probability of literal Sprint 1 PASS | Medium-high (unverified network-class assumption) | Same as 1, if the machine exists | Unverified — depends entirely on provider | Low (no evidence of a different outcome) |
| Probability of autonomous twice-weekly operation | High once built | High once built | High if the provider itself is reliable | High if it worked at all |
| Independence from PO's PC/presence | Full | Full | Full | Full |
| Time to cheapest falsification | Immediate (reuse JH-SUP-0011 Gate 0 as network proxy) | Immediate if a machine already exists | Requires research first | Immediate (just try it — but low information value, already-falsified pattern) |
| Time to first real result | Days (buy + set up device) after Gate 0 passes | Hours if a machine exists | Unknown — depends on provider | Fast, but likely repeats failure |
| Cash cost | ~$50-300 one-time, verified as an estimate not a quote | ~$0 if a machine already exists | Ongoing subscription, verified pricing needed | Ongoing hosting cost |
| Implementation complexity | Low-medium (outbound-poll worker, reused extraction code) | Same as 1 | Low if the provider's API is simple, unverified | Low (same app, different host) |
| Operational burden | Low at 2 runs/week | Low | Depends on provider reliability | Low |
| Security/privacy risk | Low if outbound-only, localhost-only CDP | Same | Depends on provider's own security posture, unverified | Same as current app |
| Google challenge risk | Unverified — this is what Gate 0 tests | Same | Unverified, likely high if datacenter-hosted | High (same failure mode expected) |
| ToS/policy uncertainty | Medium, same as any automated Google interaction | Same | Same, plus a third party's own ToS | Same |
| Maintainability | Good | Good | Depends on provider | Same as current app |
| Failure recovery | Simple (single-instance, next scheduled slot) | Same | Depends on provider | Same |
| Evidence preservation | Straightforward (local JSON, reused extraction) | Same | Depends on provider's API | Same |

**Verified facts used above:** the JH-SUP-0007/0008 cloud-host block (directly observed, twice). **Assumptions flagged as unverified:** that a residential/business ISP avoids the block (untested); any specific managed-browser provider's network class (not researched in this directive); candidate 4's cost/outcome (would just be another guess).

## Primary recommendation

**Candidate 1: a dedicated small always-on appliance on the Product Owner's own ordinary home/office network, outbound-only polling architecture.** It is the most concrete, lowest-uncertainty path that doesn't require researching or trusting a third-party provider's infrastructure, and it reuses already-built, already-reviewed extraction code almost entirely.

**Gate 0 to run first:** reuse JH-SUP-0011's CDP-attach test on the Product Owner's current network as a network-class diagnostic (not the final environment itself, but the strongest available proxy for it, at zero cost). If it passes, hardware acquisition is justified. If it still hits a challenge, that is strong evidence the block follows automation-of-a-real-session regardless of network class, and candidate 1/2 should not be pursued further without a different mitigation the PO would need to explicitly approve.

## Fallback

If Gate 0 fails even on the PO's own trusted network: escalate to the Product Owner as a genuine open decision, not something to resolve unilaterally. The options at that point (researching a specific managed-browser provider's real network class; reconsidering whether an official Google API path should be revisited despite not satisfying literal Sprint 1; accepting a human-in-the-loop mode as a lesser, explicitly-non-autonomous interim state) all require Product Owner judgment calls this analysis cannot make for them.

## What must NOT be built before Gate 0 passes

No hardware purchase, no worker code beyond the already-existing reused extraction logic, no provider research spend, no scheduling/dispatch implementation, no alternate cloud deployment.
