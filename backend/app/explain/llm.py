"""
Explanation layer — LLM optional.

If OPENAI_API_KEY (or LLM_API_KEY) is unset, returns deterministic stub
explanations so the app runs end-to-end offline.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

# Hindi stubs keyed loosely by rule — used when no API key
_HINDI_STUBS = {
    "deposit_refund_extended": "आपकी सिक्योरिटी डिपॉजिट वापसी का समय बढ़ गया है, जिससे आपका पैसा ज़्यादा दिनों तक अटका रह सकता है।",
    "notice_period_extended": "नोटिस अवधि बढ़ाई गई है, जिससे अनुबंध छोड़ने में ज़्यादा समय लग सकता है।",
    "auto_renewal_introduced": "ऑटो-रिन्यूअल जोड़ा गया है — समय पर रद्द नहीं किया तो अनुबंध अपने आप बढ़ सकता है।",
    "auto_renewal_notice_extended": "ऑटो-रिन्यूअल रद्द करने की समय-सीमा सख्त हो गई है।",
    "payment_commission_reduced": "आपको मिलने वाला भुगतान या कमीशन घटाया गया है।",
    "fee_increased": "प्लेटफ़ॉर्म या सेवा शुल्क बढ़ाया गया है।",
    "rent_increased": "किराया बढ़ाया गया है, जिससे आपकी मासिक लागत बढ़ेगी।",
    "liability_shifted": "ज़्यादा कानूनी/वित्तीय ज़िम्मेदारी आपके ऊपर डाली गई है।",
    "maintenance_shifted": "मरम्मत/मेंटेनेंस की ज़िम्मेदारी आपकी तरफ़ शिफ्ट हुई है।",
    "arbitration_introduced": "विवाद अब अदालत की बजाय मध्यस्थता (arbitration) से सुलझाने होंगे।",
    "unilateral_amendment": "दूसरा पक्ष शर्तें एकतरफ़ा बदल सकता है।",
    "data_rights_expanded": "आपके डेटा के उपयोग/साझा करने के अधिकार बढ़ाए गए हैं।",
    "protection_removed": "पहले वाला सुरक्षा प्रावधान हटा दिया गया है।",
    "clause_removed": "एक खंड हटा दिया गया है — जाँच करें कि इससे आपकी सुरक्षा कम तो नहीं हुई।",
    "material_wording_change": "खंड का शब्द चयन बदला है; प्रभाव समझने के लिए तुलना करें।",
}


def _stub_explain(finding: dict[str, Any]) -> dict[str, str]:
    reason = finding.get("reason") or "This clause changed in a way that may affect you."
    impact = (finding.get("impact") or {}).get("label") or ""
    en = f"{reason}"
    if impact:
        en += f" Practical impact: {impact}."
    en += " This is informational, not legal advice."
    hi = _HINDI_STUBS.get(
        finding.get("rule_id", ""),
        "यह खंड बदला है और आपकी शर्तों को प्रभावित कर सकता है। यह जानकारी मात्र है, कानूनी सलाह नहीं।",
    )
    return {
        "explanation_en": en,
        "explanation_hi": hi,
        "provider": "stub",
    }


async def explain_finding(finding: dict[str, Any]) -> dict[str, str]:
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY") or ""
    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
    model = os.getenv("LLM_MODEL", "gpt-4o-mini")

    if not api_key:
        return _stub_explain(finding)

    prompt = (
        "You explain contract clause changes for Indian consumers. "
        "Given an ALREADY-CLASSIFIED risk finding, write:\n"
        "1) explanation_en: 1-2 plain English sentences (informational, not legal advice)\n"
        "2) explanation_hi: accurate Hindi translation of that explanation\n"
        "Do NOT re-classify risk. Do NOT invent numbers.\n\n"
        f"Rule: {finding.get('rule_name')} ({finding.get('severity')})\n"
        f"Reason: {finding.get('reason')}\n"
        f"Old: {finding.get('old_text', '')[:500]}\n"
        f"New: {finding.get('new_text', '')[:500]}\n"
        f"Impact: {(finding.get('impact') or {}).get('label')}\n"
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "Return JSON with keys explanation_en and explanation_hi only."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"},
                },
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            import json
            data = json.loads(content)
            return {
                "explanation_en": data.get("explanation_en") or _stub_explain(finding)["explanation_en"],
                "explanation_hi": data.get("explanation_hi") or _stub_explain(finding)["explanation_hi"],
                "provider": "llm",
            }
    except Exception:
        stub = _stub_explain(finding)
        stub["provider"] = "stub-fallback"
        return stub


async def explain_findings(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for f in findings:
        exp = await explain_finding(f)
        merged = dict(f)
        merged.update(exp)
        out.append(merged)
    return out
