# Sprint 1: Literal Google SERP Path and Pitfall Analysis

**Status:** discussion only; no experiment, implementation, deployment, purchase, or Google retry was performed for this document.  
**Authority:** [`SPRINT_1.md`](../../SPRINT_1.md).  
**Conclusion:** Sprint 1 remains **NOT DONE**. The smallest credible route is a Product-Owner-controlled local Chrome worker on the Owner's ordinary non-datacenter network, with an explicit human handoff for a normal consent or challenge. It must first pass the Gate 0 below. The fallback is an Owner-installed extension/local companion that extracts only the current, Owner-initiated Google result tab.

## 1. What the evidence establishes—and does not

The cloud PoC and cloud UI application are two independent implementations, with separate fresh persistent profiles. Both received Google's unusual-traffic/CAPTCHA page on their first requests, before organic results were available. In the PoC, ordinary cookie consent was accepted and the next navigation was challenged; in the UI application, the challenge came before consent. Neither used CAPTCHA solving, stealth, spoofing, proxy rotation, or profile rotation. See [`GOOGLE_BROWSER_POC_RESULTS.md`](../evidence/GOOGLE_BROWSER_POC_RESULTS.md) and [`GOOGLE_BROWSER_APP_RESULTS.md`](../evidence/GOOGLE_BROWSER_APP_RESULTS.md).

This is strong evidence that the present cloud-origin + Playwright route cannot currently complete Sprint 1. It makes **network origin/reputation a leading causal variable**, but does not prove that it is the only variable. It does not distinguish cloud IP reputation from headless automation or their interaction; it does not test a normal desktop browser, a persistent personal profile, a different egress, or a user-performed query. It also does not demonstrate that the existing organic-result extractor works on a live Google page.

Therefore, “Chromium launches,” a health endpoint, unit tests, or reaching `google.com` are not acceptance evidence. Only a live normal Google results page, extracted results, and Owner-visible same-run evidence can pass.

## 2. Non-negotiable acceptance boundary

The system must accept a short two-term query, submit it to real Google Search, read the resulting live Google page, and expose at least one actual **organic** result with the exact displayed title and destination URL for Product Owner inspection. Preserve several first-page results where present, including title, destination URL, displayed domain/snippet if exposed, capture time, query, and a redacted screenshot or Owner-visible rendering from that same run. A challenge, mandatory login, API response, cached fixture, manually copied list, or results from another engine is not a pass.

The following may be useful later, but are explicitly **NOT Sprint 1**: official search APIs; Google Programmable/Custom Search; Brave Search; Firecrawl; Profession.hu and other portal-native adapters; and other search engines. They do not read the required live Google result page and must not be used to relabel this sprint as complete.

## 3. Serious literal-Sprint-1 candidates

### A. Owner-controlled local browser worker (primary recommendation)

Run a narrow local agent on a machine the Product Owner controls, awake and connected through the Owner's usual non-datacenter network. It uses an installed, normal Chrome/Chromium browser and an explicitly designated browser profile. It receives a query, navigates to Google, detects consent/challenge, and returns only structured rendered-SERP results and acceptance evidence. It must never receive arbitrary JavaScript, URLs, DevTools commands, or generic browser automation instructions.

This most plausibly changes the causal variable exposed by the failures: cloud/datacenter network origin. It can also use an ordinary browser rather than Playwright headless, but that is a secondary, separately tested variable. It is not a promise of access: Google can challenge any session, and an Owner's browser/account must not be put at risk by repeated unattended activity.

**Gate 0-A (minutes; no application build):** On the Owner's normal network, open the chosen real Chrome profile manually, logged out unless the Owner deliberately chooses otherwise; enter one ordinary two-term query such as `IT vezető`; submit it; stop on a challenge. Capture a timestamped screenshot of the normal SERP and manually record exact title + destination URL of one organic result. This tests **network origin, ordinary browser, and selected profile/account state together**, not automation. If it fails, do not implement this candidate.

**Gate 0-A2 (only after A passes, separately authorized):** In that same browser/profile/network, use the smallest possible local automation-assisted navigation and extraction of one query, with one attempt and immediate stop/handoff on consent or challenge. Capture screenshot plus title/URL. This tests **automation itself/headless mode (if any)** while holding network and profile approximately constant. A normal manual result does not validate automation.

### B. Owner browser extension plus minimal local companion (fallback)

The Owner initiates Google in their normal interactive browser. An extension, restricted to Google Search pages, reads the rendered active tab after the page has loaded and returns title/URL records to a local companion or visible panel. A stricter variation never programmatically submits the query: the running system asks the Owner to search the two terms, and extracts the resulting current tab. That is a system that exposes results from a live Google page, but acceptance must explicitly demonstrate the required input-to-submission flow; the extension can fill/submit only after Gate 0 proves it is tolerated.

It closely reproduces the Owner's manual action and avoids remote control of a browser. It may still violate site expectations or trigger a challenge if it submits/searches automatically; content scripts are subject to DOM changes and extension review/update burden.

**Gate 0-B (minutes; no extension build):** In the Owner's ordinary browser, manually search one two-term query and record screenshot/title/URL as in A. This tests **network/profile/account state**, not extension behavior. If successful, a disposable, locally loaded proof limited to reading the active SERP DOM (not submitting, not background searching) may be tested only with authorization; that isolates **rendered-DOM access/extension extraction**. If it is challenged, stop—do not retry or alter fingerprints.

### C. Existing application in a different execution environment/network

Move the existing browser application only after an alternate environment demonstrates a normal SERP. Candidates include an Owner-managed workstation or another organization-approved egress that is genuinely distinct from the current cloud/datacenter origin. “Different cloud VM,” a proxy, or IP rotation is not evidence of a normal-user network and is not recommended. The current app's headless Playwright behaviour means a new network alone may still fail.

**Gate 0-C (minutes):** In the proposed exact environment, run one normal Chrome interactive query in a fresh, logged-out profile; capture normal SERP/title/URL or challenge. This primarily tests **network origin**, with a baseline browser/profile. Only if it passes, run one one-shot navigation with the exact execution mode planned (headless or headed, Playwright or otherwise) to isolate **automation/headless**. No application deployment or UI work precedes both observations.

### D. Human-in-the-loop Owner browser session

This is an operating mode, not necessarily a distinct component: the Owner operates a normal browser session, accepts ordinary consent, and, if Google asks, personally handles an occasional challenge. The system reads rendered results only after the normal page is available. It must pause clearly on challenge, retain no CAPTCHA image/answer, and resume only after the Owner declares the normal SERP is visible. There is no CAPTCHA-solving service, stealth, fingerprint spoofing, proxy rotation, or account farming.

This can be the fastest literal pass if the Owner is physically present and a normal manual Google query succeeds. Its cost is human availability and it may be unsuitable for unattended use. A challenge that requires a login or is not reasonably resolvable remains a hard stop for that run, not an invitation to automate around it.

**Gate 0-D (minutes):** The Owner manually performs one two-term search in their chosen normal browser session, handles only ordinary consent or any challenge personally, and supplies screenshot plus one organic title/URL. This tests **network, profile/account, and human intervention**; it does not test unattended automation. If normal results are not reached, stop.

### E. Other legitimate mechanism: Owner-mediated, same-tab extraction

A minimal desktop bookmarklet is not preferred because it expands script-execution trust and may be blocked by browser policy. A browser-native “copy current organic results” interaction or accessibility-assisted extractor, invoked by the Owner on the live Google tab, could literally satisfy Sprint 1 if the resulting system takes the two terms, causes/assists their Google submission, and exposes actual extracted data—not a manually copied list. Its advantage is no remote worker; its weakness is reduced automation and fragile DOM access. It needs the same manual Gate 0 as B. No API or cached SERP provider is an eligible “other mechanism.”

## 4. Decision matrix

All Google-behaviour assumptions are **unverified** until Gate 0. Scores use 5 as favourable: higher PASS/fidelity/maintainability/reliability, and lower cost, complexity, burden, risk, challenge likelihood, policy risk, and need for a human. “Time” is deliberately not scored: it gives the concrete shortest expected interval, assuming the Owner and exact target machine are available.

| Candidate | PASS | Fidelity | Falsify / work | Cash | Complexity | Ops burden | Privacy/security | Challenge | Policy/ToS | Human need | Maintain | Title+URL | Assumption / decision |
|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| A Local worker | 4/5 | 4/5 | minutes / hours-days after A+A2 | 5 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | Primary if Owner manual Gate 0 and exact-mode A2 pass. Assumes ordinary non-datacenter egress. |
| B Extension + companion | 4/5 | 5/5 | minutes / hours-days after read-only proof | 5 | 3 | 3 | 3 | 4 | 3 | 2 | 3 | 4 | Fallback; active-tab-only is the best privacy boundary. Assumes permissions and DOM access work. |
| C Alternate existing app | 2/5 | 2/5 | minutes / hours-days | 2–4 | 2 | 2 | 2 | 2 | 2 | 3 | 2 | 4 | Consider only after non-cloud manual and exact-mode gates. A different cloud IP is weak evidence. |
| D Human-in-loop | 5/5 if manual SERP works; 0 otherwise | 5/5 | minutes / minutes-hours | 5 | 2 | 2 | 4 | 4 | 4 | 1 | 4 | 5 | Fastest literal path, but not unattended operation. |
| E Owner-mediated same-tab extractor | 3/5 | 5/5 | minutes / hours-days | 5 | 2 | 4 | 3 | 4 | 3 | 1 | 2 | 3 | Use only if B cannot be packaged; never accept manual copy as the system output. |

“Policy/ToS” is inherently uncertain: check then-current Google terms and organization policy before authorization. No design should assume that permission to view a page also permits automated collection.

## 5. Pitfall and risk register

Classification: **HARD_STOP** means no literal PASS for that run/path until the external condition changes or a permitted human action completes; **HUMAN_OP_DEPENDENCY** means the system can work only with a person/process; **ACCEPTABLE_RISK** means it can be contained by design and verified evidence. Likelihood is for a small Sprint 1 system, informed by the two first-request cloud challenges.

| Area and pitfall | Likelihood | Impact | Cheapest earliest detection | Mitigation | Class |
|---|---|---|---|---|---|
| Datacenter IP reputation challenges first request | High on current cloud; unverified elsewhere | Zero readable SERPs | One manual two-term Chrome query from exact proposed egress | Gate network before build; choose Owner-controlled normal egress only if it passes | HARD_STOP |
| Headless/fingerprint effect separate from IP | Medium-high | Cloud/local automation blocked despite manual success | Same egress/profile: manual query, then one exact-mode automation query | Use normal headed browser only if authorized and proven; do not spoof fingerprints | HARD_STOP |
| CAPTCHA/unusual traffic page | High on tested cloud | No result may be extracted | Detect known challenge text/page before extraction; screenshot | Immediate visible stop and Owner handoff; never solve/bypass/retry automatically | HARD_STOP |
| Consent/interstitial blocks or changes DOM | Medium | False empty results or bad extraction | First normal query with clean profile and screenshot | Explicit consent state; distinguish consent, challenge, no-results, and SERP | HUMAN_OP_DEPENDENCY |
| Fresh vs persistent/logged-out/logged-in profile difference | Medium | Unrepeatable or account-linked success | Gate matrix of one selected state at a time, no repeated probing | Document selected profile; default logged-out; do not transfer cookies; persist only with Owner consent | HUMAN_OP_DEPENDENCY |
| Account dependence or account risk | Medium | Owner account warning, lock, privacy exposure | Start logged out; Owner decides whether account use is necessary | No account farming; separate designated profile; minimal rate; clear abort path | HUMAN_OP_DEPENDENCY |
| Rate/volume sensitivity | High after initial success | Later challenge/temporary block | One-query Gate 0 proves no volume capacity | One query per requested action, serial queue, strict caps/backoff, stop on first challenge | ACCEPTABLE_RISK |
| Locale/language/geo/personalization variance | High | Acceptance cannot reproduce expected results | Record browser locale, Google params, IP region, account state | Present actual live result data, not expected ranking; disclose context | ACCEPTABLE_RISK |
| Ranking changes between runs | High | Brittle assertions or false “failure” | Repeat manually only if authorized; compare evidence | Assert live provenance/title+URL, not fixed rank/content | ACCEPTABLE_RISK |
| Google terms/organization policy disallow proposed automation | Medium, unverified | Candidate cannot be authorized | Review current terms and internal policy before Gate 0-A2/B/C | Prefer Owner-operated active-tab read; no circumvention or mass collection | HARD_STOP |
| Local machine asleep/offline | Medium | Request cannot run | Disconnect/lock-screen readiness check | Visible availability state, queue expiry, manual retry after wake | HUMAN_OP_DEPENDENCY |
| NAT/firewall/secure dispatch | Medium | Worker unreachable or exposed | Local loopback test and inbound-port inventory before design | Outbound authenticated polling or local-only pairing; no public inbound browser endpoint | ACCEPTABLE_RISK |
| Remote-control attack surface | Medium | Browser/data compromise | Threat-model command schema before implementation | Fixed query schema; allowlisted Google URL; no arbitrary navigation/scripts/CDP | HARD_STOP |
| Cookies/session/user data leakage | Medium | Account/privacy incident | Permission/data-flow review before any profile access | Dedicated profile, local extraction, send results only, encrypt transport, never export cookies | HARD_STOP |
| Arbitrary browser-control commands | Medium | Unbounded misuse and policy risk | Negative tests against malformed task payloads | Capability-based protocol: query string, correlation ID, one active tab; server validation | HARD_STOP |
| Least privilege failure / excessive extension permissions | Medium | Broad browsing visibility | Manifest/permission review before install | `google.com/search` host restriction, active-tab option where feasible, no history/download access | HARD_STOP |
| Browser/OS updates or SERP selector change | High over time | Empty/wrong results | Fixture-less visual/DOM smoke check after update | Multiple semantic extraction paths, versioned parser, fail visibly, short acceptance scope | ACCEPTABLE_RISK |
| Profile lock/corruption | Medium | Worker cannot start or loses selected state | Start/stop test with browser closed | Single owner, lock detection, no copying active profile, documented recovery | HUMAN_OP_DEPENDENCY |
| Concurrent searches create suspicious traffic/races | Medium | Challenges or results cross-contaminate | Two-request queue simulation without Google | Single-flight queue; one tab/profile; request IDs; reject parallel jobs | ACCEPTABLE_RISK |
| Crash/reboot recovery | Medium | Lost run/evidence or stuck worker | Kill/restart local process test | Idempotent states, no automatic replay of Google query, report unknown outcome | ACCEPTABLE_RISK |
| Challenge needs a human | Medium-high | Unattended run cannot finish | Challenge detector and manual browser observation | Pause with exact instruction; Owner completes only permitted action; no answer capture | HUMAN_OP_DEPENDENCY |
| Owner not physically present | Medium | No consent/challenge resolution or initial setup | Availability identified before acceptance | Schedule acceptance while Owner is present; no claim of unattended service | HUMAN_OP_DEPENDENCY |
| Install/update burden | Medium | Candidate decays/unusable | Install checklist on target OS | Signed/reviewed package where possible; simple update and rollback guidance | HUMAN_OP_DEPENDENCY |
| Windows vs Linux/macOS browser/profile assumptions | Medium | Profile APIs/paths/extension automation differ | Gate on exact Owner OS/browser, not developer machine | Support one declared OS/browser for Sprint 1; defer cross-platform | ACCEPTABLE_RISK |
| Residential IP changes/ISP reputation | Low-medium | Formerly working worker challenged | Record only coarse egress context; next run Gate 0-like check | Treat as variable; no IP pinning/proxy workaround; surface blocked state | HUMAN_OP_DEPENDENCY |
| VPN/proxy accidentally used | Medium | Reintroduces suspicious origin or changes locale | Preflight shows VPN/proxy status and egress context | Require ordinary direct connection; abort with clear instruction if VPN/proxy active | HARD_STOP |
| Google DOM/selectors change | High | Extraction failure while page is normal | One live page inspected before acceptance | Prefer result-container semantics; capture raw/redacted evidence; fail rather than fabricate | ACCEPTABLE_RISK |
| Ads vs organic ambiguity | High | Requirement not met by ad extraction | Inspect labels and destination/result containers in Gate 0 evidence | Exclude labeled sponsored units; label uncertain records; require one confirmed organic item | HARD_STOP |
| Panels/snippets/job widgets hide organic items | Medium | No organic item in first viewport / false parsing | Scroll/render check on one query | Scan rendered page until organic result found; report widgets separately; do not call them organic | ACCEPTABLE_RISK |
| Google redirect link vs canonical URL | High | Wrong destination URL | Compare anchor href and rendered destination on Gate 0 | Normalize only Google wrapper to decoded destination when unambiguous; retain raw href and display URL | ACCEPTABLE_RISK |
| Duplicates | Medium | Poor Owner inspection / misleading count | Inspect first-page record keys | Stable canonical-URL key; retain duplicates with reason if normalization uncertain | ACCEPTABLE_RISK |
| Missing snippets/domain | Medium | Overclaims unavailable fields | Query with sparse SERP | Make snippet/domain optional; title+destination URL remain minimum | ACCEPTABLE_RISK |
| Dynamic/lazy rendering / incomplete load | Medium | Partial result list | Wait for visible normal SERP and first organic unit, then bounded scroll | Capture extraction timestamp/count; never infer unloaded results | ACCEPTABLE_RISK |
| Cannot prove results were live, not fabricated/cached | Medium | Acceptance rejection | Same-run UI/screenshot and structured record review | Query, time, Google URL, screenshot, exact text/URLs, challenge state, run ID; label any persistence as historical | HARD_STOP |
| Built application before fatal dependency validation | Already occurred | Wasted effort and misleading readiness | Gate 0 as first work item | Make external normal-SERP proof an entry criterion for all implementation | ACCEPTABLE_RISK |
| Infra readiness mistaken for feasibility | Already occurred | Premature PASS confidence | Demand owner-visible organic evidence, not health/tests | Separate “browser ready” from “Google SERP readable” status | ACCEPTABLE_RISK |
| Requirement redefinition after failure | High pressure risk | Non-PASS work falsely accepted | Compare proposal/output against `SPRINT_1.md` | Explicit literal acceptance checklist; owner approval required for scope change | HARD_STOP |
| Profession.hu/useful alternatives substituted | High pressure risk | Wrong product delivered | Source provenance shown in UI/evidence | Keep alternatives out of Sprint 1 acceptance path | HARD_STOP |
| Governance/doc production replaces falsification | Medium | Delay without learning | Count unanswered causal questions and time-to-Gate-0 | Authorize exactly one minimal Gate 0 after discussion; stop writing architecture until result | ACCEPTABLE_RISK |
| PASS accepted without Owner-visible proof | Medium | False completion | Acceptance run checklist and Owner inspection | Require live UI plus evidence artifact and exact title/URL | HARD_STOP |
| Retry same falsified cloud architecture | High if not controlled | Repeated challenge, possible worse reputation | Compare proposed Gate variable with recorded failures | No repeat unless at least one causal variable changes and is named | HARD_STOP |

## 6. Minimal safe architecture after a passing Gate 0

Do not build this until the selected candidate proves a normal SERP. If A is selected and A+A2 pass, Sprint 1 should be deliberately small:

1. A local, Owner-controlled process exposes an **outbound** authenticated connection to a coordinator, or is invoked locally. It never accepts public inbound control.
2. The task schema is fixed: exactly two ordinary keywords (validated length/characters), one query, a correlation ID, and no URL/script/options fields. A one-at-a-time queue prevents parallel searches.
3. It opens only `https://www.google.com/search` in a designated normal browser/profile and reports one of `SERP_READY`, `CONSENT_NEEDED`, `CHALLENGE_NEEDS_OWNER`, `LOGIN_BLOCKED`, `NO_ORGANIC_RESULT`, or `WORKER_UNAVAILABLE`. It never retries a challenge.
4. The extractor returns only title, canonical/destination URL, optional displayed domain/snippet, original Google link, ordinal, query, timestamp, and run ID. It marks ad/widget/uncertain elements rather than treating them as organic.
5. The Owner-facing result view displays those records and same-run evidence. Cookies, page credentials, full browsing history, CAPTCHA content, and arbitrary page HTML do not leave the Owner's machine by default. Screenshots should be explicitly approved/redacted because they can contain account or personalized information.

This is intentionally not a general remote-browser platform, job-search workflow, scheduled crawler, or multi-source system.

## 7. Primary recommendation, fallback, and stop conditions

**Primary:** authorize only Gate 0-A: the Product Owner manually performs one two-term Google search in their ordinary Chrome on their ordinary direct network, with a designated profile, and supplies normal-SERP evidence. If and only if it passes, authorize Gate 0-A2 to distinguish automation from network/profile effects. If A2 passes, a narrow local worker is the preferred build path.

**Fallback:** if a normal Owner manual search passes but worker automation does not, authorize the browser-extension/local-companion path in an Owner-initiated active Google tab. Begin with read-only active-tab extraction; add query submission only if a separate, minimal test proves it does not cause a challenge. This keeps the Owner in the normal session and avoids building a remote-controlled browser.

**Do not build before Gate 0 passes:** no new local worker, extension, companion, cloud relocation/deployment, remote command channel, profile/cookie migration, scheduler, portal adapter, search API integration, Firecrawl flow, job-ranking workflow, payment/proxy arrangement, CAPTCHA mechanism, stealth/fingerprint change, or “retry” of the present cloud path. In particular, do not treat a manual copied result list as acceptance or use a passing manual search as evidence that unattended automation will work.

If Gate 0 produces a challenge or mandatory blocker, record the exact environment/state and stop. The next decision must change a named causal variable legitimately (for example, normal Owner network versus cloud) or accept a human-operated mode; it must not repeat the same architecture hoping for a different result.
