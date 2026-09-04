import sys
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from app.main import app
from legal import (
    get_legal_service,
    get_repository,
    KNOWLEDGE_BASE_VERSION,
    MANDATORY_DISCLAIMER,
    GLOBAL_DISCLAIMER,
    map_finding_to_legal_context,
)
from legal.sources import validate_source_entry, is_source_verified
from legal.disclaimer import PROHIBITED_PHRASES
from app.detection import run_detection
from app.detection.rules import _days

client = TestClient(app)

def run_all_tests():
    print("==================================================")
    print("PACTLENS LEGAL LAYER — MANDATORY VERIFICATION SUITE")
    print("==================================================")

    svc = get_legal_service()
    repo = get_repository()

    # 1. Deposit finding -> legal mapping exists
    dep_finding = {
        "category": "deposit",
        "severity": "High",
        "old_text": "Security deposit shall be refunded within 30 days.",
        "new_text": "Security deposit shall be refunded within 60 days.",
        "numeric_changes": {"old": 30, "new": 60},
    }
    dep_res = svc.process_finding(dep_finding, state=None, contract_type="rental")
    assert len(dep_res["legal_context"]) > 0, "Deposit finding should map to legal context"
    mta_card = next((c for c in dep_res["legal_context"] if "Model Tenancy Act" in c["act"]), None)
    assert mta_card is not None, "Deposit must map to Model Tenancy Act"
    assert "Section 11" in mta_card["provision"], "Must cite Section 11"
    assert "vacant possession" in mta_card["summary"], "Must note refund is connected to vacant possession"
    # Ensure no claim of universal 30 days or automatic illegality
    assert "universal fixed" not in mta_card["summary"]
    for phrase in PROHIBITED_PHRASES:
        assert phrase not in str(dep_res).lower(), f"Prohibited phrase '{phrase}' found in deposit context"
    print("[OK] Test 1 Passed: Deposit finding -> Model Tenancy Act context mapped without illegality claims")

    # 2. Notice finding -> legal mapping exists
    notice_finding = {
        "category": "notice",
        "severity": "Medium",
        "old_text": "Rent may be revised on sixty days notice.",
        "new_text": "Rent may be revised on fifteen days notice.",
    }
    notice_res = svc.process_finding(notice_finding, contract_type="rental")
    assert len(notice_res["legal_context"]) > 0
    notice_card = notice_res["legal_context"][0]
    assert "Model Tenancy Act" in notice_card["act"]
    assert "Section 9" in notice_card["provision"] or "Section 10" in notice_card["provision"]
    assert "violat" not in notice_card["why_it_matters"].lower(), "Must not claim automatic violation"
    print("[OK] Test 2 Passed: Notice finding -> Model Tenancy Act notice framework mapped")

    # 3. Arbitration finding -> legal mapping exists (does NOT claim arbitration is invalid)
    arb_finding = {
        "category": "arbitration",
        "severity": "Medium",
        "old_text": "Disputes shall be resolved before civil courts in Delhi.",
        "new_text": "Disputes shall be resolved by sole arbitrator appointed by Landlord.",
    }
    arb_res = svc.process_finding(arb_finding, contract_type="rental")
    assert len(arb_res["legal_context"]) > 0
    arb_card = arb_res["legal_context"][0]
    assert "Rent Authority" in arb_card["summary"]
    assert "automatically invalid" not in arb_card["why_it_matters"], "Must not claim arbitration is invalid"
    assert "tenancy framework applicable in your state" in arb_card["why_it_matters"]
    print("[OK] Test 3 Passed: Arbitration finding -> Non-invalidation dispute framework mapped")

    # 4. Liability finding -> Indian Contract Act context
    liab_finding = {
        "category": "liability",
        "severity": "High",
        "old_text": "Each party shall be responsible for its own gross negligence.",
        "new_text": "Tenant shall indemnify Landlord against all claims and damages unconditionally.",
    }
    liab_res = svc.process_finding(liab_finding, contract_type="rental")
    ica_card = next((c for c in liab_res["legal_context"] if "Indian Contract Act" in c["act"]), None)
    assert ica_card is not None
    assert "Section 23" in ica_card["provision"]
    assert "violates section 23" not in ica_card["why_it_matters"].lower(), "Must NEVER write 'This clause violates Section 23'"
    assert "raise questions under general contract-law principles" in ica_card["why_it_matters"]
    print("[OK] Test 4 Passed: Liability finding -> Indian Contract Act Section 23 context mapped")

    # 5. Consumer-facing contract -> Consumer Protection context only when applicable
    # Rental agreement should NOT arbitrarily inject consumer law
    rental_liab = svc.process_finding(liab_finding, contract_type="rental")
    cpa_in_rental = any("Consumer Protection Act" in c["act"] for c in rental_liab["legal_context"])
    assert not cpa_in_rental, "Rental contract must not default to consumer law"

    # Consumer agreement should include CPA
    consumer_res = svc.process_finding(liab_finding, contract_type="consumer")
    cpa_in_consumer = any("Consumer Protection Act" in c["act"] for c in consumer_res["legal_context"])
    assert cpa_in_consumer, "Consumer-facing contract must include Consumer Protection Act"
    print("[OK] Test 5 Passed: Consumer Protection Act applied only to relevant consumer contexts")

    # 6. Gig/platform contract -> Social Security Code context where relevant
    gig_finding = {
        "category": "payment",
        "severity": "High",
        "old_text": "Platform commission shall be 15% per order.",
        "new_text": "Platform commission shall be increased to 30% per order.",
    }
    gig_res = svc.process_finding(gig_finding, contract_type="gig")
    css_card = next((c for c in gig_res["legal_context"] if "Social Security" in c["act"]), None)
    assert css_card is not None, "Gig worker contract must include Code on Social Security context"
    assert "current applicability/commencement should be verified" in css_card["why_it_matters"]
    print("[OK] Test 6 Passed: Gig contract -> Code on Social Security with commencement verification note")

    # 7. Unknown state -> no fabricated state-specific law
    state_res = svc.process_finding(dep_finding, state="Atlantis State", contract_type="rental")
    assert "Atlantis" not in state_res["jurisdiction_note"] or "not been verified" in state_res["jurisdiction_note"]
    assert "A state-specific provision has not been verified in PactLens." in state_res["jurisdiction_note"]
    print("[OK] Test 7 Passed: Unknown state -> Clean fallback without fabricated sections")

    # 8. Missing source URL -> legal claim is not rendered
    unverified_entry = {
        "id": "test-invalid-1",
        "category": "deposit",
        "act": "Imaginary Tenancy Act",
        "provision": "Section 99",
        "summary": "Some summary",
        "source_url": "",  # MISSING URL
        "last_verified_date": "2026-09-01",
        "jurisdiction_note": "Pan-India",
    }
    val_ok, reason = validate_source_entry(unverified_entry)
    assert not val_ok, "Validator must reject entries missing source_url"
    assert is_source_verified("", "2026-09-01") is False
    print("[OK] Test 8 Passed: Missing source URL rejected from rendering")

    # 9. Missing verification date -> rejected by source validator
    unverified_entry_2 = {
        "id": "test-invalid-2",
        "category": "deposit",
        "act": "Model Tenancy Act",
        "provision": "Section 11",
        "summary": "Some summary",
        "source_url": "https://mohua.gov.in/test.pdf",
        "last_verified_date": "",  # MISSING DATE
        "jurisdiction_note": "Pan-India",
    }
    val_ok_2, reason_2 = validate_source_entry(unverified_entry_2)
    assert not val_ok_2, "Validator must reject entries missing last_verified_date"
    print("[OK] Test 9 Passed: Missing verification date rejected by validator")

    # 10. Every legal card contains disclaimer
    for c in dep_res["legal_context"]:
        assert c["disclaimer"] == MANDATORY_DISCLAIMER
        assert "Informational reference only" in c["disclaimer"]
        assert "not legal advice" in c["disclaimer"]
    print("[OK] Test 10 Passed: Mandatory disclaimer strictly present on every legal card")

    # 11. LLM disabled -> legal layer still works
    os.environ.pop("OPENAI_API_KEY", None)
    os.environ.pop("LLM_API_KEY", None)
    health_resp = client.get("/api/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["detection_llm_dependency"] is False
    print("[OK] Test 11 Passed: Legal layer operates with LLM = OFF")

    # 12. LLM disabled -> deterministic legal explanation is generated
    from app.explain.legal_explainer import explain_legal_finding, DETERMINISTIC_EXPLANATIONS
    import asyncio
    expl = asyncio.run(explain_legal_finding({
        "finding": dep_finding,
        "legal_context": dep_res["legal_context"],
        "jurisdiction_note": dep_res["jurisdiction_note"],
        "possible_next_steps": dep_res["possible_next_steps"],
    }))
    assert len(expl["english"]) > 20
    assert len(expl["hindi"]) > 20
    assert "डिपॉज़िट" in expl["hindi"]
    assert "security deposit" in expl["english"].lower()
    print("[OK] Test 12 Passed: Deterministic English & Hindi explanations generated without LLM")

    # 13. Saved report preserves legal context exactly
    scan_resp = client.post(
        "/api/scan",
        files={
            "old_file": ("old.txt", b"Security deposit shall be refunded within thirty days.", "text/plain"),
            "new_file": ("new.txt", b"Security deposit shall be refunded within sixty days.", "text/plain"),
        },
        data={"contract_type": "rental", "state": "Delhi", "skip_explain": "true"},
    )
    assert scan_resp.status_code == 200, scan_resp.text
    scan_data = scan_resp.json()
    scan_id = scan_data["scan_id"]
    first_f = scan_data["findings"][0]
    assert "legal_context" in first_f
    assert len(first_f["legal_context"]) > 0
    saved_ctx = first_f["legal_context"]

    # Reopen saved report
    get_resp = client.get(f"/api/scans/{scan_id}")
    assert get_resp.status_code == 200
    reopened_data = get_resp.json()
    reopened_ctx = reopened_data["findings"][0]["legal_context"]
    assert saved_ctx == reopened_ctx, "Reopened report must preserve legal context exactly without regeneration"
    print("[OK] Test 13 Passed: Saved report preserves exact legal context without regeneration")

    # 14. Knowledge-base version is stored
    assert reopened_data.get("legal_knowledge_base_version") == KNOWLEDGE_BASE_VERSION
    assert scan_data.get("legal_knowledge_base_version") == KNOWLEDGE_BASE_VERSION
    print(f"[OK] Test 14 Passed: Knowledge base version '{KNOWLEDGE_BASE_VERSION}' preserved in scan")

    # 15. Prohibited phrases check
    full_dump = (
        str(dep_res) + " " +
        str(notice_res) + " " +
        str(arb_res) + " " +
        str(liab_res) + " " +
        str(gig_res) + " " +
        str(reopened_data["findings"])
    ).lower()

    for phrase in PROHIBITED_PHRASES:
        assert phrase not in full_dump, f"Prohibited phrase '{phrase}' detected in system outputs!"
    print("[OK] Test 15 Passed: Zero prohibited advisory/illegality phrases detected")

    # 16. FINAL ACCEPTANCE TEST:
    # "Security deposit shall be refunded within thirty days."
    # vs
    # "Security deposit shall be refunded within sixty days."
    # Expected:
    # - Detection: deposit category
    # - Numeric extraction: old = 30, new = 60
    # - Risk: High
    # - Legal Layer: Model Tenancy Act, 2021 context
    # - No claim that "60 days is illegal"
    # - LLM completely disabled.
    acceptance_det = run_detection(
        "Security deposit shall be refunded within thirty days.",
        "Security deposit shall be refunded within sixty days.",
        contract_type="rental",
    )
    findings = acceptance_det["findings"]
    assert len(findings) > 0, "Must detect deposit refund extension"
    dep_f = next((f for f in findings if f["rule_id"] == "deposit_refund_extended"), None)
    assert dep_f is not None, "deposit_refund_extended rule must trigger"
    assert dep_f["severity"] == "High", "30 -> 60 day extension must be High risk"
    assert dep_f["extracted"]["numeric_changes"]["old"] == 30
    assert dep_f["extracted"]["numeric_changes"]["new"] == 60

    # Map through legal layer
    acc_legal = svc.process_finding(dep_f, contract_type="rental")
    mta_entry = next((c for c in acc_legal["legal_context"] if "Model Tenancy Act" in c["act"]), None)
    assert mta_entry is not None
    assert "Section 11" in mta_entry["provision"]
    assert "illegal" not in mta_entry["why_it_matters"].lower()
    assert "This clause may be inconsistent" in mta_entry["why_it_matters"] or "affects the timing" in mta_entry["why_it_matters"]

    print("[OK] Test 16 Passed: Final Acceptance Test 'thirty days' vs 'sixty days' -> 30 to 60 numeric shift, High risk, MTA context")

    # Also test legal knowledge base API endpoints
    legal_api = client.get("/api/legal?category=deposit&state=Uttar%20Pradesh")
    assert legal_api.status_code == 200
    assert "Uttar Pradesh" in legal_api.json()["jurisdiction_note"]

    cats_api = client.get("/api/legal/categories")
    assert cats_api.status_code == 200
    assert "deposit" in cats_api.json()["categories"]

    sources_api = client.get("/api/legal/sources")
    assert sources_api.status_code == 200
    assert len(sources_api.json()["sources"]) >= 5

    print("[OK] API Endpoints: /api/legal, /api/legal/categories, /api/legal/sources all verified")
    print("\n==================================================")
    print("ALL 16 COMPREHENSIVE LEGAL LAYER TESTS PASSED (100%)")
    print("==================================================")

if __name__ == "__main__":
    run_all_tests()
