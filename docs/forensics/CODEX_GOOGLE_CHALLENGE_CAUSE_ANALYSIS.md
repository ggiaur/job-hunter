# Codex independent forensic analysis — JH-SUP-0015

## Scope and method

This is a static analysis of the directive, the preserved Gate 0 JSON and screenshot, the Gate 0 source and Docker/wrapper files, and the locally installed Playwright 1.62.1 source. No request to Google or another Google property was made, and no Claude-authored forensic conclusion was read. Assertions below distinguish the preserved facts from inferences; Google alone has the decision telemetry needed to attribute its challenge to a particular signal.

The screenshot and JSON agree on a single attempt at `2026-09-03T20:23:27.974Z`, for `IT vezető`, using Chromium `151.0.7922.34`, ending 1.922 seconds later with `GOOGLE_CHALLENGE`. The screenshot is a Hungarian Google interstitial. It says Google detected unusual traffic from the computer network, suspects a program may be sending searches, and displays IP `78.131.58.101`, timestamp `2026-09-03T20:23:29Z`, and the requested search URL.

## A. What the Google challenge page proves

It proves that Google served an anti-abuse/human-verification interstitial instead of a normal results page to this request/session, and that the page associated the request with public egress IP `78.131.58.101`. It also proves Google described the triggering condition in broad terms as unusual traffic from the computer network and possible programmatic searches.

It does **not** prove which signal or rule produced that decision: IP reputation, prior IP history, current request volume, browser/browser-context characteristics, cookies, TLS/network characteristics, query semantics, a combination, or a false positive. The wording is explanatory, not an audit log or causal attribution.

## B. Meaning of the named public IP

Naming `78.131.58.101` identifies the public address Google saw for this request. Together with the recorded pre-run egress check and the absence of a configured proxy in the Gate 0 code, it strongly supports that the request left through the organization's normal public egress rather than an intended application proxy.

It does not prove that IP reputation caused the block. A challenge page can display the source IP irrespective of which classifier feature triggered it. Nor can the display distinguish the Gate 0 container from other users/devices sharing that NAT address.

## C. What one failed first query says about browser fingerprinting

One first-query failure is compatible with browser/session fingerprinting, especially because the run was Playwright-controlled Chromium in a disposable Docker/Xvfb environment. It does not prove it. There was no controlled comparison holding the egress and all other request properties constant while changing only browser characteristics; nor was there a comparison holding browser properties constant while changing egress/history. A pre-existing IP/network score could cause an immediate first-request challenge just as readily as a fingerprint-based score, and an ensemble decision can use both.

The lack of a prior query within this script usefully rules out a rate threshold created by *multiple Gate 0 searches in this run*. It does not rule out rate/history attributed to the public IP, cookie-less session, or other NATed clients before the run.

## D. Exact run: observable automation-relevant properties

### Directly established by the artifact/source

| Property | Finding | Evidentiary limit |
|---|---|---|
| Automation controller | `gate0-onprem.mjs` imports Playwright and calls `chromium.launch({ headless: false })`. | Proven from source; the challenge page does not identify this as its reason. |
| Browser build | Playwright package and lockfile pin `1.62.1`; its local `browsers.json` maps Chromium revision 1234 to `151.0.7922.34`. The JSON reports that same version. | Proven for the recorded executable version. |
| Browser channel | No `channel` or `executablePath` is supplied. Playwright therefore selects its managed `chromium` executable, which local metadata labels Chrome for Testing; it is not a user-installed branded Google Chrome profile. | Proven from code/default-selection source. |
| Headed/display mode | `headless: false`; the image entrypoint is `xvfb-run -a`. Thus this was headed Chromium rendered against an ephemeral virtual X server, not Playwright headless mode. | The display is virtual; actual GPU/device characteristics were not captured. |
| Context/profile | `browser.newContext(...)` creates a new non-persistent context, and Playwright source creates a temporary `playwright_chromiumdev_profile-*` user-data directory for a non-persistent launch. No storage state, persistent profile, cookies, extensions, account, or prior browsing history is supplied. | The exact directory contents and page-visible cookies/fingerprint were not preserved. |
| Locale/rendering inputs | The context explicitly sets `hu-HU`, `Europe/Budapest`, and viewport `1365x900`. | These alone neither prove normality nor detection. |
| Remote control transport | Playwright 1.62.1 Chromium defaults append `--remote-debugging-pipe` and `--no-startup-window` for a non-persistent launch. | The final process command line was not recorded, but these defaults follow exactly from the recorded launch options with no `ignoreDefaultArgs`. |
| Sandbox | Playwright's Chromium default adds `--no-sandbox` unless `chromiumSandbox: true`; this code does not set it. | Same source-derived qualification as above. Docker itself is not proof of a particular kernel sandbox state. |
| Other distinctive defaults | Local Playwright source adds many test/automation-oriented switches, including `--disable-background-networking`, `--disable-extensions`, `--no-first-run`, `--password-store=basic`, `--use-mock-keychain`, `--disable-sync`, `--disable-infobars`, `--disable-dev-shm-usage`, `--enable-unsafe-swiftshader`, and a temporary `--user-data-dir`. | Exact defaults are known; their individual contribution is unknown. |
| Proxy/bypass modifications | No Playwright proxy option, custom Chromium args, stealth package, fingerprint patch, CAPTCHA action, or retry exists in this code path. The wrapper invokes ordinary Docker networking; the evidence records no proxy. | This proves the intended code path has none, not all possible host-network configuration outside the repo. |

### Important non-findings

The recorded launch is headed, so it does not add Playwright's `--headless`, `--hide-scrollbars`, `--mute-audio`, or headless pointer/hover switches. The local 1.62.1 Chromium default switch list inspected here does not include `--enable-automation`, and this run does not set `--remote-debugging-port=0`; it uses a debugging **pipe**. Therefore `navigator.webdriver === true` must not be asserted as an observed fact. The evidence contains no page evaluation, request headers, user-agent, `navigator.webdriver` value, WebGL/canvas/audio values, font list, TLS/HTTP2 fingerprint, or final `ps` command line. Those properties cannot be reconstructed reliably from the screenshot and source alone.

These conditions are automation-identifiable in the broad operational sense (managed test Chromium, a fresh disposable context, CDP pipe, virtual display, and default test switches), but the evidence does not establish which of them Google observed or weighted.

## E. Prior public-IP/NAT history

Yes. Prior reputation/history of `78.131.58.101`, and activity by another device behind that NAT, remain live causal explanations. The page's reference to the computer network and display of the egress IP are consistent with an IP/network-scoped assessment, but do not establish it.

No firewall, router, proxy, DNS, NAT-flow, or organization-wide Google-request logs were found among the non-Claude repo artifacts inspected for this task. The repository evidence therefore neither proves nor disproves prior automated/high-volume Google traffic from other NATed hosts. Without contacting Google, useful local evidence would be time-bounded router/firewall NAT/flow logs mapping outbound TCP/443 flows to internal hosts; forward-proxy access logs; DNS resolver query logs; endpoint/browser histories and scheduler/service logs; and ISP/account records, all covering a period before `20:23:27Z`. Such records could substantiate or weaken a local-history hypothesis, but could not prove Google's internal reputation score or exclude external/shared-address history.

## F. Query and request-rate hypotheses

`IT vezető` is a short, ordinary Hungarian two-term employment-related query. Nothing in the preserved evidence makes it intrinsically abusive or shows a query-specific policy action. It is a weak live hypothesis only because Google can use query context in an undisclosed classifier.

The Gate 0 request rate is strongly weakened as the explanation: source has one `page.goto` to the Google search URL, no search loop, retry, fallback, or destination navigation before detection, and the evidence records one attempt. A burst from *this run* cannot explain an immediate challenge. Aggregate rate/history at the public IP or other devices remains possible, as does Google counting subresource, redirect, or pre-run traffic outside the evidence; neither is established.

Relative ranking: the particular query is low plausibility; in-run request rate is very low plausibility; IP/network aggregate history is materially more plausible than either, but unproven.

## G. Explanations ruled out, weakened, and still live

**Ruled out for this Gate 0 code path:** a second search query, retry loop, UI-search fallback, configured Playwright proxy, stealth/fingerprint-masking code, CAPTCHA solving, and headless-mode flags. The post-run Xvfb cleanup error is not causal: both authoritative evidence files were created and consistently identify the challenge before cleanup.

**Weakened:** a generic datacenter-AS classification as a sufficient explanation. The recorded origin is an organization-owned, non-datacenter Hungarian ISP/telecom egress, so the result shows that changing from the prior cloud class to this egress did not prevent a challenge. It does not rule out reputation specific to this IP, AS-level signals, or network history. It also weakens an explanation based on multiple searches issued by this specific probe.

**Still live:** (1) an existing IP/network reputation or shared-NAT history; (2) the combined effect of that network with this new cookie-less Playwright/Chromium session; (3) automation/environment characteristics alone; (4) unrecorded transport/device signals; and, at lower plausibility, query context. These candidates are not mutually exclusive.

## H. Ranked cause matrix

Ranks are relative plausibility, not probabilities. Confidence is confidence in the assessment of the evidence, not confidence that Google used the cause.

| Rank | Candidate explanation | Assessment | Evidence for | Evidence against / limitation |
|---:|---|---|---|---|
| 1 | Existing reputation or prior aggregate activity for public IP / shared NAT | Live; moderate relative plausibility; low causal confidence | Google names the IP and describes traffic from the network; IP reputation/history can yield a first-request challenge. | No local NAT/router/proxy/DNS history is preserved; IP display does not state the decision reason. |
| 2 | Combined network score plus fresh automated session/environment | Live; moderate relative plausibility; low causal confidence | The request was a fresh Playwright-managed Chrome-for-Testing context in Docker/Xvfb, with CDP pipe, no sandbox, disposable profile and distinctive defaults. Ensemble scoring is plausible. | No Google telemetry, page-side fingerprint capture, or controlled comparison isolates this combination. |
| 3 | Automation/browser/session characteristics independent of IP history | Live; lower-to-moderate relative plausibility; low causal confidence | The environment has several observable non-ordinary/test properties, and detection came on the first script request. | One observation cannot separate this from IP history; `webdriver` was not measured and must not be presumed true. |
| 4 | Unrecorded network/device transport characteristics | Live; low-to-moderate relative plausibility; very low causal confidence | Google may evaluate TLS, HTTP behavior, browser/device consistency, or other signals not captured here. | No evidence identifies any anomalous value. |
| 5 | Query-specific treatment of `IT vezető` | Live but weak | Query context can in principle enter an undisclosed decision. | The query is ordinary and there is no query-specific message or comparison. |
| 6 | High rate from this Gate 0 script | Substantially ruled out | None beyond the generic text. | Proven single `page.goto`, no retry/fallback, one recorded attempt. |
| 7 | Cloud/datacenter egress classification alone | Substantially weakened | Prior cloud failures may be historically relevant. | This event used the recorded non-datacenter ISP/organization egress and still challenged immediately. |

## I. Strongest defensible answer to the Product Owner

Google reacted because its anti-abuse system classified this one search request, in its full network-and-session context, as requiring human verification. The strongest evidence is the challenge page itself. The organization’s public IP was the egress Google saw, and the request came from a clearly automated, fresh Playwright/Chromium Docker/Xvfb environment; either the public IP’s pre-existing/shared-NAT reputation, the automation/session signals, or their combination could have produced that classification.

The evidence does **not** support the stronger claims that Google blocked the request *because of* the IP, *because of* Playwright, *because of* `navigator.webdriver`, or *because of* the query. Those require Google’s proprietary anti-abuse logs/model inputs or a properly authorized controlled experiment, neither of which is available or permitted under this directive. The network hard stop should remain in force; this analysis authorizes no retry or mitigation experiment.
