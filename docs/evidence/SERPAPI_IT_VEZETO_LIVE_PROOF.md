# SerpApi Live Proof — "IT vezető" (SPRINT_1.md canonical example query)

**Result: LIVE RESULT OBTAINED — presented for demo purposes**

## Important status note

This is a genuine, live, real Google-derived result set for `SPRINT_1.md`'s
own literal example query (`IT vezető`). It is presented for demonstration
because real results were requested today.

**This does not yet formally satisfy Sprint 1's Definition of Done as
currently written.** `SPRINT_1.md` §6 explicitly excludes "Google Programmable
Search / another Google API that does not expose the actual required Google
Search result behavior... unless the Product Owner later changes the
requirement explicitly." SerpApi is exactly that kind of third-party/API
result, not a literal rendered browser SERP. The team's reconciled
recommendation (JH-SUP-0016/0017/0019) has consistently been to amend
`SPRINT_1.md`'s literal wording to accept this class of result — that
amendment has not yet been made. Sprint 1 status remains `NOT_DONE` in
`docs/agent-runtime/product-supervisor-ack.yaml` until the Product Owner
makes that call.

## Execution

Query: `IT vezető` (exact match to `SPRINT_1.md`'s own example)
Engine: `google`, `hl=hu`, `gl=hu`
Method: `GET https://serpapi.com/search`
`search_metadata.status`: `Success`
Zero direct automated `google.com/search` requests from Job Hunter corporate
egress — SerpApi's own infrastructure made the underlying Google request.

## Organic results (all 9 returned, exact order)

| # | Title | URL |
|---|---|---|
| 1 | It vezető állás, munka - 145 állásajánlat - 2026 Szeptember | https://www.profession.hu/allasok/1,0,0,it%20vezet%C5%91 |
| 2 | Több mint 200 IT Vezető állás, munka: Budapest 2026, ... | https://hu.indeed.com/q-it-vezet%C5%91-l-budapest-%C3%A1ll%C3%A1sok.html |
| 3 | Állások - IT Vezető - Magyarország | https://www.careerjet.hu/it-vezeto-allasok |
| 4 | It Manager Állások itt: Hungary (462 Nyitva szerepkörök) | https://hu.linkedin.com/jobs/it-manager-jobs |
| 5 | Fizetés IT-igazgató - Magyarország - Fizetesek.hu | https://www.fizetesek.hu/fizetesek/cegvezetes/it-igazgato |
| 6 | IT vezető állás Budapest (Sürgősen!) - 137 új állásajánlat | https://hu.jooble.org/%C3%A1ll%C3%A1s-IT-vezet%C5%91/Budapest |
| 7 | Az IT vezetők titkos élete | https://www.innoteka.hu/cikk/az_it_vezetok_titkos_elete.1717.html |
| 8 | Állás informatikai vezető - 81 aktuális álláshirdetések | https://hu.jobsora.com/%C3%A1ll%C3%A1sok-informatikai-vezet%C5%91 |
| 9 | Informatikai vezető állás, munka Budapesten | https://www.profession.hu/allasok/budapest/1,0,23,informatikai%20vezet%C5%91 |

Results 1, 2, 3, 4, 6, 8, 9 are genuine live job-listing/aggregator pages —
directly on-topic for the query, confirming the search mechanism returns
real, relevant, current results, not noise.

## Raw evidence

`docs/evidence/serpapi-it-vezeto-live-proof.json` (API key confirmed absent).

## Compliance

Zero Google Search traffic from Job Hunter's own infrastructure. Zero
fabricated results. API key not present in this file or the raw JSON.
