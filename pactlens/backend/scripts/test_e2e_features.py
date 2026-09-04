import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_pipeline():
    print("Testing Full E2E Pipeline with all 5 features...")

    # 1. Health check
    health_resp = client.get("/api/health")
    assert health_resp.status_code == 200
    assert "legal_grounding_layer" in health_resp.json()["modules"]
    print("[OK] 1. Health endpoint OK")

    # 2. Upload and Scan
    old_text = (ROOT / "samples" / "rental_old.txt").read_text(encoding="utf-8")
    new_text = (ROOT / "samples" / "rental_new.txt").read_text(encoding="utf-8")

    scan_resp = client.post(
        "/api/scan",
        files={
            "old_file": ("rental_old.txt", old_text.encode("utf-8"), "text/plain"),
            "new_file": ("rental_new.txt", new_text.encode("utf-8"), "text/plain"),
        },
        data={
            "contract_type": "rental",
            "contract_name": "Ayesha — Green Park lease renewal",
            "counterparty_name": "Sharma Properties Pvt Ltd",
            "skip_explain": "true",
        },
    )
    assert scan_resp.status_code == 200, scan_resp.text
    data = scan_resp.json()
    scan_id = data["scan_id"]
    print(f"[OK] 2. Scan completed with Scan ID: {scan_id}")

    # Verify Feature 1: Legal-Grounding Layer & Actionable Remedies
    findings = data["findings"]
    deposit_f = next((f for f in findings if f["rule_id"] == "deposit_refund_extended"), None)
    assert deposit_f is not None
    assert "Model Tenancy Act, 2021 — Section 11" in deposit_f["broken_statute"]
    assert deposit_f["violation_type"] == "Direct Statutory Breach / Unfair Contract Term"
    assert "Rent Authority" in deposit_f["legal_action"]["dispute_forum"]
    assert "Section 11" in deposit_f["legal_action"]["counter_notice_draft"]
    assert len(deposit_f["legal_action"]["filing_steps"]) >= 2
    assert len(deposit_f["legal_action"]["evidentiary_defense"]) >= 2
    print("[OK] Feature 1: Legal-Grounding Layer verified (MTA Section 11 statutory mapping & counter-notice present)")

    # Verify Feature 2: Landlord Trust Graph
    tg = data["trust_graph"]
    assert tg["counterparty_name"] == "Sharma Properties Pvt Ltd"
    assert tg["total_contracts_scanned"] >= 40
    assert tg["trust_score"] < 50
    assert len(tg["patterns"]) >= 5
    assert deposit_f.get("trust_graph") is not None
    assert deposit_f["trust_graph"]["occurrences"] >= 40
    print(f"[OK] Feature 2: Landlord Trust Graph verified ({tg['total_contracts_scanned']} historical scans, {deposit_f['trust_graph']['occurrences']} repeat deposit clauses)")

    # Verify Feature 3: Tamper-Evident Evidentiary Audit Trail
    cert = data["evidentiary_certificate"]
    assert cert["certificate_id"].startswith("CERT-BSA63-")
    assert cert["cryptographic_proof"]["original_sha256"]
    assert cert["cryptographic_proof"]["revised_sha256"]
    assert cert["cryptographic_proof"]["diff_merkle_root"]
    assert cert["statutory_violations_detected"] >= 4

    html_resp = client.get(f"/api/scans/{scan_id}/certificate?format=html")
    assert html_resp.status_code == 200
    assert "Certificate of Authenticity of Electronic Evidence" in html_resp.text
    assert "Bharatiya Sakshya Adhiniyam" in html_resp.text
    print("[OK] Feature 3: Tamper-evident Section 63 BSA / Sec 65B IEA certificate generated & printable HTML verified")

    # Test Hash & Tamper Verifier endpoint
    verify_resp = client.post(
        "/api/evidence/verify",
        data={"scan_id": scan_id, "expected_hash": cert["cryptographic_proof"]["revised_sha256"]},
        files={"file": ("test.txt", new_text.encode("utf-8"), "text/plain")},
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["verified"] is True
    print("[OK] Feature 3b: Cryptographic hash verifier passed (Tamper-Free confirmed)")

    # Verify Feature 4: Legal-Aid Handoff
    clinics_resp = client.get("/api/legal-aid/clinics")
    assert clinics_resp.status_code == 200
    assert len(clinics_resp.json()["clinics"]) >= 3

    refer_resp = client.post(
        "/api/legal-aid/refer",
        data={
            "scan_id": scan_id,
            "clinic_id": "dlsa-delhi",
            "claimant_name": "Ayesha Khan",
            "claimant_contact": "ayesha@example.com",
            "notes": "Landlord refusing to refund deposit within statutory 30 days.",
        },
    )
    assert refer_resp.status_code == 200
    ref_data = refer_resp.json()
    assert ref_data["ticket_id"].startswith("REF-DLSA-")
    assert ref_data["status"] == "Dispatched"
    print(f"[OK] Feature 4: Legal-Aid Handoff referral dispatched (Ticket ID: {ref_data['ticket_id']})")

    # Verify Feature 5: Two-Sided Fairness Certification
    certify_resp = client.post(
        "/api/business/certify",
        data={
            "raw_text": new_text,
            "entity_name": "Sharma Properties Pvt Ltd",
            "contract_type": "rental",
        },
    )
    assert certify_resp.status_code == 200
    cert_data = certify_resp.json()
    assert cert_data["badge_id"].startswith("PLF-2026-")
    assert len(cert_data["remediation_checklist"]) >= 3
    assert cert_data["embed_badge_html"]
    print(f"[OK] Feature 5: Two-Sided Fairness Certification generated (Score: {cert_data['fairness_score']}/100, Badge ID: {cert_data['badge_id']})")

    print("\nALL 5 END-TO-END FEATURES FULLY VERIFIED AND OPERATIONAL!")

if __name__ == "__main__":
    test_full_pipeline()
