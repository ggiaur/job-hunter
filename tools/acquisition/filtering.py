import os
import yaml
from tools.language_filter import should_exclude_for_language, language_requirement_label

IRRELEVANT = ("tehergépkocsi", "pultos", "szakács", "cukrász", "takarító", "eladó", "sofőr", "vagyonőr")
class CheapFilter:
    def __init__(self, exclusions_path="profile/exclusions.yaml"):
        try: self.excluded = {x.lower() for x in (yaml.safe_load(open(exclusions_path, encoding="utf-8")) or {}).get("excluded_companies", [])}
        except OSError: self.excluded = set()
    def evaluate(self, job: dict) -> tuple[bool, str]:
        title, desc, company = job.get("title", ""), job.get("description", ""), job.get("company", "").lower()
        combined = f"{title} {desc}".lower()
        job["language_requirement"] = language_requirement_label(title, desc)
        if company and company in self.excluded: return False, "excluded_company"
        if should_exclude_for_language(title, desc): return False, "language"
        if any(x in combined for x in IRRELEVANT) and not any(x in combined for x in ("it", "digital", "ai", "manager", "vezető")): return False, "out_of_scope"
        if not any(x in combined for x in ("it", "digital", "ai", "informat", "vezető", "manager", "cio", "projekt")): return False, "role"
        return True, "eligible"
