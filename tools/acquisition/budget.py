"""Pre-flight hard limits. A denied reservation means the call MUST NOT occur."""
from collections import Counter

class RunBudget:
    LIMITS = {"acquisition_http": 20, "portal": 8, "web_search": 4, "employer": 4,
              "direct_detail": 4, "candidates": 60, "survivors": 15, "detail_eligible": 4,
              "firecrawl": 2, "llm": 10}
    def __init__(self): self.used = Counter(); self.blocked = Counter()
    def reserve(self, kind: str, amount: int = 1) -> bool:
        if kind not in self.LIMITS: raise ValueError(f"unknown budget kind: {kind}")
        # Every HTTP subtype is also a total acquisition request.
        affected = [kind] + (["acquisition_http"] if kind in {"portal", "web_search", "employer", "direct_detail"} else [])
        if any(self.used[x] + amount > self.LIMITS[x] for x in affected):
            self.blocked[kind] += amount; return False
        for x in affected: self.used[x] += amount
        return True
    def metrics(self) -> dict: return {"used": dict(self.used), "blocked": dict(self.blocked), "limits": dict(self.LIMITS)}
