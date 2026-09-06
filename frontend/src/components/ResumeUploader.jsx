import React, { useState, useRef } from 'react';
import { Upload, FileText, Clipboard, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_RESUMES = {
  python_dev: `Alex Morgan
alex.morgan.dev@gmail.com | (555) 382-9104 | San Francisco, CA
https://linkedin.com/in/alexmorgandev | https://github.com/alexm-dev

PROFESSIONAL SUMMARY
Results-driven Senior Full Stack & Python Engineer with 6+ years of experience designing high-throughput distributed microservices, REST APIs, and modern web applications. Expert in Python, FastAPI, React, PostgreSQL, Docker, AWS, and CI/CD pipelines. Passionate about system design, automated testing, and integrating generative AI into developer tooling.

CORE SKILLS
- Languages: Python, JavaScript, TypeScript, SQL, Bash, HTML, CSS
- Frameworks & Web: FastAPI, Flask, Django, React, Next.js, Node.js, Express, Tailwind CSS
- Cloud & DevOps: AWS, Docker, Kubernetes, GitHub Actions, Linux, Nginx, CI/CD
- Databases & Caching: PostgreSQL, Redis, MongoDB, SQLAlchemy
- Concepts & Tools: Microservices, System Design, REST APIs, Agile, Scrum, Git, TDD, Unit Testing

WORK EXPERIENCE
Senior Software Engineer | CloudScale Tech (2022 - Present)
- Architected and deployed scalable FastAPI microservices processing 45M+ daily requests, decreasing p99 response latency by 35%.
- Implemented asynchronous Redis caching and optimized PostgreSQL queries, saving $14,000 monthly in cloud infrastructure costs.
- Led the migration of legacy monolith to containerized Docker services orchestrated with Kubernetes on AWS EKS.
- Championed automated CI/CD deployment workflows using GitHub Actions, reducing release cycle time from 2 weeks to 2 days.

Full Stack Developer | Nexa Innovations (2019 - 2022)
- Engineered responsive React and Node.js web portals serving 80,000+ active enterprise users.
- Designed secure RESTful endpoints and integrated role-based authentication (OAuth2 & JWT).
- Collaborated with product designers in agile sprints, delivering 15+ major product releases on schedule.

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley (2019)
`,
  data_engineer: `Sarah Chen
sarah.chen.data@example.com | (555) 721-8930 | Austin, TX
https://linkedin.com/in/sarahchendata | https://github.com/schen-data

PROFESSIONAL SUMMARY
Senior Data & Machine Learning Engineer with 5+ years specializing in scalable ETL pipelines, cloud data warehouses, and predictive ML models. Expert in Python, SQL, BigQuery, Snowflake, Apache Kafka, PyTorch, and Docker.

CORE SKILLS
- Languages: Python, SQL, Go, Bash
- Data & Cloud: BigQuery, Snowflake, Apache Kafka, AWS, GCP, Docker, Kubernetes
- ML & Frameworks: PyTorch, Scikit-learn, Pandas, NumPy, FastAPI, Airflow
- Databases: PostgreSQL, Redis, Elasticsearch
- Practices: CI/CD, Git, Distributed Systems, Data Modeling, Agile

WORK EXPERIENCE
Senior Data Engineer | DataSphere Analytics (2022 - Present)
- Engineered real-time streaming data pipelines using Apache Kafka and Python, ingesting 2 TB of event streams daily.
- Optimized BigQuery data modeling and SQL transformations, cutting batch analytics runtime by 45%.
- Containerized data services using Docker and orchestrated workflows with Kubernetes on GCP.

Data Engineer | Horizon FinTech (2020 - 2022)
- Built automated ETL pipelines in Python and PostgreSQL for financial fraud detection.
- Developed scikit-learn classification models boosting anomalous transaction detection by 22%.

EDUCATION
B.S. in Software Engineering | University of Texas at Austin (2020)
`
};

export default function ResumeUploader({ onResumeUploaded, currentResume }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'paste'
  const [rawText, setRawText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const data = await api.uploadResumeFile(file);
      onResumeUploaded(data);
    } catch (err) {
      setError(err.message || 'Failed to parse resume file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setError('Please enter your resume text.');
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const data = await api.uploadResumeText(rawText);
      onResumeUploaded(data);
    } catch (err) {
      setError(err.message || 'Failed to parse resume text');
    } finally {
      setIsUploading(false);
    }
  };

  const loadSample = async (key) => {
    const text = SAMPLE_RESUMES[key];
    setRawText(text);
    setActiveTab('paste');
    setIsUploading(true);
    setError(null);
    try {
      const data = await api.uploadResumeText(text);
      onResumeUploaded(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-400" />
            Resume Profile
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload PDF/DOCX or paste text to parse skills, contact info, and ATS metrics.
          </p>
        </div>

        {/* Quick Sample Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Try Sample:</span>
          <button
            onClick={() => loadSample('python_dev')}
            disabled={isUploading}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 flex items-center gap-1 transition-colors"
          >
            <Sparkles className="h-3 w-3 text-amber-400" />
            Full-Stack Python
          </button>
          <button
            onClick={() => loadSample('data_engineer')}
            disabled={isUploading}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 flex items-center gap-1 transition-colors"
          >
            <Sparkles className="h-3 w-3 text-brand-400" />
            Data & ML
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/80 mb-5">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-2.5 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'upload'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          File Upload (PDF / Word)
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`pb-2.5 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'paste'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clipboard className="h-3.5 w-3.5" />
          Paste Resume Text
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload View */}
      {activeTab === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-slate-700 hover:border-slate-600 bg-slate-850 hover:bg-slate-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          {isUploading ? (
            <div className="flex flex-col items-center py-3">
              <Loader2 className="h-8 w-8 text-brand-400 animate-spin mb-2" />
              <p className="text-sm font-medium text-slate-200">Parsing Resume & Extracting Skills...</p>
              <p className="text-xs text-slate-400 mt-1">Analyzing sections, contact details, and ATS metrics</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
                <Upload className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                Click to browse or drag and drop your resume
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports PDF, DOCX, DOC, or TXT (Up to 10MB)
              </p>
              {currentResume?.filename && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  <Check className="h-3 w-3" />
                  <span>Current: {currentResume.filename}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Paste Text View */}
      {activeTab === 'paste' && (
        <form onSubmit={handleTextSubmit}>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={7}
            placeholder="Paste your resume content here (Work experience, skills, summary, education)..."
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono resize-y"
          ></textarea>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={isUploading || !rawText.trim()}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-md shadow-brand-600/20"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Parse & Analyze Resume</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
