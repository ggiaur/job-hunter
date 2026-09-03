# JH-SUP-0020 — SerpApi Live Proof Search

## Priority
P0. Execute immediately. Product Owner explicitly requires a proven live search result now.

## Exact query
Run the exact query:

`CÉGINFO WWW.VMK.HU`

## Required path
Use **SerpApi Google Search API** as the primary execution path. Do not use the previously rejected Playwright/Chrome Google automation path and do not send automated Google Search traffic from the corporate IP.

## Credential handling
1. First check whether a usable SerpApi API key already exists in the runtime environment / approved secret store. Do not print or commit the key.
2. If no key exists, attempt to obtain the free SerpApi access using an already-authorized project/service identity if one is available.
3. Do not invent credentials or expose personal secrets.
4. If the only remaining blocker is human email/account verification, record that exact blocker immediately.

## Execution
If a key is available, execute one live SerpApi request using Google engine, Hungarian locale/region where supported, query exactly `CÉGINFO WWW.VMK.HU`.

Preserve:
- request timestamp;
- query;
- engine/provider;
- organic result position;
- title;
- destination URL;
- snippet where returned;
- raw API JSON with the API key removed/redacted.

## Required evidence
Create:
- `docs/evidence/SERPAPI_LIVE_PROOF_CEGINFO_VMK.md`
- `docs/evidence/serpapi-live-proof-ceginfo-vmk.json`

The Markdown evidence must show at least the first 5 organic results if available, in exact returned order.

## Success status
Update `docs/agent-runtime/product-supervisor-ack.yaml` with:
- `SERPAPI_LIVE_PROOF_PASS` if at least one genuine organic result with title+URL is returned;
- `SERPAPI_LIVE_PROOF_BLOCKED_CREDENTIAL` only if no usable key/account can be obtained without unavoidable human verification;
- precise provider error otherwise.

This is execution, not research. Stop only after live result or a concrete unavoidable credential blocker is recorded.
