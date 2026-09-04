"""Apply risk rules to match results — deterministic, no LLM."""

from __future__ import annotations

from typing import Any

from .match import MatchResult
from .rules import (
    SPECIFIC_RULES,
    FALLBACK_RULES,
    RiskFinding,
    SEVERITY_RANK,
)


def classify_risks(matches: list[MatchResult] | list[dict]) -> list[RiskFinding]:
    findings: list[RiskFinding] = []
    for m in matches:
        md = m.to_dict() if hasattr(m, "to_dict") else dict(m)
        status = md.get("status")
        if status == "unchanged":
            continue

        hit: RiskFinding | None = None
        for rule in SPECIFIC_RULES:
            result = rule(md)
            if result:
                if hit is None or SEVERITY_RANK[result.severity] > SEVERITY_RANK[hit.severity]:
                    hit = result
        if hit is None:
            for rule in FALLBACK_RULES:
                result = rule(md)
                if result:
                    hit = result
                    break
        if hit:
            findings.append(hit)

    findings.sort(key=lambda f: (-SEVERITY_RANK.get(f.severity, 0), f.rule_id))
    return findings


def summarize_counts(findings: list[RiskFinding] | list[dict]) -> dict[str, int]:
    counts = {"High": 0, "Medium": 0, "Low": 0}
    for f in findings:
        sev = f.severity if hasattr(f, "severity") else f.get("severity")
        if sev in counts:
            counts[sev] += 1
    return counts
