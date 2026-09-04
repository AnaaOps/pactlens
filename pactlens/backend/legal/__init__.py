"""
PactLens Production Legal Layer Package.
Provides verified statutory grounding, non-advisory pathways, and jurisdiction handling.
"""

from legal.versioning import KNOWLEDGE_BASE_VERSION
from legal.disclaimer import (
    MANDATORY_DISCLAIMER,
    GLOBAL_DISCLAIMER,
    VALID_STATUS_LABELS,
    validate_text_for_prohibited_phrases,
)
from legal.schemas import LegalEntry, LegalContextCard, LegalLayerOutput
from legal.knowledge_base import get_repository, KnowledgeBaseRepository
from legal.mapper import map_finding_to_legal_context
from legal.service import LegalService, get_legal_service, generate_possible_next_steps

__all__ = [
    "KNOWLEDGE_BASE_VERSION",
    "MANDATORY_DISCLAIMER",
    "GLOBAL_DISCLAIMER",
    "VALID_STATUS_LABELS",
    "LegalEntry",
    "LegalContextCard",
    "LegalLayerOutput",
    "KnowledgeBaseRepository",
    "get_repository",
    "map_finding_to_legal_context",
    "LegalService",
    "get_legal_service",
    "generate_possible_next_steps",
    "validate_text_for_prohibited_phrases",
]
