# Sprint 1 Solution and Pitfalls — Decision (JH-SUP-0011)

## 1. What is the important task?

Prove — cheaply, before building anything substantial — whether two short keywords can be submitted to real Google Search and the live organic result page can actually be read, from an environment that has not yet been shown to be blocked. This is a diagnostic question, not an architecture question: the previous work jumped straight to building a full application before answering it.

## 2. Why is Sprint 1 still NOT DONE?

Because the only environment tested so far — headless Chromium on this cloud host, in a fresh automated profile — was blocked by Google's own anti-automation system on the very first request, twice, in two independent implementations. Zero organic Google results have ever been read.

## 3. What did the previous attempt teach us?

1. Infrastructure readiness (Chromium installed, CPU/RAM fine, code runs) is not the same as product feasibility — the fatal external dependency (will Google respond normally?) was never checked before a full application was built around it.
2. The failure is real and reproducible, but its exact cause was never isolated: the cloud host's datacenter IP and the fact that it was a fresh, automation-driven profile were never tested as separate variables. Either one alone could explain the block.
3. When the primary path failed, the next directive (JH-SUP-0009) substituted a different, easier requirement (Profession.hu results) instead of solving the actual one — this was explicitly corrected in JH-SUP-0010 and must not recur.

## 4. Claude recommends

Run a single, ~30-minute, zero-cost Gate 0: a local script uses Playwright's `connectOverCDP()` to attach to the Product Owner's own already-running, already-logged-in Chrome (started once with `--remote-debugging-port=9222`), submits one two-keyword query to `google.com/search`, and reads the result via the already-built, already-reviewed extraction code. This is the only test that resolves both open unknowns (network origin, automation-vs-trusted-session) at once. If it passes, a narrow local worker built on the same attach-to-real-browser pattern is the Sprint 1 architecture. If it still hits a challenge, fall back to a read-only browser extension that only reads a page the Product Owner searched manually — which cannot hit an automation-detection wall because there is no programmatic navigation.

## 5. Codex recommends

Split Gate 0 into two ordered steps: (0-A) the Product Owner performs one completely manual two-term Google search in their own ordinary Chrome, on their own ordinary network, and confirms a normal SERP — establishing the baseline that the block is not universal; (0-A2) only if 0-A passes, test the same environment with a minimal automated/CDP-driven query to isolate whether automation itself (not just network) triggers a block. If 0-A passes but 0-A2 does not, the recommended fallback is a browser extension performing read-only extraction from an Owner-initiated active tab, adding query submission only after a further minimal test proves it does not itself provoke a challenge.

## 6. Gemini recommends / unavailable

`GEMINI_NOT_AVAILABLE_NONBLOCKING` — the only channel was occupied with unrelated work; not interrupted or waited on, per directive.

## 7. Team primary solution candidate

**A local, Owner-controlled browser worker attached to a real, already-trusted Chrome session (not a fresh automated profile), tested via Gate 0 before any build.** Claude and Codex converge on this without prompting, differing only in whether the manual-baseline step (Codex's 0-A) is folded into the same test (Claude's version) or run as an explicit separate first step (Codex's version) — not a disagreement on architecture, only on test sequencing. Combined recommendation: run the manual baseline and the CDP-attach test in the same short session (do the manual search first as a sanity check, then immediately the automated one) — this keeps Codex's variable-isolation discipline while keeping Claude's time/cost efficiency.

## 8. Team fallback candidate

A minimal, read-only browser extension that extracts results from a page the Product Owner searched manually in their own active tab. Both independent answers name this as the fallback for the same reason: it removes the automation-detection variable entirely, at the cost of requiring the Product Owner to manually trigger each search.

## 9. The exact Gate 0 to run first

1. Product Owner performs one manual, two-keyword Google search in their own ordinary Chrome, on their own ordinary network. Confirm: normal SERP, no challenge. (Establishes the baseline — expected to pass, since this is the behavior the Product Owner has already reported working.)
2. Immediately after, in the same session: Product Owner restarts (or already has) that Chrome with `--remote-debugging-port=9222`. A local script (`chromium.connectOverCDP()`, reusing `apps/google-browser-search/lib/browser.mjs`'s extraction logic) submits one query to the same `google.com/search?q=...&hl=hu&gl=hu` URL pattern already used in the app, and attempts to extract organic results.
3. Record, per the directive's own required evidence: whether each step produced a normal SERP or a challenge, and which causal variable (network origin vs. automation-vs-trusted-session) the automated step's result actually isolates.

This is a discussion/decision artifact only — it is **not authorized to run** under JH-SUP-0011. Execution requires a separate, explicit Product Owner directive naming exactly this Gate 0.

## 10. Top five pitfalls most likely to kill Sprint 1

1. **Retrying a falsified architecture without changing the causal variable** (`HARD_STOP`) — the single most concrete risk given the session's own history of two Google-browser attempts from the same cloud host; Gate 0 must run in a genuinely different environment (the Product Owner's own machine/network), not another cloud variant.
2. **Automation-vs-network-origin left unseparated** (`HUMAN_OP_DEPENDENCY`) — if Gate 0 is skipped or conflated, a pass or fail can't be attributed to the right cause, and the next decision would be another guess.
3. **Redefining Sprint 1 after a technical path fails** (`HARD_STOP`) — already happened once (JH-SUP-0009); both independent analyses explicitly re-exclude Profession.hu/Brave/other engines again here.
4. **Accepting PASS without Product-Owner-visible live evidence** (`HARD_STOP`) — a health endpoint, a screenshot of a challenge, unit tests, or a manually-copied result list do not satisfy Sprint 1; only the Product Owner's own live two-term query with visible results does.
5. **CAPTCHA/unusual-traffic reappearing mid-session and being treated as something to work around** (`HARD_STOP` per-occurrence) — both analyses require an immediate stop, evidence preservation, and explicit `BLOCKED_HUMAN_PERMISSION`-style reporting, never a bypass attempt.

## 11. What we explicitly must NOT build/do next

- No new local worker service, extension, or companion app implementation — Gate 0 itself is a single throwaway script/manual check, not a product.
- No relocation/redeployment of the existing cloud application to a different host "to try again" without first running the cheap Gate 0 that would tell us whether that's even worth doing.
- No CAPTCHA-solving, stealth, fingerprint spoofing, proxy rotation, VPN "to be safe," or account farming, in any candidate.
- No parallel build of both the primary candidate and the fallback "to save time" — build only whichever Gate 0 result actually points to.
- No portal-adapter, Brave Search API, Firecrawl, job-ranking, notification, or production-integration work under this or the next directive unless the Product Owner explicitly changes the Sprint 1 requirement.

---

## Detailed comparison and risk register

See `docs/design/CLAUDE_SPRINT1_SOLUTION_AND_PITFALLS.md` (full pitfall table by category with likelihood/impact/detection/mitigation/classification, decision matrix across 13 scoring dimensions) and `docs/design/CODEX_SPRINT1_SOLUTION_AND_PITFALLS.md` (independently structured equivalent, including a minimal-safe-architecture sketch for after a passing Gate 0). Both are consistent with this synthesis; no material contradiction was found between them.

## Confirmation

`SPRINT_1.md` remains unchanged by this directive. `SPRINT_1_STATUS: NOT_DONE`.
