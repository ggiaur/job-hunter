"""Portal-native metadata adapters; HTTP is injected so tests never make network calls."""
import re
from html import unescape
from urllib.parse import urljoin
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

class ProfessionAdapter(PortalAdapter):
    source, search_url = "profession.hu", "https://www.profession.hu/allasok?keyword={query}"
    def extract(self, html: str) -> list[dict]:
        # tolerant card extraction for server rendered markup/data attributes
        jobs=[]
        for card in re.findall(r'<(?:article|div)[^>]*(?:job-card|job-item)[^>]*>(.*?)</(?:article|div)>', html, re.S|re.I):
            link=re.search(r'href=["\']([^"\']+)', card); title=re.search(r'(?:job-title|title)[^>]*>(.*?)</', card, re.S|re.I)
            if link and title:
                company = re.search(r'(?:company|employer)[^>]*>(.*?)</', card, re.S|re.I)
                jobs.append({"source":self.source,"source_job_id":re.sub(r'\D','',link.group(1)) or link.group(1),"url":urljoin("https://www.profession.hu",link.group(1)),"title":_text(title.group(1)),"company":_text(company.group(1)) if company else "","location":"","description":_text(card)[:700]})
        return jobs

class CVOnlineAdapter(PortalAdapter):
    source, search_url = "cvonline.hu", "https://www.cvonline.hu/hu/allasok?search={query}"
    def extract(self, html: str) -> list[dict]:
        jobs=[]
        for href,title in re.findall(r'<a[^>]+href=["\']([^"\']*(?:allas|job)[^"\']*)["\'][^>]*>(.*?)</a>',html,re.S|re.I):
            jobs.append({"source":self.source,"source_job_id":re.sub(r'\D','',href) or href,"url":urljoin("https://www.cvonline.hu",href),"title":_text(title),"company":"","location":"","description":""})
        return jobs
