# JH-SUP-0018 — Build and Validate Claude Code + Official Chrome Worker Container

## Priority / authority

P0, execute immediately. Product Owner explicitly ordered the server-side container to be built around the same operating model that already works when Claude controls a normal Chrome browser: **Claude Code CLI + official Google Chrome + official Claude in Chrome extension**, not Playwright.

## Exact target

Use the committed implementation under:

`apps/claude-chrome-worker/`

Architecture:

```text
on-prem Ubuntu server
  -> Docker
     -> Xvfb/Openbox graphical session
     -> official google-chrome-stable launched directly
     -> persistent dedicated Chrome profile
     -> official Anthropic Claude in Chrome extension
     -> Claude Code CLI
```

No Playwright, Puppeteer, Selenium, remote-debugging launch flag, stealth/fingerprint modification, proxy, VPN or CAPTCHA tooling is authorized.

## Mandatory local execution

On the actual on-prem server where Claude is operating:

1. Pull/reconcile current `main`.
2. Review the files in `apps/claude-chrome-worker/` for correctness before running.
3. Fix ordinary Docker/Linux defects if found; keep the architectural constraints above.
4. Set a strong ephemeral/local VNC password without committing it.
5. Run:

```bash
cd apps/claude-chrome-worker
VNC_PASSWORD='<local-secret>' docker compose build
VNC_PASSWORD='<local-secret>' docker compose up -d
```

6. Run `docker compose exec claude-chrome-worker worker-status` and preserve output.
7. Verify the running binary is **Google Chrome**, not Chromium.
8. Verify the official Anthropic extension policy ID is present and Chrome has downloaded/installed the extension into the persistent profile.
9. Verify the Chrome profile survives one container restart.
10. Verify Claude Code CLI starts in the container and report its version/auth state. Do not copy or commit credentials.

## Browser-control validation — LOCAL ONLY

The container serves `http://127.0.0.1:8080/` internally. Use Claude Code + Claude in Chrome to interact with this local page only:

- read heading `CLAUDE_BROWSER_LOCAL_TEST_READY`;
- enter `JOB_HUNTER_BROWSER_OK`;
- click `Apply`;
- confirm `LOCAL_BROWSER_CONTROL_PASS`.

This is the acceptance test for CLI <-> Chrome extension browser control.

If Anthropic requires a one-time interactive sign-in or permission that cannot be completed without the Product Owner, finish all other build/validation first, preserve the running container/profile, and report exactly the single remaining human permission. Do not substitute Playwright.

## HARD GOOGLE SAFETY INVARIANT

JH-SUP-0014 remains binding for network safety.

**ZERO automated `google.com/search` requests are authorized under JH-SUP-0018.**

Do not use Google Search as a connectivity test. Do not retry the prior query. Do not use a different query. Do not log into a Google account. Do not open a Google search URL automatically.

Building the browser worker and proving local browser control are authorized; external Google Search testing is not.

## Required evidence

Create/update:

`docs/evidence/CLAUDE_CHROME_WORKER_CONTAINER.md`

Record:

- image build PASS/FAIL;
- container health;
- Chrome exact version and binary path;
- Claude Code version;
- official Claude extension install/profile state;
- persistent-profile restart result;
- local browser-control PASS/FAIL;
- any one-time Anthropic sign-in/permission blocker;
- explicit statement: total automated Google Search requests during JH-SUP-0018 = 0.

Update supervisor ACK with status:

- `CLAUDE_CHROME_WORKER_LOCAL_PASS`, or
- a precise `BLOCKED_HUMAN_PERMISSION` only if the sole remaining step is an unavoidable Anthropic interactive authorization.

Do not broaden into Job Hunter scheduling or Google production execution under this directive.
