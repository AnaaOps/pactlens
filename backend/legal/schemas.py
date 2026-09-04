"""
Pydantic & Dataclass Schemas for the Legal Layer.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict, field
from typing import Any, Optional


@dataclass
class LegalEntry:
    id: str
    category: str
    act: str
    provision: str
    summary: str
    source_url: str
    last_verified_date: str
    jurisdiction_note: str
    status: str = "verified"
    why_it_matters: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class LegalContextCard:
    act: str
    provision: str
    summary: str
    why_it_matters: str
    jurisdiction_note: str
    last_verified_date: str
    source_url: str
    status_label: str
    disclaimer: str
    source_verified: bool = True

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class LegalLayerOutput:
    legal_context: list[dict[str, Any]] = field(default_factory=list)
    possible_next_steps: list[str] = field(default_factory=list)
    jurisdiction_note: str = ""
    disclaimer: str = ""
    last_verified_date: str = ""
    knowledge_base_version: str = "2026.09.01"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
