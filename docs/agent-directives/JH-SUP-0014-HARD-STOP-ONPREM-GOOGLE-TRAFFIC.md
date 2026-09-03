# JH-SUP-0014 — HARD STOP: On-Prem Google Traffic

## Authority
Product Owner / PRODUCT_ARCHITECT_ORCHESTRATION_SUPERVISOR.

## Reason
JH-SUP-0013 authoritative on-prem Gate 0 returned GOOGLE_CHALLENGE on the first and only request. The challenge explicitly identified the organization's real public IP `78.131.58.101` (secure.vmk.hu / AS20845 DIGI). This environment must therefore not be probed again automatically.

## Immediate rule
Effective immediately, **no further automated Google Search requests may be sent from the organization's on-prem network / public IP 78.131.58.101 under Job Hunter** until the Product Owner explicitly authorizes a new test.

This includes, without limitation:
- no retries;
- no second diagnostic query;
- no alternative Chromium flags;
- no headless/headed comparison;
- no profile/session experiment;
- no Docker variation;
- no scheduled test;
- no background health check that touches Google;
- no proxy/stealth/fingerprint manipulation/bypass;
- no Google-account login experiment.

The JH-SUP-0013 evidence is authoritative and sufficient for this environment.

## Required action
1. Stop/disable any pending or scheduled Job Hunter Google test on the on-prem host.
2. Do not run `run-gate0-onprem.sh` again.
3. Preserve all JH-SUP-0013 evidence unchanged.
4. Update supervisor ACK to `JH-SUP-0014` with status `ONPREM_GOOGLE_TRAFFIC_HARD_STOP_APPLIED` and confirm no further Google request was issued after the JH-SUP-0013 Gate 0.
5. Broad development freeze remains in force unless separately authorized.

No Product Owner action is required merely to stop; stopping is mandatory. Any future Google test from this network requires a new explicit Product Owner authorization.
