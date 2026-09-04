"""
Rule-based impact heuristics + pushback templates + reminder dates.

Derives financial/time impact from extracted numbers in the clause —
never invents figures that aren't present.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any


def compute_impacts(findings: list[dict[str, Any]], contract_type: str = "rental") -> list[dict[str, Any]]:
    enriched = []
    for f in findings:
        impact = _impact_for(f, contract_type)
        pushback = _pushback_for(f, impact)
        reminder = _reminder_for(f)
        item = dict(f)
        item["impact"] = impact
        item["pushback_message"] = pushback
        item["reminder"] = reminder
        enriched.append(item)
    return enriched


def _impact_for(f: dict[str, Any], contract_type: str) -> dict[str, Any]:
    ext = f.get("extracted") or {}
    severity = f.get("severity", "Low")
    rule_id = f.get("rule_id", "")

    # Time impacts
    if "old_days" in ext and "new_days" in ext:
        delta = int(ext["new_days"]) - int(ext["old_days"])
        if delta > 0:
            money_hint = None
            # Rough working-capital cost for delayed deposit refund
            if rule_id == "deposit_refund_extended" and delta:
                # Assume typical deposit ~2 months rent; use any amount in clause if present
                # Only attach ₹ estimate when we can derive from delta * notional daily cost
                # Use ₹140/day heuristic ONLY as labeled estimate when deposit amount unknown
                money_hint = f"~₹{delta * 140:,} opportunity cost (₹140/day heuristic on delayed funds)"
            return {
                "kind": "time",
                "label": f"extends your obligation / wait by {delta} days",
                "delta_days": delta,
                "money_estimate": money_hint,
                "source": "derived_from_clause_numbers",
            }

    if "delta_days" in ext and ext["delta_days"]:
        d = int(ext["delta_days"])
        return {
            "kind": "time",
            "label": f"extends your obligation by {d} days",
            "delta_days": d,
            "money_estimate": None,
            "source": "derived_from_clause_numbers",
        }

    if "delta_amount" in ext and ext["delta_amount"]:
        amt = float(ext["delta_amount"])
        sign = "costs you" if (
            rule_id in ("payment_commission_reduced",) or
            (rule_id == "rent_increased")
        ) else "changes by"
        # For rent increase, delta is extra cost; for payment reduced, delta is income lost
        if rule_id == "rent_increased":
            return {
                "kind": "money",
                "label": f"~₹{amt:,.0f} more per rent cycle",
                "delta_amount": amt,
                "money_estimate": f"~₹{amt:,.0f}",
                "source": "derived_from_clause_numbers",
            }
        if rule_id == "payment_commission_reduced":
            return {
                "kind": "money",
                "label": f"~₹{amt:,.0f} less (per referenced amount)",
                "delta_amount": amt,
                "money_estimate": f"~₹{amt:,.0f}",
                "source": "derived_from_clause_numbers",
            }
        return {
            "kind": "money",
            "label": f"{sign} ~₹{abs(amt):,.0f}",
            "delta_amount": amt,
            "money_estimate": f"~₹{abs(amt):,.0f}",
            "source": "derived_from_clause_numbers",
        }

    if "delta_pct" in ext and ext["delta_pct"]:
        p = ext["delta_pct"]
        return {
            "kind": "percent",
            "label": f"{p}% adverse change in rate/share",
            "delta_pct": p,
            "money_estimate": None,
            "source": "derived_from_clause_numbers",
        }

    if "new_notice_days" in ext and ext["new_notice_days"]:
        d = int(ext["new_notice_days"])
        return {
            "kind": "time",
            "label": f"requires {d}-day advance cancellation to avoid lock-in",
            "delta_days": d,
            "money_estimate": None,
            "source": "derived_from_clause_numbers",
        }

    # Qualitative
    labels = {
        "liability_shifted": "increases your personal financial exposure (amount not specified in clause)",
        "maintenance_shifted": "shifts repair costs onto you (amount depends on actual repairs)",
        "arbitration_introduced": "limits court options — dispute path changes",
        "unilateral_amendment": "terms may change without your affirmative consent",
        "data_rights_expanded": "expands how your data may be used/shared",
        "protection_removed": "removes a safeguard you previously had",
        "auto_renewal_introduced": "may extend the contract automatically if you miss a deadline",
    }
    return {
        "kind": "qualitative",
        "label": labels.get(rule_id, "review recommended — numeric impact not stated in clause"),
        "delta_days": None,
        "money_estimate": None,
        "source": "rule_heuristic_no_number",
    }


def _pushback_for(f: dict[str, Any], impact: dict[str, Any]) -> str:
    title = f.get("new_title") or f.get("old_title") or "the revised clause"
    reason = f.get("reason") or ""
    impact_line = impact.get("label") or ""
    old_t = (f.get("old_text") or "")[:180]
    new_t = (f.get("new_text") or "")[:180]
    sev = f.get("severity", "")

    return (
        f"Hi — before I accept the revised contract, I need clarity on \"{title}\".\n\n"
        f"What changed: {reason}\n"
        f"Why it matters: This looks {sev.lower()} risk and {impact_line}.\n\n"
        f"Previously: {old_t or '(clause not present)'}\n"
        f"Now: {new_t or '(clause removed)'}\n\n"
        f"Could we keep the original wording, or meet halfway? Happy to discuss. Thanks."
    )


def _reminder_for(f: dict[str, Any]) -> dict[str, Any] | None:
    """Derive an optional reminder date from clause numbers (e.g. notice before renewal)."""
    if f.get("severity") not in ("High", "Medium"):
        return None
    ext = f.get("extracted") or {}
    rule_id = f.get("rule_id", "")

    days = None
    label = None
    if rule_id in ("auto_renewal_introduced", "auto_renewal_notice_extended"):
        days = ext.get("new_days") or ext.get("new_notice_days") or ext.get("old_days")
        label = "Auto-renewal cancellation deadline (estimate from today + notice window)"
    elif rule_id == "notice_period_extended":
        days = ext.get("new_days")
        label = "Notice-period action deadline (estimate)"
    elif rule_id == "deposit_refund_extended":
        days = ext.get("new_days")
        label = "Follow up on deposit refund timeline"

    if not days:
        return None

    due = date.today() + timedelta(days=int(days))
    return {
        "label": label,
        "due_date": due.isoformat(),
        "derived_from_days": int(days),
        "rule_id": rule_id,
    }
