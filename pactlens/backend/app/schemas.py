"""Pydantic response schemas — structured JSON API contracts."""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class StageProgress(BaseModel):
    stage: str
    detail: str
    status: str = "done"


class RiskCounts(BaseModel):
    High: int = 0
    Medium: int = 0
    Low: int = 0


class EvidenceRecord(BaseModel):
    scan_id: str
    timestamp: str
    old_document_sha256: str
    new_document_sha256: str
    combined_sha256: str
    algorithm: str = "SHA-256"
    disclaimer: str = "Evidence record of uploaded bytes. Not a legal certification."


class ImpactInfo(BaseModel):
    kind: str
    label: str
    delta_days: Optional[int] = None
    delta_amount: Optional[float] = None
    delta_pct: Optional[float] = None
    money_estimate: Optional[str] = None
    source: str


class FindingOut(BaseModel):
    rule_id: str
    rule_name: str
    severity: str
    reason: str
    category: Optional[str] = None
    match_id: Optional[str] = None
    status: Optional[str] = None
    old_text: str = ""
    new_text: str = ""
    old_title: str = ""
    new_title: str = ""
    similarity: float = 0
    extracted: dict[str, Any] = Field(default_factory=dict)
    impact: Optional[dict[str, Any]] = None
    pushback_message: Optional[str] = None
    reminder: Optional[dict[str, Any]] = None
    legal_context: Optional[dict[str, Any]] = None
    explanation_en: Optional[str] = None
    explanation_hi: Optional[str] = None
    provider: Optional[str] = None


class ScanResponse(BaseModel):
    """Final structured JSON API response for a full scan."""
    schema_version: str = "pactlens.scan.v1"
    scan_id: str
    contract_name: str
    contract_type: str
    status: str
    created_at: str
    risk_counts: RiskCounts
    stages_progress: list[StageProgress]
    evidence: EvidenceRecord
    findings: list[dict[str, Any]]
    hero_finding: Optional[dict[str, Any]] = None
    matches_summary: Optional[dict[str, Any]] = None
    ocr: Optional[dict[str, Any]] = None
    explain_provider: str = "stub"
    handoff: Optional[dict[str, Any]] = None
    reminders: list[dict[str, Any]] = Field(default_factory=list)
    pipeline: dict[str, Any] = Field(default_factory=dict)
