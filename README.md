# PactLens

> Don't just know what changed. Know what it means for you.

**Live:** [https://pactlens-flame.vercel.app/](https://pactlens-flame.vercel.app/)

Contract **diff** and fairness engine for Indian tenants, gig workers, freelancers, and SMBs.

Upload two versions of an agreement (or a single template), and PactLens highlights what changed, how risky it is for you, and what you can push back on — in plain English and Hindi.

---

## What it does

- **Compare contracts** — old vs new PDF / text → clause-level diff
- **Risk scoring** — High / Medium / Low findings with impact estimates
- **Explanations** — optional LLM (EN + HI); works offline with stubs
- **Evidence** — SHA-256 hashes for audit / legal-aid handoff
- **Fairness certify** — single-document template check for businesses
- **History & reminders** — saved scans, deadlines, trust patterns

Outputs are **informational only** — not legal advice or certification.

---

## Architecture

```
Upload → OCR/PDF → Segment → Categorize → NLP match → Risk rules → Impact
                                                              ↓
                                                         Explain (LLM optional)
```

| Layer | Path | Notes |
|-------|------|--------|
| Detection | `backend/app/detection/` | **Zero LLM dependency** |
| NLP | `backend/app/nlp/` | TF-IDF + cosine similarity |
| Explain | `backend/app/explain/` | Plain English + Hindi |
| Persistence | `backend/app/database.py` | SQLite (SQLAlchemy) |
| UI | `frontend/` | React + Vite + Tailwind |

---

## Tech stack

- **Backend:** FastAPI, SQLAlchemy, scikit-learn, pypdf / OCR
- **Frontend:** React 19, React Router, Vite, Tailwind CSS
- **Optional:** OpenAI-compatible API for explanations

---

## Project structure

```
pactlens/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry
│   │   ├── detection/       # Segment → match → risk rules
│   │   ├── nlp/             # Semantic similarity
│   │   ├── explain/         # LLM / stub explanations
│   │   ├── ocr/             # PDF + image text extract
│   │   └── database.py      # SQLite models
│   ├── scripts/             # Detection self-tests
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/           # Home, Scan, Results, Report, Dashboard…
│       └── api.ts           # API client
├── .env.example
└── vercel.json              # Frontend + backend deploy config
```

---

## Quick start

### 1. Environment

```bash
cp .env.example .env
```

Optional keys in `.env`:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` / `LLM_API_KEY` | Explanations (stubs if empty) |
| `LLM_BASE_URL` | Default `https://api.openai.com/v1` |
| `LLM_MODEL` | Default `gpt-4o-mini` |
| `PACTLENS_DB` | Custom SQLite path (optional) |

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs  
Health: http://127.0.0.1:8000/api/health

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` → `:8000`.

On **Compare**, use **Load sample rental pair** for a quick demo.

---

## App routes

| Route | Page |
|-------|------|
| `/login` | Sign in |
| `/` | Home / overview |
| `/compare` | Upload & diff two contracts |
| `/single` | Fairness certify (one document) |
| `/results/:scanId` | Scan results |
| `/report/:scanId` | Full report |
| `/history` | Saved scans dashboard |

---

## Key APIs

| Endpoint | Role |
|----------|------|
| `GET /api/health` | Health + module list |
| `POST /api/upload` | File upload + SHA-256 |
| `POST /api/scan` | Full pipeline → structured JSON |
| `POST /api/detection/run` | Detection-only (no LLM) |
| `GET /api/scans` | Scan history |
| `GET /api/scans/{id}` | One scan |
| `PATCH /api/scans/{id}/status` | Watching / Resolved |
| `GET /api/overview` | Dashboard widgets |
| `GET /api/reminders` | Clause deadlines |
| `GET /api/templates` | Contract type templates |
| `GET /api/trust-patterns` | Cross-scan pattern stats |
| `POST /api/business/certify` | Fairness badge flow |
| `GET /api/scans/{id}/handoff.json` | Legal-aid handoff export |

---

## Detection self-test (no LLM)

```bash
cd backend && PYTHONPATH=. python3 scripts/test_detection.py
```

---

## Deploy

Production: [https://pactlens-flame.vercel.app/](https://pactlens-flame.vercel.app/)

`vercel.json` maps:

- Frontend → `frontend/` (Vite)
- Backend → `backend/` (`app.main:app`)
- `/api/*` → backend service

Set env vars (`OPENAI_API_KEY`, etc.) in your host dashboard.

---

## Disclaimer

PactLens is an **informational** contract analysis tool. It does not provide legal advice, does not certify fairness for court or regulator purposes, and should not replace a qualified lawyer or legal aid clinic.

