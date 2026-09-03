const JOB_PATH_HINTS = ['allas', 'job', 'vacancy', 'poz', 'career', 'karrier', 'toborzas'];
const SKIP_EXT = /\.(css|js|png|jpg|jpeg|gif|svg|ico|pdf|woff2?)(\?|$)/i;

function decodeHtmlEntities(s) {
  return s.replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}

export function extractJobLikeLinks(html, baseUrl, limit = 5) {
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map((m) => decodeHtmlEntities(m[1]));
  const base = new URL(baseUrl);
  const seen = new Set();
  const out = [];
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
    const lowerPath = abs.pathname.toLowerCase();
    const looksJobLike = JOB_PATH_HINTS.some((hint) => lowerPath.includes(hint));
    if (!looksJobLike) continue;
    const key = abs.origin + abs.pathname;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(abs.toString());
    if (out.length >= limit) break;
  }
  return out;
}

export function countJobLikeLinks(html, baseUrl) {
  return extractJobLikeLinks(html, baseUrl, 999).length;
}
