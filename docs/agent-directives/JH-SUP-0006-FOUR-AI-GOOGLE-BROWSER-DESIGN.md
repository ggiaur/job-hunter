# JH-SUP-0006 — FOUR-AI GOOGLE BROWSER SEARCH DESIGN

**Priority:** P0 / PRODUCT OWNER AUTHORIZED DESIGN ONLY
**Status:** ACTIVE
**Execution owner:** Cloud Claude / sole ACTIVE_ORCHESTRATOR
**Supersedes:** JH-SUP-0005 only to the limited extent necessary to perform this design/research task. The implementation freeze remains in force.

## Product Owner task

Four AI participants must jointly work out a credible, buildable solution for a Job Hunter search system that uses Google through a browser in the same basic way the Product Owner does manually:

> open Google in a normal browser -> type a normal query -> inspect the result page -> open promising results -> identify real current job postings.

The four independent contributors are:
1. ChatGPT / Product Architect
2. Cloud Claude / ACTIVE_ORCHESTRATOR
3. Codex
4. Gemini

This is a DESIGN / FEASIBILITY task only. Do not implement production code, migrate components, launch a new Sprint, run Firecrawl, deploy, or resume the previous development plan.

## Existing ChatGPT proposal

Read first:
`docs/design/CHATGPT_GOOGLE_BROWSER_SEARCH_PROPOSAL.md`

Do not give this proposal to Codex or Gemini before they have produced their own independent proposals. Claude may read it because Claude is the integration owner, but must produce its own proposal before synthesis and must not simply echo ChatGPT.

## Exact problem to solve

The current automated search must not assume Firecrawl or a job portal is the primary discovery mechanism.

We need to determine whether a cloud-hosted AI can reliably perform the same basic discovery operation the Product Owner performs manually in a browser:

1. launch/use a normal browser session;
2. navigate to Google Search;
3. type a short natural-language job query;
4. submit the query through normal UI/browser interaction;
5. read the ordinary Google results page;
6. capture organic result title/snippet/URL;
7. cheaply identify promising results;
8. open a bounded number of promising links;
9. verify whether each is a current job posting;
10. feed only useful candidates into later Job Hunter ranking/memory logic.

The design must explicitly avoid anti-bot circumvention. No CAPTCHA bypass, stealth plugin, proxy rotation, fingerprint spoofing, or evasive automation is part of the solution. A challenge requiring a human must become a clear human-permission/blocker state.

## Work sequence

### A. Claude independent proposal

Cloud Claude writes:
`docs/design/CLAUDE_GOOGLE_BROWSER_SEARCH_PROPOSAL.md`

It must answer:
- exact browser technology and runtime topology;
- headed vs headless vs persistent session choice;
- how the browser session is created and preserved;
- how Google is opened and a query is submitted;
- how organic results are identified without brittle page scraping where possible;
- how links are opened and job pages verified;
- consent/CAPTCHA/login behavior;
- request/query/click limits;
- failure handling;
- how this integrates with Job Hunter while keeping browser acquisition replaceable;
- minimum PoC acceptance test.

### B. Codex independent proposal

Give Codex ONLY the exact problem statement above, current cloud/runtime facts necessary to reason, and the requirement that no implementation is allowed.

Do NOT provide ChatGPT's or Claude's proposal first.

Save verbatim/substantively complete output to:
`docs/design/CODEX_GOOGLE_BROWSER_SEARCH_PROPOSAL.md`

### C. Gemini independent proposal

Give Gemini the same independent problem statement and same constraints.

Do NOT provide ChatGPT's, Claude's, or Codex's proposal first.

Save output to:
`docs/design/GEMINI_GOOGLE_BROWSER_SEARCH_PROPOSAL.md`

If Gemini is still quota-blocked, do not substitute another model and do not claim four-AI completion. Record the blocker and keep the task incomplete until Gemini can actually contribute, unless the Product Owner explicitly waives the fourth opinion.

### D. Four-way synthesis

Only after all four proposals exist, Cloud Claude compares them in:
`docs/design/FOUR_AI_GOOGLE_BROWSER_SEARCH_DECISION.md`

The synthesis must use a decision table covering at minimum:
- ability to behave like a normal Google browser user;
- reliability in the actual cloud environment;
- implementation complexity;
- fragility to Google UI changes;
- persistent session support;
- ability to extract organic results;
- challenge/CAPTCHA handling;
- account requirement/risk;
- legal/terms/operational risk;
- cost;
- query throughput needed for Job Hunter;
- observability/debuggability;
- compatibility with Claude/Codex/Gemini tooling;
- fallback path.

Then select exactly ONE recommended architecture and ONE fallback.

## Required final design specificity

The chosen architecture must be concrete enough that a separate later implementation directive could be written without another architecture debate. It must specify:

1. browser package/tool (for example Playwright, Playwright MCP/CLI, Chrome/Chromium mode, or a clearly better alternative);
2. process topology on the cloud host;
3. persistent profile/session approach;
4. exact interaction method with Google search UI;
5. result extraction contract;
6. organic-result identification rule;
7. query budget;
8. click budget;
9. challenge/CAPTCHA/consent behavior;
10. login policy;
11. cheap pre-click/pre-detail filtering;
12. job-detail verification step;
13. data contract returned to Job Hunter;
14. logging/evidence requirements;
15. minimal later PoC procedure;
16. success/failure criteria;
17. fallback if Google browser automation proves unreliable.

## Important distinction

The intended design is NOT "scrape Google HTML at scale" and NOT "find another search API and call it Google".

The question is specifically whether we can build a controlled browser operator that uses Google's normal browser search workflow similarly to the Product Owner, at the small query volume Job Hunter needs.

## Freeze rules during this task

Allowed:
- reasoning;
- official-document research;
- independent AI consultation;
- writing the four design documents and final decision;
- read-only inspection of cloud browser/tool availability.

Forbidden:
- production implementation;
- changing application code;
- Firecrawl/live job crawling;
- autonomous Google-query PoC unless separately authorized by the Product Owner after the four-way design is complete;
- deployment;
- migration work;
- unrelated review/fix loops.

## Completion

JH-SUP-0006 is complete only when all FOUR independent proposals and the integrated decision exist on GitHub. Until then, do not resume product development.
