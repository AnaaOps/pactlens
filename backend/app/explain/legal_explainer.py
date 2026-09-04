"""
Structured Legal Explainer.
Translates already-determined legal context into plain English and Hindi.
LLM receives ONLY structured inputs and CANNOT decide Acts, sections, violations, or jurisdiction.
Works 100% deterministically when LLM is OFF.
"""

from __future__ import annotations

import json
import os
from typing import Any


DETERMINISTIC_EXPLANATIONS = {
    "deposit": {
        "english": (
            "This change affects the timing or amount of your security deposit. "
            "The applicable tenancy framework may place limits on deposits or provide rules concerning refund. "
            "Check the law applicable in your state before accepting the revised term."
        ),
        "hindi": (
            "यह बदलाव आपकी सिक्योरिटी डिपॉज़िट की राशि या उसे वापस मिलने के समय को प्रभावित करता है। "
            "लागू होने वाले किरायेदारी कानून में डिपॉज़िट और रिफंड से संबंधित नियम हो सकते हैं। "
            "संशोधित शर्त स्वीकार करने से पहले अपने राज्य में लागू कानून की जाँच करें।"
        ),
    },
    "notice": {
        "english": (
            "This clause modifies the notice period or rent revision mechanism. "
            "Applicable tenancy frameworks often prescribe specific notice requirements for rent revisions and termination. "
            "Review your state's tenancy rules to verify required notice periods."
        ),
        "hindi": (
            "यह शर्त नोटिस अवधि या किराया संशोधन की प्रक्रिया में बदलाव करती है। "
            "लागू किरायेदारी कानून अक्सर किराया संशोधन और अनुबंध समाप्ति के लिए विशिष्ट नोटिस अवधि निर्धारित करते हैं। "
            "आवश्यक नोटिस अवधि की पुष्टि के लिए अपने राज्य के नियमों की जाँच करें।"
        ),
    },
    "arbitration": {
        "english": (
            "This revision alters the dispute-resolution pathway. "
            "In jurisdictions adopting tenancy frameworks, statutory bodies such as Rent Authorities provide designated dispute channels. "
            "The dispute-resolution clause should be checked against the tenancy framework applicable in your state."
        ),
        "hindi": (
            "यह संशोधन विवाद समाधान के तरीके को बदलता है। "
            "किरायेदारी कानूनों को लागू करने वाले क्षेत्रों में रेंट अथॉरिटी जैसी वैधानिक संस्थाएं विवाद निवारण प्रदान करती हैं। "
            "अपने राज्य में लागू किरायेदारी कानून के अनुसार इस विवाद समाधान शर्त की जाँच करें।"
        ),
    },
    "liability": {
        "english": (
            "This clause shifts legal responsibility, indemnity, or risk. "
            "Section 23 of the Indian Contract Act addresses lawful consideration and object. "
            "This clause may raise questions under general contract-law principles, including Section 23, depending on the facts."
        ),
        "hindi": (
            "यह शर्त कानूनी दायित्व, क्षतिपूर्ति या जोखिम को स्थानांतरित करती है। "
            "भारतीय अनुबंध अधिनियम की धारा 23 वैध प्रतिफल और उद्देश्य से संबंधित है। "
            "तथ्यों के आधार पर यह शर्त धारा 23 सहित सामान्य अनुबंध सिद्धांतों के तहत विचारणीय हो सकती है।"
        ),
    },
    "consumer": {
        "english": (
            "This provision introduces terms that may affect consumer rights. "
            "Consumer-law protections may apply to certain consumer-facing agreements. "
            "Applicability depends on the transaction, commercial context, and parties."
        ),
        "hindi": (
            "यह प्रावधान ऐसी शर्तें पेश करता है जो उपभोक्ता अधिकारों को प्रभावित कर सकती हैं। "
            "उपभोक्ता संरक्षण कानून कुछ उपभोक्ता समझौतों पर लागू हो सकता है। "
            "इसकी प्रयोज्यता लेन-देन और पक्षों पर निर्भर करती है।"
        ),
    },
    "gig_work": {
        "english": (
            "This revision affects payout, commission, or terms of engagement. "
            "Relevant provisions exist in the Code on Social Security, 2020 concerning gig/platform workers, "
            "but their current applicability and notification status should be verified."
        ),
        "hindi": (
            "यह संशोधन भुगतान, कमीशन या काम की शर्तों को प्रभावित करता है। "
            "सामाजिक सुरक्षा संहिता, 2020 में गिग/प्लेटफॉर्म श्रमिकों से संबंधित प्रावधान मौजूद हैं, "
            "लेकिन लागू होने की वर्तमान स्थिति की पुष्टि की जानी चाहिए।"
        ),
    },
    "general": {
        "english": (
            "This clause modifies standard contractual terms. "
            "General contract-law principles require mutual consent for variations. "
            "Compare the revision against your signed baseline."
        ),
        "hindi": (
            "यह शर्त अनुबंध के सामान्य नियमों में बदलाव करती है। "
            "सामान्य अनुबंध सिद्धांतों के अनुसार किसी भी बदलाव के लिए दोनों पक्षों की सहमति आवश्यक है। "
            "संशोधन की तुलना अपने हस्ताक्षरित अनुबंध से करें।"
        ),
    },
}


async def explain_legal_finding(
    structured_payload: dict[str, Any],
) -> dict[str, str]:
    """
    Accepts:
    {
      "finding": {...},
      "legal_context": {...},
      "jurisdiction_note": "...",
      "possible_next_steps": [...]
    }
    Returns:
    {
      "english": "...",
      "hindi": "..."
    }
    """
    finding = structured_payload.get("finding", {})
    cat = (finding.get("category") or finding.get("rule_id") or "general").lower()

    key = "general"
    if "deposit" in cat:
        key = "deposit"
    elif "notice" in cat or "rent" in cat:
        key = "notice"
    elif "arbitration" in cat or "dispute" in cat:
        key = "arbitration"
    elif "liability" in cat or "indemnity" in cat or "amendment" in cat:
        key = "liability"
    elif "consumer" in cat:
        key = "consumer"
    elif "gig" in cat or "payment" in cat:
        key = "gig_work"

    fallback = DETERMINISTIC_EXPLANATIONS.get(key, DETERMINISTIC_EXPLANATIONS["general"])

    # If LLM API key is not configured, return deterministic templates immediately
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
    if not api_key:
        return fallback

    # If LLM is configured, call with strict translation/simplification instructions only
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)
        prompt = (
            "Translate and explain this legal context in simple, accessible English and Hindi for a user.\n"
            "RULES:\n"
            "- Do NOT decide legality.\n"
            "- Do NOT claim any clause is illegal or invalid.\n"
            "- Do NOT give personalized legal advice.\n"
            "- Do NOT invent any Acts, sections, or citations.\n"
            "- Strictly output JSON format: {\"english\": \"...\", \"hindi\": \"...\"}\n\n"
            f"INPUT CONTEXT:\n{json.dumps(structured_payload, indent=2)}"
        )
        resp = await client.chat.completions.create(
            model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        content = resp.choices[0].message.content or "{}"
        parsed = json.loads(content)
        return {
            "english": parsed.get("english") or fallback["english"],
            "hindi": parsed.get("hindi") or fallback["hindi"],
        }
    except Exception:
        return fallback
