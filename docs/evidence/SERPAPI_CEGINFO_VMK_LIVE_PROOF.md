# SerpApi Live Proof — CÉGINFO WWW.VMK.HU (JH-SUP-0020/0021)

**Result: PASS**

## Registration path

**Product Owner-supplied.** JH-SUP-0021's OAuth signup path
(`serpapi.com/users/sign_up`, GitHub/Google OAuth) was blocked in this
session per `SERPAPI_CEGINFO_VMK_LIVE_PROOF.md` (this session has no
interactive browser-automation tool — see JH-SUP-0019/0021 evidence).
The Product Owner completed account creation directly and supplied a
working SerpApi API key in chat. Plan tier (Free vs paid) was not
independently confirmed by this session — the key works and returned a
successful live result; plan-tier confirmation would require checking the
SerpApi account dashboard, which this session cannot access interactively.

## API key handling

- Stored at `/home/dockeruser/.job-hunter-secrets/serpapi.env` on the
  on-prem host, outside any git working tree, directory `chmod 700`, file
  `chmod 600` (owner-only).
- **Not** committed to the repository, **not** printed in full in any log
  or evidence file.
- Redacted fingerprint: `de67...97f5` (first 4 + last 4 characters only).
- The user has stated intent to rotate this key after testing.

## Execution

Timestamp (SerpApi `created_at`): 2026-09-03 22:40:39 UTC
Query (exact, per directive): `CÉGINFO WWW.VMK.HU`
Engine: `google`
Parameters: `hl=hu`, `gl=hu`
Method: `GET https://serpapi.com/search` (note: the API requires GET with
query-string parameters; an initial attempt using `curl --data-urlencode`
without `-G` sent a POST and returned an empty `404` — corrected by adding
`-G` to force GET semantics, documented here for future reference)
Google URL SerpApi resolved internally (visible in response metadata, for
transparency): `https://www.google.com/search?q=C%C3%89GINFO+WWW.VMK.HU&oq=...&hl=hu&gl=hu`
— this request was made by SerpApi's own infrastructure, not by any Job
Hunter browser/IP. **Total direct automated `google.com/search` requests
from Job Hunter corporate egress under this directive: 0.**

`search_metadata.status`: `Success`

## Organic results (all 9 returned, exact order)

| # | Title | URL |
|---|---|---|
| 1 | Keresztury Dezső Városi Művelődési Központ | https://www.ceginformacio.hu/cr9310238195 |
| 2 | Cégszolgálat Ingyenes Céginformáció | https://www.e-cegjegyzek.hu/?cegkereses/18-10-100701 |
| 3 | VMK Kft. f. a | https://www.ceginformacio.hu/cr9310099885 |
| 4 | **Közérdekű adatok** | **https://www.vmk.hu/kozerdeku-adatok** |
| 5 | VMK BAU PLUSZ Kft.2017 | https://ceginfo.hu/ceg-adatlap/vmk-bau-plusz-kft-0109302514.html |
| 6 | **Vörösmarty Mihály Könyvtár** | **https://www.vmk.hu/** |
| 7 | VMK rövid céginformáció, cégkivonat, cégmásolat letöltése | https://www.ceginformacio.hu/cr9310268627 |
| 8 | **Adó 1%** | **https://www.vmk.hu/ado-1** |
| 9 | Beaufort VMK Kft "kt. a."2010 | https://ceginfo.hu/ceg-adatlap/beaufort-vmk-kft-kt-a-0109936206.html |

## VMK-related result confirmation

**Yes** — 3 of 9 organic results are genuine `vmk.hu` pages (positions 4, 6,
8), directly belonging to Vörösmarty Mihály Könyvtár (the library that is
this project's real-world subject/Product Owner organization). This is a
successful, genuine, non-fabricated live Google-derived result set returned
via SerpApi with zero direct Google traffic from Job Hunter's own
infrastructure.

## Raw evidence

Full raw JSON response (API key not present in the response body; no
redaction was needed beyond confirming its absence):
`docs/evidence/serpapi-ceginfo-vmk-live-proof.json`

## Compliance

Zero direct automated `google.com/search` requests from Job Hunter/corporate
egress. Zero API key committed or printed in full. Zero fabricated results —
this is a genuine live API response.
