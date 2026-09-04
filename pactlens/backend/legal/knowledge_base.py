"""
Legal Knowledge Base Loader & Category Index.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from legal.schemas import LegalEntry
from legal.sources import validate_source_entry
from legal.versioning import KNOWLEDGE_BASE_VERSION


_SEARCH_PATHS = [
    Path(__file__).resolve().parent.parent / "data" / "legal_knowledge_base.json",
    Path(__file__).resolve().parent.parent.parent / "data" / "legal_knowledge_base.json",
]


class KnowledgeBaseRepository:
    def __init__(self):
        self._entries: list[LegalEntry] = []
        self._version: str = KNOWLEDGE_BASE_VERSION
        self._loaded: bool = False
        self._load()

    def _find_path(self) -> Path:
        for p in _SEARCH_PATHS:
            if p.exists():
                return p
        raise FileNotFoundError(f"legal_knowledge_base.json not found in {_SEARCH_PATHS}")

    def _load(self) -> None:
        path = self._find_path()
        raw = json.loads(path.read_text(encoding="utf-8"))
        self._version = raw.get("version", KNOWLEDGE_BASE_VERSION)

        entries = []
        for item in raw.get("entries", []):
            valid, reason = validate_source_entry(item)
            if not valid:
                raise ValueError(f"Knowledge base entry '{item.get('id')}' failed source validation: {reason}")
            entries.append(LegalEntry(
                id=item["id"],
                category=item["category"],
                act=item["act"],
                provision=item["provision"],
                summary=item["summary"],
                source_url=item["source_url"],
                last_verified_date=item["last_verified_date"],
                jurisdiction_note=item["jurisdiction_note"],
                status=item.get("status", "verified"),
                why_it_matters=item.get("why_it_matters"),
            ))
        self._entries = entries
        self._loaded = True

    @property
    def version(self) -> str:
        return self._version

    def get_all_entries(self) -> list[LegalEntry]:
        return list(self._entries)

    def get_entries_by_category(self, category: str) -> list[LegalEntry]:
        cat = category.strip().lower()
        return [e for e in self._entries if e.category.lower() == cat]

    def get_categories(self) -> list[str]:
        seen = []
        for e in self._entries:
            if e.category not in seen:
                seen.append(e.category)
        return seen

    def get_sources(self) -> list[dict[str, Any]]:
        return [
            {
                "id": e.id,
                "act": e.act,
                "provision": e.provision,
                "source_url": e.source_url,
                "last_verified_date": e.last_verified_date,
                "category": e.category,
                "status": e.status,
            }
            for e in self._entries
        ]


_GLOBAL_REPO: KnowledgeBaseRepository | None = None


def get_repository() -> KnowledgeBaseRepository:
    global _GLOBAL_REPO
    if _GLOBAL_REPO is None:
        _GLOBAL_REPO = KnowledgeBaseRepository()
    return _GLOBAL_REPO
