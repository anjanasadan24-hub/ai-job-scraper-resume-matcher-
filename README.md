# TailorATS: AI Resume Tailor, Match Odds & Career Copilot

An intelligent, full-stack career platform that tailors resumes to any target Job Description (JD) with strict ATS-compliant single-column formatting, generates matching projects and skills, calculates your interview probability / chances of getting hired with actionable gap analysis, provides a dedicated interview preparation center with interactive mock evaluation, offers a beginner-friendly learning academy to master the suggested skills and projects from scratch, and includes a global search button (`Ctrl+K`) for asking any career question.

---

## Key Capabilities

- **ATS Resume Tailor & Odds Estimator**:
  - Automatically analyzes any target Job Description and tailors your full resume.
  - **Suggested Skills**: Extracted and categorized (Core Skills, Languages & Frameworks, Cloud & DevOps, Databases & Architecture) directly aligned to the JD.
  - **Suggested Technical Projects**: Generates 2-3 production-grade, highly relevant projects tailored to the JD stack, complete with architectural summaries and quantified accomplishment bullets (Google XYZ formula).
  - **Interview Probability & Match Odds Calculator**: Computes your odds of landing an interview (e.g. 84% - High Probability) with granular breakdown across skills, keywords, experience, and projects.
  - **Recruiter Gap Analysis**: Outlines key strengths, risk warnings/red flags, and an actionable checklist to boost your chances to 95%+.
  - **ATS-Friendly Export**: Strict single-column layout, standard headers, no tables or text boxes. 1-Click Copy Clean Text, Download Markdown (.md), or Print / Save as Clean ATS PDF.
- **Dedicated Interview Preparation Center**:
  - Filter by category: Technical Stack, Project Defense, Behavioral (STAR), Tricky & Gap Questions, and Questions to Ask the Interviewer.
  - Question diagnostic cards showing Interviewer Intent, Pitfalls to Avoid, and Winning Model Answers.
  - **Interactive Mock Simulator**: Type your answer to any question and get instant AI Bar Raiser evaluation (score 1-10, strengths, missing points, and upgraded model answer).
- **Beginner-Friendly Skill & Project Academy**:
  - **Teach Me the Skills**: ELI5 (Explain Like I'm 5) intuitive analogies, real-world production use cases, 10-minute crash courses, live code snippets, and interview talking scripts.
  - **Teach Me the Projects**: Plain-English system architecture diagrams, 4-phase step-by-step build guides (with runnable code), 60-second elevator pitches to memorize, and project defense Q&A.
- **Global Search Button & AI Copilot (`Ctrl+K`)**:
  - Prominent search button in the Navbar or `Ctrl+K` keyboard shortcut.
  - Ask ANY question about your resume, project architecture, interview answers, or tech concepts with instant AI answers and suggested follow-ups.
- **Multi-Source Job Scraper & Board**:
  - Live scrapers for **RemoteOK**, **Jobicy**, and **Arbeitnow**.
  - **URL Extractor**: Paste any job link from Greenhouse, Lever, LinkedIn, or company career portals to extract details automatically with Trafilatura.
  - **Manual Job Creator**: Add custom job postings for ad-hoc 1-on-1 resume alignment.
- **Hybrid Matching Engine**:
  - **100% Offline Capability**: Runs with intelligent heuristic algorithms, comprehensive taxonomies, and built-in knowledge bases with zero external API keys required.
  - **Google Gemini GenAI Mode**: When a Gemini API key is configured (via Settings or `.env`), it unlocks deep contextual analysis, automated bullet point rewrites, customized cover letters, and interview prep.


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
