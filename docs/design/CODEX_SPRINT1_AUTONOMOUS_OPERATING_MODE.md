# Codex — Sprint 1 autonomous operating mode

## Decision in one paragraph

Sprint 1 requires an unattended, dedicated environment—not the Product Owner's (PO's) computer—to submit a two-keyword query to real Google Search, read a normal live SERP, and expose exact organic title and URL evidence roughly twice weekly.  The most credible legitimate path is a **dedicated, always-on physical appliance at a site with ordinary non-datacenter internet egress**, preferably an organization/site location if one is available and otherwise a separately purchased/owned appliance at an approved home or office site.  It must use outbound-only control and low-volume scheduled operation.  This is a recommendation to *test*, not a claim it will work: Google has already challenged two fresh cloud Chromium attempts, and neither the relevant ISP egress nor automation behavior in the proposed final environment has been proven.  No worker, scheduler, extension, deployment, or purchase should be made until that exact environment passes Gate 0.

## Requirement and evidence boundary

**Operating-model PASS** requires all of the following in one final operating environment: a scheduled unattended run; real Google results rather than a challenge; extraction of live organic title plus destination URL; owner-visible evidence; and no dependence on the PO's workstation, browser, presence, or per-run action.  A CAPTCHA is a blocked run, never a substitute for a result.

**Verified facts**

- `SPRINT_1.md` is the authority and says PO-local operation is diagnostic only, not Sprint 1 completion.
- The current cloud-host browser application encountered Google unusual-traffic/CAPTCHA before it could read organic results.  This occurred on two independent implementations with fresh profiles.
- The intended normal cadence is only about two runs weekly.

**Not verified**

- Which causal factor triggered Google: datacenter IP reputation, browser automation signals, fresh-session behavior, locale, a combination, or another factor.
- That any home, office, business, managed-browser, or alternate-cloud egress will receive a normal SERP.
- Any particular managed browser provider's egress class, policy, price, data handling, or Google compatibility.
- Whether an existing organization/site machine and suitable egress are available.

Thus a PO-laptop experiment may isolate a variable, but is not a Gate 0 PASS for a mini-PC, organization worker, remote-browser provider, or VPS.  It may inform a later choice only.

## Candidate comparison

Scores are relative estimates: High / Medium / Low probability or favorable / mixed / unfavorable.  They are assumptions except where explicitly marked verified above.

| Candidate final environment | Literal Sprint 1 PASS | Autonomous twice-weekly | PO-PC independence | Cheapest falsification / first result | Cash / complexity / operating burden | Challenge and policy uncertainty | Evidence, maintenance, recovery | Assessment |
|---|---|---|---|---|---|---|---|---|
| 1. Dedicated physical appliance on ordinary home/office ISP | Medium, unproven | High after a build | High | Minutes **after** appliance/site provisioning; first result then | Low-to-medium one-time hardware/site cost; medium build; low ongoing | Medium: non-datacenter egress may help but is unproven; Google terms remain uncertain | Good: local persistent evidence, simple single-flight recovery | Primary if a suitable independent site is approved |
| 2. Dedicated organization/site workstation/server on ordinary business egress | Medium, unproven | High after a build | High | Minutes if an actual dedicated host is already available; first result then | Potentially low incremental cost; medium build; low-to-medium IT burden | Medium: business egress is not automatically trusted | Good, subject to site security/patch ownership | Co-primary/preferred variant if an existing compliant host exists |
| 3. Managed remote-browser/browser-compute service | Low-to-medium, entirely provider-specific | High if service is reliable | High | Provider/account/network verification, then minutes; cannot be zero-cost if a paid trial is required | Subscription plus low-medium integration; vendor operations | Medium-high: many such services may use cloud/datacenter egress; do not infer otherwise | Usually good logs but third-party retention/vendor lock-in | Conditional fallback only after documented egress and exact Gate 0 |
| 4. Another VPS/cloud/provider | Low absent evidence of a materially different egress class | High technically | High | Minutes after provisioning, but low-information repetition of the known pattern | Low-medium recurring cost; low implementation reuse | High: likely repeats datacenter-IP failure; policy unchanged | Technically easy, but poor failure diagnosis | Do not pursue as blind retry |
| 5. PO-local extension, attended browser, or human-in-loop | May show a SERP | Low | None / partial | Fast diagnostic result | Low engineering for a test, but recurrent human burden | Lower challenge risk may be possible, but unproven | Evidence possible; no unattended recovery | Diagnostic/manual fallback only; not Sprint 1 PASS |
| 6. Dedicated managed on-premise browser appliance supplied/operated by an IT/site provider, on documented ordinary site egress | Medium, unproven | High | Requires contract/provisioning, then minutes | Higher cash and vendor burden | Medium; legitimacy does not prove egress reputation | Potentially strong operations, weaker control/privacy | Viable only if it is genuinely site-egressed and Gate 0 passes |

Official Google search APIs, portal adapters, Brave, Profession.hu, Firecrawl, and other engines may have product value later.  They do not deliver the required live Google SERP and are not substitutes in this decision.

## Candidate-specific Gate 0

Gate 0 is deliberately a tiny, one-attempt, no-circumvention acceptance probe.  It must run **from the candidate's actual final environment**, using a normal installed Chromium/Chrome session in its intended execution mode.  It opens Google, submits a PO-approved ordinary two-word query once, and records: UTC time, egress/site identifier (not an IP published in evidence), browser/version and headed/headless mode, whether a normal SERP appeared, and the first several rendered organic title+destination-URL pairs.  It does not log cookies, full page HTML, credentials, or CAPTCHA content.  A challenge, mandatory sign-in, consent state that cannot be resolved normally, zero organic results, or inability to show the evidence is a Gate 0 fail/block.  No automated retry follows.

| Candidate | Exact cheapest Gate 0 | Prerequisite before it is possible | Falsification meaning |
|---|---|---|---|
| 1. Physical appliance | Put the proposed dedicated appliance on the approved final home/office network, configured as it will run unattended; make one manually observed, non-retrying probe from that appliance. | PO approves a non-PO-PC site, power, network use, and a dedicated device.  If none is loaned/available, a modest hardware purchase is prerequisite; no price is asserted without a current quote. | This exact appliance/site/mode cannot currently get the required SERP; stop before scheduler/worker build. |
| 2. Organization/site host | On the named dedicated workstation/server and its ordinary business egress, make the one probe in its intended browser mode. | PO/site administrator confirms a dedicated host, permission to run the probe, and unattended operation.  This may be zero incremental cash if it already exists. | The actual site egress or host behavior is unsuitable; do not extrapolate from another office or employee laptop. |
| 3. Managed service | First obtain provider documentation or written confirmation of browser execution and egress class; create the minimum account/trial needed, then make one probe inside its offered browser environment. | A concrete provider, accepted terms/data posture, and possibly a paid trial/account.  Cost and egress class are unknown until researched for that provider. | A challenged result, unverified/datacenter egress, or unacceptable contract/data terms eliminates that service. |
| 4. Alternate cloud | Provision the exact proposed provider/region and make one probe. | Account, minimal billed instance, and permission to incur the minimum provider charge. | A challenge confirms no useful causal change.  Passing one probe would warrant cautious follow-up, not prove sustainable operations. |
| 6. Managed on-premise appliance | One probe from the actual provider-installed appliance at its proposed site/egress. | Contract/trial, site authorization, and confirmation that it is not merely cloud browser compute. | If egress is actually cloud/datacenter or Gate 0 challenges, reject it. |

A Gate 0 on the PO laptop is only a **diagnostic experiment**.  It can compare logged-out vs. existing-session behavior or local ISP vs. cloud behavior, but it does not validate device availability, unattended lifecycle, dispatch, profile isolation, security, or the final egress host.  Candidate 5 has no final Gate 0 because it cannot meet the autonomous requirement.

## Risk register — Google and external access

This register applies to every serious final candidate (1, 2, 3, 4, and 6).  Candidate-specific likelihood differences are noted.  “HARD_STOP” means do not proceed/continue automatically; “HUMAN_OP_DEPENDENCY” means an exceptional person decision or intervention is required; “ACCEPTABLE_RISK” means it can be bounded without redefining Sprint 1.

| Risk | Likelihood / impact | Cheapest early detection | Mitigation | Classification |
|---|---|---|---|---|
| Datacenter IP reputation (especially 3/4) | High / high for conventional cloud; unknown for 3 until verified | Document egress class; exact Gate 0 | Reject blind VPS substitution; only consider a candidate whose actual egress is disclosed and passes | HARD_STOP if challenged or datacenter-only route is the untested premise |
| Ordinary residential/business ISP reputation (1/2/6) | Unknown, likely lower than cloud but not proven / high | Exact Gate 0 at the final site | Choose actual ordinary site egress, retain low cadence; do not use proxies or rotation | HARD_STOP on Gate 0 challenge |
| Automation, headed/headless, session and browser-version effects | Medium-high / high | Gate 0 records intended mode and profile condition | Use ordinary supported browser behavior; test exact mode; do not use stealth/fingerprint spoofing | HARD_STOP if normal intended mode is blocked |
| Fresh versus persistent profile / consent interstitial | Medium / medium | One fresh-profile probe, then one normal-profile setup observation only if first is a normal SERP | Persist only minimal browser state locally; document consent handling | ACCEPTABLE_RISK unless it forces per-run human action |
| Google-account dependence, lock, or credential exposure | Unknown / high | Gate 0 logged out first where feasible; security review before account use | Prefer no account; never create/farm accounts; if login becomes required, obtain explicit PO approval and stop until security design is reviewed | HUMAN_OP_DEPENDENCY |
| CAPTCHA recurrence, even at two/week | Medium / high for a run | Explicit blocker detection in design and later acceptance | Mark `BLOCKED_HUMAN_PERMISSION`, capture safe status, no in-run retry; human decides whether/when to resume | HUMAN_OP_DEPENDENCY; HARD_STOP for that run |
| Volume sensitivity/bursts | Low at target cadence / medium | Planned cadence and single-flight review | Hard cap one attempt per scheduled slot, roughly two/week, no catch-up burst | ACCEPTABLE_RISK |
| Locale, geography, personalization/ranking drift | Medium / medium | Gate 0/evidence includes locale and timestamp | Fix documented locale settings where normal UI supports them; retain displayed evidence, not expected rankings | ACCEPTABLE_RISK |
| Consent, regional, or legal interstitial | Medium / medium | Gate 0 | Handle only normal one-time consent; if recurring or human-required, block rather than automate around it | HUMAN_OP_DEPENDENCY |
| SERP DOM change and ad/organic confusion | Medium / medium-high | Extraction acceptance asserts several organic candidates and flags zero/ambiguous output | Scope extraction to visible result area; label confidence; preserve title, displayed domain/snippet where shown, and destination URL | ACCEPTABLE_RISK unless it yields unverifiable results |
| Google redirect/canonical URL ambiguity | Medium / medium | Evidence retains raw rendered link plus resolved destination only when normally navigated | Preserve exact observed href and a clearly labelled destination/canonical field; never invent URL normalization | ACCEPTABLE_RISK |
| Google ToS/policy uncertainty | Unknown / high | PO/legal review of current terms before operating | Keep behavior low-volume and transparent; seek explicit owner decision; do not claim permission from technical success | HUMAN_OP_DEPENDENCY |

## Risk register — operating the dedicated environment

| Risk | Likelihood / impact | Cheapest early detection | Mitigation | Classification |
|---|---|---|---|---|
| Power loss, sleep, reboot, disk failure (1/2/6) | Medium / medium | Site readiness check; later scheduled dry-run only after Gate 0 | Disable sleep, auto-start after reboot, health heartbeat; missed run is reported rather than burst-retried | ACCEPTABLE_RISK |
| Unattended browser lifecycle/crash | Medium / medium | A post-Gate-0 lifecycle design review | One bounded run per slot; supervisor records terminal status and cleans only its own process state | ACCEPTABLE_RISK |
| Inbound control, NAT/firewall exposure | Medium if designed carelessly / high | Architecture review before implementation | Outbound-only polling or outbound authenticated connection; no public listener | HARD_STOP if public remote-control endpoint is proposed |
| Public CDP/debugging port | Medium if convenience-driven / critical | Port/config review | No public CDP; if ever required locally, bind loopback and remove from operating design | HARD_STOP |
| Cloud-to-worker authorization | Medium / high | Threat-model review | Short-lived or scoped authenticated dispatch, replay protection, allowlisted task schema; no arbitrary browser commands | HARD_STOP if unauthenticated/arbitrary remote control |
| Patching/browser updates | Medium / medium | Ownership and patch window documented | Supported OS/browser, automatic security patches, version telemetry; re-run a single controlled validation after material change | ACCEPTABLE_RISK |
| Persistent profile corruption/concurrent lock | Medium / medium | Single-flight design review | One browser/profile owner, lock file, backup-free rebuild procedure that does not copy cookies | ACCEPTABLE_RISK |
| Cookies, session data, and secrets leakage | Medium / high | Data-flow review | Keep profile on device, encrypt disk/OS account where supported, least privilege, never export cookies; prefer logged-out use | HARD_STOP for leakage or uncontrolled account credential storage |
| Unsafe logs/evidence | Medium / high | Log-schema review | Store result metadata/screenshot only as approved; redact query if sensitive; no page dumps, cookies, headers, or credentials | HARD_STOP |
| Crash recovery causing duplicate Google searches | Medium / medium | State-machine review | Idempotency key per schedule slot; terminal records; no automatic retry after navigation/challenge/unknown outcome | HARD_STOP for retry-after-block; otherwise ACCEPTABLE_RISK |
| Concurrent runs/rate-cap failure | Low / medium | Config review | Global single-flight and hard cadence cap, including after restart | ACCEPTABLE_RISK |
| `BLOCKED_HUMAN_PERMISSION` goes unseen | Medium / high | Alert-path design review | Owner-visible status channel with timestamp/reason; a blocked run remains terminal pending a human decision | HUMAN_OP_DEPENDENCY |
| Hardware/site availability and cost | Medium / medium | Confirm host, power, network and responsible operator before build | Name an owner for physical access/patching; document replacement path | HUMAN_OP_DEPENDENCY |
| Managed-provider retention/outage/lock-in (3/6) | Medium / medium-high | Contract/SLA/data review | Export minimal evidence, avoid credentials, retain ability to change providers only after a new Gate 0 | HUMAN_OP_DEPENDENCY |

## Risk register — engineering and acceptance discipline

| Risk | Likelihood / impact | Cheapest early detection | Mitigation | Classification |
|---|---|---|---|---|
| Building before testing the fatal external dependency | Already evidenced / high | Gate 0 checklist approval | Exact-environment Gate 0 is the first engineering action | HARD_STOP |
| Infra readiness mistaken for feasibility | High / high | Separate Gate 0 result from architecture checklist | No implementation PASS language until normal live SERP evidence exists | HARD_STOP |
| Retrying the same cloud causal environment in new code/provider | High for 4 / high | Compare egress class before any probe | Treat conventional cloud as same class unless evidence proves otherwise | HARD_STOP |
| Diagnostic success mistaken for operating-model success | High / high | Evidence checklist requires final host identity and unattended schedule | Label every PO-local test diagnostic only | HARD_STOP |
| Redefining Sprint 1 after failure | Medium / high | Compare results to `SPRINT_1.md` | Keep literal Google/live-SERP/autonomy gates immutable absent PO amendment | HARD_STOP |
| Substituting API, portal, Brave, or Firecrawl output | Medium / high | Acceptance evidence review | Reject as non-Sprint-1 contrast data | HARD_STOP |
| Claiming PASS without owner-visible title+URL evidence | Medium / high | Acceptance checklist | Preserve several displayed organic results, run metadata, and a view the PO can inspect | HARD_STOP |
| One-time demo optimized over scheduled operations | Medium / high | Require a later unattended scheduled acceptance run | Demand a final-host schedule and terminal status/evidence, not only an interactive demo | HARD_STOP |

## Primary recommendation and decision gates

**Primary recommendation:** candidate 2 when the PO can name an existing, dedicated organization/site workstation or server with ordinary, non-datacenter business egress and an accountable site operator; otherwise candidate 1, a dedicated physical appliance at an approved ordinary home/office site.  These are the same operating architecture at different ownership/cost points.  They change the most plausible causal variable—cloud egress class—while satisfying autonomy without asking the PO to leave a personal machine running.  This is not an assertion that business or home egress is automatically acceptable to Google.

**Exact first Gate 0:** on that named final dedicated host, at that final site, with the intended ordinary browser/profile mode, perform one non-retrying query for a PO-approved ordinary two-keyword term.  The pass record must show a normal live Google SERP and several exact rendered organic title+URL pairs that the PO can inspect.  It must not use a Google account unless that has separately been approved.  A CAPTCHA/unusual-traffic page, sign-in demand, missing organic results, or an inability to preserve the evidence is a fail/block—not a reason to alter fingerprints, add a proxy, or retry.

**PO prerequisite/approval:** nominate either (a) an existing dedicated organization/site host with site-administrator authorization or (b) an approved non-PO-PC appliance site and authority to provision a dedicated device.  Also approve the site/network's acceptable-use posture and whether the one Gate 0 query may be made.  If no existing host exists, the only cash prerequisite is acquisition of a dedicated appliance; its exact cost must be quoted and approved before purchase.  No account credentials should be supplied for Gate 0.

**Fallback:** a concrete managed remote-browser service only after its documented actual egress class, commercial terms, data retention, and account prerequisite are researched and accepted, followed by its own exact-service Gate 0.  If it uses conventional cloud/datacenter egress or Gate 0 challenges, stop.  A PO-local browser/extension remains useful only to diagnose network/session causes or provide an explicitly manual interim mode; it is not the fallback that completes Sprint 1.

## Explicit no-build boundary

Before the recommended final environment passes Gate 0, do **not** build or modify a worker, extension, scheduler, dispatcher, API, evidence pipeline, monitoring, browser automation package, cloud deployment, or `job-searcher`; do not retry the current Google cloud path; do not buy hardware/service; and do not use CAPTCHA solving, stealth/fingerprint changes, proxy rotation, residential-proxy evasion, account farming, or alternate search sources.

After a Gate 0 pass, implementation still needs a separate authorization and later operating-model acceptance.  A one-off pass proves only that the fatal external dependency was available at that moment.  It does not by itself prove autonomous twice-weekly reliability, policy acceptability, or Sprint 1 completion.
