"""
PactLens FastAPI application.

Pipeline exposed as APIs:
  upload → OCR / PDF extract → segment → categorize → NLP match → risk rules → explain → JSON
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session

load_dotenv()

from app.database import init_db, get_db, Scan, Finding, Reminder
from app.ocr import extract_text_from_bytes
from app.detection import run_detection
from app.detection.segment import segment_clauses, Clause
from app.detection.categories import categorize_clause, CATEGORIES
from app.detection.match import match_clauses, MatchResult
from app.detection.classify import classify_risks, summarize_counts
from app.nlp import semantic_similarity, batch_similarity
from app.explain import explain_findings
from app.templates import list_templates, get_template
from app.evidence import make_evidence, attach_legal_context, build_legal_aid_handoff
from app.detection.benchmarks import attach_benchmarks
from app.trust_patterns import compute_trust_patterns, pattern_for_rule
from app.business import analyze_template

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="PactLens API",
    description=(
        "Contract diff engine: FastAPI upload → PDF/OCR → segment → "
        "categorize → NLP semantic match → risk rules → structured JSON. "
        "LLM used only for explanation."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    init_db()


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "llm_configured": bool(os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")),
        "detection_llm_dependency": False,
        "modules": [
            "upload",
            "pdf_extract",
            "ocr",
            "nlp",
            "segment",
            "categories",
            "semantic_similarity",
            "match",
            "risk_rules",
            "database",
            "templates",
            "structured_json",
        ],
    }


# ── Templates / DB helpers ──────────────────────────────────────────

@app.get("/api/templates")
def templates():
    return {"templates": list_templates(), "categories": CATEGORIES}


# ── File upload ─────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_files(
    old_file: UploadFile = File(...),
    new_file: UploadFile = File(...),
):
    """File upload API — stores bytes, returns hashes + paths (no processing yet)."""
    old_bytes = await old_file.read()
    new_bytes = await new_file.read()
    evidence = make_evidence(old_bytes, new_bytes)
    old_path = UPLOAD_DIR / f"{evidence['scan_id']}_old_{old_file.filename}"
    new_path = UPLOAD_DIR / f"{evidence['scan_id']}_new_{new_file.filename}"
    old_path.write_bytes(old_bytes)
    new_path.write_bytes(new_bytes)
    return {
        "schema": "pactlens.upload.v1",
        "scan_id": evidence["scan_id"],
        "old": {
            "filename": old_file.filename,
            "bytes": len(old_bytes),
            "sha256": evidence["old_document_sha256"],
            "stored_as": str(old_path.name),
        },
        "new": {
            "filename": new_file.filename,
            "bytes": len(new_bytes),
            "sha256": evidence["new_document_sha256"],
            "stored_as": str(new_path.name),
        },
        "evidence": evidence,
    }


# ── OCR / PDF text extraction ───────────────────────────────────────

@app.post("/api/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    """PDF text extraction + image OCR."""
    data = await file.read()
    result = extract_text_from_bytes(data, file.filename or "upload.bin")
    return {
        "schema": "pactlens.ocr.v1",
        "filename": file.filename,
        "text": result["text"],
        "method": result["method"],
        "note": result.get("note"),
        "char_count": len(result.get("text") or ""),
    }


# ── Segment + categories ────────────────────────────────────────────

@app.post("/api/segment")
async def segment_endpoint(payload: dict):
    text = payload.get("text") or ""
    source = payload.get("source") or "old"
    clauses = segment_clauses(text, source=source)
    out = []
    for c in clauses:
        d = c.to_dict()
        d["category"] = categorize_clause(c.title, c.text)
        out.append(d)
    return {
        "schema": "pactlens.segment.v1",
        "count": len(out),
        "categories_taxonomy": CATEGORIES,
        "clauses": out,
    }


# ── NLP semantic similarity ─────────────────────────────────────────

@app.post("/api/nlp/similarity")
async def nlp_similarity(payload: dict):
    a = payload.get("text_a") or ""
    b = payload.get("text_b") or ""
    score = semantic_similarity(a, b)
    return {
        "schema": "pactlens.nlp.similarity.v1",
        "method": "tfidf_cosine",
        "similarity": round(score, 4),
    }


# ── Clause matching ─────────────────────────────────────────────────

@app.post("/api/match")
async def match_endpoint(payload: dict):
    old = [Clause(**{k: c[k] for k in ("id", "index", "title", "text", "source")}) for c in payload.get("old_clauses") or []]
    new = [Clause(**{k: c[k] for k in ("id", "index", "title", "text", "source")}) for c in payload.get("new_clauses") or []]
    matches = match_clauses(old, new)
    return {
        "schema": "pactlens.match.v1",
        "method": "nlp_semantic_similarity",
        "matches": [m.to_dict() for m in matches],
    }


# ── Risk detection rules ────────────────────────────────────────────

@app.post("/api/classify")
async def classify_endpoint(payload: dict):
    matches = []
    for m in payload.get("matches") or []:
        matches.append(
            MatchResult(
                status=m["status"],
                old_clause=m.get("old_clause"),
                new_clause=m.get("new_clause"),
                similarity=float(m.get("similarity") or 0),
                match_id=m["match_id"],
                category=m.get("category") or "other",
            )
        )
    findings = classify_risks(matches)
    return {
        "schema": "pactlens.classify.v1",
        "findings": [f.to_dict() for f in findings],
        "risk_counts": summarize_counts(findings),
        "llm_used": False,
    }


@app.post("/api/explain")
async def explain_endpoint(payload: dict):
    findings = payload.get("findings") or []
    explained = await explain_findings(findings)
    return {"schema": "pactlens.explain.v1", "findings": explained}


@app.post("/api/detection/run")
async def detection_only(payload: dict):
    """Judge-facing: full detection with zero LLM."""
    result = run_detection(
        payload.get("old_text") or "",
        payload.get("new_text") or "",
        contract_type=payload.get("contract_type") or "rental",
    )
    result["findings"] = attach_legal_context(result["findings"])
    return result


# ── Full scan → final structured JSON ───────────────────────────────

@app.post("/api/scan")
async def full_scan(
    old_file: UploadFile = File(...),
    new_file: UploadFile = File(...),
    contract_type: str = Form("rental"),
    contract_name: str = Form(""),
    skip_explain: bool = Form(False),
    db: Session = Depends(get_db),
):
    stages_progress = []

    def mark(stage: str, detail: str):
        stages_progress.append({"stage": stage, "detail": detail, "status": "done"})

    old_bytes = await old_file.read()
    new_bytes = await new_file.read()
    mark("upload", f"Received {old_file.filename} + {new_file.filename}")

    evidence = make_evidence(old_bytes, new_bytes)
    # Persist uploads
    (UPLOAD_DIR / f"{evidence['scan_id']}_old_{old_file.filename}").write_bytes(old_bytes)
    (UPLOAD_DIR / f"{evidence['scan_id']}_new_{new_file.filename}").write_bytes(new_bytes)
    mark("evidence", f"SHA-256 {evidence['combined_sha256'][:16]}…")

    old_ocr = extract_text_from_bytes(old_bytes, old_file.filename or "old.pdf")
    new_ocr = extract_text_from_bytes(new_bytes, new_file.filename or "new.pdf")
    if not old_ocr["text"] or not new_ocr["text"]:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Could not extract text. Try PDF with text or .txt samples.",
                "old_method": old_ocr.get("method"),
                "new_method": new_ocr.get("method"),
                "stages": stages_progress,
            },
        )
    mark("ocr", f"old={old_ocr['method']}, new={new_ocr['method']}")

    detection = run_detection(old_ocr["text"], new_ocr["text"], contract_type=contract_type)
    mark("segment", str(detection["stages"]["segment"]))
    mark("categorize", str(detection["stages"]["categorize"]["changed_by_category"]))
    mark("match", str(detection["stages"]["match"]))
    mark("classify", str(detection["stages"]["classify"]))

    findings = attach_legal_context(detection["findings"])
    findings = attach_benchmarks(findings)

    explain_provider = "skipped"
    if not skip_explain:
        findings = await explain_findings(findings)
        explain_provider = (findings[0].get("provider") if findings else "stub") or "stub"
        mark("explain", f"provider={explain_provider}")
    else:
        for f in findings:
            f.setdefault("explanation_en", "")
            f.setdefault("explanation_hi", "")
            f["provider"] = "skipped"
        mark("explain", "skipped (detection-only)")

    name = contract_name.strip() or (
        f"{get_template(contract_type)['label']} — {(old_file.filename or 'old')} vs {(new_file.filename or 'new')}"
    )
    counts = detection["risk_counts"]

    scan_row = Scan(
        scan_id=evidence["scan_id"],
        contract_name=name,
        contract_type=contract_type,
        status="Watching",
        risk_high=counts.get("High", 0),
        risk_medium=counts.get("Medium", 0),
        risk_low=counts.get("Low", 0),
        old_filename=old_file.filename,
        new_filename=new_file.filename,
        old_hash=evidence["old_document_sha256"],
        new_hash=evidence["new_document_sha256"],
        combined_hash=evidence["combined_sha256"],
        stages_json=json.dumps(stages_progress),
        pipeline_json=json.dumps({
            "findings": findings,
            "matches": detection["matches"],
            "stages": detection["stages"],
            "old_clauses": detection["old_clauses"],
            "new_clauses": detection["new_clauses"],
            "ocr": {"old": old_ocr, "new": new_ocr},
            "evidence": evidence,
            "template": detection.get("template"),
        }),
    )
    db.add(scan_row)
    db.flush()

    for f in findings:
        db.add(Finding(
            scan_pk=scan_row.id,
            rule_id=f.get("rule_id"),
            severity=f.get("severity"),
            payload_json=json.dumps(f),
        ))
        rem = f.get("reminder")
        if rem and f.get("severity") in ("High", "Medium"):
            db.add(Reminder(
                scan_pk=scan_row.id,
                finding_rule_id=f.get("rule_id"),
                label=rem.get("label") or "Clause deadline",
                due_date=rem.get("due_date"),
            ))

    db.commit()
    db.refresh(scan_row)

    handoff = build_legal_aid_handoff(
        {"contract_name": name, "contract_type": contract_type, "risk_counts": counts},
        findings,
        evidence,
    )
    (UPLOAD_DIR / f"{evidence['scan_id']}_handoff.json").write_text(
        json.dumps(handoff, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    hero = next((f for f in findings if f.get("severity") == "High"), None)
    if not hero:
        hero = next((f for f in findings if f.get("severity") == "Medium"), None)
    if not hero and findings:
        hero = findings[0]

    # Final structured JSON API response
    return {
        "schema": "pactlens.scan.v1",
        "scan_id": evidence["scan_id"],
        "contract_name": name,
        "contract_type": contract_type,
        "template": detection.get("template"),
        "status": "Watching",
        "created_at": scan_row.created_at.isoformat() + "Z",
        "risk_counts": counts,
        "stages_progress": stages_progress,
        "evidence": evidence,
        "findings": findings,
        "hero_finding": hero,
        "matches_summary": detection["stages"]["match"],
        "category_summary": detection["stages"]["categorize"],
        "ocr": {"old_method": old_ocr["method"], "new_method": new_ocr["method"]},
        "explain_provider": explain_provider,
        "handoff": handoff,
        "reminders": [
            {"label": r.label, "due_date": r.due_date, "rule_id": r.finding_rule_id}
            for r in scan_row.reminders
        ],
        "matches": detection["matches"],
        "old_clauses": detection["old_clauses"],
        "new_clauses": detection["new_clauses"],
        "trust_patterns": {
            p["rule_id"]: pattern_for_rule(db, p["rule_id"])
            for p in compute_trust_patterns(db)["patterns"][:5]
        },
        "pipeline": {
            "segment": detection["stages"]["segment"],
            "categorize": detection["stages"]["categorize"],
            "match": detection["stages"]["match"],
            "classify": detection["stages"]["classify"],
            "nlp_method": "tfidf_cosine_semantic_similarity",
            "llm_used": not skip_explain and explain_provider not in ("skipped",),
        },
    }


@app.get("/api/scans")
def list_scans(db: Session = Depends(get_db)):
    rows = db.query(Scan).order_by(Scan.created_at.desc()).all()
    return {
        "schema": "pactlens.scans.v1",
        "scans": [
            {
                "scan_id": s.scan_id,
                "contract_name": s.contract_name,
                "contract_type": s.contract_type,
                "status": s.status,
                "created_at": s.created_at.isoformat() + "Z",
                "risk_counts": {
                    "High": s.risk_high,
                    "Medium": s.risk_medium,
                    "Low": s.risk_low,
                },
            }
            for s in rows
        ],
    }


@app.get("/api/scans/{scan_id}")
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    s = db.query(Scan).filter(Scan.scan_id == scan_id).first()
    if not s:
        raise HTTPException(404, "Scan not found")
    payload = json.loads(s.pipeline_json or "{}")
    return {
        "schema": "pactlens.scan.v1",
        "scan_id": s.scan_id,
        "contract_name": s.contract_name,
        "contract_type": s.contract_type,
        "status": s.status,
        "created_at": s.created_at.isoformat() + "Z",
        "risk_counts": {
            "High": s.risk_high,
            "Medium": s.risk_medium,
            "Low": s.risk_low,
        },
        "evidence": {
            "scan_id": s.scan_id,
            "timestamp": s.created_at.isoformat() + "Z",
            "old_document_sha256": s.old_hash,
            "new_document_sha256": s.new_hash,
            "combined_sha256": s.combined_hash,
            "algorithm": "SHA-256",
        },
        "findings": payload.get("findings") or [],
        "hero_finding": next(
            (f for f in (payload.get("findings") or []) if f.get("severity") == "High"),
            (payload.get("findings") or [None])[0],
        ),
        "stages_progress": json.loads(s.stages_json or "[]"),
        "reminders": [
            {"label": r.label, "due_date": r.due_date, "rule_id": r.finding_rule_id, "done": bool(r.done)}
            for r in s.reminders
        ],
        "matches_summary": (payload.get("stages") or {}).get("match"),
        "category_summary": (payload.get("stages") or {}).get("categorize"),
        "template": payload.get("template"),
        "matches": payload.get("matches") or [],
        "old_clauses": payload.get("old_clauses") or [],
        "new_clauses": payload.get("new_clauses") or [],
        "ocr": payload.get("ocr"),
        "handoff": payload.get("handoff"),
    }


@app.patch("/api/scans/{scan_id}/status")
def update_status(scan_id: str, payload: dict, db: Session = Depends(get_db)):
    s = db.query(Scan).filter(Scan.scan_id == scan_id).first()
    if not s:
        raise HTTPException(404, "Scan not found")
    status = payload.get("status")
    if status not in ("Watching", "Resolved"):
        raise HTTPException(400, "status must be Watching or Resolved")
    s.status = status
    db.commit()
    return {"scan_id": scan_id, "status": status}


@app.get("/api/scans/{scan_id}/handoff.json")
def download_handoff(scan_id: str, db: Session = Depends(get_db)):
    s = db.query(Scan).filter(Scan.scan_id == scan_id).first()
    if not s:
        raise HTTPException(404, "Scan not found")
    path = UPLOAD_DIR / f"{scan_id}_handoff.json"
    if path.exists():
        return Response(
            content=path.read_text(encoding="utf-8"),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{scan_id}_legal_aid_handoff.json"'},
        )
    payload = json.loads(s.pipeline_json or "{}")
    handoff = build_legal_aid_handoff(
        {
            "contract_name": s.contract_name,
            "contract_type": s.contract_type,
            "risk_counts": {"High": s.risk_high, "Medium": s.risk_medium, "Low": s.risk_low},
        },
        payload.get("findings") or [],
        {
            "scan_id": s.scan_id,
            "timestamp": s.created_at.isoformat() + "Z",
            "old_document_sha256": s.old_hash,
            "new_document_sha256": s.new_hash,
            "combined_sha256": s.combined_hash,
            "algorithm": "SHA-256",
        },
    )
    body = json.dumps(handoff, indent=2, ensure_ascii=False)
    return Response(
        content=body,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{scan_id}_legal_aid_handoff.json"'},
    )


@app.get("/api/reminders")
def list_reminders(db: Session = Depends(get_db)):
    rows = db.query(Reminder).order_by(Reminder.due_date.asc()).all()
    return {
        "reminders": [
            {
                "id": r.id,
                "scan_id": r.scan.scan_id if r.scan else None,
                "contract_name": r.scan.contract_name if r.scan else None,
                "label": r.label,
                "due_date": r.due_date,
                "rule_id": r.finding_rule_id,
                "done": bool(r.done),
            }
            for r in rows
        ]
    }


@app.patch("/api/reminders/{reminder_id}")
def toggle_reminder(reminder_id: int, payload: dict, db: Session = Depends(get_db)):
    r = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not r:
        raise HTTPException(404, "Reminder not found")
    if "done" in payload:
        r.done = 1 if payload["done"] else 0
    db.commit()
    return {"id": r.id, "done": bool(r.done)}


@app.get("/api/overview")
def overview(db: Session = Depends(get_db)):
    """Home + dashboard widgets: scans, risks, reminders, trends."""
    scans = db.query(Scan).order_by(Scan.created_at.desc()).all()
    reminders = db.query(Reminder).filter(Reminder.done == 0).order_by(Reminder.due_date.asc()).limit(10).all()
    total_high = sum(s.risk_high for s in scans)
    total_medium = sum(s.risk_medium for s in scans)
    total_low = sum(s.risk_low for s in scans)
    watching = sum(1 for s in scans if s.status == "Watching")
    return {
        "schema": "pactlens.overview.v1",
        "scan_count": len(scans),
        "watching_count": watching,
        "risk_totals": {"High": total_high, "Medium": total_medium, "Low": total_low},
        "recent_scans": [
            {
                "scan_id": s.scan_id,
                "contract_name": s.contract_name,
                "contract_type": s.contract_type,
                "status": s.status,
                "created_at": s.created_at.isoformat() + "Z",
                "risk_counts": {"High": s.risk_high, "Medium": s.risk_medium, "Low": s.risk_low},
            }
            for s in scans[:5]
        ],
        "upcoming_reminders": [
            {
                "id": r.id,
                "scan_id": r.scan.scan_id if r.scan else None,
                "contract_name": r.scan.contract_name if r.scan else None,
                "label": r.label,
                "due_date": r.due_date,
                "done": bool(r.done),
            }
            for r in reminders
        ],
        "trust_patterns": compute_trust_patterns(db),
    }


@app.get("/api/trust-patterns")
def trust_patterns(contract_type: str | None = None, db: Session = Depends(get_db)):
    return compute_trust_patterns(db, contract_type=contract_type)


@app.post("/api/business/analyze")
async def business_analyze(
    file: UploadFile = File(...),
    contract_type: str = Form("rental"),
):
    data = await file.read()
    from app.ocr import extract_text_from_bytes
    ocr = extract_text_from_bytes(data, file.filename or "template.txt")
    if not ocr["text"]:
        raise HTTPException(400, "Could not extract text from template")
    return analyze_template(ocr["text"], contract_type=contract_type)
