# JH-SUP-0017 — Cheapest Google Search Cost Review

## Priority / authority
P0, Product Owner. Execute immediately. Research only; ZERO new automated google.com/search traffic.

## Exact Product Owner question
Claude MUST explicitly ask Gemini, independently:

> What is the cheapest good solution for Job Hunter to perform approximately 8-10 automated Google-derived searches per month and obtain useful title+URL results, without risking the corporate public IP and without anti-bot bypass? Specifically compare Gemini API Grounding with Google Search, SerpApi, Zenserp, Serper.dev, SearchAPI.io, and Google Web Search Service. Also answer whether a Google account/login is required and why a normal human Incognito search succeeds while Playwright headed Chromium was challenged.

Claude must independently answer the same question and then reconcile with Gemini. Codex may fact-check but must not replace Gemini's answer.

## Mandatory current facts to verify
- Gemini Developer API current pricing for Grounding with Google Search, including free-tier/paid-tier allowances and model token costs.
- Whether Grounding response exposes source URL/title and whether it is a raw SERP/ranking or only model-selected grounding sources.
- SerpApi free monthly quota and no-card requirement; Google organic result title/link semantics.
- Zenserp free monthly quota.
- Serper free signup queries, paid minimum/top-up and credit expiry.
- SearchAPI.io free trial and paid minimum.
- WSS: distinguish official public pricing (if absent) from reported partner commercial terms ($15/1000 and $30,000 monthly minimum).

## Required decision
Produce `docs/design/CHEAPEST_GOOGLE_SEARCH_COST_DECISION.md` with a cheapest-first table for 8-10 searches/month and three recommendations:
1. cheapest Google-authorized option;
2. cheapest option that returns raw Google organic result-like title+URL/rank;
3. recommended Job Hunter production choice.

Explicitly explain Google-account vs Google Cloud/API credential requirements and Incognito vs Playwright differences without suggesting evasion.

Update ACK with `CHEAPEST_GOOGLE_SEARCH_COST_REVIEW_COMPLETE` only after Claude and Gemini both provide answers.
