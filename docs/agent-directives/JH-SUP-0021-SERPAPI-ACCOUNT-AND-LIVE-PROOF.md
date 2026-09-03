# JH-SUP-0021 — Create SerpApi Free Account and Execute Live Proof Search

## Authority / priority

P0. Product Owner explicitly ordered: create the SerpApi registration now and produce a real result. Execute immediately.

## Goal

Create a SerpApi Free account, securely obtain/store the API key on the on-prem Job Hunter environment, then execute the exact Google query:

`CÉGINFO WWW.VMK.HU`

and preserve the raw SerpApi JSON plus a human-readable title+URL result list.

## Registration method

Use SerpApi's official signup page: `https://serpapi.com/users/sign_up`.

Preferred order:
1. If the local browser session is already authenticated to the GitHub identity that owns/operates `ggiaur/job-hunter`, use **Sign up with GitHub**.
2. Otherwise, if an authorized Google identity is already signed in and appropriate for Job Hunter, use **Sign up with Google**.
3. Do NOT invent an email/password, do NOT create a new mailbox, and do NOT ask the Product Owner to paste secrets into chat.

If OAuth presents a normal consent screen, the Product Owner's explicit instruction to create the account authorizes ordinary SerpApi account creation and acceptance of SerpApi's signup flow. If the identity selector is ambiguous, a CAPTCHA/2FA requires the human, or no authorized signed-in identity exists, stop only at that exact point with `BLOCKED_HUMAN_OAUTH` and preserve everything already completed.

## API key handling

After account creation:
- retrieve the SerpApi API key from the SerpApi dashboard;
- store it only on the on-prem server in a non-versioned secret location or environment file with restrictive permissions;
- do NOT commit or print the full key into GitHub evidence;
- evidence may show only a redacted fingerprint such as first 4 + last 4 characters.

## Live proof search

Use the SerpApi Google engine, not direct automated `google.com/search` from corporate egress.

Exact query:
`CÉGINFO WWW.VMK.HU`

Recommended parameters:
- `engine=google`
- `q=CÉGINFO WWW.VMK.HU`
- `hl=hu`
- `gl=hu`
- return organic results

Acceptance requires at least one organic result with:
- position
- title
- destination URL
- snippet if present

## Evidence

Create:
- `docs/evidence/SERPAPI_CEGINFO_VMK_LIVE_PROOF.md`
- `docs/evidence/serpapi-ceginfo-vmk-live-proof.json`

The raw JSON evidence must have the API key removed/redacted before commit.

Record:
- registration path used (GitHub OAuth / Google OAuth);
- Free plan confirmed;
- API key stored locally (redacted fingerprint only);
- exact query;
- timestamp;
- organic title+URL results;
- whether VMK-related result(s) were returned;
- total direct automated `google.com/search` requests from Job Hunter corporate egress under this directive = 0.

Update `docs/agent-runtime/product-supervisor-ack.yaml` with one of:
- `SERPAPI_LIVE_PROOF_PASS`
- `BLOCKED_HUMAN_OAUTH`
- `SERPAPI_LIVE_PROOF_FAIL`

Do not broaden scope. The Product Owner wants the account created and the proof result now.