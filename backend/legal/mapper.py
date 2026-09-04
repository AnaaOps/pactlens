"""
Deterministic Legal Mapping Engine.
Maps detection findings to verified statutory context without LLM intervention.
"""

from __future__ import annotations

import re
from typing import Any

from legal.knowledge_base import get_repository
from legal.schemas import LegalEntry, LegalContextCard
from legal.disclaimer import MANDATORY_DISCLAIMER, VALID_STATUS_LABELS, validate_text_for_prohibited_phrases
from legal.sources import is_source_verified


CATEGORY_MAP = {
    "deposit": "deposit",
    "deposit_refund_extended": "deposit",
    "notice": "notice",
    "notice_period_extended": "notice",
    "rent": "notice",
    "rent_increased": "notice",
    "arbitration": "arbitration",
    "arbitration_introduced": "arbitration",
    "dispute": "arbitration",
    "liability": "liability",
    "liability_shifted": "liability",
    "unfair_terms": "liability",
    "maintenance": "maintenance",
    "maintenance_shifted": "maintenance",
    "auto_renewal": "renewal",
    "auto_renewal_introduced": "renewal",
    "auto_renewal_notice_extended": "renewal",
    "renewal": "renewal",
    "unilateral_amendment": "liability",
    "lockin": "lockin",
    "payment": "payment",
    "payment_commission_reduced": "payment",
    "fee_increased": "payment",
    "gig": "gig_work",
}


def map_finding_to_legal_context(
    finding: dict[str, Any],
    state: str | None = None,
    contract_type: str = "rental",
) -> list[LegalContextCard]:
    """
    Deterministically maps a finding to verified LegalContextCard objects.
    Rejects any unverified source URLs. Never claims definite illegality.
    """
    repo = get_repository()
    raw_cat = (finding.get("category") or "").strip().lower()
    rule_id = (finding.get("rule_id") or "").strip().lower()

    # Determine standard category
    mapped_cat = CATEGORY_MAP.get(rule_id) or CATEGORY_MAP.get(raw_cat) or "liability"

    # Contextual refinement: Gig contracts vs Consumer vs General Tenancy
    blob = f"{finding.get('old_text', '')} {finding.get('new_text', '')}".lower()
    is_gig = (
        contract_type == "gig"
        or "gig" in blob
        or "delivery partner" in blob
        or "platform fee" in blob
        or "commission" in blob
    )
    is_consumer = (
        contract_type in ("consumer", "saas", "subscription")
        or "consumer" in blob
        or "subscriber" in blob
    )

    entries: list[LegalEntry] = []

    if is_gig and mapped_cat in ("payment", "gig_work", "liability"):
        gig_entries = repo.get_entries_by_category("gig_work")
        entries.extend(gig_entries)

    base_entries = repo.get_entries_by_category(mapped_cat)
    for be in base_entries:
        if be not in entries:
            entries.append(be)

    # If consumer context applies specifically
    if is_consumer and mapped_cat in ("liability", "renewal"):
        cpa_entries = repo.get_entries_by_category("consumer")
        for ce in cpa_entries:
            if ce not in entries:
                entries.append(ce)

    cards: list[LegalContextCard] = []

    for entry in entries:
        # Check source verification
        source_ok = is_source_verified(entry.source_url, entry.last_verified_date)
        if not source_ok:
            status_label = VALID_STATUS_LABELS["SOURCE_VERIFICATION_REQUIRED"]
            card = LegalContextCard(
                act=entry.act,
                provision=entry.provision,
                summary="Legal source not currently verified.",
                why_it_matters="Verification in progress.",
                jurisdiction_note="Source verification required.",
                last_verified_date=entry.last_verified_date or "Unverified",
                source_url="",
                status_label=status_label,
                disclaimer=MANDATORY_DISCLAIMER,
                source_verified=False,
            )
            cards.append(card)
            continue

        # Jurisdiction note resolution
        jur_note = _resolve_jurisdiction_note(entry, state)

        # Status label determination
        status_label = (
            VALID_STATUS_LABELS["JURISDICTION_DEPENDENT"]
            if state or "Model" in entry.act
            else VALID_STATUS_LABELS["POTENTIALLY_RELEVANT"]
        )

        why = entry.why_it_matters or entry.summary

        # Validate that no prohibited phrases exist in the output text
        validate_text_for_prohibited_phrases(why)
        validate_text_for_prohibited_phrases(entry.summary)
        validate_text_for_prohibited_phrases(jur_note)

        cards.append(LegalContextCard(
            act=entry.act,
            provision=entry.provision,
            summary=entry.summary,
            why_it_matters=why,
            jurisdiction_note=jur_note,
            last_verified_date=entry.last_verified_date,
            source_url=entry.source_url,
            status_label=status_label,
            disclaimer=MANDATORY_DISCLAIMER,
            source_verified=True,
        ))

    return cards


def _resolve_jurisdiction_note(entry: LegalEntry, state: str | None) -> str:
    """
    Applies non-fabrication state jurisdiction logic.
    Never invents state-specific acts or sections.
    """
    if not state or not state.strip():
        return entry.jurisdiction_note

    st = state.strip().title()

    # Known verified state adoptions / frameworks
    if "Model Tenancy Act" in entry.act:
        if st in ("Uttar Pradesh", "Andhra Pradesh", "Tamil Nadu", "Assam"):
            return f"{st} has taken formal steps toward tenancy law revision informed by the Model Tenancy Act. Local state rules and notification dates should be checked."
        elif st in ("Delhi", "National Capital Territory Of Delhi"):
            return "Delhi rental arrangements are historically governed by the Delhi Rent Control Act, 1958 where applicable; applicability of the Model Tenancy framework remains subject to central and local legislative notification."
        else:
            return "Your state's tenancy/contract framework may contain additional or different requirements. A state-specific provision has not been verified in PactLens."

    if "Indian Contract Act" in entry.act:
        return f"Central statute applicable in {st} and all other states."

    if "Code on Social Security" in entry.act:
        return f"Central Code; implementation rules and welfare boards are formulated at both central and {st} state levels."

    return "Your state's tenancy/contract framework may contain additional or different requirements. A state-specific provision has not been verified in PactLens."
