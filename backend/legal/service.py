"""
High-Level Legal Layer Service.
Coordinates mapping, action layer ('Possible Next Steps'), disclaimers, and versioning.
"""

from __future__ import annotations

from typing import Any

from legal.schemas import LegalLayerOutput, LegalContextCard
from legal.mapper import map_finding_to_legal_context
from legal.disclaimer import MANDATORY_DISCLAIMER, validate_text_for_prohibited_phrases
from legal.versioning import KNOWLEDGE_BASE_VERSION


NEXT_STEPS_DEPOSIT = [
    "Send a written request or legal notice asking for clarification or restoration of the baseline refund timeline.",
    "Check whether the local Rent Authority or Rent Court mechanism applies to your premises in your state.",
    "Consider an appropriate consumer forum where consumer-law jurisdiction applies to the transaction.",
    "Contact a tenant-rights NGO or legal-aid clinic for pro-bono review of your specific situation.",
]

NEXT_STEPS_GIG = [
    "Send a formal written request or ticket to the platform's partner support desk.",
    "Check the relevant state labour authority or commissioner pathway for gig/platform worker grievances.",
    "Consider consulting a worker union or gig-worker collective for shared representation.",
    "Seek legal-aid assistance where an administrative resolution is not provided.",
]

NEXT_STEPS_GENERAL = [
    "Ask the other party for written clarification regarding the intended operation of the revised clause.",
    "Preserve both the signed baseline and revised versions, along with written communication records.",
    "Consider professional legal review before signing if the term shifts significant operational risk.",
    "Explore the dispute-resolution mechanism specified in the agreement and applicable statutory law.",
]


def generate_possible_next_steps(category: str, contract_type: str = "rental") -> list[str]:
    """Generates general procedural pathways using strictly non-advisory language."""
    cat = category.lower()
    if "deposit" in cat:
        steps = list(NEXT_STEPS_DEPOSIT)
    elif "gig" in cat or contract_type == "gig" or "payment" in cat:
        steps = list(NEXT_STEPS_GIG)
    else:
        steps = list(NEXT_STEPS_GENERAL)

    # Compliance check: ensure no prohibited advisory phrases exist
    for s in steps:
        validate_text_for_prohibited_phrases(s)

    return steps


class LegalService:
    def __init__(self):
        self.version = KNOWLEDGE_BASE_VERSION

    def process_finding(
        self,
        finding: dict[str, Any],
        state: str | None = None,
        contract_type: str = "rental",
    ) -> dict[str, Any]:
        """
        Accepts detection finding and returns:
        {
          "legal_context": [...],
          "possible_next_steps": [...],
          "jurisdiction_note": "...",
          "disclaimer": "...",
          "last_verified_date": "YYYY-MM-DD",
          "legal_knowledge_base_version": "YYYY.MM.DD"
        }
        """
        cards: list[LegalContextCard] = map_finding_to_legal_context(
            finding, state=state, contract_type=contract_type
        )

        cat = (finding.get("category") or finding.get("rule_id") or "general").lower()
        next_steps = generate_possible_next_steps(cat, contract_type=contract_type)

        primary_jur = cards[0].jurisdiction_note if cards else (
            "Your state's tenancy/contract framework may contain additional or different requirements. A state-specific provision has not been verified in PactLens."
            if state
            else "General statutory reference; applicability depends on jurisdiction."
        )

        last_date = cards[0].last_verified_date if cards else "2026-09-01"

        output = LegalLayerOutput(
            legal_context=[c.to_dict() for c in cards],
            possible_next_steps=next_steps,
            jurisdiction_note=primary_jur,
            disclaimer=MANDATORY_DISCLAIMER,
            last_verified_date=last_date,
            knowledge_base_version=self.version,
        )

        return {
            **output.to_dict(),
            "legal_knowledge_base_version": self.version,
        }


_GLOBAL_SERVICE: LegalService | None = None


def get_legal_service() -> LegalService:
    global _GLOBAL_SERVICE
    if _GLOBAL_SERVICE is None:
        _GLOBAL_SERVICE = LegalService()
    return _GLOBAL_SERVICE
