# Google Browser Search — Job Hunter PoC application (JH-SUP-0008)

Bounded application, not the production Job Hunter pipeline. No Firestore, no Telegram, no scheduler, no Firecrawl.

## Install & run

```bash
cd apps/google-browser-search
npm install
npm start
# open http://localhost:4173
```

`PORT` env var overrides the default port (4173).

## Endpoints

- `GET /` — UI
- `GET /health` — `{status, browser}` — reports whether the persistent browser context is up, performs no Google search
- `POST /api/search` — `{query}` → runs one bounded Google-browser search

## Operational limits (enforced in `lib/browser.mjs`)

- Google navigation only, via `https://www.google.com/search?q=...&hl=hu&gl=hu`; one recorded UI-search-box fallback if that yields zero results and no challenge occurred
- max 10 first-page organic results read per query
- max 5 destination pages opened per query
- zero pagination
- zero Firecrawl calls, zero search-API calls
- no anti-bot bypass; a CAPTCHA/unusual-traffic/login challenge stops the request and returns `challenge: true` to the UI, no retry

## Tests

```bash
npm test
```

Covers the deterministic helpers in `lib/extract.mjs` (relevance scoring, challenge detection, exclusion reasoning). Browser interaction itself is not unit-tested (requires a real Google response); see `docs/evidence/GOOGLE_BROWSER_APP_RESULTS.md` for the real acceptance run.
