"""
Two-Sided Fairness Certification Engine.

Enables landlords, gig platforms, and property managers to opt in and audit
their lease / TOS agreements before publication to obtain a 'PactLens Verified Fair' badge.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from app.detection.segment import segment_clauses
from app.detection.categories import categorize_clause


def analyze_template(
    text: str,
    entity_name: str = "Sharma Properties Pvt Ltd",
    contract_type: str = "rental",
) -> dict[str, Any]:
    """
    Audits a contract draft / template against Indian statutory fairness standards
    (Model Tenancy Act 2021, Consumer Protection Act 2019, Indian Contract Act 1872).
    """
    clauses = segment_clauses(text, source="new")
    results = []
    fails = 0
    warnings = 0
    passes = 0
    remediation_items = []

    # Indian statutory fairness audit rules
    audit_rules = [
        {
            "category": "deposit",
            "regex": r"refund.{0,40}(\d+)\s*days?|(\d+)\s*days?.{0,40}refund",
            "check": "Deposit Refund Window",
            "statute": "Model Tenancy Act, 2021 — Section 11",
            "evaluator": lambda m: int(m.group(1) or m.group(2)) if (m.group(1) or m.group(2)) else 30,
            "max_allowed": 30,
            "fail_msg": "Deposit refund window exceeds statutory 30-day cap under Model Tenancy Act, 2021 §11.",
            "fix_msg": "Change refund timeline to strictly 30 days or less upon vacant handover.",
        },
        {
            "category": "auto_renewal",
            "regex": r"auto[\s-]?renew",
            "check": "Auto-Renewal & Lock-In",
            "statute": "Consumer Protection Act, 2019 — Section 2(46)",
            "fail_msg": "Silent auto-renewal clause detected without express bilateral re-execution requirement.",
            "fix_msg": "Replace deemed auto-renewal with: 'Renewal shall occur only upon mutual written agreement executed at least 30 days prior to term expiry.'",
        },
        {
            "category": "amendment",
            "regex": r"sole\s+discretion|at\s+any\s+time\s+without\s+notice|unilaterally\s+modify",
            "check": "Unilateral Amendment Rights",
            "statute": "Consumer Protection Act, 2019 — Section 2(46)(vi)",
            "fail_msg": "Landlord/platform reserves unilateral right to amend terms without counterparty consent.",
            "fix_msg": "State clearly: 'No amendment of this Agreement shall be effective unless agreed to in writing by both parties.'",
        },
        {
            "category": "maintenance",
            "regex": r"responsible\s+for\s+all\s+maintenance|except\s+structural\s+collapse|bear[s]?\s+no\s+obligation\s+for\s+day-to-day",
            "check": "Maintenance Allocation",
            "statute": "Model Tenancy Act, 2021 — Section 15 & Second Schedule",
            "fail_msg": "Major repairs, plumbing, or electrical burdens shifted entirely onto tenant.",
            "fix_msg": "Assign structural upkeep, major electrical rewiring, and external plumbing to landlord as required by MTA §15.",
        },
        {
            "category": "liability",
            "regex": r"solely\s+liable|indemnify\s+and\s+hold\s+harmless",
            "check": "Indemnity & Liability Symmetry",
            "statute": "Indian Contract Act, 1872 — Section 23",
            "warn_msg": "One-sided indemnity clause exculpating landlord/platform from negligence.",
            "fix_msg": "Make indemnity bilateral and explicitly exclude landlord's own gross negligence or premises defects.",
        },
        {
            "category": "dispute",
            "regex": r"binding\s+arbitration|arbitrator",
            "check": "Dispute Resolution Equity",
            "statute": "Vidya Drolia (2020) / Model Tenancy Act, 2021",
            "warn_msg": "Private commercial arbitration may impose disproportionate financial burdens on tenant.",
            "fix_msg": "Provide dispute recourse through local Rent Authority / Civil Courts rather than private commercial arbitration.",
        },
    ]

    for c in clauses:
        cat = categorize_clause(c.title, c.text)
        blob = f"{c.title} {c.text}".lower()
        clause_status = "pass"
        clause_issues = []

        for r in audit_rules:
            m = re.search(r["regex"], blob, re.I)
            if m:
                if "evaluator" in r:
                    val = r["evaluator"](m)
                    if val > r["max_allowed"]:
                        clause_status = "fail"
                        clause_issues.append({
                            "type": "fail",
                            "check": r["check"],
                            "statute": r["statute"],
                            "message": f"{r['fail_msg']} (Detected: {val} days)",
                            "fix": r["fix_msg"],
                        })
                        fails += 1
                        remediation_items.append({
                            "clause": c.title,
                            "severity": "High",
                            "issue": f"{r['check']} violates statutory limits ({val} days > 30 days)",
                            "statute": r["statute"],
                            "required_action": r["fix_msg"],
                        })
                elif "fail_msg" in r:
                    clause_status = "fail"
                    clause_issues.append({
                        "type": "fail",
                        "check": r["check"],
                        "statute": r["statute"],
                        "message": r["fail_msg"],
                        "fix": r["fix_msg"],
                    })
                    fails += 1
                    remediation_items.append({
                        "clause": c.title,
                        "severity": "High",
                        "issue": r["check"],
                        "statute": r["statute"],
                        "required_action": r["fix_msg"],
                    })
                elif "warn_msg" in r and clause_status != "fail":
                    clause_status = "warn"
                    clause_issues.append({
                        "type": "warn",
                        "check": r["check"],
                        "statute": r["statute"],
                        "message": r["warn_msg"],
                        "fix": r["fix_msg"],
                    })
                    warnings += 1
                    remediation_items.append({
                        "clause": c.title,
                        "severity": "Medium",
                        "issue": r["check"],
                        "statute": r["statute"],
                        "required_action": r["fix_msg"],
                    })

        if clause_status == "pass":
            passes += 1

        results.append({
            "title": c.title,
            "category": cat,
            "status": clause_status,
            "issues": clause_issues,
            "text_preview": c.text[:220],
        })

    # Score out of 100
    score = max(20, min(100, int(100 - (fails * 18 + warnings * 6))))
    is_verified = (score >= 85 and fails == 0)
    badge_id = f"PLF-2026-{uuid.uuid4().hex[:6].upper()}"

    badge_status = (
        "PactLens Verified Fair"
        if is_verified
        else "Fair with Compliance Warnings"
        if score >= 70
        else "Non-Compliant / High Risk Terms"
    )

    embed_html = (
        f'<a href="https://pactlens.org/verify/{badge_id}" target="_blank" rel="noopener noreferrer">\n'
        f'  <img src="https://pactlens.org/badges/{badge_id}.svg" alt="PactLens Verified Fair Agreement" width="220" height="60" />\n'
        f'</a>'
    )

    return {
        "schema": "pactlens.fairness_certification.v2",
        "badge_id": badge_id,
        "entity_name": entity_name,
        "contract_type": contract_type,
        "audit_timestamp": datetime.now(timezone.utc).isoformat(),
        "fairness_score": score,
        "badge_status": badge_status,
        "is_verified": is_verified,
        "summary": {
            "total_clauses_audited": len(clauses),
            "passed": passes,
            "warnings": warnings,
            "failed": fails,
        },
        "score_dimensions": [
            {
                "dimension": "Deposit Transparency & Caps",
                "status": "PASS" if not any("deposit" in r["issue"].lower() for r in remediation_items) else "FAIL",
                "statute": "Model Tenancy Act 2021 §11",
            },
            {
                "dimension": "Termination & Notice Symmetry",
                "status": "PASS" if not any("auto-renewal" in r["issue"].lower() for r in remediation_items) else "FAIL",
                "statute": "Consumer Protection Act 2019 §2(46)",
            },
            {
                "dimension": "Maintenance & Repair Burden",
                "status": "PASS" if not any("maintenance" in r["issue"].lower() for r in remediation_items) else "FAIL",
                "statute": "Model Tenancy Act 2021 §15",
            },
            {
                "dimension": "Bilateral Modification Consensus",
                "status": "PASS" if not any("amendment" in r["issue"].lower() for r in remediation_items) else "FAIL",
                "statute": "Indian Contract Act 1872 §62",
            },
            {
                "dimension": "Liability & Indemnity Equity",
                "status": "PASS" if not any("indemnity" in r["issue"].lower() for r in remediation_items) else "WARN",
                "statute": "Indian Contract Act 1872 §23",
            },
        ],
        "clauses": results,
        "remediation_checklist": remediation_items,
        "embed_badge_html": embed_html,
        "badge_verification_url": f"/verify/{badge_id}",
        "disclaimer": "PactLens Fairness Certification reflects adherence to statutory tenant/worker protection baselines.",
    }
