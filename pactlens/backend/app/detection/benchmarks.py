"""
Fairness benchmarks — compare clause values against reference norms.

Deterministic, rule-based. Informational only — not legal advice.
"""

from __future__ import annotations

from typing import Any

# Reference benchmarks (days, amounts are illustrative market norms for India)
BENCHMARKS: dict[str, dict[str, Any]] = {
    "deposit_refund_extended": {
        "metric": "days",
        "market_reference": 30,
        "label": "Security deposit refund timeline",
        "unit": "days",
        "source": "Model Tenancy Act guidance / common practice",
    },
    "notice_period_extended": {
        "metric": "days",
        "market_reference": 30,
        "label": "Notice period",
        "unit": "days",
        "source": "Typical residential lease norms",
    },
    "auto_renewal_notice_extended": {
        "metric": "days",
        "market_reference": 30,
        "label": "Auto-renewal cancellation notice",
        "unit": "days",
        "source": "Consumer fairness norms",
    },
    "auto_renewal_introduced": {
        "metric": "days",
        "market_reference": 0,
        "label": "Auto-renewal clause",
        "unit": "days",
        "source": "Many leases renew by mutual consent only",
    },
    "rent_increased": {
        "metric": "percent_cap",
        "market_reference": 10,
        "label": "Annual rent increase cap (typical)",
        "unit": "%",
        "source": "Model Tenancy Act rent revision norms",
    },
    "payment_commission_reduced": {
        "metric": "percent",
        "market_reference": 80,
        "label": "Worker payout share (gig platforms)",
        "unit": "%",
        "source": "Industry transparency discussions",
    },
    "fee_increased": {
        "metric": "percent",
        "market_reference": 15,
        "label": "Platform fee ceiling (reference)",
        "unit": "%",
        "source": "Consumer fairness norms",
    },
}


def _yours_value(finding: dict[str, Any]) -> float | None:
    ext = finding.get("extracted") or {}
    rule_id = finding.get("rule_id", "")
    if rule_id in ("deposit_refund_extended", "notice_period_extended", "auto_renewal_notice_extended"):
        return float(ext.get("new_days") or ext.get("new_notice_days") or 0) or None
    if rule_id == "auto_renewal_introduced":
        return float(ext.get("new_notice_days") or ext.get("new_days") or 45)
    if rule_id == "rent_increased":
        return float(ext.get("delta_pct") or 0) or None
    if rule_id in ("payment_commission_reduced", "fee_increased"):
        return float(ext.get("new_pct") or 0) or None
    return None


def compute_benchmark(finding: dict[str, Any]) -> dict[str, Any] | None:
    rule_id = finding.get("rule_id", "")
    ref = BENCHMARKS.get(rule_id)
    if not ref:
        return None
    yours = _yours_value(finding)
    if yours is None:
        return None
    market = float(ref["market_reference"])
    if market == 0 and rule_id == "auto_renewal_introduced":
        return {
            "label": ref["label"],
            "market_reference": "No auto-renewal (mutual consent)",
            "yours": f"{int(yours)}-day notice to cancel auto-renewal",
            "multiplier": None,
            "worse": True,
            "explanation": "Auto-renewal was not in your signed version — any lock-in is worse than the benchmark.",
            "source": ref["source"],
            "disclaimer": "Informational benchmark — not a legal determination",
        }
    if market <= 0:
        return None
    mult = round(yours / market, 1) if market else None
    worse = yours > market if rule_id != "payment_commission_reduced" else yours < market
    return {
        "label": ref["label"],
        "market_reference": f"{int(market)} {ref['unit']}",
        "yours": f"{int(yours)} {ref['unit']}" if ref["metric"] != "percent_cap" else f"{yours}% increase",
        "multiplier": mult,
        "worse": worse,
        "explanation": (
            f"Your revised terms are ~{mult}× the reference on {ref['label'].lower()}."
            if mult and mult > 1
            else f"Your value ({yours}) differs from the reference ({market} {ref['unit']})."
        ),
        "source": ref["source"],
        "disclaimer": "Informational benchmark — not a legal determination",
    }


def attach_benchmarks(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for f in findings:
        item = dict(f)
        b = compute_benchmark(f)
        if b:
            item["fairness_benchmark"] = b
        out.append(item)
    return out
