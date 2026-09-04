# PactLens comprehensive verification test (Legal Layer, Trust Graph, Certificate)
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.database import init_db, SessionLocal, Scan
from app.detection import run_detection
from app.evidence import make_evidence, attach_legal_context, generate_evidentiary_certificate, build_legal_aid_handoff
from app.trust_patterns import (
    extract_counterparty,
    seed_baseline_corpus,
    get_counterparty_trust_graph,
    pattern_for_rule_in_entity,
)
from app.business import analyze_template


def main():
    old = (ROOT / "samples" / "rental_old.txt").read_text(encoding="utf-8")
    new = (ROOT / "samples" / "rental_new.txt").read_text(encoding="utf-8")
    result = run_detection(old, new, contract_type="rental")
    findings = attach_legal_context(result["findings"])

    print("=== 1. DETECTION & LEGAL GROUNDING LAYER ===")
    print("Clauses old/new:", result["stages"]["segment"])
    print("Match counts:", result["stages"]["match"])
    print("Risk counts:", result["risk_counts"])
    print()

    # Verify legal grounding on findings
    deposit_finding = next((f for f in findings if f["rule_id"] == "deposit_refund_extended"), None)
    assert deposit_finding is not None, "deposit_refund_extended must be detected"
    assert "Model Tenancy Act, 2021" in deposit_finding["broken_statute"], "Statutory mapping failed"
    assert deposit_finding["legal_action"]["dispute_forum"], "Dispute forum missing"
    assert "Section 11" in deposit_finding["legal_action"]["counter_notice_draft"], "Counter notice missing MTA cite"
    print("PASS: Legal-grounding mapped deposit clause to Model Tenancy Act, 2021 Section 11.")

    # Verify auto-renewal finding
    renewal_finding = next((f for f in findings if f["rule_id"] == "auto_renewal_introduced"), None)
    assert renewal_finding is not None, "auto_renewal_introduced must be detected"
    assert "Consumer Protection Act" in renewal_finding["broken_statute"], "Auto-renewal statute missing"
    print("PASS: Auto-renewal mapped to Consumer Protection Act 2019 Unfair Terms.")
    print()

    # 2. Cryptographic Evidence & Section 63 BSA Certificate
    print("=== 2. TAMPER-EVIDENT AUDIT TRAIL (SECTION 63 BSA / 65B IEA) ===")
    evidence = make_evidence(old.encode("utf-8"), new.encode("utf-8"))
    assert evidence["old_document_sha256"]
    assert evidence["new_document_sha256"]
    assert evidence["certificate_id"].startswith("CERT-BSA63-")

    cert = generate_evidentiary_certificate(
        {"contract_name": "Ayesha vs Sharma Properties", "contract_type": "rental", "counterparty_name": "Sharma Properties Pvt Ltd"},
        evidence,
        findings,
    )
    assert cert["statutory_violations_detected"] >= 4
    assert cert["cryptographic_proof"]["diff_merkle_root"]
    print("PASS: Section 63 BSA / Sec 65B IEA Certificate generated with Certificate ID:", cert["certificate_id"])
    print("Statutory violations certified in record:", cert["statutory_violations_detected"])
    print()

    # 3. Landlord / Platform Trust Graph
    print("=== 3. LANDLORD / PLATFORM TRUST GRAPH ===")
    init_db()
    db = SessionLocal()
    seed_baseline_corpus(db)

    counterparty = extract_counterparty("Ayesha — Green Park lease renewal", new, "rental")
    assert counterparty == "Sharma Properties Pvt Ltd", f"Expected Sharma Properties, got {counterparty}"

    tg = get_counterparty_trust_graph(db, counterparty, "rental")
    assert tg["total_contracts_scanned"] >= 40
    assert tg["trust_score"] < 50, "Sharma Properties should have low trust score due to recidivism"
    print(f"Counterparty: {counterparty}")
    print(f"Total historical contracts scanned: {tg['total_contracts_scanned']}")
    print(f"Trust Score: {tg['trust_score']}/100 ({tg['trust_rating']})")

    rule_pat = pattern_for_rule_in_entity(db, counterparty, "deposit_refund_extended")
    assert rule_pat is not None
    assert rule_pat["occurrences"] >= 40
    print("Recurrence callout:", rule_pat["callout"])
    print("PASS: Trust graph correctly computes recurring clause prevalence across scans.")
    print()

    # 4. Legal-Aid Handoff Dossier
    print("=== 4. LEGAL-AID HANDOFF DOSSIER ===")
    handoff = build_legal_aid_handoff(
        {"contract_name": "Green Park Lease", "contract_type": "rental", "counterparty_name": counterparty, "risk_counts": result["risk_counts"]},
        findings,
        evidence,
    )
    assert len(handoff["statutory_violations"]) >= 4
    assert handoff["evidence"]["admissibility"]
    print("PASS: Legal-aid handoff dossier constructed with", len(handoff["statutory_violations"]), "statutory violations.")
    print()

    # 5. Two-Sided Fairness Certification
    print("=== 5. TWO-SIDED FAIRNESS CERTIFICATION ===")
    audit = analyze_template(new, entity_name=counterparty, contract_type="rental")
    assert audit["fairness_score"] < 70, "Unfair contract with 90 days deposit & unilateral terms must fail"
    assert len(audit["remediation_checklist"]) >= 3
    print(f"Fairness audit score: {audit['fairness_score']}/100 ({audit['badge_status']})")
    print(f"Remediation fixes required: {len(audit['remediation_checklist'])}")
    print("PASS: Two-sided fairness audit generated score, dimensions, and remediation items.")
    print()
    print("ALL BACKEND VERIFICATIONS PASSED SUCCESSFULLY!")
    db.close()


if __name__ == "__main__":
    main()
