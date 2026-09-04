"""
Mandatory Legal Disclaimers & Permitted Status Labels.
"""

MANDATORY_DISCLAIMER = (
    "Informational reference only. This is not legal advice and does not constitute a "
    "legal determination. Consult a lawyer or legal-aid clinic for advice on your specific situation."
)

GLOBAL_DISCLAIMER = (
    "PactLens provides informational legal references, not legal advice or a legal determination."
)

VALID_STATUS_LABELS = {
    "POTENTIALLY_RELEVANT": "Potentially relevant",
    "JURISDICTION_DEPENDENT": "Jurisdiction dependent",
    "INFORMATIONAL_CONTEXT": "Informational context",
    "SOURCE_VERIFICATION_REQUIRED": "Source verification required",
}

PROHIBITED_PHRASES = [
    "this is illegal",
    "this violates the law",
    "you will win",
    "you should sue",
    "guaranteed violation",
    "guaranteed enforceability",
    "definitely illegal",
]


def validate_text_for_prohibited_phrases(text: str) -> None:
    """Raises ValueError if any legally prohibited advisory phrase is detected."""
    lower = text.lower()
    for phrase in PROHIBITED_PHRASES:
        if phrase in lower:
            raise ValueError(f"Prohibited non-compliant phrase detected: '{phrase}'")
