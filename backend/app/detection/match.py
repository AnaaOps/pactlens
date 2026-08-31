"""
Clause-to-clause matching via NLP semantic similarity (TF-IDF + cosine).

No LLM. Fully reworded clauses still match if vocabulary/meaning overlap
is high enough. Classifies each match as unchanged / modified / added / removed.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, asdict
from typing import Any, Optional

from app.nlp import batch_similarity
from .segment import Clause
from .categories import categorize_clause


MATCH_THRESHOLD = 0.32
UNCHANGED_THRESHOLD = 0.92


@dataclass
class MatchResult:
    status: str  # unchanged | modified | added | removed
    old_clause: Optional[dict[str, Any]]
    new_clause: Optional[dict[str, Any]]
    similarity: float
    match_id: str
    category: str = "other"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _clause_blob(c: Clause) -> str:
    return f"{c.title} {c.text}"


def _enrich(c: Clause) -> dict[str, Any]:
    d = c.to_dict()
    d["category"] = categorize_clause(c.title, c.text)
    return d


def match_clauses(
    old_clauses: list[Clause],
    new_clauses: list[Clause],
) -> list[MatchResult]:
    """Match old↔new clauses by semantic similarity."""
    results: list[MatchResult] = []

    if not old_clauses and not new_clauses:
        return results

    if not old_clauses:
        for i, nc in enumerate(new_clauses):
            d = _enrich(nc)
            results.append(
                MatchResult(
                    status="added",
                    old_clause=None,
                    new_clause=d,
                    similarity=0.0,
                    match_id=f"add-{i + 1}",
                    category=d["category"],
                )
            )
        return results

    if not new_clauses:
        for i, oc in enumerate(old_clauses):
            d = _enrich(oc)
            results.append(
                MatchResult(
                    status="removed",
                    old_clause=d,
                    new_clause=None,
                    similarity=0.0,
                    match_id=f"rem-{i + 1}",
                    category=d["category"],
                )
            )
        return results

    old_docs = [_clause_blob(c) for c in old_clauses]
    new_docs = [_clause_blob(c) for c in new_clauses]
    sim = batch_similarity(old_docs, new_docs)

    paired_old: set[int] = set()
    paired_new: set[int] = set()
    pairs: list[tuple[int, int, float]] = []

    candidates = [
        (float(sim[i, j]), i, j)
        for i in range(sim.shape[0])
        for j in range(sim.shape[1])
    ]
    candidates.sort(reverse=True)

    for score, i, j in candidates:
        if score < MATCH_THRESHOLD:
            break
        if i in paired_old or j in paired_new:
            continue
        paired_old.add(i)
        paired_new.add(j)
        pairs.append((i, j, score))

    pairs.sort(key=lambda x: x[0])

    for idx, (i, j, score) in enumerate(pairs):
        oc = old_clauses[i]
        nc = new_clauses[j]
        od, nd = _enrich(oc), _enrich(nc)
        cat = nd["category"] if nd["category"] != "other" else od["category"]
        if score >= UNCHANGED_THRESHOLD and _nearly_identical(oc.text, nc.text):
            status = "unchanged"
        else:
            if _has_meaningful_delta(oc.text, nc.text):
                status = "modified"
            elif score >= UNCHANGED_THRESHOLD:
                status = "unchanged"
            else:
                status = "modified"
        results.append(
            MatchResult(
                status=status,
                old_clause=od,
                new_clause=nd,
                similarity=round(score, 4),
                match_id=f"pair-{idx + 1}",
                category=cat,
            )
        )

    rem_idx = 0
    for i, oc in enumerate(old_clauses):
        if i not in paired_old:
            rem_idx += 1
            d = _enrich(oc)
            results.append(
                MatchResult(
                    status="removed",
                    old_clause=d,
                    new_clause=None,
                    similarity=0.0,
                    match_id=f"rem-{rem_idx}",
                    category=d["category"],
                )
            )

    add_idx = 0
    for j, nc in enumerate(new_clauses):
        if j not in paired_new:
            add_idx += 1
            d = _enrich(nc)
            results.append(
                MatchResult(
                    status="added",
                    old_clause=None,
                    new_clause=d,
                    similarity=0.0,
                    match_id=f"add-{add_idx}",
                    category=d["category"],
                )
            )

    return results


def _nearly_identical(a: str, b: str) -> bool:
    na = re.sub(r"\s+", " ", (a or "").lower().strip())
    nb = re.sub(r"\s+", " ", (b or "").lower().strip())
    return na == nb


_NUM = re.compile(
    r"(?:₹\s*[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?\s*%|\b\d+\s*(?:days?|months?|years?|hrs?|hours?)\b|\b\d+\b)",
    re.IGNORECASE,
)


def _has_meaningful_delta(old: str, new: str) -> bool:
    old_nums = set(m.group(0).lower().replace(" ", "") for m in _NUM.finditer(old or ""))
    new_nums = set(m.group(0).lower().replace(" ", "") for m in _NUM.finditer(new or ""))
    if old_nums != new_nums:
        return True
    flips = [
        ("landlord", "tenant"),
        ("company", "worker"),
        ("platform", "partner"),
        ("shall not", "shall"),
        ("auto-renew", "renew"),
    ]
    ol, nl = (old or "").lower(), (new or "").lower()
    for a, b in flips:
        if (a in ol) != (a in nl) or (b in ol) != (b in nl):
            if a in ol or a in nl or b in ol or b in nl:
                return True
    return False
