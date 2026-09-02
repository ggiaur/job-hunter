import re
from dataclasses import dataclass
from pathlib import Path

@dataclass(frozen=True)
class QueryPlan:
    version: str; roles: tuple[str, ...]; seniority: tuple[str, ...]; locations: tuple[str, ...]; queries: tuple[str, ...]

class QueryPlanner:
    """Deliberately small parser: persona edits directly alter plan terms."""
    ROLE_TERMS = ("it vezető", "it manager", "cio", "head of it", "projektmenedzser", "infrastruktúra vezető", "digital", "ai")
    SENIORITY = ("vezető", "manager", "igazgató", "head", "senior", "cio")
    LOCATIONS = ("budapest", "hibrid", "remote", "távmunka", "magyarország")
    def __init__(self, persona_path: str | Path = "profile/persona.md"): self.persona_path = Path(persona_path)
    def build(self) -> QueryPlan:
        text = self.persona_path.read_text(encoding="utf-8").lower()
        terms = lambda pool: tuple(x for x in pool if re.search(r"\b" + re.escape(x) + r"\b", text))
        roles, seniority, locations = terms(self.ROLE_TERMS), terms(self.SENIORITY), terms(self.LOCATIONS)
        roles = roles or ("it vezető",); seniority = seniority or ("vezető",); locations = locations or ("budapest",)
        fixed = [f"{r} {locations[0]}" for r in roles[:4]]
        rotating = [f"{r} {s}" for r, s in zip(roles * 4, seniority * 4)][:4]
        queries = tuple(dict.fromkeys((fixed + rotating)))[0:8]
        return QueryPlan("persona-v1", roles, seniority, locations, queries)
