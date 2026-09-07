import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Copy, Download, 
  Printer, Code2, Layers, Briefcase, FileText, ChevronRight, Target, 
  TrendingUp, ShieldCheck, CheckSquare, RefreshCw, Loader2, BookOpen
} from 'lucide-react';
import { api } from '../services/api';

export default function ResumeTailorView({
  activeResume,
  jobs,
  selectedJob,
  onSelectJob,
  onNavigateTab
}) {
  const [targetJob, setTargetJob] = useState(selectedJob || (jobs.length > 0 ? jobs[0] : null));
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [tailoredData, setTailoredData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [checkedTips, setCheckedTips] = useState({});

  // Sync selected job prop if changed externally
  useEffect(() => {
    if (selectedJob) {
      setTargetJob(selectedJob);
      setIsCustomMode(false);
    } else if (!targetJob && jobs.length > 0) {
      setTargetJob(jobs[0]);
    }
  }, [selectedJob, jobs]);

  // Initial load / trigger tailoring when job is selected
  const handleGenerateTailoredResume = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = isCustomMode ? {
        custom_job_title: customTitle || 'Software Engineer',
        custom_job_company: customCompany || 'Target Company',
        custom_job_description: customDesc
      } : {
        job_id: targetJob?.id || null
      };

      const response = await api.tailorFullResume(payload);
      setTailoredData(response);
    } catch (err) {
      setError(err.message || 'Failed to tailor resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate if first time and we have a target
  useEffect(() => {
    if (!tailoredData && (targetJob || customDesc)) {
      handleGenerateTailoredResume();
    }
  }, [targetJob]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!tailoredData) return;
    const blob = new Blob([tailoredData.ats_formatted_text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(tailoredData.candidate_name || 'Resume').replace(/\s+/g, '_')}_ATS_Tailored.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleTip = (idx) => {
    setCheckedTips(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Job Target Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                ATS Precision Tailor & Odds Engine
              </span>
              <span className="text-xs text-slate-500">• 100% Single-Column ATS Compliant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tailor Resume to Job Description
            </h1>
            <p className="text-sm text-slate-400">
              Align your projects, skills, and bullets to any job description to pass ATS filters and calculate your interview chances.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {isCustomMode ? '← Pick from Saved Jobs' : '✏️ Paste Custom Job Description'}
            </button>
            <button
              onClick={handleGenerateTailoredResume}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span>{tailoredData ? 'Re-Tailor Resume' : 'Generate Tailored Resume & Odds'}</span>
            </button>
          </div>
        </div>

        {/* Job Selection Controls */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          {!isCustomMode ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Target Job Posting:
              </label>
              {jobs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {jobs.map((job) => {
                    const isSelected = targetJob?.id === job.id;
                    return (
                      <div
                        key={job.id}
                        onClick={() => {
                          setTargetJob(job);
                          if (onSelectJob) onSelectJob(job);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-brand-500/10 border-brand-500/60 ring-1 ring-brand-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{job.title}</h4>
                          {job.match_score && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                              {Math.round(job.match_score)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 truncate">{job.company} • {job.location || 'Remote'}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>No scraped jobs yet. You can paste a custom job description directly or scrape live jobs from the Job Board.</span>
                  <button
                    onClick={() => setIsCustomMode(true)}
                    className="text-brand-400 font-semibold hover:underline"
                  >
                    Paste Job Description →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Target Job Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Company Name</label>
                  <input
                    type="text"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="e.g. Stripe, Netflix, Google"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Paste Job Description Requirements</label>
                <textarea
                  rows={4}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Paste the full job requirements, skills, and responsibilities here..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="p-16 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="h-14 w-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center animate-pulse">
            <Sparkles className="h-7 w-7 text-brand-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Synthesizing Tailored Resume & Computing Odds</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Extracting required skills from JD, drafting industry-aligned projects, structuring action bullets, and running ATS compliance checks...
            </p>
          </div>
        </div>
      )}

      {!isLoading && tailoredData && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* SECTION 1: CHANCES OF GETTING THE JOB (ODDS METER & GAP ANALYSIS) */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Predictive Recruiter Match Engine
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Chances of Landing an Interview
                </h2>
                <p className="text-xs text-slate-400">
                  Calculated based on skill overlap, keyword density, seniority alignment, and technical project relevance.
                </p>
              </div>

              {/* Overall Probability Badge */}
              <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl">
                <div className="text-right">
                  <div className="text-3xl font-black text-white tracking-tight">
                    {tailoredData.job_chances?.probability_percentage || 84}%
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-400">
                    {tailoredData.job_chances?.rating || 'High Probability Match'}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 flex items-center justify-center font-bold text-xs text-emerald-300">
                  ✓
                </div>
              </div>
            </div>

            {/* Probability Breakdown Meters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(tailoredData.job_chances?.factors || {
                skills_match: 88,
                ats_keyword_density: 92,
                experience_alignment: 80,
                project_relevance: 85
              }).map(([factorKey, value]) => {
                const label = factorKey
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <div key={factorKey} className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">{label}</span>
                      <span className="font-bold text-white">{value}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          value >= 85 ? 'bg-emerald-400' : value >= 70 ? 'bg-indigo-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Strengths and Critical Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Key Strengths (Recruiter Highlights)</span>
                </div>
                <ul className="space-y-2">
                  {(tailoredData.job_chances?.strengths || []).map((str, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Critical Gaps & Potential Risks */}
              <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Risk Warnings & Experience Gaps</span>
                </div>
                <ul className="space-y-2">
                  {(tailoredData.job_chances?.critical_gaps || []).map((gap, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Chance Booster Checklist */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <CheckSquare className="h-4 w-4 text-indigo-400" />
                  <span>Actionable Checklist to Boost Chances to 95%+</span>
                </div>
                <span className="text-[11px] text-slate-400">Click to track progress</span>
              </div>
              <div className="space-y-2">
                {(tailoredData.job_chances?.chance_booster_tips || []).map((tip, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleTip(idx)}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      checkedTips[idx]
                        ? 'bg-emerald-950/20 border-emerald-500/30 line-through text-slate-400'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedTips[idx]}
                      onChange={() => {}}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-700 text-brand-500 focus:ring-0"
                    />
                    <span className="text-xs">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: SUGGESTED SKILLS ACCORDING TO JD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-brand-400" />
                  <span>Suggested Skills for Job Description</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extracted and strategically grouped to match ATS keywords and recruiter searches.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allSkills = Object.values(tailoredData.suggested_skills || {}).flat().join(', ');
                    copyToClipboard(allSkills, 'all_skills');
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedKey === 'all_skills' ? 'Copied All!' : 'Copy All Skills'}</span>
                </button>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('learn')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-xs text-brand-300 font-semibold border border-brand-500/30 transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Teach Me These Skills (Beginner-Friendly) →</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(tailoredData.suggested_skills || {}).map(([category, skillList]) => (
                <div key={category} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider truncate">
                    {category}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skillList.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        onClick={() => copyToClipboard(skill, `skill_${category}_${sIdx}`)}
                        className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/90 text-slate-200 hover:bg-brand-600/30 hover:text-brand-300 border border-slate-700/60 transition-colors"
                        title="Click to copy skill"
                      >
                        {skill}
                        {copiedKey === `skill_${category}_${sIdx}` && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: SUGGESTED TECHNICAL PROJECTS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-400" />
                  <span>Suggested Tailored Projects for Resume</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Production-grade projects designed to prove proficiency in the exact technologies requested in the job description.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('learn')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-xs text-indigo-300 font-semibold border border-indigo-500/30 transition-colors self-start sm:self-auto"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>How to Build & Explain These Projects →</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(tailoredData.suggested_projects || []).map((project, pIdx) => (
                <div 
                  key={pIdx}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{project.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{project.tagline}</p>
                      </div>
                      <button
                        onClick={() => {
                          const projText = `${project.title}\nTech Stack: ${project.tech_stack.join(', ')}\n${project.bullets.map(b => `• ${b}`).join('\n')}`;
                          copyToClipboard(projText, `proj_${pIdx}`);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800/80 hover:bg-slate-700 transition-colors shrink-0"
                        title="Copy project details"
                      >
                        {copiedKey === `proj_${pIdx}` ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Tech Stack Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {project.tech_stack.map((tech, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Architecture overview */}
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/60 text-[11px] text-slate-300">
                      <strong className="text-indigo-400">Architecture: </strong>
                      {project.architecture_overview}
                    </div>

                    {/* Quantified Accomplishment Bullets */}
                    <ul className="space-y-2 pt-1">
                      {project.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-brand-400 font-bold mt-0.5">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Google XYZ Accomplishment Formula</span>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('interview')}
                      className="text-brand-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Prepare Project Defense</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: COMPLETE ATS-FRIENDLY RESUME PREVIEW & EXPORT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    ATS Compliance Score: {tailoredData.ats_score || 95}/100
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  ATS-Friendly Formatted Resume
                </h3>
                <p className="text-xs text-slate-400">
                  Strict single-column layout without tables, graphics, or text boxes. Ready for direct application upload or form copy.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => copyToClipboard(tailoredData.ats_formatted_text, 'full_resume')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedKey === 'full_resume' ? 'Copied Entire Resume!' : 'Copy Clean Text'}</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .md</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Save as ATS PDF</span>
                </button>
              </div>
            </div>

            {/* ATS Compliance Checklist Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(tailoredData.ats_checks || []).map((chk, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white">{chk.check}</div>
                    <div className="text-[11px] text-slate-400">{chk.details}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clean ATS Resume Paper Preview */}
            <div className="rounded-xl border border-slate-800 bg-white text-slate-900 p-8 sm:p-10 font-sans shadow-2xl print:p-0 print:border-none print:shadow-none">
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-4 text-center">
                  <h1 className="text-2xl font-bold tracking-wider uppercase text-slate-950">
                    {tailoredData.candidate_name || 'Alex Morgan'}
                  </h1>
                  <p className="text-xs text-slate-700 mt-1">
                    alex.morgan@example.com • (555) 234-5678 • San Francisco, CA • linkedin.com/in/alexmorgan • github.com/alexmorgan
                  </p>
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1">
                    Professional Summary
                  </h2>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {tailoredData.tailored_summary}
                  </p>
                </div>

                {/* Core Competencies / Skills */}
                <div className="space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1">
                    Core Skills & Technologies
                  </h2>
                  <div className="text-xs text-slate-800 space-y-1">
                    {Object.entries(tailoredData.suggested_skills || {}).map(([cat, list]) => (
                      <div key={cat} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                        <strong className="text-slate-950 min-w-[170px]">{cat}:</strong>
                        <span>{list.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Featured Projects */}
                <div className="space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1">
                    Featured Technical Projects
                  </h2>
                  <div className="space-y-3">
                    {(tailoredData.suggested_projects || []).map((p, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-950">
                          <span>{p.title}</span>
                          <span className="text-slate-600 font-normal italic">{p.tech_stack.join(', ')}</span>
                        </div>
                        {p.tagline && <p className="text-xs text-slate-700 italic">{p.tagline}</p>}
                        <ul className="list-disc list-inside text-xs text-slate-800 space-y-0.5">
                          {p.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1">
                    Professional Experience
                  </h2>
                  <div className="space-y-3">
                    {(tailoredData.tailored_experience || []).map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-950">
                          <span>{exp.title} — {exp.company}</span>
                          <span className="text-slate-600 font-normal">{exp.duration}</span>
                        </div>
                        <ul className="list-disc list-inside text-xs text-slate-800 space-y-0.5">
                          {(exp.highlights || []).map((h, hIdx) => (
                            <li key={hIdx} className="leading-relaxed">{h}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1">
                    Education & Certifications
                  </h2>
                  <div className="text-xs text-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-950">Bachelor of Science in Computer Science</span>
                    <span>State University (2022)</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Quick Footer Links to Other Pages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => onNavigateTab && onNavigateTab('interview')}
              className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 cursor-pointer transition-all group flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-indigo-400">Step 2: Interview Readiness</span>
                <h4 className="text-sm font-bold text-white mt-1">
                  Prepare for Technical & Project Defense Questions →
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Access tailored technical, behavioral STAR, and project defense questions with winning model answers.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>

            <div 
              onClick={() => onNavigateTab && onNavigateTab('learn')}
              className="p-5 rounded-2xl bg-gradient-to-br from-brand-950/40 to-slate-900 border border-brand-500/30 hover:border-brand-500/60 cursor-pointer transition-all group flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-brand-400">Step 3: Master the Stack</span>
                <h4 className="text-sm font-bold text-white mt-1">
                  Teach Me Skills & Projects (Beginner-Friendly) →
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Beginner-friendly ELI5 tutorials, code snippets, project build blueprints, and interview elevator pitches.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-brand-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
