# RealityCheck AI

**AI-powered Fake News & Misinformation Detection System**

Paste a news article / claim or upload a screenshot — RealityCheck AI classifies it as **Real**, **Fake**, or **Misleading** with an evidence-backed explanation powered by RAG (Retrieval-Augmented Generation).

---

## Features

- **Text & Image input** — paste text or drag-and-drop a WhatsApp / social screenshot  
- **OCR extraction** — automatic text extraction from images via Tesseract  
- **AI classification** — Mistral-7B-Instruct via Cloudflare Workers AI  
- **RAG pipeline** — embeddings (all-MiniLM-L6-v2 via Hugging Face) + FAISS similarity search  
- **Structured output** — label, confidence, summary, detailed explanation, key inconsistencies, evidence alignment  
- **Modern UI** — React + Tailwind CSS, dark/light mode, animated confidence ring, PDF download  
- **100% remote AI** — no local model hosting required  

---

## Architecture

```
User Input
  → OCR (if image)
  → LLM Classification (Cloudflare Workers AI)
  → Embedding (Hugging Face Inference API)
  → FAISS similarity search (local vector DB)
  → LLM Explanation with evidence
  → Structured JSON response
  → React UI
```

---

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Python · FastAPI · FAISS · httpx · Tesseract OCR |
| Frontend  | React · Vite · Tailwind CSS v4 · jsPDF |
| LLM       | Mistral-7B-Instruct-v0.2 (Cloudflare Workers AI) |
| Embeddings| all-MiniLM-L6-v2 (Hugging Face Inference API) |

---

## Project Structure

```
backend/
├── main.py                  # FastAPI app & /analyze endpoint
├── services/
│   ├── classifier.py        # LLM classification service
│   ├── explanation.py        # LLM explanation service
│   ├── ocr.py                # Tesseract OCR service
│   └── rag.py                # Embedding + FAISS retrieval
├── utils/
│   ├── config.py             # Env vars, constants, seed articles
│   └── prompts.py            # LLM prompt templates
├── requirements.txt
└── .env.example

frontend/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── InputArea.jsx
│   │   ├── Loader.jsx
│   │   ├── ConfidenceRing.jsx
│   │   ├── EvidenceCard.jsx
│   │   └── ResultPanel.jsx
│   ├── services/
│   │   └── api.js
│   └── utils/
│       └── pdf.js
└── .env.example
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Tesseract OCR** — [install guide](https://github.com/tesseract-ocr/tesseract#installing-tesseract)
  - Windows: download installer from [UB-Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
  - macOS: `brew install tesseract`
  - Ubuntu: `sudo apt install tesseract-ocr`
- **Free API accounts:**
  - [Cloudflare](https://dash.cloudflare.com/) — enable Workers AI
  - [Hugging Face](https://huggingface.co/settings/tokens) — create API token (free tier)

---

## Quick Start

### 1. Clone & set up environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your actual keys:
#   CLOUDFLARE_ACCOUNT_ID=...
#   CLOUDFLARE_API_TOKEN=...
#   HUGGINGFACE_API_TOKEN=...

# Frontend (optional — defaults to localhost:8000)
cp frontend/.env.example frontend/.env
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

The API will be available at **http://localhost:8000**.  
Docs: **http://localhost:8000/docs**

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## API Reference

### `POST /analyze`

**Content-Type:** `multipart/form-data`

| Field  | Type   | Description |
|--------|--------|-------------|
| `text` | string | News text or claim (optional if `file` is provided) |
| `file` | file   | Image file for OCR (optional if `text` is provided) |

**Response:**

```json
{
  "label": "Fake",
  "confidence": 0.92,
  "reasoning_summary": "...",
  "detailed_explanation": "...",
  "key_inconsistencies": ["point 1", "point 2"],
  "evidence_alignment": "...",
  "retrieved_articles": [
    {
      "title": "...",
      "source": "...",
      "url": "...",
      "similarity_score": 0.87
    }
  ]
}
```

### `GET /health`

Returns `{ "status": "ok" }`.

---

## Deployment

### Backend → Render

1. Push `backend/` to a Git repository.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set root directory to `backend`.
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables from `.env.example`.
7. Under **Advanced** → install Tesseract:
   - Add build script: `apt-get update && apt-get install -y tesseract-ocr`

### Frontend → Vercel

1. Push `frontend/` to a Git repository.
2. Import into [Vercel](https://vercel.com).
3. Framework: **Vite**.
4. Set environment variable `VITE_API_URL` to your Render backend URL.
5. Deploy.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Workers AI API token |
| `HUGGINGFACE_API_TOKEN` | Hugging Face Inference API token |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (default: `http://localhost:8000`) |

---

## License

MIT
