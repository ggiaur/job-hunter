# JH-SUP-0016 — Google Search Best-Practice Research

## Authority / priority

Product Owner / PRODUCT_ARCHITECT_ORCHESTRATION_SUPERVISOR. P0. Execute immediately.

## Goal

Find the safest, legitimate, production-grade way to satisfy the Job Hunter need for approximately two automated Google searches per week and obtain genuine Google web-search title+URL results, given that both cloud and the verified on-prem corporate network produced Google's unusual-traffic challenge under Playwright Chromium automation.

This is a research/decision task. Do not generate any new Google Search traffic from the corporate network or from an automated Job Hunter browser.

## Mandatory independent work

Claude and Codex MUST research independently before reconciliation. Do not anchor Codex on Claude's conclusion.

Each analysis must investigate at minimum:

1. Google's official current guidance on automated/unusual Search traffic.
2. Google's current official programmatic web-search products, with special attention to the **Web Search Service API documented on 2026-09-03** (`developers.google.com/web-search-service`), including:
   - whether it returns genuine Google web-search results;
   - eligibility / partner agreement / client_id requirements;
   - availability to an ordinary organization;
   - pricing or commercial prerequisites if discoverable;
   - Hungarian/region support;
   - whether title, URL, snippet are returned;
   - whether using it would satisfy the Product Owner's underlying business requirement even if canonical `SPRINT_1.md` currently says literal browser SERP.
3. Google Programmable Search / Custom Search current capabilities and 2026 deprecation/transition status, distinguishing it from normal Google.com web results.
4. Whether browser automation of consumer `google.com/search` is a recommended/supported production integration at all. Do not propose fingerprint hiding, CAPTCHA solving, residential proxies, stealth plugins, or other anti-bot circumvention as best practice.
5. Legitimate managed browser/browser-compute vendors only as a separate candidate, explicitly checking whether their intended use and terms support Google Search automation without bypass and whether they actually change the core policy/anti-abuse issue.
6. Persistent real Chrome profile / GUI worker / human session approaches: explain whether they are production best practice or merely fragile diagnostic/manual approaches, including account/IP reputation and unattended-operation risks.
7. A decision matrix for: official Google Web Search Service API; Programmable Search; literal automated Google browser; managed browser; manual/human-in-loop; non-Google search provider only as fallback (not as Sprint 1 equivalence).

## Critical distinction

Separate these questions:

A. What is the best-practice technical solution for the Product Owner's actual business need: obtain current Google web-search result title+URL automatically ~2x/week?

B. Does that solution satisfy the current literal wording of `SPRINT_1.md` requiring a live Google SERP in a browser?

If A and B conflict, say so explicitly and recommend whether `SPRINT_1.md` should be amended by Product Owner decision rather than forcing an unsupported browser-scraping architecture.

## Safety invariant

JH-SUP-0014 remains in force for traffic safety:

- ZERO new automated `google.com/search` requests from corporate/on-prem egress.
- No retry or test variants against Google Search.
- No CAPTCHA solve automation.
- No proxy/VPN/residential proxy rotation.
- No stealth/fingerprint evasion.
- No paid trial purchase without Product Owner approval.

Web/documentation research is allowed.

## Required outputs

Create:

- `docs/design/CLAUDE_GOOGLE_SEARCH_BEST_PRACTICE.md`
- `docs/design/CODEX_GOOGLE_SEARCH_BEST_PRACTICE.md`
- `docs/design/GOOGLE_SEARCH_BEST_PRACTICE_DECISION.md`

The decision document must state:

1. Claude recommendation.
2. Codex recommendation.
3. Reconciled team recommendation.
4. Whether Web Search Service API is the new preferred path and exactly what prerequisite blocks immediate use.
5. Whether Product Owner should amend Sprint 1 from 'browser live SERP' to 'official Google Search result service returning genuine Google results'.
6. Smallest safe next action that does not risk the corporate IP.
7. Top 10 operational/legal/product pitfalls.

Update supervisor ACK with `GOOGLE_SEARCH_BEST_PRACTICE_RESEARCH_COMPLETE` when complete and include evidence paths.
