# Next Step After Google Cloud-Host Block

## Decision

Treat browser-driven Google discovery from the present cloud-host IP as **falsified for this product deployment path**. Two fresh profiles failing on their first live request, before any result is read, is strong evidence that retrying, changing browser settings, or rebuilding the UI will not solve the immediate problem. It is not independent proof that the IP reputation is the cause, but it is enough to stop investing in this route until a narrowly scoped test separates host/network reputation from other factors.

The recommended architecture is a **source-adapter discovery layer**:

1. Make portal-native, direct HTTP fetchers the primary discovery mechanism, beginning with the already proven `profession.hu` adapter.
2. Add further permitted job portals and employer career sites as independent adapters.
3. Normalize all results into a common posting model, preserving the portal's canonical posting URL and source metadata.
4. Use a legitimate search API only as a supplementary discovery/indexing source, not as a replacement for portal adapters.

This follows the evidence already available: the portal-native approach has produced current, relevant results from this host without blocking or per-query API cost, whereas the Google-browser route has not produced a single readable organic result.

## Candidate comparison

| Candidate | Expected result quality | Operational reliability | Cost | Implementation complexity | Credential/account dependency | Policy / ToS risk | Exact URLs | Similarity to a human manual Google search |
|---|---|---|---|---|---|---|---|---|
| Official search API (Brave Search API; Google Programmable Search Engine / Custom Search JSON API) | Broad web coverage, but ranking, freshness, result count, and domain coverage may differ from Google Search UI. Good for finding employer pages and smaller sources; less targeted than portal-native queries. | Generally high if quota and service are available; subject to rate limits, quota exhaustion, and vendor changes. | Usually metered or quota-limited. Current pricing, free tiers, regional availability, and Google product status must be verified from official sources before selection. | Low to medium: API client, quota handling, caching, result normalization, and relevance filtering. | Yes: API key and usually a billing/account relationship. Google PSE additionally requires a configured search engine. | Low when used within published API terms; avoid treating it as permission to scrape result pages. | Usually yes: APIs return result links, although redirects/tracking URLs should be canonicalized. | Moderate. It approximates web search intent, but does not reproduce the interactive Google UI or its exact ranking. |
| Browser worker on a user-controlled non-datacenter network | Potentially closest to manual Google results and ranking, including rich snippets and live UI behavior. | Medium to low: depends on household connection stability, browser state, Google challenges, and whether the use is permitted. A different network can still be challenged. | Potentially low incremental cash cost if existing hardware/network is used; nontrivial maintenance and support cost. | Medium to high: remote worker, secure job dispatch, observability, secrets, browser lifecycle, failure handling, and data transfer. | Possibly: worker enrollment and remote-access credentials; Google account use should not be assumed or required. | Medium to high. Even from a residential connection, automated interaction with Google may violate or be constrained by Google's terms and can trigger anti-abuse controls. No bypass/evasion should be designed. | Yes if organic results can be read; however redirects and consent/interstitial pages need ordinary validation. | High in output appearance, but automation remains materially different from a human and may not be policy-safe. |
| Reuse and extend portal-native direct HTTP fetch adapters | High for covered portals: structured, current postings and portal-specific filters can be highly relevant. Lower web-wide recall until multiple sources are added. | High where the proven fetch route remains available; each portal has isolated failure modes. Monitor for markup/API changes and access restrictions. | Near-zero marginal API cost; normal compute/bandwidth only. | Low for the existing `profession.hu` adapter; medium per additional portal due to source-specific parsing, filtering, and tests. | Often none for publicly available listings; some portals may require an account or expose sanctioned feeds. | Low to medium when accessing public pages in accordance with each portal's terms, robots guidance where applicable, and reasonable request rates. Do not defeat access controls. | Excellent: retain the portal's canonical job-posting URL as a first-class field. | Low. It does not emulate Google; it directly answers the user's actual need—finding relevant jobs—more deterministically. |
| Employer career-site adapters / official ATS integrations (for example, official feeds or public endpoints from known ATS providers) | Very high precision and canonical application links for target employers; low discovery breadth unless paired with an employer list. | High for stable official feeds; medium for HTML-only career sites. Diversified across employers. | Typically zero API cost; maintenance grows with coverage. | Medium: employer registry, ATS-specific connectors, deduplication, and optional sitemap/RSS/feed support. | Usually none for public postings; official partner APIs may require credentials. | Low when using published feeds/APIs and public pages responsibly. | Excellent, often the canonical apply URL. | Low to moderate. It replaces general searching with direct, authoritative source collection. |
| Candidate-supplied alerts and subscriptions (portal alerts, employer newsletters, saved searches, RSS where offered) | High precision for configured criteria; freshness can be excellent. Coverage depends on supported services and user setup. | High after setup, but delivery is external and may be delayed or filtered. | Often free; some services may require accounts. | Low to medium: ingest user-authorized email/feed notifications, parse, normalize, and deduplicate. | Yes in many cases: user-owned portal/email accounts and consent. | Low if user-authorized and handled according to provider terms. | Usually yes, from the notification content. | Moderate: reflects saved human searches, but is asynchronous rather than interactive. |

## Architecture details

### Primary path: source adapters

Use the existing frozen `profession.hu` implementation as the reference adapter, without assuming it is complete or permanently stable. Keep the discovery boundary source-oriented rather than Google-oriented:

- A source adapter receives a normalized search intent (role families, seniority, location, language, exclusions, recency).
- It retrieves only the source's publicly permitted search/listing pages or official interface.
- It produces normalized postings containing at least title, employer when available, location, date when available, source, canonical URL, and enough source identifiers/text for deduplication and audit.
- A shared layer scores relevance, removes duplicates across sources, records retrieval time, and exposes source-specific failures rather than failing the whole search.
- Preserve provenance: every job should say which adapter found it and retain the unmodified canonical URL.

The first expansion should favor portals and career sources that cover the target market and have an inspectable, stable, permitted public listing path. Each proposed source needs its own small live validation before adapter investment; no generic scraper framework should be built prematurely.

### Supplementary search API path

Use a supported web-search API for discovery gaps that portal adapters cannot cover, particularly employer career pages, niche listings, and new sources. A vendor-neutral interface permits a later choice between Brave Search API and Google Programmable Search Engine / Custom Search JSON API.

Before committing to either, independently verify from the vendor's current official documentation:

- service availability for this project and region;
- current pricing, free quota, billing requirements, rate limits, and retention restrictions;
- whether returned results meet the needed locale/language/domain-filtering and freshness requirements;
- the API's exact URL fields, pagination behavior, and permitted storage/display/use of results;
- any current deprecation, migration, or product-status notices for Google's offering.

Search-API results should be treated as leads. Where a result points to a job board or employer page, fetch the destination through its appropriate adapter or normal permitted page retrieval before presenting it as a confirmed posting.

### Residential browser worker: only a controlled contingency

Do not make a non-datacenter browser worker a production dependency now. It remains useful only to answer a narrow question: is the immediate challenge specific to this host/network? If pursued later, it must be a user-controlled machine/network, with explicit ownership and consent, minimal request volume, no login assumed, ordinary visible challenge handling, and an immediate stop on challenge. It must not include CAPTCHA solving, fingerprint spoofing, proxy rotation, account farming, or any evasion mechanism.

Even a successful single request would establish only that this environment differs; it would not establish durable automation viability or permission under Google's terms.

## Cheapest live falsification test before substantial build

Run one small, read-only test of the **already-proven `profession.hu` adapter** using a representative IT-leadership query from the cloud host. Record only:

- whether the source returns a normal result/listing response without an access challenge;
- a small sample of canonical posting URLs and titles;
- response status/timing and the retrieval timestamp;
- whether the returned postings remain materially relevant.

Success falsifies the practical claim that the host is generally unusable for job discovery. It does not diagnose Google's block, but it directly validates the recommended product path at negligible incremental cost. The test should use conservative request volume and the same permitted access pattern as the successful frozen work.

If an independent network-cause diagnosis is specifically required, the next-cheapest diagnostic is one manual, non-automated Google search from a user-controlled non-datacenter connection, compared with one manual search from the cloud environment if that can be done without automation. This is diagnostic only, should stop at any challenge, and must not be used as authorization to automate Google there.

## Recommended next experiment

**Primary experiment:** revive the frozen `profession.hu` adapter in an isolated evaluation path and run the single representative live query above. Measure result count, relevance of the first small sample, canonical URL completeness, response health, and cost. If it still succeeds, define the normalized adapter contract around its existing output and add one additional target source only after that source passes an equally small source-specific validation.

This is the shortest path to proving an end-to-end discovery product from the current host, with evidence already supporting it.

**Fallback:** conduct a time-boxed evaluation of one official search API—preferably Brave Search API first because it is a dedicated web-search API, while also checking the current status and constraints of Google Programmable Search Engine / Custom Search JSON API. Use a fixed, small query set and compare returned canonical URLs, localization, freshness, precision, quota behavior, and documented cost. Select it only if it adds meaningful jobs or employer sources beyond the portal adapters at an acceptable verified price and terms.

If neither produces adequate coverage, add employer/ATS adapters and user-authorized saved-search alerts before considering any browser-worker route.

## Explicit non-goals: do not build these next

- Do not rebuild, tune, or retry cloud-host Playwright-to-Google discovery as though this were a UI or profile bug.
- Do not build CAPTCHA solving, anti-detection, browser fingerprint manipulation, proxy rotation, residential proxy procurement, account rotation, or any other bypass/evasion capability.
- Do not make a residential browser worker the default production architecture before its legality, terms, durability, and operating burden are explicitly accepted.
- Do not create a broad generic scraping framework before a second source has passed a small live validation; source-specific adapters are cheaper and easier to audit initially.
- Do not spend on a search API, create billing dependencies, or promise Google-equivalent ranking until current official pricing, availability, quotas, and terms have been verified.
- Do not delete or overwrite the frozen portal adapter while evaluating this direction; it is the strongest currently evidenced asset.

## Success criteria for the next phase

The next phase is successful when the application can retrieve a small set of current, materially relevant IT-leadership postings from the cloud host through permitted sources, show canonical URLs and provenance, and do so repeatably without access challenges or per-query search-engine automation. Web-wide recall can then be increased deliberately through additional validated adapters and, if justified, a supported search API.
