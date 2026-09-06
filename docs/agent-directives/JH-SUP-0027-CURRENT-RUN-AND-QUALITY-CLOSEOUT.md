# JH-SUP-0027 — Fresh live run + operational quality closeout

**Priority:** P0
**Mode:** execute immediately; implementation/operation, not research

## Product Owner intent

The Job Hunter must not stop merely because the previous directive reached PASS. The Product Owner wants current, real, apply-worthy vacancies and continuous improvement of the running system.

## Required work

1. Run the current Job Hunter pipeline live immediately using the already-operational acquisition stack.
2. Produce **7–15 currently live, genuinely relevant vacancies** if that many exist, prioritizing Pillér-like roles:
   - IT/digitalisation project or programme leadership;
   - cross-functional coordination, delivery ownership, decision support;
   - IT manager / department / infrastructure / service leadership where genuinely relevant;
   - institutional, public-service, nonprofit, regulated or large-enterprise environments are a positive signal but not a hard requirement.
3. Apply the current approved language rule exactly:
   - mandatory advanced/fluent/negotiation/native-level English => reject;
   - intermediate/basic English => allowed;
   - English merely as an advantage => allowed.
4. Re-check each visible vacancy for current reachability and validity. Remove expired, closed, redirected-to-generic-listing, or otherwise stale records from the user-visible set.
5. Persist a new timestamped run snapshot and human-readable current-run evidence. The Product Owner must be able to see title, company, location/work arrangement, language requirement, relevance %, direct URL, and concise fit/mismatch reasons.
6. Verify the unattended schedule is actually installed and active. Record the exact cron entry, cron service status, and next expected scheduled execution according to server time. Do not merely inspect repository timer files.
7. Close the one disclosed quality gap from JH-SUP-0026: the final one-line bare `projektmenedzser` acquisition fix that restored Pillér must receive a fresh independent falsification/review if Codex and Gemini capacity is available. If either review cannot run because of external/session limits, state that precisely and do not falsely claim review coverage.
8. Re-run the known-positive canaries (Pillér, EN-CO, Swiss Medical if still live). Canary success means genuinely acquired and evaluated through real acquisition, never injected.
9. If the live run exposes a false positive or false negative, fix the causal stage, add regression evidence, and rerun before PASS.

## Acceptance

PASS only when:
- a fresh live run has completed under this directive;
- 7–15 live relevant jobs are surfaced if available, otherwise the actual smaller count is justified with funnel evidence;
- Pillér-like preference is reflected in ranking;
- stale/closed roles are not presented as current;
- current cron operation is verified on-host;
- the outstanding independent-review gap is closed or explicitly documented as externally blocked;
- fresh evidence is committed.

## Required evidence

- `docs/evidence/REAL_JOB_HUNTER_CURRENT_RUN.md` updated with the fresh run
- `docs/evidence/real-job-hunter-current-run.json` updated
- timestamped run under `docs/evidence/job-hunter-runs/`
- ACK status: `JOB_HUNTER_CURRENT_OPERATIONAL_PASS` or one precise blocker

Do not stop at design or status commentary. Execute the live run and preserve evidence.