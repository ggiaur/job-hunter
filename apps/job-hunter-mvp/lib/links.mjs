// JH-SUP-0026: replaces broad path-substring "job-like link" matching with
// real vacancy-detail-link classification. The prior version (JOB_PATH_HINTS
// substring match) could not distinguish an actual vacancy detail page from
// a company profile, RSS feed, job-alert signup, pagination link, or advice
// page -- all of which share substrings like "allas"/"job"/"career" on
// Profession.hu. The fixed 12-slot cap then got consumed by these before
// real job ads, causing real, scoreable vacancies (e.g. the Pillér Nonprofit
// Kft. Projektmenedzser reference) to never be fetched at all. See
// docs/forensics/PILLER_MISS_RECONCILIATION_2026-09-04.md for the proof.
//
// Fix: classify by URL structure, not substring presence, and apply any cap
// only AFTER non-vacancy links are filtered out, never before.

const SKIP_EXT = /\.(css|js|png|jpg|jpeg|gif|svg|ico|pdf|woff2?)(\?|$)/i;

// Profession.hu real vacancy-detail pages are singular "/allas/<slug>-<id>"
// (verified live, 2026-09-04: e.g. /allas/projektmenedzser-piller-nonprofit-kft-budapest-2988550).
// Category/listing pages, company profiles, and search results all use the
// plural "/allasok/..." prefix instead, so the singular/plural distinction
// plus a trailing numeric ID is a real structural signal, not a heuristic
// guess -- confirmed against the live site, not assumed.
const PROFESSION_DETAIL_REGEX = /^\/allas\/[a-z0-9-]+-\d+\/?$/i;

// Non-vacancy path prefixes seen live on Profession.hu listing pages that
// would otherwise pass a naive substring check (all contain "allas"):
// /allasok/... (category/company/listing), /allasertesito/... (job-alert
// signup), /allaskeresesi-tanacsok (advice page), /allas-kulcsszo/ (keyword
// search entry point). Tracked explicitly so filteredNonJobCount reasons are
// meaningful, not just "didn't match".
const KNOWN_NON_DETAIL_PREFIXES = [
  { prefix: '/allasok', reason: 'category/listing/company-profile page' },
  { prefix: '/allasertesito', reason: 'job-alert signup' },
  { prefix: '/allaskeresesi-tanacsok', reason: 'advice/informational page' },
  { prefix: '/allas-kulcsszo', reason: 'keyword-search entry point' },
];

// Generic fallback for any future non-Profession listing source: still
// requires a job-path hint, but additionally excludes the same classes of
// non-detail path (RSS, alerts, advice, pagination-style query-only pages)
// so a new source doesn't silently regress to the old over-inclusive
// behavior. Kept intentionally conservative -- Profession.hu is the only
// verified listing source in this pipeline.
const GENERIC_JOB_PATH_HINTS = ['allas', 'job', 'vacancy', 'poz', 'career', 'karrier', 'toborzas'];
const GENERIC_NON_DETAIL_HINTS = ['rss', 'ertesito', 'alert', 'tanacs', 'kulcsszo', 'signup', 'regisztracio'];

function decodeHtmlEntities(s) {
  return s.replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}

/**
 * Classify a same-origin pathname as a real vacancy-detail link or not.
 * Returns { kind: 'DETAIL' } or { kind: 'OTHER', reason }.
 */
export function classifyJobPath(hostname, pathname) {
  const isProfession = /(^|\.)profession\.hu$/i.test(hostname);
  if (isProfession) {
    if (PROFESSION_DETAIL_REGEX.test(pathname)) return { kind: 'DETAIL' };
    const nonDetail = KNOWN_NON_DETAIL_PREFIXES.find((p) => pathname.toLowerCase().startsWith(p.prefix));
    if (nonDetail) return { kind: 'OTHER', reason: nonDetail.reason };
    return { kind: 'OTHER', reason: 'does not match Profession.hu vacancy-detail URL structure (/allas/<slug>-<id>)' };
  }
  // Generic fallback for a non-Profession source.
  const lowerPath = pathname.toLowerCase();
  if (GENERIC_NON_DETAIL_HINTS.some((h) => lowerPath.includes(h))) {
    return { kind: 'OTHER', reason: 'matches a known non-detail path hint (alert/rss/advice/signup)' };
  }
  if (GENERIC_JOB_PATH_HINTS.some((h) => lowerPath.includes(h))) return { kind: 'DETAIL' };
  return { kind: 'OTHER', reason: 'no job-path hint matched' };
}

/**
 * Extract real vacancy-detail links from a listing page's HTML.
 *
 * Unlike the pre-JH-SUP-0026 version, this classifies every same-origin,
 * non-asset link by URL structure BEFORE applying any cap, so a fixed
 * traversal budget only ever competes against other real vacancy links, not
 * navigation/RSS/company-profile links. Returns full stage evidence so the
 * acquisition funnel is explainable per JH-SUP-0026 section 3, not just a
 * bare array of URLs.
 *
 * @param {string} html
 * @param {string} baseUrl
 * @param {number} limit  cap applied AFTER filtering non-vacancy links
 * @returns {{
 *   detailLinks: string[],
 *   totalRawLinks: number,
 *   totalDetailLinksFound: number,
 *   filteredNonJobCount: number,
 *   filteredReasons: Record<string, number>,
 *   queuedCount: number,
 *   truncatedCount: number,
 * }}
 */
export function extractJobLikeLinks(html, baseUrl, limit = 200) {
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => decodeHtmlEntities(m[1]));
  const base = new URL(baseUrl);
  const seenDetail = new Set();
  const detailLinks = [];
  const filteredReasons = {};
  let totalRawLinks = 0;
  let filteredNonJobCount = 0;

  for (const href of hrefs) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    let abs;
    try {
      abs = new URL(href, base);
    } catch {
      continue;
    }
    if (abs.hostname !== base.hostname) continue;
    if (SKIP_EXT.test(abs.pathname)) continue;
    totalRawLinks++;

    const cls = classifyJobPath(abs.hostname, abs.pathname);
    if (cls.kind !== 'DETAIL') {
      filteredNonJobCount++;
      filteredReasons[cls.reason] = (filteredReasons[cls.reason] || 0) + 1;
      continue;
    }
    const key = abs.origin + abs.pathname;
    if (seenDetail.has(key)) continue;
    seenDetail.add(key);
    detailLinks.push(abs.toString());
  }

  const totalDetailLinksFound = detailLinks.length;
  const queued = detailLinks.slice(0, limit);

  return {
    detailLinks: queued,
    totalRawLinks,
    totalDetailLinksFound,
    filteredNonJobCount,
    filteredReasons,
    queuedCount: queued.length,
    truncatedCount: Math.max(0, totalDetailLinksFound - queued.length),
  };
}

/**
 * Discover same-origin, same-category pagination links on a listing page:
 * links whose pathname shares the current page's pathname as a prefix but
 * differs from it, and which are not themselves vacancy-detail links. This
 * follows only pagination links the site itself already generated in the
 * HTML -- it does not attempt to construct or guess Profession.hu's
 * multi-parameter category/pagination URL encoding, which was found live
 * (2026-09-04) to be fragile and source-specific enough that guessing it
 * produced real 500 errors for some keyword strings. Bounded and auditable
 * per JH-SUP-0026 section 1.2.
 *
 * @param {string} html
 * @param {string} baseUrl
 * @param {number} maxPages
 */
export function discoverPaginationLinks(html, baseUrl, maxPages = 2) {
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => decodeHtmlEntities(m[1]));
  const base = new URL(baseUrl);
  const seen = new Set([base.pathname]);
  const out = [];
  for (const href of hrefs) {
    if (!href || href.startsWith('#')) continue;
    let abs;
    try {
      abs = new URL(href, base);
    } catch {
      continue;
    }
    if (abs.hostname !== base.hostname) continue;
    if (abs.pathname === base.pathname) continue;
    if (!abs.pathname.startsWith(base.pathname.split(',')[0])) continue; // same category-path family
    const cls = classifyJobPath(abs.hostname, abs.pathname);
    if (cls.kind === 'DETAIL') continue; // not a pagination link, a detail link
    const key = abs.origin + abs.pathname;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(abs.toString());
    if (out.length >= maxPages) break;
  }
  return out;
}

export function countJobLikeLinks(html, baseUrl) {
  return extractJobLikeLinks(html, baseUrl, Number.MAX_SAFE_INTEGER).totalDetailLinksFound;
}
