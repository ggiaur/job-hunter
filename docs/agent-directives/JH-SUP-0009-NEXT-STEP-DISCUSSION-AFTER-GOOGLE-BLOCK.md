# JH-SUP-0009 — NEXT-STEP DISCUSSION AFTER GOOGLE BLOCK

**Priority:** P0 / PRODUCT OWNER REQUEST
**Status:** ACTIVE — DESIGN/DISCUSSION ONLY
**Execution owner:** Cloud Claude / sole ACTIVE_ORCHESTRATOR
**Supersedes:** JH-SUP-0008 for current execution

## Product Owner request

The Product Owner wants the team to discuss the continuation again after the live Google-browser application was proven blocked by Google's unusual-traffic/CAPTCHA response from the current cloud host/IP.

Do not build anything in this directive. The broad development freeze is fully back in force. No application code, PoC, deployment, Firecrawl work, Google retries, browser retries, or production integration is authorized.

The purpose is to produce concrete engineering answers for the Product Owner before any next implementation is chosen.

## Known facts that must be treated as evidence, not debated away

1. `apps/google-browser-search/` exists and was executed.
2. The required searches were run through the committed application.
3. Google returned a real unusual-traffic/CAPTCHA challenge from the cloud host/IP.
4. Two fresh profiles / independent runs reproduced the host/IP-level block.
5. No anti-bot bypass was attempted and none is authorized.
6. Firecrawl-heavy discovery is not an acceptable default continuation.
7. The Product Owner wants a system that produces useful real job results, not merely a technically elegant search component.
8. Do not wait for Gemini. Gemini may contribute only if immediately available without delaying Claude/Codex answers.

## Required independent answers

### A. Claude

Write `docs/design/CLAUDE_NEXT_STEP_AFTER_GOOGLE_BLOCK.md`.

Answer independently before reading any new Codex/Gemini answer. At minimum:

- What is the best next architecture now that cloud -> google.com browser automation is falsified on this host/IP?
- Compare at least these classes, without assuming one wins:
  1. official Google Search grounding / official Google-supported search capability available to an application;
  2. local/residential browser worker using a dedicated normal Chrome/Chromium session outside the datacenter IP;
  3. any other legitimate search/discovery mechanism worth considering.
- For every candidate: expected result quality, operational reliability, cost, implementation complexity, dependence on credentials/accounts, policy/ToS risk, ability to return exact URLs, and how closely it reproduces the Product Owner's manual Google behavior.
- Identify the **cheapest live falsification test** that must run before building anything substantial.
- Recommend one primary next experiment and one fallback.
- Explicitly state what should NOT be built next.

### B. Codex

Dispatch the same factual problem statement to Codex independently, without showing Claude's new answer first.

Codex writes `docs/design/CODEX_NEXT_STEP_AFTER_GOOGLE_BLOCK.md` with the same decision questions and evidence requirements.

### C. Gemini — non-blocking only

If a clean Gemini channel is immediately available, obtain an independent answer in `docs/design/GEMINI_NEXT_STEP_AFTER_GOOGLE_BLOCK.md`.

If Gemini is not immediately available, record `GEMINI_NOT_AVAILABLE_NONBLOCKING` and continue. Do not wait, repair Gemini tooling, change permissions, or delay the Product Owner's answer.

## Required synthesis

After Claude and Codex answers exist (Gemini optional/non-blocking), write:

`docs/design/NEXT_STEP_AFTER_GOOGLE_BLOCK_DECISION.md`

The synthesis must include:

- agreement/disagreement matrix;
- the smallest experiment that can falsify each serious candidate architecture;
- estimated engineering effort before first real result (not full production build);
- external service/API cost assumptions clearly separated from verified costs;
- primary recommendation;
- fallback recommendation;
- explicit stop conditions;
- **NO IMPLEMENTATION AUTHORIZATION**.

Do not choose based on architectural elegance. Choose based on the probability of returning real, inspectable, relevant job results with the least wasted engineering work.

## Product-owner answer format

The final synthesis must be understandable without reading all internal files. Put a short top section with:

1. Claude says: ...
2. Codex says: ...
3. Gemini says: ... / not available without blocking
4. Team recommendation: ...
5. First test to run: ...
6. Why this test is different from the failed Google-browser build: ...

## Completion

Update `docs/agent-runtime/product-supervisor-ack.yaml`:

- `last_seen_directive_id: JH-SUP-0009`
- `last_accepted_directive_id: JH-SUP-0009`
- `last_applied_directive_id: JH-SUP-0009`
- status `DISCUSSION_COMPLETE`
- evidence paths for Claude, Codex, optional Gemini, and synthesis.

Then stop. No code changes beyond discussion/evidence files are authorized.