# Claude — next step after Google-browser block

Written independently, before any Codex/Gemini answer.

## Candidate comparison

| Candidate | Result quality | Reliability | Cost | Complexity | Credentials | ToS risk | Exact URLs | Matches PO's manual behavior |
|---|---|---|---|---|---|---|---|---|
| 1. Official search API (Brave Search API, or Google Programmable Search Engine) | High for Brave (real organic web results incl. non-portal sites); Google PSE narrower (custom-indexed sites only) | High — documented API, no bot-detection risk since it's the intended machine-use path | Brave: free tier (2,000 queries/month per public docs — verify current terms before relying on it, not assumed from memory); Google PSE: free tier then paid, and its general Custom Search JSON API is being closed to new customers (per ChatGPT's SUP-0080-era finding, deprecation by 2027-01-01) | Low — REST call, no browser | API key signup (human action, no card required for Brave per current docs) | None — this is exactly what these APIs are for | Yes, real URLs/snippets | Approximates it (same breadth as a Google search) but isn't literally "Google" |
| 2. Residential/non-datacenter browser worker | Same as Google-browser design once unblocked | Unverified — untested whether a residential IP actually avoids the challenge; Google's bot detection may key on more than IP class | Ongoing (a real device/proxy, not free) | High — needs a persistent connector from a non-cloud network back into Job Hunter, or a paid residential proxy | A device the PO controls, or a proxy subscription | Grey-to-risky if using a proxy service specifically to mask automation from Google's own detection; low-risk if it's genuinely the PO's own machine running search on his own behalf | Yes | Closest in spirit, but now literally runs on someone's home network, not "the cloud" |
| 3. Portal-native direct-fetch adapters (already built, JH-SUP-0003, currently frozen) | **Already demonstrated real IT-leadership jobs** ("IT igazgató", "Enterprise Server Services Team leader", "E&P IT Operations Manager") from profession.hu, zero blocking, zero cost | Already proven live, once — needs re-verification but not re-invention | Zero (plain HTTP, no API key) | Zero — already committed, working code exists at `tools/acquisition/adapters.py` | None | None — this is public HTML the same way a browser would load it, at direct-fetch volume (not scraping-at-scale) | Yes | Not Google, but reproduces the *outcome* the PO cares about (real, current, relevant jobs) more cheaply than any Google path |

## What this comparison actually shows

The Google-browser attempt was falsified twice (JH-SUP-0007, JH-SUP-0008), on two fresh profiles, on the first request each time — this is very likely an IP-reputation-based block specific to this cloud host, not a fixable code defect. Retrying it without a different network origin (candidate 2) is not a serious next step; candidate 2 itself is unverified and the most expensive/riskiest option here.

Candidate 3 is not hypothetical: `docs/evidence/LIVE_JOB_SEARCH_ACCEPTANCE.md` (JH-SUP-0003, frozen work already sitting in this repo) already recorded 27 cheap-filter survivors and 15+ materially relevant IT-leadership job postings from a real, zero-cost, zero-blocked live run against profession.hu — obtained *before* the Google-browser detour started. That evidence was never invalidated; it was simply frozen by JH-SUP-0005 before being extended.

## Cheapest live falsification test

Re-run the already-committed `tools/acquisition/` portal adapters (from the frozen JH-SUP-0003 work) against 2-3 fresh queries. This requires **zero new engineering** — it is a re-verification of code that already exists and already worked, not a new build. If it still works today, it is strictly cheaper and lower-risk than standing up any new architecture.

## Recommendation

- **Primary next experiment:** un-freeze and re-verify the JH-SUP-0003 portal-native adapters (profession.hu confirmed; extend/verify cvonline.hu's real search endpoint, which was left as a known gap). This directly answers the PO's actual goal (real, useful jobs) without Google at all.
- **Fallback:** if portal coverage proves too narrow after re-verification, add Brave Search API as a supplementary discovery source for broader/employer-career-page coverage — it's the closest ToS-clean approximation of "a normal web search" without a browser, and ties directly into the existing `SearchProvider`-style interface already designed in earlier sessions.

## What should NOT be built next

- Another Google-browser retry from this same cloud host, in any form (headed, different Chromium channel, different consent handling) — the evidence already shows this is an IP-level block, not a code-level one.
- A residential-proxy workaround whose primary purpose is evading Google's own bot detection — this crosses into the anti-evasion territory every JH-SUP-000x directive has explicitly forbidden, even if technically distinct from "stealth plugins."
- Any new architecture before re-running what's already built and already proven to work.
