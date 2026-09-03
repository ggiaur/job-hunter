# Claude — Sprint 1 solution and pitfalls (JH-SUP-0011, canonical)

## Exact interpretation of Sprint 1

A runnable system accepts two short ordinary keywords, submits them to real `google.com/search`, reads the live rendered result page, and exposes real organic results (at minimum exact title + URL, snippet when available) for the Product Owner to inspect. Nothing else counts. `SPRINT_1_STATUS: NOT_DONE`.

## What is already falsified

Cloud-host headless Chromium (Playwright), two independent implementations (JH-SUP-0007 PoC, JH-SUP-0008 app), two fresh profiles, both hit a real CAPTCHA/unusual-traffic challenge on the *first* request. This proves the current cloud host + fresh-automated-profile combination does not work. It does **not** isolate whether the cause is IP-class specifically versus "any automated browser control against a fresh Google session" more generally — no test has ever separated those two variables.

## Mandatory candidates evaluated

1. **User-controlled local browser worker** (non-datacenter network, real Chrome profile) — a local Node+Playwright script attached via `chromium.connectOverCDP()` to the Product Owner's own already-running, already-logged-in Chrome (started once with `--remote-debugging-port=9222`), reusing the already-built extraction code (`apps/google-browser-search/lib/extract.mjs`/`browser.mjs`).
2. **Browser extension / local companion** — a minimal unpacked Chrome extension: the PO manually types and submits the query in their own session, a content script reads the rendered `#search` DOM and reports title/URL/snippet to a popup. No programmatic navigation at all.
3. **Different execution environment/network for the existing app** — same `apps/google-browser-search/` code, run from a non-cloud-datacenter host. Isolates network-origin from browser/session factors, but requires provisioning a machine outside this project's current infrastructure — an owner decision, not free.
4. **Human-in-the-loop browser session** — ordinary manual consent/occasional-challenge handling permitted; no CAPTCHA-solving, stealth, fingerprint spoofing, proxy rotation, or account farming. Candidates 1 and 2 both already satisfy this without extra design.
5. No other legitimate mechanism identified beyond variants of 1-4 that still literally submits to Google and reads Google's own page.

**Explicitly not Sprint 1** (useful later, not now): official search APIs (Brave Search API, Google Programmable/Custom Search), portal-native adapters (profession.hu etc.), Firecrawl, any non-Google search engine.

## Pitfall / risk register

Columns: Likelihood, Impact, Detection, Mitigation, Classification (`HARD_STOP` / `HUMAN_OP_DEPENDENCY` / `ACCEPTABLE_RISK`).

### Google / anti-automation / access

| Pitfall | Likelihood | Impact | Detection | Mitigation | Classification |
|---|---|---|---|---|---|
| Datacenter IP reputation | Confirmed on current host | High | Already observed (2x) | Move to non-datacenter origin (candidates 1-3) | HARD_STOP on current cloud host |
| Headless/fingerprint vs. network effect, unseparated | High (genuinely unknown) | High — determines viable candidate | Gate 0 below resolves this directly | Run Gate 0 before choosing candidate 1 vs 2 | HUMAN_OP_DEPENDENCY (needs a real test, not a guess) |
| CAPTCHA/unusual-traffic mid-session | Will happen sometimes even on a good origin | Low if handled correctly | Already-built `matchesChallenge()` detection | Stop immediately, report, no bypass | HARD_STOP per-occurrence |
| Consent/interstitial | Certain on a fresh profile | Low | Trivial to detect (button present) | One-time ordinary accept, same as a human does | ACCEPTABLE_RISK |
| Logged-out vs. logged-in vs. fresh vs. persistent profile | Medium — behavior may differ | Medium | Compare via Gate 0 | Prefer the PO's real logged-in persistent profile (candidate 1/2) over a fresh one | ACCEPTABLE_RISK once tested |
| Google account dependence/risk | Low if using PO's existing session unmodified | Medium if account gets flagged | Low without owner report | Never create a new/automation-only Google account; use the PO's real one as-is | HUMAN_OP_DEPENDENCY — PO must accept this |
| Rate/volume sensitivity | Low at Sprint-1 scale (1-2 queries) | Low | N/A at this volume | Keep to explicit low volume; no loop/scheduler | ACCEPTABLE_RISK |
| Locale/language/geo/personalization skew | Medium | Low-medium (result variance, not failure) | Compare `hl`/`gl` params, note personalization | Use the PO's real locale/session as ground truth, not a synthetic one | ACCEPTABLE_RISK |
| Ranking/result instability run-to-run | High (normal Google behavior) | Low | Expected, not a bug | Record raw results per run; do not expect byte-identical repeats | ACCEPTABLE_RISK |
| ToS/policy risk of automated interaction, even locally | Genuinely uncertain | Medium — reputational | Low without legal review | Flag explicitly to PO: distinguish "PO's own account doing PO's own low-volume search" from bulk automation/evasion | HUMAN_OP_DEPENDENCY — PO must explicitly accept |

### Local/browser-worker architecture

| Pitfall | Likelihood | Impact | Detection | Mitigation | Classification |
|---|---|---|---|---|---|
| Machine must be online/awake | Certain, by design | Low (Sprint 1 is not a service) | N/A | PO runs it on-demand, not as a daemon, for Sprint 1 | ACCEPTABLE_RISK |
| NAT/firewall/secure task dispatch | N/A for Sprint 1 | N/A | N/A | Localhost-only; no remote orchestration needed at this scope | ACCEPTABLE_RISK |
| Remote-control attack surface | Low if localhost-only | High if exposed | Code review | Never bind the CDP/worker port beyond localhost | HARD_STOP if violated |
| Protecting cookies/session/user data | Low if never copied off-machine | High if leaked | Code review | Never transmit the profile directory or cookies to the cloud host; only extracted result JSON leaves the machine | HARD_STOP if violated |
| Arbitrary browser-control commands | Low — script is fixed-purpose | High if generalized | Code review | Script only navigates to a `google.com/search` URL and reads DOM; no generic remote-command interface | HARD_STOP if violated |
| Browser/OS updates breaking automation | Medium over time | Low-medium | Next run fails visibly | Reuse existing role/semantic extraction (already resilient to CSS churn) | ACCEPTABLE_RISK |
| Session corruption/profile locking | Low | Medium (blocks PO's normal browsing) | Immediate (browser won't open) | CDP-attach to an already-open browser, don't launch a second instance against the same profile | ACCEPTABLE_RISK |
| Parallel/concurrent searches | N/A for Sprint 1 (1-2 queries, sequential) | N/A | N/A | Not built for Sprint 1 | ACCEPTABLE_RISK |
| Recovery after crash/reboot | Low impact at this scale | Low | Manual re-run | PO re-runs the script; no persistence requirement for Sprint 1 | ACCEPTABLE_RISK |
| Human intervention on challenge | Will happen sometimes | Low if defined | Immediate (visible challenge page) | PO can manually resolve in their own visible browser if they choose; automation never attempts it | HUMAN_OP_DEPENDENCY |
| PO must be physically present | Yes, for candidate 1/2 | Medium — limits when Sprint 1 can run | N/A | Explicit, accepted constraint for Sprint 1 scale | HUMAN_OP_DEPENDENCY |
| Install/update burden | Low (Node+Playwright, one-time) | Low | N/A | One-time local setup, documented in a README | ACCEPTABLE_RISK |
| Windows/macOS/Linux differences | Low — Playwright/CDP work cross-platform | Low | Ask PO's OS upfront | No Linux-only assumption; CDP flag works identically on all three | ACCEPTABLE_RISK |
| Residential IP changes/ISP behavior | Low relevance for Sprint 1's single-run scope | Low | N/A | Not a concern at 1-2 queries; would matter for a later always-on service | ACCEPTABLE_RISK |
| VPN/proxy turning the worker back into a suspicious origin | Low if PO uses their normal connection | Medium if it recurs the original problem | Immediate (challenge reappears) | Do not add a VPN/proxy "to be safe" — use the PO's own ordinary connection | HARD_STOP if a proxy is added specifically to route around detection |

### SERP extraction / product behavior

| Pitfall | Likelihood | Impact | Detection | Mitigation | Classification |
|---|---|---|---|---|---|
| Selector/DOM layout change | Medium over time | Medium | Extraction returns 0 results | Reuse existing role/`a>h3`-scoped extraction (already reviewed, already resilient) | ACCEPTABLE_RISK |
| Sponsored vs. organic results | Certain to appear | Medium if not excluded | Already handled | Existing extraction already scopes to `#search`/excludes Google-owned nav links | ACCEPTABLE_RISK |
| Knowledge panels/featured snippets/job widgets obscuring organic results | Medium, query-dependent | Medium | Visual/manual inspection during Gate 0 | Extraction targets `h3`-in-`a` pattern specifically, not generic page text | ACCEPTABLE_RISK |
| Redirect/tracking URLs vs. canonical destination | Medium | Low-medium | Compare href to final URL | Preserve the href Google actually renders; do not follow/expand speculatively | ACCEPTABLE_RISK |
| Duplicate results | Low-medium | Low | Dedupe by URL, already implemented | Existing `seen` set in extraction code | ACCEPTABLE_RISK |
| Missing snippets | Medium | Low (title+URL still satisfies Sprint 1's minimum) | Visual inspection | Snippet is "when available" per SPRINT_1.md, not mandatory | ACCEPTABLE_RISK |
| Dynamic/lazy-loaded content | Low-medium | Medium if results load after initial parse | Compare result count to visible page | Wait for `domcontentloaded` + a short settle, already the current pattern | ACCEPTABLE_RISK |
| What evidence must be preserved | N/A — process question | High if unresolved | N/A | Raw HTML/screenshot + extracted JSON, timestamped, committed as evidence per run | HUMAN_OP_DEPENDENCY (PO must find this sufficient) |
| Distinguishing live from fabricated/cached results | N/A — process question | High (repeats the exact prior mistake) | PO inspection | PASS requires the PO's own live query with visible results, not a rerun of stored evidence | HARD_STOP if violated |

### Engineering-process failures (from what already went wrong)

| Pitfall | Likelihood | Impact | Detection | Mitigation | Classification |
|---|---|---|---|---|---|
| Building an app before validating the fatal external dependency | Already happened (JH-SUP-0008) | High — wasted a full app build | Obvious in hindsight | Gate 0 mandatory before any build, per this directive's own structure | HARD_STOP going forward |
| Mistaking infra readiness (Chromium installed, CPU/RAM OK) for product feasibility | Already happened (JH-SUP-0007's runtime-fact check) | High | Named explicitly now | Gate 0 tests the actual external dependency (Google's response), not tooling presence | HARD_STOP going forward |
| Redefining Sprint 1 after a technical path fails | Already happened (JH-SUP-0009 recommending profession.hu) | High — this is why JH-SUP-0010 exists | Named explicitly, corrected | Sprint 1 = SPRINT_1.md, unconditionally, for this directive's scope | HARD_STOP |
| Substituting Profession.hu/other useful results for Google behavior | Already happened | High | Named explicitly | Explicitly excluded above | HARD_STOP |
| Overproducing governance/design docs instead of running the cheapest falsification gate | Real risk right now, in this very directive | Medium | Self-aware | Keep this document focused on Gate 0 + decision, not open-ended essay | ACCEPTABLE_RISK if bounded |
| Accepting PASS without owner-visible product evidence | Named explicitly in JH-SUP-0010 | High if repeated | PO review | PASS gate requires the PO's own two-term query, visible real results | HARD_STOP |
| Retrying a falsified architecture without changing the causal variable | This is exactly what "just try Google-browser again" would be | High if attempted | Named explicitly | Do not retry cloud-host headless Chromium; only test candidates that change the causal variable (network origin AND/OR automation presence) | HARD_STOP |

## Gate 0 — cheapest falsification per candidate

| Candidate | Gate 0 | Causal variable tested | Time |
|---|---|---|---|
| 1. Local worker via CDP to PO's real Chrome | PO starts Chrome with `--remote-debugging-port=9222`; local script (reused extraction code, ~20 new lines) connects via CDP, navigates to `google.com/search?q=<2 keywords>`, extracts results | Network origin AND automation-vs-trusted-session, simultaneously | ~30 min, zero cost |
| 2. Browser extension, read-only | Load unpacked extension in PO's Chrome; PO manually searches once; content script reads DOM | Extraction logic only (automation/network moot — there is no automated navigation) | ~1-2 hours to build the smallest extension, zero cost |
| 3. Alternate host/network for existing app | Run existing `apps/google-browser-search/` unmodified from a different (non-cloud-datacenter) machine/network; single query | Network origin only, isolated from browser/session state (fresh profile either way) | Depends entirely on provisioning access to such a machine — not free/immediate, an owner decision |
| 4. Human-in-the-loop | Not a separate Gate 0 — folded into candidates 1/2's challenge-handling behavior | N/A | N/A |

**Recommended Gate 0 to run first: Candidate 1.** It is the only one that tests both open variables (network origin, automation-vs-trusted-session) in a single ~30-minute, zero-cost test, and it reuses already-built, already-reviewed code almost entirely as-is.

## Decision matrix

| Dimension | Candidate 1 (CDP local worker) | Candidate 2 (extension) | Candidate 3 (alt host, same app) |
|---|---|---|---|
| Probability of literal Sprint 1 PASS | High (uses PO's real trusted session) | High (no automation to detect at all) | Medium — unverified whether a non-datacenter host is actually available/sufficient |
| Reproduces PO's manual action | Close — script does what PO would type, in PO's own browser | Closest — PO literally does the typing/searching | Same as current failed app, just relocated |
| Time to first falsification (Gate 0) | ~30 min | ~1-2 hours | Unknown — depends on host provisioning (owner decision) |
| Time to first working Sprint 1 result | Same as Gate 0 if it passes (result IS the evidence) | Same as Gate 0 if it passes | Unverified until a host exists |
| Cash cost | $0 | $0 | Unverified — depends on what "alternate host" means (a spare machine = $0; a rented VPS = ongoing cost, and may itself be a flagged datacenter IP) |
| Engineering complexity | Low — mostly reused code | Low-medium — new extension boilerplate | Low if a host already exists, else this becomes a provisioning project |
| Ongoing operational burden | PO must run it on demand | PO must click it on demand | Depends on hosting choice |
| Security/privacy risk | Low if localhost-only, profile never leaves the machine | Very low — extension runs entirely in PO's existing session | Same as current app's existing (already-reviewed) code |
| Google challenge risk | Unverified until Gate 0 — this is exactly what it tests | Very low (no automated navigation) | Still possible if the alternate host is itself a flagged datacenter |
| Policy/ToS risk | Medium, needs explicit PO acceptance | Lower — closest to "a person using their browser with a helper" | Same as current, unresolved |
| Human intervention requirement | PO must start Chrome with the debug flag, be present | PO must manually search each time | None beyond running the app |
| Maintainability | Good — small, localized script | Good — small extension | Same as current app |
| Exact title+URL extraction reliability | High (reused, reviewed code) | High (same extraction logic, ported) | High (unchanged code) — moot if network origin doesn't fix the challenge |

Assumptions marked unverified: Candidate 1's core premise (that a trusted, already-logged-in local session avoids the challenge) is **not yet tested** — this is precisely what Gate 0 exists to determine. Candidate 3's viability depends entirely on an unstated resource (an actual non-datacenter host) that does not currently exist in this project.

## Recommendation

- **Primary:** run Gate 0 for Candidate 1 first. Cheapest, most diagnostic (tests both open unknowns at once), reuses already-reviewed code.
- **Fallback:** if Gate 0 for Candidate 1 still hits a challenge, build Candidate 2 (extension) — it cannot hit an automation-detection wall because there is no programmatic navigation for Google to detect.
- **Not recommended as a next step:** Candidate 3, until/unless the Product Owner identifies an actual available non-datacenter host — otherwise it is not a concrete plan, it is a placeholder for one.

## What must NOT be built before Gate 0 passes

No full local worker service, no persistent daemon, no extension packaging/distribution, no UI beyond a bare console script for Gate 0 itself. Do not build Candidate 2 in parallel with Candidate 1 "to save time" — that spends effort on whichever one turns out not to be needed.
