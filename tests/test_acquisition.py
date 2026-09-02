import sys
import types
from tools.acquisition.budget import RunBudget
from tools.acquisition.planner import QueryPlanner
from tools.acquisition.orchestrator import JobSearchAgent
from tools.analyzer import GeminiQuotaExceededError

class Response:
    def __init__(self,text): self.text=text
class Analyzer:
    def __init__(self): self.calls=[]
    def analyze_job(self,j):
        self.calls.append(j["url"])
        if "bad" in j["url"]: raise GeminiQuotaExceededError("quota")
        return {"score":90,"summary":"good"}
class Notifier:
    def __init__(self): self.sent=[]
    def send_job_notification(self,j,*a): self.sent.append(j["url"]); return True
    def send_summary_notification(self,*a,**k): return True

def test_mock_mode_uses_environment_when_not_explicitly_passed(monkeypatch):
    monkeypatch.setenv("MOCK_MODE", "true")
    agent = JobSearchAgent()
    assert agent.mock_mode is True

def test_real_clients_are_constructed_only_outside_mock_mode(monkeypatch):
    calls = []
    fake_requests = types.SimpleNamespace(get=lambda *args, **kwargs: calls.append((args, kwargs)))
    class FakeFirecrawl:
        def __init__(self, *, api_key): calls.append(("firecrawl", api_key))
    monkeypatch.setitem(sys.modules, "requests", fake_requests)
    monkeypatch.setitem(sys.modules, "firecrawl", types.SimpleNamespace(V1FirecrawlApp=FakeFirecrawl))
    monkeypatch.setenv("FIRECRAWL_API_KEY", "test-key")

    mocked = JobSearchAgent(mock_mode=True)
    assert calls == []
    assert mocked.http_get is mocked._no_network

    live = JobSearchAgent(mock_mode=False, analyzer=object(), storage=object(), notifier=object())
    assert calls == [("firecrawl", "test-key")]
    assert live.direct_fetch is live.http_get
    live.http_get("https://example.test", timeout=7)
    assert calls[-1] == (("https://example.test",), {"timeout": 7})
    assert callable(live.fallback_search)
    assert callable(live.firecrawl_detail)

def test_budget_enforcer_stops_before_all_hard_caps():
    b=RunBudget()
    for kind, limit in b.LIMITS.items():
        if kind == "acquisition_http": continue
        for _ in range(limit): assert b.reserve(kind)
        assert not b.reserve(kind), kind
    # aggregate cap independently denies a subtype even when subtype has room
    b=RunBudget()
    for _ in range(20): assert b.reserve("portal") if _ < 8 else (b.reserve("web_search") if _ < 12 else b.reserve("employer") if _ < 16 else b.reserve("direct_detail"))
    assert not b.reserve("portal") and b.blocked["portal"] == 1
    assert not b.reserve("acquisition_http")

def test_persona_edit_changes_query_plan(tmp_path):
    p=tmp_path/"persona.md"; p.write_text("IT manager Budapest",encoding="utf-8"); first=QueryPlanner(p).build()
    p.write_text("CIO remote",encoding="utf-8"); second=QueryPlanner(p).build()
    assert first.queries != second.queries and len(second.queries) <= 8

def test_candidate_analysis_failure_does_not_abort_and_filter_precedes_detail(tmp_path):
    p=tmp_path/"persona.md"; p.write_text("IT Manager Budapest",encoding="utf-8")
    calls=[]
    jobs=[{"source":"x","source_job_id":"bad","url":"https://x/bad","title":"IT Manager","description":"short"},{"source":"x","source_job_id":"good","url":"https://x/good","title":"IT Manager","description":"short"},{"source":"x","source_job_id":"english","url":"https://x/en","title":"IT Manager","description":"advanced English required"}]
    analyzer=Analyzer(); notifier=Notifier()
    agent=JobSearchAgent(mock_mode=True,planner=QueryPlanner(p),fallback_search=lambda q:jobs if q else [],direct_fetch=lambda u,timeout: calls.append(u) or Response("detail"),analyzer=analyzer,notifier=notifier)
    result=agent.run()
    assert analyzer.calls == ["https://x/bad","https://x/good"] and notifier.sent == ["https://x/good"]
    assert "https://x/en" not in calls and any(x["reason"]=="analysis_failure" for x in result["skipped"])

def test_orchestrator_firecrawl_fallback_and_detail_caps(tmp_path):
    p=tmp_path/"persona.md"; p.write_text("IT Manager Budapest",encoding="utf-8"); fallback=[]
    jobs=[{"source":"x","source_job_id":str(n),"url":f"https://x/{n}","title":"IT Manager","description":""} for n in range(20)]
    agent=JobSearchAgent(mock_mode=True,planner=QueryPlanner(p),fallback_search=lambda q: fallback.append(q) or jobs,direct_fetch=lambda *a,**k: (_ for _ in ()).throw(RuntimeError()),firecrawl_detail=lambda u:{"description":"d"})
    result=agent.run()
    assert len(fallback) == 2 and result["budget"]["used"]["firecrawl"] == 2
    assert result["budget"]["used"]["candidates"] <= 60 and result["budget"]["used"]["direct_detail"] == 4 and result["budget"]["used"]["detail_eligible"] == 4 and result["budget"]["used"]["llm"] == 10

def test_preferred_company_bonus_crosses_relevance_threshold_without_affecting_others(tmp_path):
    persona = tmp_path / "persona.md"; persona.write_text("IT Manager Budapest", encoding="utf-8")
    preferred = tmp_path / "preferred_companies.yaml"; preferred.write_text("preferred_companies:\n  - Preferred Co\n", encoding="utf-8")
    jobs = [
        {"source":"x", "source_job_id":"preferred", "url":"https://x/preferred", "title":"IT Manager", "company":"Preferred Co", "description":"long enough description"},
        {"source":"x", "source_job_id":"ordinary", "url":"https://x/ordinary", "title":"IT Manager", "company":"Ordinary Co", "description":"long enough description"},
    ]
    class ThresholdAnalyzer:
        def __init__(self): self.results = []
        def analyze_job(self, job):
            result = {"score": 55, "summary": "below base threshold"}; self.results.append(result); return result
    analyzer = ThresholdAnalyzer(); notifier = Notifier()
    agent = JobSearchAgent(mock_mode=True, planner=QueryPlanner(persona), fallback_search=lambda query: jobs,
                           analyzer=analyzer, notifier=notifier, preferred_companies_path=preferred)

    result = agent.run()

    assert result["relevant"] == result["sent"] == 1
    assert notifier.sent == ["https://x/preferred"]
    assert [item["score"] for item in analyzer.results] == [65, 55]
