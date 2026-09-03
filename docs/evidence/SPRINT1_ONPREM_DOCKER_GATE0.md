# Sprint 1 On-Prem Docker Gate 0 — Result (JH-SUP-0013)

**Result: FAIL (GOOGLE_CHALLENGE)**

## Host identity (verified, not assumed)

- Public IP: `78.131.58.101`
- Reverse DNS: `secure.vmk.hu` (the Product Owner's own organization)
- Network: AS20845 DIGI Távközlési és Szolgáltató Kft. — a genuine Hungarian ISP/telecom, **not** a cloud/datacenter provider (not AWS/GCP/Azure/Hetzner/OVH/DigitalOcean etc.)
- Location: Székesfehérvár, Fejér, Hungary — a real organizational site, not a datacenter region
- OS: Ubuntu 26.04 LTS, hostname `dev-docker`
- Confirmed live via `curl https://ifconfig.me` and `curl https://ipinfo.io/json` immediately before execution, not assumed from the directive's description alone.

This is the exact on-prem, non-datacenter environment JH-SUP-0013 required to be verified before running Gate 0.

## Execution

Command run exactly as specified:

```bash
bash apps/google-browser-search/run-gate0-onprem.sh "IT vezető"
```

- Docker: 29.7.2, confirmed usable (other containers already running on this host).
- Container browser: Chromium 151.0.7922.34 (Playwright-managed, `mcr.microsoft.com/playwright:v1.62.1-noble` base image).
- Headed mode under Xvfb inside the container, as specified — not headless.
- Exactly one query, no retry, no fallback query, no proxy, no stealth, no CAPTCHA bypass, no Firecrawl.

## Result

```json
{
  "gate": "SPRINT1_EXACT_FINAL_ENVIRONMENT_GATE0",
  "query": "IT vezető",
  "startedAt": "2026-09-03T20:23:27.974Z",
  "host": "ac9b0b858c7e",
  "finalEnvironmentClaim": "on-prem Docker worker",
  "googleUrl": "https://www.google.com/search?q=IT%20vezet%C5%91&hl=hu&gl=hu",
  "browser": "151.0.7922.34",
  "consentHandled": false,
  "challenge": true,
  "organicResults": [],
  "status": "FAIL",
  "reason": "GOOGLE_CHALLENGE",
  "finishedAt": "2026-09-03T20:23:29.896Z"
}
```

The screenshot (`evidence/gate0-2026-09-03T20-23-27-974Z.png`) shows Google's real "unusual traffic" interstitial, in Hungarian, and **explicitly names the exact real IP that was blocked: `78.131.58.101`** — the on-prem organizational IP itself, confirming this is not a proxy/relay artifact or a misconfiguration; Google genuinely challenged this specific, verified non-datacenter IP.

No consent dialog appeared before the challenge (`consentHandled: false`) — the challenge was presented immediately.

## Interpretation — this changes the working hypothesis

Every prior JH-SUP-0007/0008/0011/0012 analysis (mine and Codex's both) operated on the working hypothesis that **datacenter/cloud IP reputation** was the primary suspected cause, with "automation itself, independent of network class" as an acknowledged but unresolved alternative. This Gate 0 result is the first real test that isolates the two variables, and it comes out against the IP-reputation hypothesis: a genuine, verified, non-datacenter, organization-owned Hungarian ISP IP was challenged on the very first automated request, exactly as the cloud host was.

This does not yet prove the cause is "automation/headless-adjacent browser fingerprinting" with certainty — but it substantially weakens the network-origin explanation that was the shared primary recommendation of JH-SUP-0011 and JH-SUP-0012, and shifts weight toward browser/session/fingerprint-level signals as the more likely cause.

## Runtime note (not part of the product result)

The wrapper script's overall process exit code was `5`, while `gate0-onprem.mjs` itself reports and would independently exit `2` for `GOOGLE_CHALLENGE`. The container log shows `xvfb-run: error: problem while cleaning up temporary directory` printed after the script had already written its evidence JSON/screenshot and printed its own result — this is an Xvfb temp-directory cleanup issue occurring after the actual test completed, not a failure of the test itself. The JSON evidence and screenshot are the authoritative record of what happened; both are internally consistent and were written before this cleanup message appeared.

## Compliance

No retry was attempted. No stealth, proxy, fingerprint change, or CAPTCHA bypass was used. Evidence preserved at:
- `apps/google-browser-search/evidence/gate0-2026-09-03T20-23-27-974Z.json`
- `apps/google-browser-search/evidence/gate0-2026-09-03T20-23-27-974Z.png`
