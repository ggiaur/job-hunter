"""Portal-native metadata adapters; HTTP is injected so tests never make network calls."""
import re
from html import unescape
from urllib.parse import quote, urljoin
from .budget import RunBudget

def _text(value: str) -> str: return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", unescape(value))).strip()

class PortalAdapter:
    source = "portal"
    search_url = ""
    def __init__(self, http_get, budget: RunBudget): self.http_get, self.budget = http_get, budget; self.failures = 0
    def discover(self, query: str) -> list[dict]:
        if self.failures >= 2 or not self.budget.reserve("portal"): return []
        try:
            response = self.http_get(self.search_url.format(query=query), timeout=10)
            html = response.text if hasattr(response, "text") else str(response); self.failures = 0
            return self.extract(html)
        except Exception:
            self.failures += 1; return []

PROFESSION_JOB_ANCHOR = re.compile(
    # The detail URL is sometimes followed by a `?keyword=...&hash=...`
    # tracking query string (verified live, 2026-09-02, on the real
    # /allasok/1,0,0,{query}@1@1 search-results path) -- an earlier version
    # of this pattern required the closing quote immediately after the
    # slug, so it silently matched zero anchors on that page shape.
    r'<a\s[^>]*?href=["\'](https?://(?:www\.)?profession\.hu/allas/[a-zA-Z0-9_-]+)(?:\?[^"\']*)?["\'][^>]*>',
    re.I,
)

class ProfessionAdapter(PortalAdapter):
    """URL-anchored extraction, not a guessed card-wrapper CSS class.

    Verified live (2026-09-02) against a real fetch of the search results
    page: the page IS server-rendered and contains real
    profession.hu/allas/<slug>-<id> detail links (20 on one page), but a
    speculative `job-card`/`job-item` wrapper regex matched nothing real and
    fell through to unrelated icon/nav/social links instead.

    Each real job URL appears TWICE in the raw HTML: once as a `data-link`
    attribute on an enclosing `<li>` wrapper (no title info), and again
    inside the actual `<a href=...>` anchor that carries `data-item-name`
    (clean title) and `data-item-id` (numeric posting id). An earlier
    version of this adapter matched the bare URL anywhere and used
    `rfind`/`find` to locate a "nearby" `<a>` tag -- that grabbed the
    wrong (adjacent, previous-job's) anchor and produced title/URL
    mismatches, confirmed live. Matching the whole `<a href=...>` tag in
    one regex avoids the ambiguity entirely.
    """
    source = "profession.hu"

    def _url_for(self, query: str) -> str:
        # `?keyword=` does not filter results at all (verified live,
        # 2026-09-02) -- the actual search form POSTs `adv_pattern` with a
        # CSRF token to /allasok, which redirects to this GET-able path
        # pattern (same shape job-searcher's legacy TARGET_URLS already
        # hardcoded, e.g. "/allasok/1,0,0,informatikai%20vezet%C5%91").
        # Confirmed live: this path alone, no session/token needed, returns
        # materially IT-relevant titles ("Head of IT", "IT Csoportvezető",
        # "IT biztonsági Osztályvezető").
        return f"https://www.profession.hu/allasok/1,0,0,{quote(query)}@1@1"

    def discover(self, query: str) -> list[dict]:
        if self.failures >= 2 or not self.budget.reserve("portal"): return []
        try:
            response = self.http_get(self._url_for(query), timeout=10)
            html = response.text if hasattr(response, "text") else str(response); self.failures = 0
            return self.extract(html)
        except Exception:
            self.failures += 1; return []

    def extract(self, html: str) -> list[dict]:
        jobs=[]; seen=set()
        for m in PROFESSION_JOB_ANCHOR.finditer(html):
            url, tag = m.group(1), m.group(0)
            if url in seen: continue
            seen.add(url)
            item_id = re.search(r'data-item-id=["\'](\d+)', tag)
            item_name = re.search(r'data-item-name=["\']([^"\']+)', tag)
            title_attr = re.search(r'\btitle=["\']([^"\']+)', tag)
            title = _text(item_name.group(1)) if item_name else (_text(title_attr.group(1)) if title_attr else "")
            if not title: continue
            jobs.append({"source":self.source,"source_job_id":item_id.group(1) if item_id else url,"url":url,"title":title,"company":"","location":"","description":_text(title_attr.group(1)) if title_attr else title})
        return jobs

class CVOnlineAdapter(PortalAdapter):
    """Known gap (2026-09-02): the assumed `/hu/allasok?search=` URL 404s;
    the real search entrypoint on cvonline.hu was not identified within this
    slice's live-verification budget. Left returning no matches (fails
    open/empty, not on garbage) rather than guessing another wrong pattern.
    Next slice: identify cvonline.hu's real search URL/markup live before
    re-enabling this adapter's contribution."""
    source, search_url = "cvonline.hu", "https://www.cvonline.hu/hu/allasok?search={query}"
    def extract(self, html: str) -> list[dict]:
        return []
