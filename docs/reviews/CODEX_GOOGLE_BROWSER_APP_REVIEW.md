# Independent Codex Review — Google Browser Search Application

**Reviewed commit:** `51b376a01b26b7de3d5bd1ccfcb1270e8cfbd4a`  
**Scope:** `apps/google-browser-search/` and `docs/evidence/GOOGLE_BROWSER_APP_RESULTS.md`  
**Review mode:** read-only; no application or production Job Hunter code changed.

## Determination

`BLOCKED_HUMAN_PERMISSION` is supported as the appropriate result *if the recorded Google challenge responses occurred*. The code would return exactly the documented shape on a challenge found immediately after the direct Google navigation: `challenge: true`, empty `organicResults`, empty `destinationsOpened`, and both call-count fields equal to zero. It returns before either extraction or destination navigation, so the evidence's reported zero organic results and zero opened destinations are internally consistent and plausible.

The runtime occurrence of a Google challenge cannot be independently proven from the committed source/evidence alone: the evidence includes a raw response only for query 1 and no independently verifiable response capture for queries 2 and 3. This is a provenance limitation, not evidence that the challenge assertion is false.

The evidence's substantive no-Firecrawl/no-search-API claim is confirmed by source inspection: there is no such discovery path in this application. The only `fetch` is the UI's same-origin request to `/api/search`; all Google interaction is through Playwright's persistent Chromium context and `page.goto`/page DOM evaluation.

## Required checks

| Check | Finding |
|---|---|
| Hidden HTTP / Firecrawl / search API | **Confirmed absent.** `server.mjs` only exposes the local Express routes. `lib/browser.mjs` imports Playwright and navigates a rendered page to Google; it contains no HTTP client, Firecrawl, or search-API use. The `proxy-addr` string in `package-lock.json` is an Express transitive dependency, not a proxy configuration or request path. |
| Hard organic budget | **Confirmed.** `MAX_ORGANIC_PER_QUERY = 10` is passed into the browser-page extraction routine, and extraction stops before adding result 11. |
| Hard destination budget | **Confirmed.** `MAX_DESTINATIONS_PER_QUERY = 5` is checked before every `context.newPage()`/destination navigation. |
| No evasion | **Confirmed.** No CAPTCHA solver, stealth plugin, proxy rotation, fingerprint spoofing, or comparable bypass code/dependency appears in the reviewed slice. On a detected challenge, `performSearch` returns immediately without fallback, extraction, or destination actions. |
| Evidence behavior under a challenge | **Confirmed as code-consistent/plausible.** The direct-request challenge branch produces the documented method, URL, false consent flag (when no consent action occurred), empty arrays, and zero counters. |
| Production Job Hunter integration | **Confirmed absent at this commit.** `git diff-tree` for `51b376a` lists only the new application files and `docs/evidence/GOOGLE_BROWSER_APP_RESULTS.md`; it contains no changes to `tools/`, `agents/`, `main.py`, `docs/agent-runtime/product-supervisor-ack.yaml`, or `docs/agent-directives/`. |

## Independent test result

Executed in `apps/google-browser-search/` with the committed dependencies already present:

```text
npm test
...
# tests 1
# pass 1
# fail 0
```

Thus the actual `npm test` pass count in this environment (Node `v24.19.0`) is **1/1 top-level test-file result**, not 7/7. Running the test module directly reports its seven declared helper tests as 7/7, but that is not the requested `npm test` command.

## Concrete defects

1. **Evidence test-count claim is contradicted.** The evidence says `npm test` is 7/7. The committed `npm test` command (`node --test tests/*.test.mjs`) produced 1 passing top-level test-file result and 0 failures here. The seven individual test declarations do pass when the module is run directly, but the evidence specifically attributes 7/7 to `npm test`.
2. **Evidence omits the required exact SHA.** It says `Commit SHA: this commit`, rather than recording `51b376a01b26b7de3d5bd1ccfcb1270e8cfbd4a` (or another exact immutable SHA). This fails the directive/evidence and review-protocol provenance requirement, although the review request itself supplied the target SHA.
3. **The server does not bound query length.** `POST /api/search` only rejects an empty query, despite the application contract describing one short human-readable query. This does not affect the three blocked acceptance requests or the conclusion above, but is a concrete missing guard.

## Conclusion

The application slice does not contain a prohibited alternative discovery mechanism or anti-bot evasion, and its challenge branch makes the documented all-zero result plausible. Therefore the reported operational classification is **confirmed as code-consistent: `BLOCKED_HUMAN_PERMISSION`**. It is not a PASS: no organic results or verified jobs were produced. The evidence must nevertheless be corrected for its exact SHA and its `npm test` count before it can be considered fully compliant provenance.
