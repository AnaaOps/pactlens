"""Cross-scan trust patterns — clause/rule occurrence analytics."""

from __future__ import annotations

import json
from collections import Counter
from typing import Any

from sqlalchemy.orm import Session

from app.database import Scan, Finding


def compute_trust_patterns(db: Session, contract_type: str | None = None) -> dict[str, Any]:
    """Aggregate rule_id frequency across all historical scans."""
    q = db.query(Finding)
    if contract_type:
        q = q.join(Scan).filter(Scan.contract_type == contract_type)
    rows = q.all()
    rule_counts: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()
    total_scans = db.query(Scan).count()

    for row in rows:
        if row.rule_id:
            rule_counts[row.rule_id] += 1
        try:
            payload = json.loads(row.payload_json or "{}")
            cat = payload.get("category") or "other"
            category_counts[cat] += 1
        except Exception:
            pass

    patterns = []
    for rule_id, count in rule_counts.most_common(12):
        patterns.append({
            "rule_id": rule_id,
            "occurrences": count,
            "pct_of_scans": round(count / max(total_scans, 1) * 100, 1),
            "label": _rule_label(rule_id),
        })

    return {
        "total_scans": total_scans,
        "patterns": patterns,
        "top_categories": [
            {"category": k, "count": v}
            for k, v in category_counts.most_common(8)
        ],
        "disclaimer": "Aggregated from your saved scans only — informational pattern, not legal precedent.",
    }


def pattern_for_rule(db: Session, rule_id: str) -> dict[str, Any] | None:
    total = db.query(Scan).count()
    count = db.query(Finding).filter(Finding.rule_id == rule_id).count()
    if count == 0:
        return None
    return {
        "rule_id": rule_id,
        "occurrences": count,
        "total_scans": total,
        "message": f"This clause pattern appeared in {count} of your {total} saved scan(s).",
        "disclaimer": "Based on your scan history only.",
    }


def _rule_label(rule_id: str) -> str:
    labels = {
        "deposit_refund_extended": "Deposit refund timeline extended",
        "notice_period_extended": "Notice period extended",
        "auto_renewal_introduced": "Auto-renewal introduced",
        "rent_increased": "Rent increased",
        "liability_shifted": "Liability shifted",
        "arbitration_introduced": "Arbitration introduced",
        "unilateral_amendment": "Unilateral amendment rights",
        "payment_commission_reduced": "Payment/commission reduced",
        "maintenance_shifted": "Maintenance shifted",
        "fee_increased": "Fee increased",
        "protection_removed": "Protective clause removed",
        "clause_removed": "Clause removed",
        "material_wording_change": "Material wording change",
    }
    return labels.get(rule_id, rule_id.replace("_", " ").title())
