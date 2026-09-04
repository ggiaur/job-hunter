// JH-SUP-0026 section 1.3: activate direct Profession.hu acquisition as a
// complementary path alongside SerpApi, so vacancy discovery does not depend
// entirely on SerpApi returning a listing/category page as an organic
// result (the structural gap SUP-0026 section 1.3 identifies).
//
// URL pattern adapted from job-searcher's already-proven, already-deployed
// scraper (tools/scraper.py, e.g. its confirmed working
// "https://www.profession.hu/allasok/1,0,0,informatikai%20vezet%C5%91"
// query) -- the exact preservation candidate PO_DECISIONS/consolidation
// decisions name. Re-implemented natively in JS rather than bridged from
// Python, since this pipeline is entirely JS and a cross-language bridge
// would add real operational risk for no benefit.
//
// This is the SAME simple national keyword-search entry point, not a
// per-city category URL: live testing (2026-09-04) found Profession.hu's
// multi-parameter category/city/pagination URL encoding fragile enough
// that constructing city-specific variants produced real HTTP 500s and
// empty replies for some inputs -- exactly the kind of unverified
// "should work" claim this project's discipline forbids. The national
// keyword search already returns ads from every region (verified live),
// so it satisfies real regional coverage without guessing that encoding.

const BASE_URL = 'https://www.profession.hu/allasok/1,0,0,';

export function buildDirectProfessionUrl(keyword) {
  return `${BASE_URL}${encodeURIComponent(keyword)}`;
}

/**
 * Fetch one direct Profession.hu keyword search and extract real
 * vacancy-detail links from it, via the same structural classifier used for
 * SerpApi-discovered listing pages (lib/links.mjs). A transient failure
 * (timeout, 5xx, empty reply -- all observed live during development) is
 * retried once with a short delay, then reported honestly as a failed
 * acquisition attempt rather than silently dropped -- per this project's
 * "no pretend success" discipline.
 *
 * @param {(url: string) => Promise<{ok: boolean, status: number|null, html?: string, error?: string}>} fetchFn
 * @param {(html: string, url: string, limit: number) => object} extractFn  injected for testability
 * @param {string} keyword
 * @param {{ limit?: number, retryDelayMs?: number }} opts
 */
export async function searchProfessionDirect(fetchFn, extractFn, keyword, opts = {}) {
  const { limit = 60, retryDelayMs = 1500 } = opts;
  const url = buildDirectProfessionUrl(keyword);

  let res = await fetchFn(url);
  if (!res.ok || !res.html) {
    await new Promise((r) => setTimeout(r, retryDelayMs));
    res = await fetchFn(url);
  }

  if (!res.ok || !res.html) {
    return {
      query: keyword,
      url,
      ok: false,
      error: res.error || `HTTP ${res.status}`,
      detailUrls: [],
    };
  }

  const linkResult = extractFn(res.html, url, limit);
  return {
    query: keyword,
    url,
    ok: true,
    detailUrls: linkResult.detailLinks,
    totalDetailLinksFound: linkResult.totalDetailLinksFound,
    filteredNonJobCount: linkResult.filteredNonJobCount,
  };
}

/**
 * Run direct Profession.hu acquisition for multiple keywords with a small
 * stagger between requests (politeness / rate-limit avoidance -- observed
 * live during development that rapid sequential requests could produce
 * transient empty replies). Bounded and sequential, not concurrent, per
 * JH-SUP-0026's "no consumer scraping/bot-evasion, stay within a modest
 * request budget" spirit.
 */
export async function runDirectProfessionAcquisition(fetchFn, extractFn, keywords, opts = {}) {
  const { staggerMs = 400, ...rest } = opts;
  const results = [];
  for (const keyword of keywords) {
    results.push(await searchProfessionDirect(fetchFn, extractFn, keyword, rest));
    if (staggerMs > 0) await new Promise((r) => setTimeout(r, staggerMs));
  }
  return results;
}
