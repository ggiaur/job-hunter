# Claude Chrome Container — Feasibility Review (JH-SUP-0019)

Zero Google Search traffic generated. Based on official Anthropic documentation
(`code.claude.com/docs/en/chrome`, fetched directly 2026-09-03) and direct
inspection of the committed `apps/claude-chrome-worker/` draft. This session's
own toolset does not currently include Chrome-integration tools (no `--chrome`
was passed to this session, no `claude-in-chrome` MCP tools are present), so
this review is documentation-based, not a live hands-on test of the
integration — stated explicitly rather than implied otherwise.

## 1. Verdict

**NOT_VIABLE_AS_DESIGNED** for the stated goal — an unattended, twice-weekly,
no-human-present automated Google search worker.

**CONDITIONAL / VIABLE** only for a materially different, narrower use: a
human-supervised, interactively-triggered assistant session, where a person is
actually present (locally or via the VNC tunnel) to log in, approve actions,
and hand off CAPTCHA/login screens. That is a legitimate, documented use of
Claude in Chrome, but it is not "automation" in the sense every JH-SUP-0016
through 0018 directive has been pursuing, and should not be represented as
solving the same requirement.

## 2. Evidence supporting the verdict

Direct quotes from the official Claude Code Chrome docs, fetched 2026-09-03:

- **Authentication is plan-gated and incompatible with the kind of credential
  an unattended job would use**: *"Chrome integration also requires signing in
  with `/login`. If you authenticate with an API key or a long-lived token
  from `claude setup-token`, Claude Code keeps Chrome integration off, even
  when you pass `--chrome`, because the browser extension can't authenticate
  with those credentials."* A scheduled/cron-triggered worker with no human
  present would almost certainly need to authenticate Claude Code via an
  API key or a stored long-lived token — exactly the two credential types this
  documentation says **disable** Chrome integration outright. This is a hard
  architectural blocker for "unattended," not a friction point to engineer
  around.
- **Human presence is the assumed operating model, not an edge case**: *"Browser
  actions run in a visible Chrome window in real time. When Claude encounters
  a login page or CAPTCHA, it pauses and asks you to handle it manually."*
  and state-changing browser actions (click, type, navigate) *"prompt for
  approval"* by default. The product is designed around a human watching and
  approving, not a silent background job.
- **No Docker/headless/server-side deployment is documented anywhere** in the
  official page. Every example, prerequisite, and troubleshooting step assumes
  an interactive desktop session with a visible window. This doesn't prove it
  cannot work in Docker/Xvfb, but there is zero official support or precedent
  to rely on — it would be genuinely unverified territory, discovered only by
  trying it against the still-forbidden live Google target, or through
  extensive undocumented trial and error against arbitrary sites.
- **Native messaging does confirm one part of the current draft is directionally
  correct**: the extension talks to a native host process via a manifest file
  Chrome reads at a fixed path under the browser's own config directory
  (`~/.config/google-chrome/NativeMessagingHosts/...json` on Linux), installed
  by Claude Code on first use. This requires Claude Code and Chrome to be
  co-located in the same OS/user session — which the current single-container,
  same-user design does satisfy. This part of the architecture is not the
  problem.

## 3. Unsupported/unverified assumptions in the current draft

- **The README's framing that this reproduces "the already-observed Claude
  controls a normal Chrome browser operating model" as an unattended worker is
  the central unproven claim.** Every prior observation of "Claude controlling
  Chrome" (in this or any session) has been an interactive session with a human
  present — there is no evidence, official or otherwise, that this same
  integration operates unattended on a schedule.
- The Dockerfile force-installs the extension via Chrome enterprise policy
  (`ExtensionInstallForcelist`), which handles *installation* but does not
  address *authentication* — the extension still requires a normal Anthropic
  sign-in flow tied to a direct Pro/Max/Team/Enterprise plan, which is an
  interactive, human step regardless of how the extension binary got installed.
- The design assumes Xvfb + Openbox is a sufficient stand-in for "a visible
  Chrome window" from the human's perspective (a person only actually looks at
  it through the noVNC tunnel) — plausible, but genuinely unverified against
  official guidance, since no such deployment is documented.
- The local test (`LOCAL_BROWSER_CONTROL_PASS`) proves Claude Code can reach
  *some* page through *some* browser session once a human has completed the
  one-time interactive setup. It does not and cannot prove unattended,
  no-human-present operation — by design, since the whole integration requires
  a human-approved, plan-authenticated session per the documentation above.
  Passing this local test would not settle the actual open question.
- "Whether an unattended twice-weekly browser task can be triggered from
  Claude CLI without a human approving each browser-control action" (directive
  question 10): per the documentation, **no** — this is not merely undocumented,
  it's affirmatively excluded by the auth-credential restriction, independent
  of the approval-prompt behavior.

## 4. Minimal architecture recommended instead

Do not build a persistent unattended Claude-in-Chrome worker for the Sprint 1
search requirement. Two separate paths, not to be conflated:

- **For the actual Sprint 1 business need** (~8-10 automated searches/month,
  no human present): use the already-validated recommendation from
  JH-SUP-0016/0017 — **SerpApi's free tier** ($0/month at this volume, returns
  ranked organic title+URL, requires no browser, no Chrome extension, no
  interactive login per run, and is already proven viable). This is simpler,
  cheaper, faster to ship, and doesn't depend on an integration whose own
  documentation excludes unattended use.
- **If the Product Owner separately wants a human-supervised Claude+Chrome
  assistant tool** for other tasks (debugging, manual research, ad hoc browsing
  help) — that is a legitimate, documented, narrower use case. It should be
  scoped and built as exactly that (an interactive tool a person opens when
  they want help), not as Sprint 1's automated search mechanism. The elaborate
  persistent-worker/restart-survival/VNC engineering in the current draft is
  more infrastructure than a "person opens a session occasionally" tool needs.

## 5. Exact one-time human setup/permissions, if any

If the Product Owner still wants to validate the human-supervised assistant
path: a person needs a **direct Anthropic Pro/Max/Team/Enterprise plan**
(API-key/long-lived-token auth explicitly does not work), must complete
`/login` interactively inside the container (via the VNC tunnel), install/pair
the Chrome extension through its normal Web Store + guided setup flow, and
approve the one-time introductory dialog. This cannot be scripted around; it
is an unavoidable human step per the documented design, not a temporary
limitation of this draft.

## 6. Is Docker still recommended?

Conditionally yes, but only for the narrower human-supervised-assistant use
case, and only because it correctly co-locates Chrome and Claude Code in one
OS/user session (satisfying the native-messaging requirement) while keeping
the profile/session isolated from other work via named volumes. For that
narrower use case, Docker is not disqualifying, but it is also not obviously
better than running Chrome + Claude Code directly on the host — the added
Xvfb/VNC/container layers exist to make an interactive tool remotely
reachable, which is a real, valid reason, but should be a deliberate choice
made after confirming the assistant use case is actually wanted, not before.

## 7. Smallest LOCAL-ONLY validation, zero Google traffic

If the Product Owner wants to keep this line of work alive for the
human-supervised-assistant use case: the existing local validation step
(`LOCAL_BROWSER_CONTROL_PASS` against `http://127.0.0.1:8080/`) is a reasonable
smallest test **for that narrower goal** — it would confirm the native-messaging
pairing and container plumbing work at all. It would not, and should not be
read to, validate anything about unattended automation, because no unattended
path exists for this integration per the documentation reviewed.

## 8. Should any build proceed after this review?

**No further build of the unattended-worker architecture under JH-SUP-0018
should proceed.** The stated goal (twice-weekly unattended search) cannot be
met by Claude-in-Chrome per official documentation, independent of how well
the container is engineered. Recommend the Product Owner instead authorize
implementation against the already-reconciled SerpApi free-tier plan from
`docs/design/GOOGLE_SEARCH_BEST_PRACTICE_DECISION.md` /
`docs/design/CHEAPEST_GOOGLE_SEARCH_COST_DECISION.md`, which is proven,
compliant, and $0/month at the required volume. If the Product Owner wants
the human-supervised Chrome+Claude assistant tool for a separate purpose, that
should be spun up as its own, explicitly-scoped, smaller task — not framed as
Sprint 1's search mechanism.
