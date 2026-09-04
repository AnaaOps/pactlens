"""
Standalone detection pipeline (OCR text in → structured risk JSON out).

Stages: Segment → Categorize → Match (NLP) → Risk classify → Impact
No imports from app.explain.
"""

from __future__ import annotations

from typing import Any

from .segment import segment_clauses
from .categories import categorize_clause, CATEGORIES, display_category
from .match import match_clauses
from .classify import classify_risks, summarize_counts
from .impact import compute_impacts
from app.templates import get_template


def run_detection(
    old_text: str,
    new_text: str,
    contract_type: str = "rental",
) -> dict[str, Any]:
    template = get_template(contract_type)

    old_clauses = segment_clauses(old_text, source="old")
    new_clauses = segment_clauses(new_text, source="new")

    # Attach categories on clause objects via match enrichment; also expose lists
    old_out = []
    for c in old_clauses:
        d = c.to_dict()
        d["category"] = categorize_clause(c.title, c.text)
        old_out.append(d)
    new_out = []
    for c in new_clauses:
        d = c.to_dict()
        d["category"] = categorize_clause(c.title, c.text)
        new_out.append(d)

    matches = match_clauses(old_clauses, new_clauses)
    findings = classify_risks(matches)
    finding_dicts = [f.to_dict() for f in findings]
    # Attach category from match when possible
    match_by_id = {m.match_id: m for m in matches}
    for fd in finding_dicts:
        m = match_by_id.get(fd.get("match_id") or "")
        if m:
            fd["category"] = m.category
        else:
            fd["category"] = categorize_clause(fd.get("new_title") or fd.get("old_title") or "", fd.get("new_text") or fd.get("old_text") or "")
        fd["display_category"] = display_category(fd["category"])

    enriched = compute_impacts(finding_dicts, contract_type=contract_type)
    counts = summarize_counts(findings)

    category_summary: dict[str, int] = {}
    for m in matches:
        if m.status != "unchanged":
            category_summary[m.category] = category_summary.get(m.category, 0) + 1

    return {
        "schema": "pactlens.detection.v1",
        "contract_type": contract_type,
        "template": {
            "id": template["id"],
            "label": template["label"],
            "expected_categories": template["expected_categories"],
        },
        "stages": {
            "segment": {"old_count": len(old_clauses), "new_count": len(new_clauses)},
            "categorize": {
                "taxonomy": CATEGORIES,
                "changed_by_category": category_summary,
            },
            "match": {
                "method": "tfidf_cosine_semantic_similarity",
                "total": len(matches),
                "unchanged": sum(1 for m in matches if m.status == "unchanged"),
                "modified": sum(1 for m in matches if m.status == "modified"),
                "added": sum(1 for m in matches if m.status == "added"),
                "removed": sum(1 for m in matches if m.status == "removed"),
            },
            "classify": counts,
        },
        "old_clauses": old_out,
        "new_clauses": new_out,
        "matches": [m.to_dict() for m in matches],
        "findings": enriched,
        "risk_counts": counts,
        "llm_used": False,
    }
