# PactLens

> Don't just know what changed. Know what it means for you.

Contract **diff** engine for Indian tenants, gig workers, freelancers, and SMBs.

## Architecture (non-negotiable)

```
Upload → OCR/PDF → Segment → Categorize → NLP match → Risk rules → Impact
                                                              ↓
                                                         Explain (LLM optional)
```

- `backend/app/detection/` — **zero LLM dependency**
- `backend/app/nlp/` — TF-IDF + cosine semantic similarity
- `backend/app/explain/` — plain English + Hindi only

## Quick start

```bash
# API
cd backend
PYTHONPATH=. uvicorn app.main:app --reload --port 8000

# UI (proxies /api → :8000)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — use **Load sample rental pair** on Scan.

## Detection self-test (no LLM)

```bash
cd backend && PYTHONPATH=. python3 scripts/test_detection.py
```

## Key APIs

| Endpoint | Role |
|----------|------|
| `POST /api/upload` | File upload + SHA-256 |
| `POST /api/ocr` | PDF extract / OCR |
| `POST /api/segment` | Clause segmentation + categories |
| `POST /api/nlp/similarity` | Semantic similarity |
| `POST /api/match` | Clause matching |
| `POST /api/classify` | Risk rules |
| `POST /api/scan` | Full pipeline → structured JSON |
| `POST /api/detection/run` | Detection-only (judge demo) |
| `GET /api/scans` | History (SQLite) |
| `GET /api/templates` | Contract type templates |

Outputs are **informational**, not legal advice or certification.
