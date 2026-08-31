"""
Contract type templates — seed structures + expected clause categories.

Persisted conceptually via this module; scans store contract_type in DB.
"""

from __future__ import annotations

from typing import Any

TEMPLATES: dict[str, dict[str, Any]] = {
    "rental": {
        "id": "rental",
        "label": "Rental / Lease",
        "description": "Residential or commercial tenancy agreements",
        "expected_categories": [
            "parties",
            "premises_scope",
            "term_duration",
            "payment_rent",
            "deposit_refund",
            "notice_termination",
            "maintenance_repairs",
            "liability_indemnity",
            "dispute_arbitration",
            "renewal_auto_renewal",
        ],
        "priority_rules": [
            "deposit_refund_extended",
            "notice_period_extended",
            "rent_increased",
            "auto_renewal_introduced",
            "maintenance_shifted",
        ],
    },
    "gig": {
        "id": "gig",
        "label": "Gig / Platform Terms",
        "description": "Platform worker / delivery / ride-share terms of service",
        "expected_categories": [
            "parties",
            "commission_fees",
            "payment_rent",
            "liability_indemnity",
            "dispute_arbitration",
            "data_privacy",
            "amendment_variation",
            "notice_termination",
        ],
        "priority_rules": [
            "payment_commission_reduced",
            "fee_increased",
            "liability_shifted",
            "arbitration_introduced",
            "unilateral_amendment",
            "data_rights_expanded",
        ],
    },
    "freelance": {
        "id": "freelance",
        "label": "Freelance / Client Contract",
        "description": "Independent contractor / SOW revisions",
        "expected_categories": [
            "parties",
            "premises_scope",
            "payment_rent",
            "notice_termination",
            "liability_indemnity",
            "dispute_arbitration",
            "amendment_variation",
        ],
        "priority_rules": [
            "payment_commission_reduced",
            "liability_shifted",
            "unilateral_amendment",
            "arbitration_introduced",
        ],
    },
    "vendor": {
        "id": "vendor",
        "label": "Vendor / Supplier Agreement",
        "description": "Small-business vendor and supply contracts",
        "expected_categories": [
            "parties",
            "premises_scope",
            "payment_rent",
            "liability_indemnity",
            "dispute_arbitration",
            "amendment_variation",
            "notice_termination",
        ],
        "priority_rules": [
            "payment_commission_reduced",
            "liability_shifted",
            "arbitration_introduced",
            "unilateral_amendment",
        ],
    },
}


def get_template(contract_type: str) -> dict[str, Any]:
    key = (contract_type or "rental").lower().strip()
    return TEMPLATES.get(key, TEMPLATES["rental"])


def list_templates() -> list[dict[str, Any]]:
    return list(TEMPLATES.values())
