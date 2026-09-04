"""For Business — template fairness analysis (deterministic stub)."""

from __future__ import annotations

import re
from typing import Any

from app.detection.segment import segment_clauses
from app.detection.categories import categorize_clause
from app.detection.rules import SPECIFIC_RULES, FALLBACK_RULES


def analyze_template(text: str, contract_type: str = "rental") -> dict[str, Any]:
    """
    Analyze a single contract template for transparency/fairness signals.
    Returns pass/fail per clause category + overall score.
    """
    clauses = segment_clauses(text, source="new")
    results = []
    fails = 0
    warnings = 0

    risk_patterns = [
        (r"auto[\s-]?renew", "Auto-renewal without clear opt-out", "fail"),
        (r"sole\s+discretion|at\s+any\s+time\s+without\s+notice", "Unilateral amendment", "fail"),
        (r"solely\s+liable|hold\s+harmless", "One-sided liability", "warn"),
        (r"binding\s+arbitration", "Mandatory arbitration", "warn"),
        (r"(\d+)\s*days?.{0,40}refund", "Refund timeline", "info"),
        (r"(\d+)\s*days?.{0,40}notice", "Notice period", "info"),
    ]

    for c in clauses:
        cat = categorize_clause(c.title, c.text)
        issues = []
        status = "pass"
        blob = f"{c.title} {c.text}".lower()
        for pat, label, sev in risk_patterns:
            if re.search(pat, blob, re.I):
                issues.append({"label": label, "severity": sev})
                if sev == "fail":
                    status = "fail"
                    fails += 1
                elif sev == "warn" and status != "fail":
                    status = "warn"
                    warnings += 1
        results.append({
            "title": c.title,
            "category": cat,
            "status": status,
            "issues": issues,
            "text_preview": c.text[:200],
        })

    total = len(clauses) or 1
    score = max(0, min(100, int(100 - (fails * 15 + warnings * 5))))
    badge = "PactLens Verified" if score >= 85 and fails == 0 else None

    return {
        "schema": "pactlens.business.fairness.v1",
        "contract_type": contract_type,
        "clause_count": len(clauses),
        "fairness_score": score,
        "pass_count": sum(1 for r in results if r["status"] == "pass"),
        "warn_count": warnings,
        "fail_count": fails,
        "clauses": results,
        "badge": badge,
        "badge_note": "Informational transparency score — not legal certification" if badge else None,
        "recommendations": _recommendations(fails, warnings),
        "disclaimer": "Fairness analysis is informational. Not legal advice or certification.",
    }


def _recommendations(fails: int, warnings: int) -> list[str]:
    recs = []
    if fails:
        recs.append("Review auto-renewal and unilateral amendment clauses — these commonly trigger consumer pushback.")
    if warnings:
        recs.append("Consider softening liability and arbitration language for transparency.")
    if not recs:
        recs.append("Template looks reasonably balanced on automated checks — still have a lawyer review.")
    return recs
