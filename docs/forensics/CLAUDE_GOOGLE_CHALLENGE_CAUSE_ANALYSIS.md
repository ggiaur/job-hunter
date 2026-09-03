# Claude — Google Challenge Cause Analysis (JH-SUP-0015)

Independent analysis. No new Google request made or needed; based entirely on
JH-SUP-0013 evidence already on disk: `docs/evidence/SPRINT1_ONPREM_DOCKER_GATE0.md`,
`gate0-2026-09-03T20-23-27-974Z.json`/`.png`, `gate0-onprem.mjs`, `Dockerfile.gate0`,
`run-gate0-onprem.sh`.

## A. What exactly is proven by the challenge page?

The screenshot text (Hungarian, machine-translated): "Our systems detected unusual
traffic from your computer network. This page checks whether you are really sending
the requests and not a robot," followed by `IP-cím: 78.131.58.101`, a timestamp, and
the exact request URL. This proves only that Google's abuse-detection system classified
*this specific request* as suspicious enough to interstitial-gate at time of arrival.
It does not disclose which signal(s) triggered it — IP reputation, TLS/HTTP
fingerprint, browser automation fingerprint, request-header profile, or a
combination. Google does not expose that in the challenge page by design.

## B. Does naming IP 78.131.58.101 prove IP reputation caused the block?

No. Google always echoes the requester's observed public IP on this interstitial —
it is diagnostic display, not a causal statement. It identifies *egress*, not *cause*.
It does rule out one specific failure mode: this was not a proxy/relay misattribution
bug in our own script — the IP Google saw is the IP we actually verified we had. That
is the only thing it proves.

## C. Does one failed first query prove browser fingerprinting caused it?

No, for the same reason: a single data point cannot isolate a specific cause when
multiple candidate signals were present simultaneously in this one run (see D). It is
consistent with a fingerprinting cause, but "consistent with" is not "proven by."

## D. Automation-specific properties of this exact run

From reading `gate0-onprem.mjs` and `Dockerfile.gate0` directly (no network request needed):

- `chromium.launch({ headless: false })` — Playwright-managed Chromium (base image
  `mcr.microsoft.com/playwright:v1.62.1-noble`), **not** branded Google Chrome. Playwright
  ships its own Chromium build; Google's abuse systems are known (publicly documented
  behavior, not internal knowledge) to weight non-Chrome/Chromium-build signals
  differently from a stock retail Chrome binary.
- No `args` passed to `launch()` — Playwright's default launch flags apply, which
  historically include `--enable-automation`-class switches unless explicitly
  suppressed. The script does not pass `--disable-blink-features=AutomationControlled`
  or any other de-fingerprinting flag.
  present.
- `browser.newContext(...)` creates a **brand-new, cookie-less, history-less** context —
  zero prior Google session, zero prior consent-cookie state, zero prior browsing
  history on this profile. A context with no organic browsing history behind it before
  hitting a Google SERP directly is itself an unusual traffic pattern versus a real
  user's browser.
  the first URL loaded in that fresh context.
- `xvfb-run` virtual display: real rendering happens, but under a virtual framebuffer
  inside a container — screen/display properties (`screen.width/height`, color depth,
  `devicePixelRatio`) can differ from a physical display's typical values, another
  weak fingerprint signal.
- Docker container environment: container-typical `/proc`, timezone/locale set
  programmatically (`hu-HU` / `Europe/Budapest`) rather than inherited from an
  actual OS install — consistent with, though not conclusive of, an automated
  environment.
- Sandbox state: no `--no-sandbox` flag was passed (good — that specific flag is a
  commonly-cited strong automation signal, and it was correctly *not* used here).

None of these individually is dispositive; several stacked together on the very first
request is the relevant observation.

## E. Could prior reputation of the organizational IP or another NATed host be causal?

Possible, cannot be ruled in or out from local evidence alone. `secure.vmk.hu` is a
shared organizational egress; if any other host/device behind the same public IP has
recently run bulk/automated/scraping traffic against Google (or any Google property)
this would plausibly poison the shared IP's reputation window, independent of anything
this test did.

What local evidence could help without contacting Google: router/firewall/proxy logs
showing outbound traffic volume and destinations from this public IP over the days
preceding 2026-09-03T20:23. I do not have access to that infrastructure from this
session (no firewall/router log source was made available in the evidence set), so
this remains **unresolved**, not ruled out.

## F. Could the query itself or request rate explain it?

Rate: no — this was a single, cold, first-ever request from a fresh context, so a
rate-based signal (too many requests too fast) is not plausible; there was no prior
request to be "too fast" relative to.

Query content: `IT vezető` is an ordinary, non-suspicious two-word Hungarian query
(IT manager/lead). No injection characters, no automation-typical query patterns
(e.g., sequential dictionary queries). Very low probability this is causal.

Ranking: query content — negligible probability. Rate — negligible probability
(no prior requests existed to establish a rate).

## G. What can now be ruled out, weakened, or remains live?

- **Ruled out**: proxy/relay misattribution (the challenge named our own verified real IP).
- **Ruled out**: request rate (single cold request, no prior traffic from this context).
- **Weakened** (per `SPRINT1_ONPREM_DOCKER_GATE0.md`'s own conclusion, which I concur
  with): datacenter/cloud-IP-reputation as the *primary sufficient* cause — a genuine
  non-datacenter ISP-assigned organizational IP was challenged exactly as the earlier
  cloud host was.
- **Live**: automation/browser-fingerprint signals (non-Chrome-branded Chromium build,
  default Playwright launch args, cookie-less/history-less fresh context, virtual
  display environment) — plausible, stacked, unproven individually.
- **Live, unresolved**: shared-IP reputation contamination from other traffic on the
  same organizational egress — no local evidence available either way.
- **Live, weak**: query content or rate — very low probability per F.

## H. Ranked cause matrix

| Rank | Cause | Confidence | Evidence for | Evidence against |
|---|---|---|---|---|
| 1 | Automation/browser fingerprint (non-branded Chromium, default launch args, fresh/history-less context, virtual display) | Moderate | Multiple stacked automation-typical signals present simultaneously on first request; publicly documented that Google's abuse systems consider browser-automation signals | No single signal individually proven causal; cannot isolate from B/C |
| 2 | Shared organizational IP reputation contamination (not datacenter reputation — prior misuse on the same egress) | Low-Moderate | Plausible mechanism, consistent with block occurring on first request from this script | No log evidence available to confirm or deny |
| 3 | Datacenter/cloud IP-reputation (original hypothesis from JH-SUP-0011/0012) | Weakened, Low as sole cause | N/A | This IP is verified non-datacenter, organization-owned; still challenged |
| 4 | Query content or request rate | Very low | N/A | Ordinary query, single cold request, no rate signal possible |

## I. Strongest defensible answer to "Why did Google react this way?"

The most defensible statement, without claiming access to Google's proprietary
telemetry: **the block was very likely triggered primarily by automation-detectable
signals in how the browser session was constructed and driven (a non-Chrome-branded
Playwright Chromium instance, default automation-typical launch configuration, and a
brand-new session with no prior browsing history, hitting a Google SERP as its first
and only action) — not primarily by the IP address's network class, since a genuine
verified non-datacenter organizational IP was challenged identically to the earlier
cloud test.** A secondary, currently unverifiable possibility is pre-existing
reputation on the shared organizational egress unrelated to this test. Google's
internal scoring weights are not observable from outside, so this is a
best-evidence ranking, not a proof.
