# JH-SUP-0007 — CLAUDE GOOGLE-BROWSER POC

**Priority:** P0 / PRODUCT OWNER DECISION
**Status:** ACTIVE
**Execution owner:** Cloud Claude / sole ACTIVE_ORCHESTRATOR
**Supersedes:** JH-SUP-0006 for current execution

## Product Owner decision

The Product Owner accepts Claude's Google-browser proposal **only if it demonstrates real, useful search results**.

Do **not** wait for Gemini. The four-AI synthesis requirement is waived by the Product Owner for this decision. Do not spend further time obtaining a Gemini proposal and do not create a four-AI synthesis merely for process completeness.

The general product-development freeze remains in force. This directive authorizes exactly one narrow technical activity: a bounded Google-browser proof of concept based on Claude's proposal. It does not authorize production integration, migration, refactoring, deployment, Firecrawl work, or continuation of any earlier Job Hunter development slice.

## Accepted PoC design

Use Claude's proposed primary mechanism:

- Node.js + Playwright;
- Playwright-managed Chromium available on the cloud host;
- persistent, logged-out browser profile;
- headless mode for the first PoC because that is the runtime mode currently grounded by host evidence;
- Google opened in the browser and search performed by normal browser navigation to `https://www.google.com/search?q={query}`;
- extract organic results through semantic/ARIA/role-oriented browser structure rather than volatile Google class names;
- open only a bounded subset of promising destinations in the same browser context;
- no Firecrawl for discovery;
- no Google search API;
- no stealth plugins, fingerprint spoofing, proxy rotation, CAPTCHA solving, or anti-bot circumvention;
- CAPTCHA / unusual-traffic / login challenge => stop and report `BLOCKED_HUMAN_PERMISSION`.

The Product Owner explicitly accepts direct `google.com/search?q=` navigation for this PoC. Do not replace it with another architecture before testing it.

## Scope boundary

You MAY create the smallest isolated PoC code required to run this experiment and push it to GitHub, clearly separated from production Job Hunter code, e.g. under `poc/google-browser/` or an equivalently isolated path.

You MUST NOT wire the PoC into the production acquisition pipeline, scheduler, notifier, deployment, Firestore, Firecrawl, or existing runtime. No production behavior may change in this directive.

## Experiment

Use the existing candidate/profile information already present in `job-hunter` / preserved Job Searcher material. Generate a maximum of **3 short, ordinary Google queries** that reflect the actual target roles. They must resemble searches a human would type, not giant Boolean expressions.

For each query:

1. open the Google results page in the persistent Playwright Chromium session;
2. inspect first-page organic results only;
3. capture at most 10 organic results with at least title, URL, visible snippet/domain, and rank;
4. apply only a cheap local plausibility check to choose promising destinations;
5. open at most 5 destination pages;
6. identify whether each opened destination is a real current job posting, using `JobPosting` structured data or visible job-detail evidence;
7. record exact evidence.

Hard budget:

- max 3 Google queries total;
- first results page only;
- max 10 organic results read per query;
- max 5 destination pages opened per query;
- zero Firecrawl calls;
- zero search API calls;
- zero CAPTCHA/anti-bot bypass attempts;
- no automatic retries after a Google challenge.

## What counts as a real result

A successful PoC must show actual search output, not merely that Chromium launched or that a parser returned rows.

Create:

`docs/evidence/GOOGLE_BROWSER_POC_RESULTS.md`

It must contain, for every query:

- exact query text;
- whether Google loaded successfully;
- number of organic results extracted;
- a table of the extracted organic result titles and destination URLs (up to the bounded limit);
- which destinations were opened;
- exact current job titles and companies found;
- source URL for each verified job;
- short reason each verified job is plausibly relevant to the candidate profile;
- challenge/consent behavior observed;
- Firecrawl calls: must be `0`;
- any failures or ambiguity.

## PASS criterion

Do **not** declare PASS merely because the browser automation works.

PASS requires all of the following:

1. at least 2 of the attempted Google queries return readable organic results through the browser;
2. the PoC records actual first-page Google result titles + URLs rather than synthetic/test data;
3. at least **3 distinct, currently open job postings** are reached from those Google results and are plausibly relevant to the real candidate profile;
4. the evidence file exposes the exact job titles, companies, and URLs so the Product Owner can inspect them;
5. Firecrawl discovery calls = 0;
6. no CAPTCHA/evasion mechanism was used.

If fewer than 3 plausibly relevant current jobs are found, result = **FAIL**, even if Playwright itself worked perfectly.

## Failure handling

If Google presents CAPTCHA, unusual-traffic, mandatory login, or another automation challenge:

- stop the Google PoC immediately;
- do not retry with stealth/evasion/profile rotation/proxy changes;
- preserve evidence;
- ACK `BLOCKED_HUMAN_PERMISSION`.

If the browser runs but search results are empty/unparseable or no useful jobs are found, record **POC_COMPLETE_FAIL** with evidence. Do not redesign or start a second implementation inside this directive.

## Completion / ACK

Update `docs/agent-runtime/product-supervisor-ack.yaml` with JH-SUP-0007 and one of:

- `POC_COMPLETE_PASS`
- `POC_COMPLETE_FAIL`
- `BLOCKED_HUMAN_PERMISSION`

Reference the exact PoC implementation SHA and `docs/evidence/GOOGLE_BROWSER_POC_RESULTS.md` SHA/path.

After the PoC evidence is pushed, stop and wait for Product Owner review. **Do not integrate the solution into Job Hunter unless a later explicit Product Owner directive authorizes it.**
