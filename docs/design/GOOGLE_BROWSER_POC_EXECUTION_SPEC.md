# Google Browser PoC — execution specification

**Status:** Product Owner authorized bounded PoC only  
**Primary design:** Claude proposal, accepted conditionally on real search results  
**Review inputs:** ChatGPT + Claude + Codex proposals  
**Gemini:** explicitly waived by Product Owner; do not wait for it  
**Production integration:** NOT AUTHORIZED

## 1. Product question

Can Job Hunter reproduce the Product Owner's successful manual behavior closely enough to be useful: use a normal browser session to ask Google ordinary job-search queries, read the real first-page results, open promising results, and return real current job postings that match the candidate profile?

The PoC exists to answer that question with evidence. A browser that merely launches, or a parser that merely returns links, is not a PASS.

## 2. Fixed candidate profile for this PoC

Use the canonical `profile/persona.md`. The target is an experienced IT leader with 20+ years of experience, infrastructure/operations/project leadership background, Budapest/agglomeration or remote/hybrid preference, and target roles including IT vezető / informatikai vezető / IT manager / infrastruktúra vezető / IT projektmenedzser / CIO / digitalization and AI leadership.

Do not change the persona merely to make the PoC pass.

## 3. Exact initial Google queries

Run exactly these three plain-language queries in this order for the first acceptance attempt:

1. `IT vezető Budapest állás`
2. `IT manager Budapest állás`
3. `IT projektmenedzser Budapest hibrid állás`

These are intentionally short and human-like. Do not replace them with a large Boolean expression, portal-specific fan-out, or synthetic keyword explosion in the first attempt.

If the three queries are technically submitted but Google produces no useful results, record FAIL. Do not silently change the test corpus until the failed run is preserved.

## 4. Browser/runtime choice

Implement the PoC as a small isolated Node.js Playwright worker under a clearly PoC-only path such as `poc/google-browser/`.

Use:
- Playwright for Node.js;
- Playwright-managed Chromium already available/cached on the host if compatible with the installed Playwright version;
- a dedicated persistent `userDataDir` outside tracked source, e.g. `/srv/projects/job-hunter/.runtime/google-browser-profile` (must be gitignored);
- one browser context and one active query at a time;
- logged out of Google;
- headless first, because that is the host mode Claude can currently support with evidence;
- prefer the regular Chromium/new-headless channel when available rather than relying on the legacy headless shell, because Playwright documents the newer Chromium headless mode as closer to normal headed browser behavior.

Do not automate the machine's default Chrome profile. Use a dedicated automation profile only.

## 5. Query submission — accepted Claude primary plus measured fallback

### Primary

Use Claude's accepted primary mechanism:

`https://www.google.com/search?q=<encoded query>&hl=hu&gl=hu`

Navigate there through the browser with Playwright. This is still browser navigation to the same Google results surface, not an HTTP scraping client or a search API.

### Fallback test, not silent substitution

If the primary path fails to produce a normal Google results page for a query but there is no CAPTCHA/challenge, one bounded fallback may be tested for that query:

1. open `https://www.google.com/`;
2. locate the visible search control using a user-facing Playwright locator (`getByRole`, label or equivalent);
3. fill the same exact query;
4. press Enter.

Record which method was used for every query. The fallback exists specifically to test the only material disagreement among the three proposals. Do not mix methods without recording it.

## 6. Consent, login and anti-automation stop rules

A standard Google cookie/consent screen may be handled once in the dedicated profile using a visible ordinary consent action, and the resulting cookie state may persist.

Immediately stop the Google-discovery PoC on any of the following:
- CAPTCHA / reCAPTCHA;
- `unusual traffic` or equivalent automation challenge;
- `verify you are human`;
- Google account sign-in or identity verification requirement;
- certificate/security warning requiring judgment.

Return `BLOCKED_HUMAN_PERMISSION`. No retry loop against the challenge. No proxy rotation, fingerprint spoofing, stealth package, CAPTCHA service, profile churn, account creation, or other bypass/evasion.

## 7. Google result extraction

Do not scrape Google's HTML with `requests`, Firecrawl, curl or another non-browser client. Extraction must occur from the page already rendered in Playwright.

Use user-facing/semantic structure as the first strategy:
- scope to the main/results region where practical;
- identify outbound result links associated with visible heading text;
- Playwright role/accessible locators are preferred;
- a minimal structural fallback such as an outbound `<a>` containing an `<h3>` is acceptable if role-only extraction proves insufficient;
- never depend on obfuscated Google CSS class names as the primary contract.

For each query capture at most the first 10 organic results with:
- query;
- rank;
- visible title;
- href/final outbound URL;
- visible snippet if reliably attributable;
- domain;
- extraction method.

Exclude obvious Google navigation, ads/sponsored results, search refinements and Google-owned control links. If classification is ambiguous, skip rather than guess.

## 8. Cheap selection before opening destinations

Before opening any destination, score only from Google-visible metadata. This is not the final relevance model; it is only a click-budget filter.

Positive title/snippet signals include, in rough priority order:
- `IT vezető`, `informatikai vezető`, `IT manager`;
- `IT osztályvezető`, `infrastruktúra vezető`, `IT operations manager`, `team lead` where clearly IT/infrastructure;
- `IT projektmenedzser`, `IT project manager`;
- `CIO`, `digitalizációs vezető`, `AI lead`, `Head of AI`, `AI transformation`.

Reject obvious non-target results before opening:
- pure helpdesk/1st line;
- pure individual-contributor software developer roles;
- non-IT management;
- generic article/training/news pages when they are clearly not job detail pages.

Maximum 5 destination pages opened per query, 15 total.

## 9. Destination verification

Open a selected result in a new tab in the same persistent context. Keep the Google result tab intact.

A result counts as a real job only if the destination provides evidence that it is a current concrete job detail page. Strong evidence:
- schema.org `JobPosting` JSON-LD/microdata; or
- visible coherent job-detail content including job title plus employer/company and application/responsibility/location information.

Reject or mark separately:
- search/category/index pages;
- company home/careers landing pages without a concrete opening;
- expired/closed postings;
- login/application walls that do not expose enough evidence to validate the job;
- unrelated articles/content.

For every verified job extract at minimum:
- exact job title;
- company/employer;
- final URL;
- location/remote-hybrid text if visible;
- current/open evidence or reason it is considered current;
- source Google query and rank;
- verification reason (`JOBPOSTING_SCHEMA` or `VISIBLE_JOB_DETAIL`).

## 10. Human-level relevance check

A verified job is `plausibly relevant` only when it fits the canonical persona strongly enough that a human would reasonably open it for this candidate.

The PoC must not declare PASS from keyword coincidence alone. For each final candidate provide a short factual rationale tied to the persona, e.g. leadership scope, infrastructure/operations/project focus, seniority, location/hybrid fit.

The canonical exclusions in `profile/persona.md` still apply. In particular, if the advertisement explicitly requires advanced/negotiation/native-level English, record it as excluded rather than counting it toward PASS.

## 11. Hard budgets

Per complete PoC run:
- 3 Google queries maximum;
- first results page only;
- 10 organic results captured per query maximum;
- 5 destination opens per query maximum;
- 15 destination opens total maximum;
- no pagination/infinite-scroll expansion;
- no automatic replay of failed queries;
- target wall time <= 8 minutes;
- Firecrawl calls = 0;
- search API calls = 0;
- paid crawling calls = 0.

An LLM is not required to prove browser discovery. If used for final relevance reasoning, record the model call count separately and do not use it to fabricate missing page evidence.

## 12. Evidence file

Write the complete measured result to:

`docs/evidence/GOOGLE_BROWSER_POC_RESULTS.md`

It must contain:
1. timestamp and exact code SHA;
2. Node/Playwright/Chromium versions and actual launch mode;
3. dedicated profile path (no secret/session contents);
4. exact three queries;
5. for each query: submission method, resulting Google URL, challenge/consent state, count of organic results;
6. a table of the captured organic results (rank/title/domain/URL);
7. a table of destination pages opened and verification outcome;
8. final plausibly relevant current jobs with exact title + company + URL + short fit rationale;
9. Firecrawl/search-API/LLM call counts;
10. PASS / FAIL / BLOCKED_HUMAN_PERMISSION.

Do not omit ugly results. The evidence file must make it possible to see whether Google actually behaved usefully, not only the successful subset.

## 13. Acceptance gate

### PASS

All of the following must be true in one preserved run:
- all three queries were attempted through the browser under the hard budgets;
- real first-page organic Google results were captured;
- at least 3 **distinct**, **current**, **concrete** job postings are verified;
- those 3 are plausibly relevant to `profile/persona.md` after exclusions;
- exact title + company + URL are recorded for each;
- Firecrawl discovery calls = 0;
- search API calls = 0;
- no anti-bot bypass/evasion occurred.

### FAIL

Examples:
- browser launches but useful Google results cannot be extracted;
- results are mostly irrelevant/non-jobs;
- fewer than 3 current plausibly relevant jobs survive;
- direct `?q=` navigation behaves materially worse and the UI fallback also fails;
- the evidence is insufficient to verify the actual listings.

### BLOCKED_HUMAN_PERMISSION

A Google challenge/login/security interaction stops the run under section 6.

## 14. Review protocol

Claude is execution owner for the accepted design. Codex is the independent reviewer of the exact PoC implementation/evidence SHA after the run.

Codex must specifically verify:
- no hidden HTTP/Firecrawl/search-API discovery path;
- hard budgets are enforced before actions;
- the evidence titles/companies/URLs really came from the run;
- at least 3 PASS candidates satisfy the persona and exclusions;
- no production integration was smuggled into the PoC.

Claude then resolves only concrete review findings and re-runs only if required. Do not broaden scope.

## 15. Production decision after PoC

This specification does **not** authorize production integration. If PASS, preserve the successful PoC and its evidence; the Product Owner then decides whether this Google-browser mechanism becomes Sprint 1's discovery foundation.

If FAIL, do not revert to Firecrawl-heavy discovery by default. Preserve the failure and diagnose the smallest falsified assumption (browser mode, direct-query method, result extraction, Google operational blocking, or query quality) before proposing the next experiment.
