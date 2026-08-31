"""
Clause category taxonomy for Indian rental / gig / freelance / vendor contracts.

Assigned by keyword rules after segmentation — no LLM.
"""

from __future__ import annotations

import re
from typing import Optional

# Canonical categories
CATEGORIES = [
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
    "data_privacy",
    "amendment_variation",
    "commission_fees",
    "other",
]

_RULES: list[tuple[str, re.Pattern]] = [
    ("parties", re.compile(r"\b(parties|landlord|tenant|employer|worker|vendor|client)\b", re.I)),
    ("deposit_refund", re.compile(r"\b(security\s+deposit|deposit|refund)\b", re.I)),
    ("notice_termination", re.compile(r"\b(notice\s+period|terminat|vacat|lock[\s-]?in|cancellat)\b", re.I)),
    ("payment_rent", re.compile(r"\b(monthly\s+rent|\brent\b|payment\s+terms|consideration|salary|payout)\b", re.I)),
    ("commission_fees", re.compile(r"\b(commission|platform\s+fee|service\s+fee|convenience\s+fee)\b", re.I)),
    ("maintenance_repairs", re.compile(r"\b(maintain|repair|upkeep|structural)\b", re.I)),
    ("liability_indemnity", re.compile(r"\b(liabilit|indemnif|hold\s+harmless|damages)\b", re.I)),
    ("dispute_arbitration", re.compile(r"\b(arbitrati|dispute\s+resolution|jurisdiction|governing\s+law)\b", re.I)),
    ("renewal_auto_renewal", re.compile(r"\b(auto[\s-]?renew|renewal)\b", re.I)),
    ("data_privacy", re.compile(r"\b(personal\s+data|privacy|location\s+data|data\s+with\s+third)\b", re.I)),
    ("amendment_variation", re.compile(r"\b(amend|modify|unilateral|variation|at\s+its\s+sole\s+discretion)\b", re.I)),
    ("term_duration", re.compile(r"\b(term|duration|commenc|expir|lease\s+term)\b", re.I)),
    ("premises_scope", re.compile(r"\b(premises|scope\s+of\s+work|deliverable|occupancy|flat|property)\b", re.I)),
]


def categorize_clause(title: str, text: str) -> str:
    blob = f"{title or ''} {text or ''}"
    for cat, pat in _RULES:
        if pat.search(blob):
            return cat
    return "other"


def categorize_clauses(clauses: list) -> list:
    """Mutate/return clause dicts with `category` field."""
    out = []
    for c in clauses:
        if hasattr(c, "to_dict"):
            d = c.to_dict()
        else:
            d = dict(c)
        d["category"] = categorize_clause(d.get("title", ""), d.get("text", ""))
        out.append(d)
    return out
