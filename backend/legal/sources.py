"""
Verified Legal Sources & Strict Source Validation.
"""

from __future__ import annotations

from typing import Any


VERIFIED_OFFICIAL_DOMAINS = [
    "indiacode.nic.in",
    "mohua.gov.in",
    "egazette.gov.in",
    "labour.gov.in",
    "consumeraffairs.nic.in",
    "mca.gov.in",
]


def validate_source_entry(entry: dict[str, Any]) -> tuple[bool, str]:
    """
    Validates that a knowledge-base entry contains all required fields:
    act, provision, summary, source_url, last_verified_date, jurisdiction_note.
    Rejects any missing fields.
    """
    required_fields = [
        "act",
        "provision",
        "summary",
        "source_url",
        "last_verified_date",
        "jurisdiction_note",
    ]
    for rf in required_fields:
        val = entry.get(rf)
        if not val or not str(val).strip():
            return False, f"Missing required legal source field: '{rf}'"

    url = str(entry.get("source_url") or "").strip()
    if not url.startswith("https://") and not url.startswith("http://"):
        return False, f"Invalid source URL scheme: '{url}'"

    return True, "Valid"


def is_source_verified(source_url: str | None, last_verified_date: str | None) -> bool:
    """Checks if source URL and verification date are present and non-empty."""
    if not source_url or not str(source_url).strip():
        return False
    if not last_verified_date or not str(last_verified_date).strip():
        return False
    return True
