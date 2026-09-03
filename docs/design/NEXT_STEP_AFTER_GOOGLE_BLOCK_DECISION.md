# Next Step After Google Block — Decision (JH-SUP-0009)

## Top summary

1. **Claude says:** revive the already-proven, zero-cost `profession.hu` portal adapter (frozen JH-SUP-0003 work) as the primary next experiment; Brave Search API as fallback for broader coverage; do not retry Google-browser or pursue residential-proxy evasion.
2. **Codex says:** independently, the same primary conclusion — revive the frozen portal adapter first (cheapest, already evidenced), Brave Search API / Google PSE as a time-boxed fallback evaluation only if coverage proves too narrow.
3. **Gemini says:** not available without blocking (`gemini-freshcheck` session was mid-task on unrelated work) — recorded, not waited on, per directive.
4. **Team recommendation:** un-freeze and re-verify `tools/acquisition/` (profession.hu adapter) before building anything new. Google-browser-from-this-cloud-host is closed as a dead end, not to be retried.
5. **First test to run:** re-run the existing, already-committed profession.hu adapter against 2-3 representative queries and confirm it still returns real, relevant, current job postings today (result count, sample titles/URLs, response health) — zero new code required.
6. **Why this test is different from the failed Google-browser build:** it re-verifies a mechanism that already succeeded live once (JH-SUP-0003's acceptance evidence: 27 survivors, 15+ materially relevant IT-leadership postings, zero blocking, zero cost) rather than retrying a mechanism that has now failed twice, from the same host, on the first request both times.

## Agreement/disagreement matrix

| Point | Claude | Codex | Agreement |
|---|---|---|---|
| Google-browser retry from this host | Reject | Reject | Full |
| Portal-native adapter as primary next step | Recommend | Recommend | Full |
| Residential/non-datacenter browser worker | Candidate, unverified, highest risk/cost | Not primary; explicit non-goal until legality/terms accepted | Full (both treat it as last-resort, not next) |
| Official search API as fallback | Brave Search API named specifically | Brave Search API named first, Google PSE also to be checked | Full — same primary fallback candidate |
| Residential-proxy-as-evasion | Explicitly forbidden | Explicitly forbidden | Full |

No material disagreement. Both independent answers converge on the same primary/fallback pair.

## Smallest falsification test per serious candidate

- **Portal-native adapter (primary):** one read-only run of the existing profession.hu adapter against 2-3 queries; success = real relevant postings returned, no access challenge. Already-built code, near-zero engineering.
- **Brave Search API (fallback):** one small fixed query set through the API (after key signup); success = real organic URLs/snippets with acceptable freshness/precision, verified current pricing/quota (not assumed from memory).
- **Residential browser worker (not recommended next):** would require a dedicated non-cloud device/network and legality/terms review before even a falsification test is meaningful — this is why it's not the next step.

## Estimated engineering effort before first real result

- Portal-native re-verification: near-zero (code exists, just needs a run + result inspection) — same order of effort as JH-SUP-0007/0008's evidence-gathering, but without new code.
- Brave Search API evaluation: small (API key signup + a thin adapter behind the existing `SearchProvider`-shaped interface) — a few hours of focused work, not a rebuild.

## Cost assumptions — verified vs. unverified

- **Verified by direct evidence in this repo:** portal-native adapter cost = $0 (plain HTTP, no API key) — this was actually run and measured (JH-SUP-0003).
- **Unverified, needs checking before committing to it:** Brave Search API's free-tier terms (referenced from public docs in earlier design proposals, not re-verified in this directive's execution) and Google Programmable Search Engine/Custom Search JSON API's current availability (already flagged in JH-SUP-0006-era work as closing to new customers by 2027-01-01, per ChatGPT's own finding) — both must be confirmed live before any implementation commitment, not assumed from memory.

## Primary recommendation

Un-freeze `tools/acquisition/` and re-run the profession.hu adapter live. If it still works, extend coverage (cvonline.hu's real search endpoint, still a known gap; possibly one more portal) before considering any paid API.

## Fallback recommendation

If portal coverage proves structurally too narrow after re-verification (e.g. too few sources, too generic within one portal), time-box an evaluation of Brave Search API as a supplementary discovery source, behind the same adapter interface, with verified current pricing/terms.

## Explicit stop conditions

- Do not retry Google-browser automation from this cloud host in any form.
- Do not build CAPTCHA-solving, stealth, proxy rotation, or fingerprint spoofing.
- Do not commit to a residential-proxy or residential-worker architecture without explicit Product Owner acceptance of its legality, cost, and operating burden.
- Do not spend on or integrate a paid search API before its current price/terms/quota are verified live.
- Do not delete or overwrite the frozen portal-adapter code while evaluating.

## NO IMPLEMENTATION AUTHORIZATION

This document is discussion/decision output only, per JH-SUP-0009. Implementation of the recommended first test requires a separate, explicit Product Owner directive authorizing it (the broad development freeze from JH-SUP-0005/0009 remains in force).
