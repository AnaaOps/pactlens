"""
LLM explanation layer — called ONLY after risk classification.

Never decides what is risky. Takes already-classified findings and
produces plain-English + Hindi explanations.
"""

from .llm import explain_finding, explain_findings

__all__ = ["explain_finding", "explain_findings"]
