"""Failure-isolated pipeline replacing legacy agents/job_search_agent.py:27-202."""
import logging, os, time, uuid
from typing import Any, Callable
import yaml
from .budget import RunBudget
from .planner import QueryPlanner
from .adapters import ProfessionAdapter, CVOnlineAdapter
from .filtering import CheapFilter
from tools.analyzer import GeminiQuotaExceededError, JobAnalyzer
from tools.storage import JobStorage
from tools.notifier import TelegramNotifier

logger = logging.getLogger(__name__); RELEVANCE_THRESHOLD = 60

class JobSearchAgent:
    def __init__(self, mock_mode: bool | None = None, *, http_get: Callable | None = None, fallback_search: Callable | None = None, direct_fetch: Callable | None = None, firecrawl_detail: Callable | None = None, analyzer=None, storage=None, notifier=None, planner=None, preferred_companies_path="profile/preferred_companies.yaml"):
        self.mock_mode = mock_mode if mock_mode is not None else os.getenv("MOCK_MODE", "false").lower() == "true"
        self.budget = RunBudget()
        self.http_get = http_get or self._no_network
        self.fallback_search = fallback_search
        self.direct_fetch = direct_fetch or self._no_network
        self.firecrawl_detail = firecrawl_detail
        if not self.mock_mode:
            if http_get is None:
                self.http_get = self._default_http_get()
            if direct_fetch is None:
                self.direct_fetch = self.http_get
            if fallback_search is None or firecrawl_detail is None:
                firecrawl = self._default_firecrawl_client()
                if firecrawl:
                    if fallback_search is None:
                        self.fallback_search = self._firecrawl_search(firecrawl)
                    if firecrawl_detail is None:
                        self.firecrawl_detail = self._firecrawl_detail(firecrawl)
        self.analyzer=analyzer or JobAnalyzer(mock_mode=self.mock_mode); self.storage=storage or JobStorage(mock_mode=self.mock_mode); self.notifier=notifier or TelegramNotifier(mock_mode=self.mock_mode); self.planner=planner or QueryPlanner()
        try: self.preferred_companies=set((yaml.safe_load(open(preferred_companies_path, encoding="utf-8")) or {}).get("preferred_companies", []))
        except OSError: self.preferred_companies=set()
    @staticmethod
    def _no_network(*args, **kwargs): raise RuntimeError("network client required; MOCK_MODE never makes live calls")

    @staticmethod
    def _default_http_get() -> Callable:
        """Return requests' GET callable without making a request."""
        import requests
        def http_get(url: str, *, timeout: int = 10, **kwargs):
            return requests.get(url, timeout=timeout, **kwargs)
        return http_get

    @staticmethod
    def _default_firecrawl_client():
        api_key = os.getenv("FIRECRAWL_API_KEY", "").strip()
        if not api_key:
            return None
        try:
            # Keep the v1-compatible client used by the legacy scraper.
            from firecrawl import V1FirecrawlApp as FirecrawlApp
            return FirecrawlApp(api_key=api_key)
        except Exception as exc:
            logger.warning("Firecrawl client unavailable: %s", exc)
            return None

    @staticmethod
    def _firecrawl_search(client) -> Callable:
        def search(query: str) -> list[dict]:
            response = client.search(query, limit=5, lang="hu", country="hu")
            items = response.data if hasattr(response, "data") else response.get("data", [])
            return [{
                "source": "firecrawl",
                "source_job_id": item.get("url", ""),
                "url": item.get("url", ""),
                "title": item.get("title", ""),
                "company": "",
                "location": "",
                "description": item.get("markdown") or item.get("description", ""),
            } for item in items if item.get("url")]
        return search

    @staticmethod
    def _firecrawl_detail(client) -> Callable:
        def detail(url: str) -> dict:
            response = client.scrape_url(url, formats=["markdown"])
            if hasattr(response, "markdown") and response.markdown:
                return {"description": response.markdown}
            if hasattr(response, "data"):
                data = response.data
                return {"description": getattr(data, "markdown", "") if not isinstance(data, dict) else data.get("markdown", "")}
            return {"description": response.get("markdown", "") if isinstance(response, dict) else ""}
        return detail
    def _discover(self, plan):
        listings=[]
        for adapter in (ProfessionAdapter(self.http_get,self.budget), CVOnlineAdapter(self.http_get,self.budget)):
            for query in plan.queries:
                if self.budget.used["candidates"] >= self.budget.LIMITS["candidates"]: break
                listings.extend(adapter.discover(query))
        # User-requested Firecrawl-backed fallback: only after low portal yield.
        if len(listings) < 3 and self.fallback_search:
            for query in plan.queries:
                if not self.budget.reserve("firecrawl"): break
                try: listings.extend(self.fallback_search(query))
                except Exception as exc: logger.warning("fallback search skipped: %s", exc)
        bounded=[]
        for job in listings:
            if not self.budget.reserve("candidates"): break
            bounded.append(job)
        return bounded
    def _enrich(self, job):
        if len(job.get("description", "")) >= 200: return job
        if not self.budget.reserve("detail_eligible") or not self.budget.reserve("direct_detail"): return job
        try:
            response=self.direct_fetch(job["url"], timeout=10); text=response.text if hasattr(response,"text") else str(response)
            if text: job["description"] = text[:5000]; return job
        except Exception as exc: logger.info("direct detail failed: %s", exc)
        if self.firecrawl_detail and self.budget.reserve("firecrawl"):
            try:
                detail=self.firecrawl_detail(job["url"]); job["description"] = detail.get("description", detail) if isinstance(detail,dict) else str(detail)
            except Exception as exc: logger.warning("Firecrawl enrichment skipped: %s", exc)
        return job
    def run(self) -> dict[str, Any]:
        started=time.time(); run_id="run_"+uuid.uuid4().hex[:8]; self.storage.create_run_log(run_id); self.storage.expire_stale()
        plan=self.planner.build(); raw=self._discover(plan); unique=[]; identities=set(); duplicates=0
        for job in raw:
            if not job.get("url"): continue
            key=self.storage.identity(job)
            if key in identities: duplicates+=1; continue
            identities.add(key); observed=self.storage.observe(job)
            if observed["already_notified"]: duplicates+=1; continue
            unique.append((job,observed))
        filter_=CheapFilter(); survivors=[]; skipped=[]
        for job, obs in unique:
            ok, reason=filter_.evaluate(job)
            if ok and self.budget.reserve("survivors"): survivors.append(job)
            else: skipped.append({"url":job.get("url"),"reason":reason if not ok else "survivor_budget"})
        relevant=sent=0
        for job in survivors:
            self._enrich(job)
            if not self.budget.reserve("llm"): skipped.append({"url":job.get("url"),"reason":"llm_budget"}); continue
            try: analysis=self.analyzer.analyze_job(job)
            except (GeminiQuotaExceededError, Exception) as exc:
                # replaces legacy abort at job_search_agent.py:129-146
                logger.warning("analysis skipped for one candidate: %s", exc); skipped.append({"url":job.get("url"),"reason":"analysis_failure"}); continue
            if not analysis: skipped.append({"url":job.get("url"),"reason":"analysis_empty"}); continue
            if job.get("company") in self.preferred_companies:
                analysis["score"] = min(100, analysis.get("score", 0) + 10)
            if analysis.get("score",0) >= RELEVANCE_THRESHOLD:
                relevant += 1; record={**job,"relevance_score":analysis["score"],"ai_summary":analysis.get("summary","")}
                if self.storage.save_job(record) and self.notifier.send_job_notification(record, analysis["score"], analysis.get("summary", "")): sent += 1
        metrics={"found":len(raw),"unique":len(unique),"relevant":relevant,"duplicate":duplicates,"sent":sent,"errors":len(skipped),"runtime":time.time()-started,"skipped":skipped,"budget":self.budget.metrics(),"queries":list(plan.queries)}
        self.storage.update_run_log(run_id,"completed",metrics); self.notifier.send_summary_notification(len(raw),relevant,duplicates,sent,metrics["runtime"],self.budget.used["acquisition_http"])
        return metrics
