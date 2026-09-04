# Codex independent Pillér miss analysis — 2026-09-04

**Scope.** JH-SUP-0025 P0 forensic audit only. No production code was changed. This was conducted without reading any pre-existing `docs/forensics/` file. The four labels below are deliberate: a missing historical payload is not evidence of a negative result.

## Executive finding

**INFERENCE (high confidence, conditional on snapshot integrity):** Pillér disappeared before a successfully verified detail page entered extraction: either it was not in Stage A's top-ten SERP inventory, or it was reachable only through a Profession listing that the historical runner failed to fetch. It cannot have been removed by the title/domain gate, English handling, scoring/visibility, URL normalization, or semantic deduplication, because those execute only after a schema-verified detail page and the snapshot has no Pillér record in `results`, `excluded`, or `unreachable`.

**REPRODUCED EVIDENCE:** the direct current vacancy is live and has the expected title, company, Budapest location, IT-project planning/coordination, project plans/status reports/decision preparation, resource/deadline/risk handling, and coordination across business, development, test, operations, and leadership. It says `Nem kell nyelvtudás`; conversational English is an advantage. Source: [current Profession detail page](https://www.profession.hu/allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550), captured 2026-09-04 through the approved direct source path.

## Method and evidence limits

**KNOWN FACT:** the audited committed runner is `apps/job-hunter-mvp/run.mjs`. Its stages are: eleven fixed SerpApi `num=10` searches (A); fetch/classify those URLs (B); fetch at most the first twelve job-like links from each successful listing (C); then structured extraction, hard exclusions/scoring, and title+company deduplication.

**KNOWN FACT:** snapshot `docs/evidence/job-hunter-runs/2026-09-04T11-59-53-105Z.json` reports 108 organic results, 72 unique URLs, 58 confirmed ads, 6 scored results, 52 exclusions, and 169 unreachable/unclassifiable records. A case-insensitive search for `2988550`/`Pillér` over all three persisted record arrays returns zero.

**UNKNOWN-BECAUSE-NOT-PERSISTED:** the snapshot does not contain Stage-A raw SERP items/ranks, Stage-B successful listing HTML, extracted Stage-C link order, fetched HTML, JobPosting JSON-LD, or a per-candidate stage log. It therefore cannot prove the historical rank of Pillér or reconstruct a historical page's first twelve anchors.

**REPRODUCED EVIDENCE:** direct shell `curl`, Node `fetch`, and the real `serpapiSearch()` wrapper all failed in this workspace with DNS/`fetch failed`; all eleven bounded calls to the wrapper failed rather than returning a SERP. This is a present audit-environment transport limitation, not evidence about the 11:59 historical SERPs. The approved web access path did retrieve the live Profession detail and category pages, so live page-content assertions below derive from that path.

## Answers to the required questions

### 1. Was Pillér in any of today's top ten SERP results?

**UNKNOWN-BECAUSE-NOT-PERSISTED:** no raw historical SerpApi payload or rank was persisted. The 108 total is compatible with some queries returning fewer than ten, but says nothing about which results were returned. It would be fabrication to say “no” from the final result set alone.

**REPRODUCED EVIDENCE:** the prescribed bounded re-run of the real SerpApi wrapper, once for each of the exact eleven query strings, produced eleven `fetch failed` errors in this environment; it could not test current ranks. No Google endpoint was contacted directly.

**INFERENCE:** Pillér very likely was not a directly discovered Stage-A detail URL. If it had been, `run.mjs` would have attempted a Stage-B fetch and, on failure, persisted its exact URL in `unreachable`; if successful and schema-confirmed, it would have reached later partitions. Its absence from all partitions strongly challenges a direct-URL-discovery explanation, but does not mathematically rule out a persistence defect.

### 2. Did a listing containing Pillér appear, and was it within the first twelve links?

**KNOWN FACT:** the historical snapshot contains these Stage-B Profession listing candidates, all recorded `fetch failed`: 

- `https://www.profession.hu/allasok/budapest/1,0,23,projektmenedzser`
- `https://www.profession.hu/allasok/1,0,0,it%20projektmenedzser`
- `https://www.profession.hu/allasok/budapest/1,0,23,it%20projektmenedzser`

**REPRODUCED EVIDENCE:** the current first-party IT-development + project-management category page reports 186 ads and includes the Pillér card, title/company/location/requirements and the same duties. See [current category page](https://www.profession.hu/allasok/projektmenedzsment/1,10,0,0,76) and the direct detail URL above.

**UNKNOWN-BECAUSE-NOT-PERSISTED:** I cannot prove that one of the three historical listing responses contained Pillér, because all three failed before body persistence; nor can I state the historical or current raw-HTML first-twelve order.

**REPRODUCED EVIDENCE:** `extractJobLikeLinks(html, base, 12)` is a blind DOM-order collector: it accepts any same-host URL whose pathname contains a broad hint (`allas`, `job`, `career`, etc.), not just result-card detail URLs. The historical Stage-C output from a successful `it vezető` listing demonstrates the consequence: its twelve include pagination, RSS, alert, advice and company-listing URLs before/among five detail URLs. Thus a lower result-card link has a real, independently demonstrated depth/order failure mode.

**INFERENCE:** even if a successful listing contained Pillér, it was vulnerable to the twelve-link cap; it was not reached from the three project-manager listing URLs because each failed in Stage B. This is a contributing structural risk, not proven as the historical Pillér route.

### 3. Was Pillér fetched by B/C and did it have `JobPosting`?

**UNKNOWN-BECAUSE-NOT-PERSISTED:** no persisted record says that its URL was fetched, and no raw HTML/schema was saved. The live text-access method exposes rendered content but not the raw `<script type="application/ld+json">` required by `extractJobPostingSchema()`, so I do not claim a schema result.

**INFERENCE:** it did not successfully pass B or C in the historical run. A successful schema-confirmed fetch is appended to `confirmedJobAds` and is necessarily represented later as a scored/excluded record unless an unrecorded process failure occurred. A fetch failure would be represented in `unreachable` with its URL. Neither exists for Pillér.

### 4. If extracted, what is the score/exclusion state?

**REPRODUCED EVIDENCE:** I passed the live first-party title, Budapest location, and rendered vacancy text through the real exports in `lib/extract.mjs` and `lib/scoring.mjs` (not a reimplementation). Result: `matchesTargetPosition=false`, `isGenericProjectTitle=true`, `hasITDomainContext=true`, `hasProjectLeadershipScope=true`, `hasManagementScope=false`, `checkAdvancedEnglishRequired=false`; `positionRelevant=true`; score **77**, `visible=true`, `hardExcluded=false`.

**REPRODUCED EVIDENCE:** factor accounting for that invocation is 35 base + 12 generic project title with IT context + 15 project-leadership markers + 5 institutional-context marker (`közigazgatási`) + 10 remote/hybrid. The final +10 is an incidental-parser effect: the live text's “agilis, vízesés vagy **hibrid projektmódszertan**” matches the broad remote/hybrid regex, even though the stated workplace is Budapest. There was no datePosted input, salary was neutral, and the scorer's English label was `not specified in extracted text` (it does not recognise “Társalgási szintű”).

**UNKNOWN-BECAUSE-NOT-PERSISTED:** the exact historical schema description and `datePosted` are absent, so 77 is a reproducible current-text counterfactual, not an asserted historical persisted score. With a schema date, freshness could add 4 or 8; with a schema description omitting some rendered text, the value could differ.

### 5. Does title + IT-domain logic accept it?

**REPRODUCED EVIDENCE:** yes. `Projektmenedzser` alone is not in `POSITION_MATCH_TERMS`, but it is in `GENERIC_PROJECT_TITLE_TERMS`; “informatikai projektek” makes `hasITDomainContext()` true. The actual gate is:

`matchesTargetPosition(title) || (isGenericProjectTitle(title) && hasITDomainContext(descriptionText))`.

It evaluates true for the current live text. This falsifies “generic title was the cause.”

### 6. Did normalization/dedup/tracking remove it?

**KNOWN FACT:** URL normalization removes only `hash`; it does **not** remove a query string. Stage-A URL dedup is only exact normalized URL identity. Title+company semantic dedup executes only over `results`, after scoring; `excluded` is not semantically deduplicated.

**INFERENCE:** none can explain this absence. For any of those mechanisms to remove Pillér, a confirmed/scored record would first have to exist; no Pillér scored/excluded record exists. The test also falsifies the tempting “Profession tracking parameter was stripped” explanation: the implementation preserves it.

### 7. Ranked causes

1. **KNOWN FACT / highest demonstrated mechanism:** source transport/retrieval failure. The historical run explicitly persisted all three relevant Profession listing URLs as `fetch failed`; Stage B cannot yield C links or details from them.
2. **INFERENCE / high structural risk:** limited query coverage/ranking. Discovery is only 11 fixed Google/SerpApi phrases × top 10, with no direct Profession inventory; historic SERP rank is not persisted and cannot be claimed.
3. **REPRODUCED EVIDENCE / material structural risk:** listing traversal is capped at 12 broad path-heuristic links and demonstrably spends positions on navigation/RSS/pagination/company pages. A legitimate lower card can be missed.
4. **KNOWN FACT / not causal here:** direct Profession acquisition is dormant, so no first-party inventory compensates for either SERP ranking or listing fetch failures.
5. **REPRODUCED EVIDENCE / falsified for Pillér:** title/domain, English, scoring threshold, and dedup would accept/show the live text; they are not the earliest disappearance.
6. **UNKNOWN-BECAUSE-NOT-PERSISTED:** JobPosting verification strictness could be an additional false-negative if the page lacked valid JSON-LD, but no historical/live raw source was available to test it.

### 8. Why Budapest in all eleven searches?

**KNOWN FACT:** `run.mjs` hard-codes all eleven strings with `Budapest`; it does not read `persona.md`, `PO_DECISIONS`, or the location ring when composing queries. The Fehérvárcsurgó regional rule exists only in scoring (`scoreLocation`), after acquisition.

**INFERENCE:** this is a configuration/implementation drift, not a location-gate decision. It does not cause this Budapest Pillér miss, but it independently reduces regional recall before scoring can help.

### 9. Why is direct Profession not live?

**KNOWN FACT:** `tools/acquisition/adapters.py` contains a `ProfessionAdapter` with documented live verification, while the current `run.mjs` imports only SerpApi. `docs/product/SPRINT1_RECONCILIATION_NOTE.md` explicitly chose SerpApi as the sole live path for that sprint and deferred integrating the Python adapter to avoid cross-language migration risk while relevance scoring was the priority. `SPRINT_1.md` and PO decisions name direct Profession/job-searcher work as a preservation/reuse candidate, not as already-integrated behavior.

**INFERENCE:** the absence is an intentional deferral, now exposed by this audit as a material coverage trade-off—not evidence that the adapter was unavailable or that source use was prohibited.

### 10. Bounded false-negative blast-radius sample

**REPRODUCED EVIDENCE:** the current 186-ad Profession IT-development/project-management page supplied the following deliberately non-exhaustive sample. Each had a title, IT/project/leadership signal, and/or duties plausibly worth the Product Owner's review; this is not a recommendation or a claim that each would survive the rules. Exact ID lookup across historical `results`, `excluded`, and `unreachable` returned **ABSENT** for every resolved ID below.

| Current Profession candidate | ID | Why sampled | Snapshot state |
| --- | ---: | --- | --- |
| D365 Application Manager — HILL International | 2991281 | IT projects / enterprise application ownership | absent |
| Incident Management Reliability Engineer — Sanofi | 2990494 | leads major incidents and cross-team coordination | absent |
| Incidens manager — Pont Systems | 2987178 | directs specialist work; ITIL | absent |
| Test Manager — Pont Systems | 2987157 | planning, coordination, test risk | absent |
| IT szolgáltatásmenedzser — BKM | 2976822 | direct IT service-management title, nonprofit/public context | absent |
| Senior IT szolgáltatásmenedzser — MVM Informatika | 2971316 | direct target title, supplier/service lifecycle duties | absent |
| Projektmenedzser – IT területen — Swiss Medical Services | URL not returned by source cache | explicit IT PM, system-development/deployment projects | title/company absent |
| IT Retail Project Specialist — ORLEN | 2970025 | leads/co-ordinates retail IT delivery | absent |
| Release Manager & Test Automation Lead — ARM | 2989821 | release delivery plus technical leadership | absent |
| Process Project Coordinator — Harman Becker | 2984945 | project deadline/cost coordination in primary region | absent |
| Automatizáció és MI Business Analyst — BKK | 2989345 | digital/AI transformation use cases and prioritisation | absent |
| Projektmenedzser — Pillér Nonprofit | 2988550 | committed positive reference; IT PM/risk/status/decision support | absent |

**INFERENCE:** this sample, not a denominator or completeness measure, supports a large false-negative exposure: a first-party category view containing 186 roles has at least twelve superficially plausible roles that did not enter any persisted historical partition. Some might correctly be excluded after full evaluation (for example advanced English or individual-contributor scope); their non-acquisition is still a discovery-recall blind spot and prevents an evidence-based decision.

### 11. Separation of facts, reproductions, inferences and unknowns

**KNOWN FACT:** code order, fixed Budapest queries, ten-result SerpApi call, twelve-link cap, recording behavior, snapshot counts, listing-fetch failures, and dormant adapter decision are directly inspectable in committed files.

**REPRODUCED EVIDENCE:** current Pillér/page/category content; its current category presence; the real code's acceptance/scoring output; and the real wrapper/network failure described above.

**INFERENCE:** the earliest effective miss is pre-successful-detail acquisition, with Stage-B listing transport failure the strongest concrete mechanism and top-ten source coverage an unmeasurable but material co-mechanism.

**UNKNOWN-BECAUSE-NOT-PERSISTED:** historical SERP ranks, whether a historical listing body contained Pillér, exact C-link order, actual historical page fetch/schema, and its exact historical score/date. These must remain unknown until a future run persists candidate-level and raw/derived stage evidence.

## Audit conclusion

**INFERENCE:** the immediate root-cause category is **acquisition reliability and recall**, not relevance scoring. The positive reference would be visible under the current downstream rules when supplied as a real detail candidate. The record also exposes two independent acquisition weaknesses that can miss other Pillér-like roles: hard top-ten indirect discovery and a short, non-card-aware listing crawl. No fix is implemented or proposed here beyond that forensic conclusion.
