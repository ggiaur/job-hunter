# SerpApi Live Proof — CÉGINFO WWW.VMK.HU (JH-SUP-0020)

**Result: BLOCKED_CREDENTIAL**

## Attempted

Timestamp: 2026-09-03T22:02:29Z
Query (exact, per directive): `CÉGINFO WWW.VMK.HU`
Required path: SerpApi Google Search API. No Playwright/Chrome Google automation
was used or considered. No automated request was sent to `google.com` from the
corporate IP or any other network.

## Credential check performed

1. `env | grep -i serp` / `env | grep -i SERPAPI` — no SerpApi-related
   environment variable found.
2. `find` across the repo for `.env*` files and across common filesystem
   locations for anything named `*serpapi*` — none found.
3. `gh secret list` / `gh variable list` on `ggiaur/job-hunter` — `gh` CLI is
   not authenticated in this session (`gh auth login` required); could not
   enumerate GitHub-stored repo secrets this way. Git push/pull to GitHub
   itself works via a separately configured credential, which is unrelated to
   `gh` CLI auth and does not expose secret values.
4. Broad `printenv` scan for any API-key/token-shaped variable that could
   plausibly be a SerpApi key — none found.

**No usable SerpApi API key exists in any location accessible to this session.**

## Attempt to obtain free access

Per the directive's instruction ("attempt to obtain the free SerpApi access
using an already-authorized project/service identity if one is available"):
no already-authorized SerpApi project/service identity is available to this
session — no prior account, no stored credential, no linked service identity
of any kind was found.

SerpApi's free-tier signup (per the JH-SUP-0016/0017 research already on
record) requires creating a new account, which in turn requires a real email
address, completing an email-based verification step, and agreeing to SerpApi's
own terms of service on behalf of the organization. Per the directive's own
explicit instruction ("Do not invent credentials or expose personal secrets"),
this session did not attempt to fabricate an identity, register an account
under an invented email, or use any personal credential to sign up.

## Exact unavoidable blocker

**Human email/account verification.** A SerpApi API key cannot be obtained
without a human (the Product Owner, or someone they designate) completing
account signup and email verification at serpapi.com, then providing the
resulting API key to this session through an approved secret-storage
mechanism (repository secret, environment variable, or equivalent) — not
committed to the repository in plaintext.

## Next step

Once the Product Owner (or a designated team member) completes SerpApi
signup and supplies the API key via an approved secret channel, this exact
directive's query (`CÉGINFO WWW.VMK.HU`) can be executed in a single follow-up
run with zero additional research needed — the request/response handling,
evidence format, and redaction approach are already specified and ready.

## Compliance

Zero Google Search traffic. Zero fabricated credentials. Zero secrets printed
or committed.
