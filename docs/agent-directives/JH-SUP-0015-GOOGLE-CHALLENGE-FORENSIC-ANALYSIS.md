# JH-SUP-0015 — Google Challenge Forensic Analysis (NO Google Traffic)

## Authority
Product Owner / PRODUCT_ARCHITECT_ORCHESTRATION_SUPERVISOR

## Priority
P0 analysis. Execute immediately. Supersedes JH-SUP-0014 only for analysis; the JH-SUP-0014 network hard stop remains in force as a safety constraint.

## Safety invariant
**NO new Google Search request is authorized from the on-prem network or any other Job Hunter environment under this directive.**
Do not open google.com/search, do not solve CAPTCHA, do not retry, do not run a browser variant against Google, do not use proxy/VPN/stealth/bypass.

## Objective
Determine, as precisely as available evidence permits, why Google's anti-abuse system returned `unusual traffic` for the single JH-SUP-0013 on-prem Docker/Playwright request. Separate proven facts from hypotheses. Explicitly state what cannot be known without Google's internal telemetry.

## Required independent analyses
1. Claude must produce its own forensic analysis.
2. Codex must independently analyze the same evidence without reading Claude's conclusion first where practical.
3. Claude then produces a reconciliation identifying agreements/disagreements.

## Evidence to inspect
- `docs/evidence/SPRINT1_ONPREM_DOCKER_GATE0.md`
- the JH-SUP-0013 JSON evidence and screenshot
- `apps/google-browser-search/gate0-onprem.mjs`
- `apps/google-browser-search/Dockerfile.gate0`
- exact Playwright/Chromium versions and default launch behavior
- browser launch command/flags if obtainable locally without network requests
- current Playwright source/docs relevant to automation-identifiable defaults
- local host/network facts already recorded
- existing firewall/router/proxy/DNS/log evidence if locally available and safe to inspect, specifically whether other hosts behind the same public IP generated automated/high-volume Google traffic before Gate 0

## Questions that must be answered
A. What exactly is proven by the Google challenge page?
B. Does naming public IP `78.131.58.101` prove IP reputation caused the block, or only identify the network egress?
C. Does one failed first query prove browser fingerprinting caused it? Why/why not?
D. Which Playwright/Chromium properties in this exact run were observably automation-specific (launch flags, webdriver exposure, remote-debugging pipe, fresh profile/context, sandbox state, Chromium vs branded Chrome, Xvfb/rendering environment, etc.)?
E. Could prior reputation/history of the organizational public IP or another NATed host still be causal? What local evidence would prove/disprove this without contacting Google?
F. Could the query itself (`IT vezető`) or request rate explain it? Rank probability with evidence.
G. What causal explanations can now be ruled out, weakened, or remain live?
H. Provide a ranked cause matrix with confidence levels and evidence for/against each cause.
I. State the strongest defensible answer to the Product Owner's question: "Why did Google react this way?" without pretending access to Google's proprietary anti-abuse telemetry.

## Required output
- `docs/forensics/CLAUDE_GOOGLE_CHALLENGE_CAUSE_ANALYSIS.md`
- `docs/forensics/CODEX_GOOGLE_CHALLENGE_CAUSE_ANALYSIS.md`
- `docs/forensics/GOOGLE_CHALLENGE_CAUSE_RECONCILIATION.md`

The reconciliation must begin with a concise section:
- `PROVEN`
- `HIGH-CONFIDENCE`
- `POSSIBLE BUT UNPROVEN`
- `RULED OUT / WEAKENED`
- `CANNOT BE DETERMINED FROM AVAILABLE EVIDENCE`

## Scope
Analysis only. No new Google requests. No implementation. No purchase. No bypass. Preserve the network hard stop.
