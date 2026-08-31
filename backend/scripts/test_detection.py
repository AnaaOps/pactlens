# PactLens detection self-test (no LLM)
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.detection import run_detection
from app.evidence import make_evidence, attach_legal_context
from app.nlp import semantic_similarity


def main():
    old = (ROOT / "samples" / "rental_old.txt").read_text(encoding="utf-8")
    new = (ROOT / "samples" / "rental_new.txt").read_text(encoding="utf-8")
    result = run_detection(old, new, contract_type="rental")
    findings = attach_legal_context(result["findings"])

    print("=== DETECTION (LLM disabled) ===")
    print("Clauses old/new:", result["stages"]["segment"])
    print("Match:", result["stages"]["match"])
    print("Risk counts:", result["risk_counts"])
    print()
    for f in findings:
        print(f"[{f['severity']}] {f['rule_id']}: {f['reason']}")
        if f.get("impact"):
            print(f"   impact: {f['impact'].get('label')}")
    print()

    # Evidence hash changes when bytes change
    e1 = make_evidence(old.encode(), new.encode())
    e2 = make_evidence(old.encode(), (new + "\n").encode())
    assert e1["old_document_sha256"] == e2["old_document_sha256"]
    assert e1["new_document_sha256"] != e2["new_document_sha256"]
    assert e1["combined_sha256"] != e2["combined_sha256"]
    print("Evidence hash OK — combined hash changes when new file changes")
    print("scan_id example:", e1["scan_id"])

    # Must catch deposit 30→90
    rules = {f["rule_id"] for f in findings}
    assert "deposit_refund_extended" in rules, rules
    assert result["risk_counts"]["High"] >= 1
    print("PASS: deposit_refund_extended detected; High risks present")
    print("llm_used: False")


if __name__ == "__main__":
    main()
