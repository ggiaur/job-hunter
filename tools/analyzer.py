"""Gemini structured-output analyzer, retained from legacy with a narrow provider boundary.

The orchestrator catches GeminiQuotaExceededError per candidate (the replacement
for job-searcher/agents/job_search_agent.py:129-146); this class deliberately
continues to distinguish quota from retryable provider errors.
"""
import json, logging, os, random, time
from typing import Any
from pydantic import BaseModel, Field
logger=logging.getLogger(__name__)
class JobEvaluationSchema(BaseModel):
    score:int=Field(description="0-100 relevance score")
    summary:str=Field(description="Hungarian summary")
class GeminiQuotaExceededError(Exception): pass
def _load_persona():
    base=os.path.join(os.path.dirname(__file__),"..","profile"); result=""
    for name in ("persona.md","learned_preferences.md"):
        path=os.path.join(base,name)
        if os.path.exists(path): result += open(path,encoding="utf-8").read()+"\n"
    return result
class JobAnalyzer:
    def __init__(self,api_key=None,mock_mode=None):
        self.mock_mode=mock_mode if mock_mode is not None else os.getenv("MOCK_MODE","false").lower()=="true"; self.api_key=(api_key or os.getenv("GEMINI_API_KEY","")).strip(); self.last_call_time=0.; self.min_call_interval=float(os.getenv("GEMINI_MIN_INTERVAL_SEC","8")); self.client=None; self.model_name=os.getenv("GEMINI_MODEL","gemini-flash-lite-latest")
        if not self.mock_mode and self.api_key:
            from google import genai
            self.client=genai.Client(api_key=self.api_key)
    def analyze_job(self,job:dict[str,Any])->dict[str,Any]|None:
        title=job.get("title",""); text=f"{title} {job.get('description','')}".lower()
        if self.mock_mode:
            if any(x in text for x in ("helpdesk","junior","pék","éttermi")): return {"score":15,"summary":"Alacsony relevancia."}
            if any(x in text for x in ("it vezető","it manager","cio","projektmenedzser","vezető")): return {"score":90,"summary":"Vezetői profilhoz illeszkedik."}
            return {"score":50,"summary":"Közepes relevancia."}
        if not self.client: return {"score":0,"summary":"Gemini kliens nincs inicializálva."}
        pause=self.min_call_interval-(time.time()-self.last_call_time)
        if pause>0: time.sleep(pause)
        prompt=f"Profil:\n{_load_persona()}\nÁllás:\nCím: {title}\nLeírás: {job.get('description','')[:3000]}"
        for attempt in range(4):
            try:
                from google.genai import types
                self.last_call_time=time.time(); response=self.client.models.generate_content(model=self.model_name,contents=prompt,config=types.GenerateContentConfig(response_mime_type="application/json",response_schema=JobEvaluationSchema))
                parsed=self._parse_json_response(response.text or "")
                return {"score":int(parsed.get("score",0)),"summary":str(parsed.get("summary",""))} if parsed else {"score":0,"summary":"Gemini elemzési hiba."}
            except Exception as exc:
                message=str(exc).lower()
                if any(x in message for x in ("429","quota","resource_exhausted","prepayment credits are depleted")): raise GeminiQuotaExceededError(str(exc))
                if attempt == 3: logger.warning("Gemini retries exhausted: %s",exc); return {"score":0,"summary":"Gemini elemzési hiba."}
                time.sleep(2**attempt+random.uniform(.5,1.5))
    @staticmethod
    def _parse_json_response(text):
        import re
        m=re.search(r"(\{.*?\})",text,re.S)
        try: return json.loads(m.group(1) if m else text)
        except Exception: return None
