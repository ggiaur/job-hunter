# Google Challenge Cause — Reconciliation (JH-SUP-0015)

Reconciles independent analyses: `CLAUDE_GOOGLE_CHALLENGE_CAUSE_ANALYSIS.md`,
`CODEX_GOOGLE_CHALLENGE_CAUSE_ANALYSIS.md`. Both written from the same static
JH-SUP-0013 evidence with zero new Google traffic. Codex additionally inspected
the locally installed Playwright 1.62.1 source directly (browser launch defaults),
which is more rigorous than Claude's general-knowledge claims on the same points
and is adopted here where the two differ in precision.

## PROVEN

- Google served a genuine Hungarian "unusual traffic" interstitial to the single
  Gate 0 request at 2026-09-03T20:23:27–29Z, naming public IP `78.131.58.101`.
- Exactly one Google Search navigation occurred (`gate0-onprem.mjs` contains one
  `page.goto`, no retry/fallback/loop — confirmed by direct source read by both agents).
- The browser was Playwright-managed Chromium 151.0.7922.34 ("Chrome for Testing"
  build per local `browsers.json`), not a user-installed branded Chrome profile.
- The context was a brand-new, non-persistent, cookie-less/history-less Playwright
  context (no storage state, no prior session).
- Per Playwright 1.62.1 source (Codex's direct read): this launch configuration
  defaults to `--no-sandbox` (no `chromiumSandbox: true` set), a temporary
  ephemeral user-data-dir, `--remote-debugging-pipe`, `--no-startup-window`, and a
  cluster of other test/automation-oriented Chromium switches
  (`--disable-background-networking`, `--disable-extensions`, `--no-first-run`,
  `--password-store=basic`, `--use-mock-keychain`, `--disable-sync`, etc.).
- No stealth/fingerprint-masking code, proxy, CAPTCHA-bypass, or headless flags
  were present in the executed code path.

## HIGH-CONFIDENCE (not directly proven, but very well supported)

- The challenge was not caused by request rate or query retries from this run —
  a single cold request cannot trigger a rate-based rule.
- The IP-reputation explanation is not *sufficient by itself* as the sole cause
  class: a verified genuine non-datacenter, organization-owned Hungarian ISP IP
  was challenged exactly as the earlier cloud/datacenter host was, weakening (not
  eliminating) network-class as the dominant factor.
- The environment carries multiple stacked automation-typical signals
  simultaneously (test-build Chromium, disposable/history-less context, CDP pipe,
  virtual-display Docker/Xvfb rendering, `--no-sandbox`), which is jointly
  consistent with a fingerprint/automation-weighted contribution to the decision.

## POSSIBLE BUT UNPROVEN

- Pre-existing reputation or prior high-volume/automated activity on the shared
  organizational public IP or another NATed device behind it, independent of this
  test.
- A combined-signal (ensemble) decision blending network-history and
  session/automation signals — plausible, not isolable from one data point.
- Any specific automation signal (e.g. `navigator.webdriver`, TLS/HTTP fingerprint,
  CDP exposure) as the individual deciding factor — none of these values were
  actually captured in the evidence; their presence as Playwright defaults is
  proven, but their causal weight in Google's decision is not.
- Query-context-specific classifier behavior for `IT vezető` — very low
  plausibility, not excluded outright.

## RULED OUT / WEAKENED

- **Ruled out**: proxy/relay misattribution (challenge named our own independently
  verified real IP).
- **Ruled out**: in-run request rate/retry as cause (single cold request, no prior
  traffic in this context).
- **Ruled out** as the executed code path: any stealth, bypass, second query, or
  fallback mechanism — none exist in `gate0-onprem.mjs`.
- **Weakened**: "datacenter/cloud IP reputation" as the primary sufficient cause —
  the shared conclusion of JH-SUP-0011/JH-SUP-0012 — given this non-datacenter IP
  was challenged identically.
- **Not causal**: the `xvfb-run` cleanup error in the container log occurred after
  evidence was already written; unrelated to the challenge decision.

## CANNOT BE DETERMINED FROM AVAILABLE EVIDENCE

- The exact signal or combination of signals Google's classifier actually weighted
  (network history vs. session/browser fingerprint vs. both) — this requires
  Google's internal telemetry, which is inaccessible and out of scope.
- Whether other devices behind the same public IP generated prior automated Google
  traffic — no firewall/router/proxy/DNS log source was available in this session's
  evidence set to confirm or deny.
- Actual observed values for `navigator.webdriver`, TLS/HTTP2 fingerprint, or other
  page-level automation signals during the real run — not captured by the probe
  and not reconstructable from the screenshot/JSON alone.

## Agreement / disagreement between Claude and Codex

**Agreement**: both analyses converge on the same top-level conclusion — the
IP-reputation-alone hypothesis is weakened, not eliminated; automation/session
fingerprint signals are a live and plausible contributor; the single data point
cannot isolate one exact cause; shared-IP prior history remains a genuinely
unresolved alternative with no local evidence either way; query content and
in-run rate are both very low probability.

**Disagreement (of degree, not conclusion)**: Claude's original ranking placed
"automation/browser fingerprint" as the clear #1 cause. Codex's ranking, using
direct Playwright-source evidence, places "existing IP/NAT reputation or history"
and "combined network+session signal" as marginally higher or equal plausibility
to "automation alone," and explicitly cautions against asserting unmeasured
signals (e.g. `navigator.webdriver`) as observed fact. This reconciliation adopts
Codex's more conservative framing as the team position: **automation/session
signals and IP/network history are both live, roughly comparable-plausibility
contributors, more likely acting in combination than either alone being
sufficient** — not a single dominant cause.

## Strongest defensible team answer to the Product Owner

Google's anti-abuse system classified this single search request as requiring
human verification. The most defensible statement: the block was very likely
driven by a combination of (a) automation/session-level signals inherent to a
fresh, cookie-less, Playwright-managed "Chrome for Testing" instance launched
with test-oriented Chromium defaults under a virtual display, and (b) the
possibility of pre-existing reputation or history on the shared organizational
public IP, which cannot be confirmed or excluded from evidence available in this
session. It was **not** primarily a simple "datacenter IP" penalty, since a
verified genuine non-datacenter organizational IP was challenged identically to
the earlier cloud test. Google does not disclose its internal decision weights,
so no stronger causal claim is defensible without either Google's telemetry or a
controlled experiment — and no such experiment is authorized; the JH-SUP-0014
network hard stop remains in force.
