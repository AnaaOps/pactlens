"""
Deterministic risk detection — ZERO LLM dependency.

Pipeline stages hosted here:
  segment → match → risk classify → impact heuristics

This package must remain importable and fully functional with
`explain/` mocked or disabled. Do not import from `app.explain`.
"""

from .segment import segment_clauses
from .match import match_clauses
from .classify import classify_risks
from .impact import compute_impacts
from .pipeline import run_detection

__all__ = [
    "segment_clauses",
    "match_clauses",
    "classify_risks",
    "compute_impacts",
    "run_detection",
]
