# Sprint 1 Autonomous Operating Mode — Decision (JH-SUP-0012)

## 1. What is the real Sprint 1 operating requirement now?

Two keywords → real Google SERP → visible organic title+URL, **and** the mechanism must run unattended, roughly twice a week, from a dedicated environment that is not the Product Owner's personal computer, without the PO needing to be present, keep a device awake, or manually start each search.

## 2. Why the Product Owner-local approach is not an acceptable final solution

It can only prove that automation reaches a normal SERP from a trusted session (a diagnostic fact). It cannot prove the mechanism can run twice a week with nobody at a keyboard — which is the actual product requirement `SPRINT_1.md` now states explicitly. Presenting a PO-laptop test result as Sprint 1 completion was exactly the mistake this directive exists to prevent.

## 3. Claude's primary recommendation

A dedicated, always-on small appliance (or an existing organization/site machine, if the Product Owner has one) on an ordinary home/office/business internet connection — not a datacenter — running outbound-only (polls for scheduled tasks; never accepts inbound connections). Gate 0: reuse the already-designed JH-SUP-0011 CDP-attach test on the Product Owner's own current network as a zero-cost network-class diagnostic proxy for whether *that class of network* would work for a dedicated device sitting on it — explicitly labeled diagnostic, not the final environment's own test.

## 4. Codex's primary recommendation

The same architecture class: a dedicated organization/site workstation/server with ordinary business egress if one already exists and has an accountable operator (preferred, since it avoids new hardware spend); otherwise a dedicated physical appliance at an approved home/office site. Gate 0 must run **on that exact named final host**, not as a proxy elsewhere — a single non-retrying query with preserved organic title+URL evidence.

## 5. Team recommendation for the final operating environment

**A dedicated, non-datacenter, always-on host (existing org/site machine if one exists; otherwise a small appliance at an approved site), outbound-only polling architecture, reusing the already-built extraction code from `apps/google-browser-search/lib/`.** Both independent analyses converge on this without prompting. The only real difference is Gate-0 sequencing detail: Claude proposes a zero-cost network-class proxy test on the PO's current network first (cheapest possible signal before spending anything), Codex insists the authoritative Gate 0 must run on the actual named final host. **Reconciled:** run the zero-cost proxy test first as a fast pre-screen (if it fails, stop before spending anything on hardware); if it passes, that is not sufficient by itself — the authoritative Gate 0 per Codex still must be run on the real final host once named/acquired, since the proxy test only validates network class, not the full worker/lifecycle/scheduling stack.

Managed remote-browser services (candidate 3) are explicitly **not** recommended without first researching a specific provider's actual egress network class — both analyses independently flag this as unverified and likely to be cloud-datacenter-hosted, which would reproduce the exact original failure. Alternate cloud/VPS (candidate 4) is explicitly rejected by both as offering no evidence of a different outcome.

## 6. Exact cheapest Gate 0 to run first (in the final environment)

1. **Pre-screen (zero cost, immediate):** on the Product Owner's own current network, CDP-attach to their real logged-in Chrome (`--remote-debugging-port=9222`), submit one two-keyword query, attempt extraction with the already-reviewed code. This is diagnostic only — it screens the network class, not the final host.
2. **Authoritative Gate 0 (requires the named final host):** on the actual dedicated machine (existing org/site machine, or a newly acquired appliance at an approved site), with its own real browser profile, perform exactly one non-retrying two-keyword query. PASS requires a normal live SERP with several real organic title+URL pairs preserved as evidence the Product Owner can inspect. A challenge, sign-in demand, or missing evidence is a fail/block — not a reason to add stealth, a proxy, or a retry.

## 7. What prerequisite the Product Owner would need to provide or approve

- Confirm whether an existing organization/site machine with ordinary business internet egress already exists and can be dedicated to this; if not, approve acquiring a small always-on appliance (~$50-300 one-time, an estimate not a quote) and a site to place it (home or office).
- Explicitly approve running this on their own real Google account/session (no new automation-only account is recommended), and accept the associated, genuinely uncertain ToS risk that comes with any automated interaction with Google, however low-volume.
- Accept that the pre-screen test (step 1 above) is diagnostic evidence only, not itself Sprint 1 completion, even if it passes.

## 8. Top 10 pitfalls that could still kill the solution

1. Datacenter-class IP reputation reappearing even on "ordinary" business egress if the ISP peers through cloud infrastructure — `HARD_STOP` if confirmed, `HUMAN_OP_DEPENDENCY` to verify.
2. Automation-vs-network ambiguity still not fully resolved by a network-only proxy test — the authoritative Gate 0 on the real final host is the only test that closes this.
3. Diagnostic PASS (the pre-screen) mistaken for operating-model PASS — explicitly guarded against in this synthesis and in `SPRINT_1.md` itself.
4. Managed remote-browser service turning out to be cloud-datacenter-hosted after time is spent researching/trialing it — mitigated by requiring verified egress-class research before any trial spend.
5. Google account lock/flag risk on the PO's real account from unattended automated use, however low-volume — genuinely uncertain, requires explicit PO acceptance.
6. Unattended browser/worker crash or update breaking a scheduled run silently, with no one present to notice — mitigated by a visible status/evidence channel per run, not a silent failure mode.
7. CAPTCHA/unusual-traffic recurring on the final host even after a successful Gate 0 — a single pass does not guarantee durability; must be treated as an ongoing operational risk, not a one-time proof.
8. Scope creep into building the full worker/scheduler/dispatch stack before Gate 0 passes — explicitly forbidden below.
9. Retrying the same causal environment (e.g. "just try a different cloud VPS") without a verified different network class — explicitly rejected by both independent analyses.
10. Cookie/session/profile data leaking off the dedicated host into cloud storage or logs — mitigated by keeping the profile local and only transmitting extracted result JSON.

## 9. Exact stop conditions

Stop and report `BLOCKED_HUMAN_PERMISSION` (no retry, no evasion) if: a CAPTCHA/unusual-traffic challenge appears at any Gate 0 step; Google demands sign-in/identity verification; or evidence cannot be preserved despite an apparently normal SERP. Stop and escalate to the Product Owner (not a technical decision) if: no existing org/site machine exists and appliance acquisition needs budget approval; or the pre-screen test on the PO's own network also fails, since that would mean the automation-detection question remains open even on a trusted network and requires an owner-level judgment call on how to proceed.

## 10. NO IMPLEMENTATION AUTHORIZATION

This document is discussion/decision output only, per JH-SUP-0012's own explicit rule. `SPRINT_1_STATUS` remains `NOT_DONE`. No worker, extension, scheduler, dispatcher, evidence pipeline, or deployment may be built under this directive. `SPRINT_1.md` is unchanged by this synthesis (it was already updated by the Product Owner directly, prior to this directive, to state the autonomous requirement this document analyzes).

---

## Detailed comparison and risk register

Full pitfall tables (Google/access, dedicated-worker operations, engineering-process) and the 14-dimension decision matrix are in `docs/design/CLAUDE_SPRINT1_AUTONOMOUS_OPERATING_MODE.md` and the independently-structured equivalent in `docs/design/CODEX_SPRINT1_AUTONOMOUS_OPERATING_MODE.md`. No material contradiction was found between them.
