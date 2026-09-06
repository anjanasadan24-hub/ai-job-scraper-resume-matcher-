# AI Job Scraper & Resume Matcher

An intelligent, full-stack platform designed to automate the job search and application preparation workflow. It features real-time job scraping across developer job boards, ATS resume parsing, skills gap analysis, and Generative AI for customized resume bullet points, cover letters, and interview preparation.

---

## Key Features

- **Multi-Source Job Scraper & Ingestion**:
  - Live scrapers for **RemoteOK**, **Jobicy**, and **Arbeitnow**.
  - **URL Extractor**: Paste any job link from Greenhouse, Lever, LinkedIn, or company career portals to extract details automatically with Trafilatura.
  - **Manual Job Creator**: Add custom job postings for ad-hoc 1-on-1 resume alignment.
- **ATS Resume Parser & Skills Taxonomy**:
  - Supports **PDF**, **DOCX**, **TXT**, or direct plain text pasting.
  - Automatically identifies candidate contact details (Email, Phone, LinkedIn, GitHub).
  - Categorizes skills across Languages, Frameworks, Cloud & DevOps, Databases, and Methodologies.
  - Computes an **ATS Health Score** with actionable formatting and keyword feedback.
- **Hybrid Matching Engine**:
  - **100% Offline Capability**: Uses TF-IDF cosine similarity, skill set overlap heuristics, and seniority detection. Works with zero external API keys.
  - **Google Gemini GenAI Mode**: When a Gemini API key is configured (via the UI or `.env`), it unlocks deep contextual analysis, automated bullet point rewrites, customized cover letters, and interview prep.
- **AI Career Copilot**:
  - **Tailor Resume Bullets**: Generates high-impact, quantifiable bullet points aligned to the specific job description.
  - **Cover Letter Generator**: Drafts personalized 3-4 paragraph letters in multiple tones (Professional, Enthusiastic, Concise, Technical) with 1-click copy & download.
  - **Interview Prep**: Generates 5 tailored technical and behavioral questions with interviewer objectives and winning answer strategies.
- **Modern Responsive Dashboard**:
  - Dark-mode interface built with React, Vite, and Tailwind CSS.
  - Filter jobs by minimum match score (e.g. 70%+, 80%+), search terms, and remote status.

---

## Quick Start

### 1. Requirements
- **Python 3.10+**
- **Node.js 18+** & **npm**

### 2. Launch Application
In the project directory:
```bash
# Launch unified app (serves UI + Backend on http://127.0.0.1:8000)
.venv\Scripts\python.exe run.py

# Or launch in development mode with hot reload
.venv\Scripts\python.exe run.py --dev
```

Open your browser to:
- **Web Dashboard**: `http://127.0.0.1:8000` (or `http://localhost:5173` in `--dev` mode)
- **Interactive Swagger API Docs**: `http://127.0.0.1:8000/docs`

---

## Running Automated Tests

To run the verification test suite:
```bash
.venv\Scripts\python.exe tests\test_engine.py
```

---

## Architecture Overview

```
ai-job-scraper-resume-matcher/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (resume, jobs, match, ai, settings)
│   │   ├── core/         # Config and SQLite database persistence
│   │   ├── models/       # Pydantic data schemas
│   │   ├── services/     # Scrapers, Parsers, Matching Engine & Gemini Service
│   │   └── main.py       # FastAPI application entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components (Uploader, Preview, Search, Modals)
│   │   ├── services/     # API fetch client
│   │   ├── App.jsx       # Main Dashboard view
│   │   └── index.css     # Tailwind CSS styles
│   ├── package.json
│   └── vite.config.js
├── tests/
│   └── test_engine.py    # Test suite
├── data/                 # SQLite database & uploaded resumes
└── run.py                # Single-command runner
```
