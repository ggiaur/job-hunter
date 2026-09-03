# JH-SUP-0019 — Claude Chrome Container Feasibility Review BEFORE Further Build

## Authority / priority

P0. Product Owner correction. Execute immediately. This directive **pauses further implementation/build execution** of JH-SUP-0018 until Claude has first answered whether the proposed container architecture is actually supported and viable from Claude's own runtime/integration perspective.

## Why this directive exists

The Product Owner correctly identified a sequencing error: the team started building a Claude Code CLI + Chrome container before first asking the local Claude orchestrator whether its own Chrome integration can operate correctly in that environment.

Do not defend the existing draft implementation. Review it critically from first principles and from current Anthropic-supported behavior.

## Question Claude must answer

**Can Claude Code CLI, running inside a Docker container on the on-prem Ubuntu server, reliably control an official Google Chrome instance via the official Claude in Chrome integration in an unattended/persistent worker architecture?**

Answer YES / NO / CONDITIONAL, then justify precisely.

## Mandatory checks — no Google Search traffic

Claude must investigate, using local installed software/docs/source and web documentation if needed, but issue **ZERO automated google.com/search requests**.

Determine at minimum:

1. Whether Claude Code CLI on Linux officially supports connection to Claude in Chrome.
2. Whether the Chrome integration depends on Chrome native messaging, a host-side bridge, local sockets, browser extension APIs, Desktop app components, or any process that Docker isolation would break.
3. Whether both Claude CLI and Chrome must run in the same OS/user namespace, or whether containerization is supported/unsupported/unknown.
4. Whether the extension can be enterprise/force-installed and still complete its normal Anthropic authentication/permissions flow.
5. Whether a real system D-Bus/session bus, desktop login session, keyring, user systemd, or other host desktop services are required.
6. Whether Xvfb/Openbox is sufficient or a real desktop session (GNOME/XFCE/etc.) is needed.
7. Whether official Google Chrome inside Docker is supported by the Claude browser integration or merely technically launchable.
8. Whether Claude Code authentication state and Claude in Chrome authentication are independent, shared, or require interactive pairing.
9. Whether the architecture can survive container restart while preserving Chrome profile/extension state without unsupported credential copying.
10. Whether an unattended twice-weekly browser task can be triggered from Claude CLI without a human approving each browser-control action.
11. Whether the proposed noVNC-only-first-run setup is viable.
12. Whether Docker is the best deployment unit at all. Compare:
   - single Docker container containing CLI + Chrome + GUI;
   - Chrome/desktop directly on the Ubuntu host + Claude CLI on host;
   - GUI VM/container such as systemd-nspawn/LXC/VM;
   - any Anthropic-recommended server/headless/browser-control architecture.

## Review the committed draft

Inspect all files under `apps/claude-chrome-worker/` and identify every assumption that is unproven or likely wrong. In particular verify:

- extension ID and installation method;
- native messaging / connector requirements;
- Chrome launch method;
- Claude CLI install/auth path;
- persistent profile handling;
- GUI/session prerequisites;
- localhost test architecture;
- whether the local test can genuinely prove Claude CLI -> Claude in Chrome control rather than merely Chrome availability.

## Required decision

Create:

`docs/design/CLAUDE_CHROME_CONTAINER_FEASIBILITY.md`

It must contain:

1. Verdict: `VIABLE`, `VIABLE_WITH_CHANGES`, or `NOT_VIABLE_AS_DESIGNED`.
2. Evidence supporting the verdict.
3. Exact unsupported/unverified assumptions in the current draft.
4. Minimal architecture Claude recommends instead.
5. Exact one-time human setup/permissions, if any.
6. Whether Docker remains recommended.
7. Smallest LOCAL-ONLY validation that proves the critical integration, with zero Google Search traffic.
8. Explicit statement whether any build should proceed after review.

## Execution constraint

**Do not build/rebuild/start the container under this directive.** This is feasibility review first. Do not modify the implementation except documentation needed for the review. Do not run Google Search.

Update `docs/agent-runtime/product-supervisor-ack.yaml` with status `CLAUDE_CHROME_CONTAINER_FEASIBILITY_COMPLETE` and the verdict/evidence path. Stop after the review so the Product Owner can see Claude's answer before further implementation.
