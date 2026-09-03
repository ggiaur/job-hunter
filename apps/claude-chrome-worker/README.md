# Claude Code + Official Chrome Worker

Purpose: reproduce the already-observed **Claude controls a normal Google Chrome browser** operating model on the on-prem Ubuntu server, without Playwright/Selenium and without a fresh automation-created Chromium context.

## Architecture

```text
on-prem Ubuntu Server
  -> Docker container
     -> Xvfb virtual display + Openbox
     -> official google-chrome-stable
     -> persistent real Chrome user profile
     -> official Anthropic Claude in Chrome extension
     -> Claude Code CLI
     -> noVNC, bound to host localhost only, for first-run setup/inspection
```

This container intentionally does **not** contain Playwright, Puppeteer, Selenium, stealth plugins, proxy logic or CAPTCHA tooling.

## Why this is materially different from the failed Gate 0

The failed `apps/google-browser-search` Gate 0 used Playwright-managed Chromium and a Playwright-created browser context. This worker launches the installed official Google Chrome binary directly and keeps its user profile across restarts. Browser control is delegated to Anthropic's official Claude in Chrome integration.

## Persistent state

Two named Docker volumes survive container recreation:

- `claude_chrome_profile` -> `/home/worker/.config/google-chrome`
- `claude_code_state` -> `/home/worker/.claude`

The first stores Chrome/extension/session state. The second stores Claude Code state. Do not commit either volume to Git.

## Build and start

From this directory:

```bash
export VNC_PASSWORD='use-a-strong-local-password'
docker compose build
docker compose up -d
```

Check the worker without contacting Google:

```bash
docker compose exec claude-chrome-worker worker-status
```

## First-run GUI setup

The noVNC service is deliberately bound to `127.0.0.1:6080` on the host. From an administrator workstation, create an SSH tunnel to the on-prem server:

```bash
ssh -L 6080:127.0.0.1:6080 <server>
```

Then open the local noVNC page in the administrator's browser. The Chrome window inside the container should show the local validation page.

The official Anthropic extension is force-installed by Chrome policy using extension ID:

`fcoeoabgfenejglbffodgkkbkcdhcgfn`

On first use, complete the normal Anthropic sign-in and permission prompts in Chrome. A Google account is not required by this container and must not be added merely to make automation appear human.

Claude Code is installed using Anthropic's official Linux installer. If Claude Code authentication is not already present in the persisted state volume, run:

```bash
docker compose exec claude-chrome-worker claude
```

and complete Anthropic's normal login flow.

## Safe local integration validation

**Do this before any external browser task.** The worker serves a page only inside the container at:

`http://127.0.0.1:8080/`

Ask Claude Code, using its Chrome integration, to:

1. read the page heading;
2. enter `JOB_HUNTER_BROWSER_OK` in the verification input;
3. click `Apply`;
4. report the resulting text.

Pass condition:

`LOCAL_BROWSER_CONTROL_PASS`

This proves Claude Code <-> Claude in Chrome browser control without generating Google Search traffic.

## Google safety gate

`JH-SUP-0014` remains authoritative until explicitly superseded by the Product Owner. Therefore merely building, starting, authenticating and locally validating this worker does **not** authorize a Google search.

No automated `google.com/search` request is allowed from the corporate egress during container validation. Any later Google test requires a separate explicit Product Owner directive defining a one-shot budget and stop conditions.

## Production notes

- Keep noVNC bound to host localhost; do not publish it to the LAN/Internet.
- Keep the Chrome profile persistent and dedicated to Job Hunter; do not reuse a personal browsing profile.
- Do not store Google credentials in this worker unless a later explicit design requires them. Ordinary Google Search does not require a Google account.
- Do not add Playwright launch flags, remote-debugging flags, proxies, stealth/fingerprint modification or CAPTCHA solving.
- The container is a dedicated browser workstation, not a stateless scraping job.
