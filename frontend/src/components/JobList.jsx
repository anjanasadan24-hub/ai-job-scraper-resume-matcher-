import React, { useState } from 'react';
import {
  ExternalLink,
  Sparkles,
  FileEdit,
  HelpCircle,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  DollarSign,
  Building,
  ChevronRight
} from 'lucide-react';

export default function JobList({
  jobs = [],
  onSelectMatch,
  onOpenBullets,
  onOpenCoverLetter,
  onOpenInterviewPrep,
  activeResume
}) {
  const [filterScore, setFilterScore] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');

  const filteredJobs = jobs.filter((job) => {
    const match = (job.match_score ?? 0) >= filterScore;
    const matchesSearch =
      !searchFilter.trim() ||
      job.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.company.toLowerCase().includes(searchFilter.toLowerCase()) ||
      job.description.toLowerCase().includes(searchFilter.toLowerCase());
    return match && matchesSearch;
  });

  const getMatchBadge = (score) => {
    if (score === null || score === undefined) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          Unscored
        </span>
      );
    }
    if (score >= 80) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{Math.round(score)}% Match</span>
        </div>
      );
    }
    if (score >= 65) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
          <span>{Math.round(score)}% Good</span>
        </div>
      );
    }
    if (score >= 45) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <span>{Math.round(score)}% Moderate</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <span>{Math.round(score)}% Low</span>
      </div>
    );
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-dashed border-slate-700/80 rounded-2xl p-12 text-center mt-6">
        <Building className="h-12 w-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Jobs Scraped Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Use the search bar above to scrape live tech feeds, extract from a URL, or add a job manually.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {/* List Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Job Opportunities ({filteredJobs.length} of {jobs.length})
          </h3>
          <p className="text-xs text-slate-400">Ranked by ATS & skills alignment with your resume</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter list..."
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 w-36 sm:w-44"
          />

          <select
            value={filterScore}
            onChange={(e) => setFilterScore(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value={0}>All Match Scores</option>
            <option value={70}>70%+ High Fit</option>
            <option value={80}>80%+ Top Match</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.map((job) => {
          const matched = job.matched_skills || [];
          const missing = job.missing_skills || [];

          return (
            <div
              key={job.id}
              className="bg-slate-800/70 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-5 shadow-lg transition-all duration-200 hover:shadow-brand-500/5 group"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Title & Metadata */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                      {job.title}
                    </h4>
                    {getMatchBadge(job.match_score)}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      {job.location || 'Remote'}
                    </span>
                    {job.salary && (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <DollarSign className="h-3.5 w-3.5" />
                        {job.salary}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700/60 text-[10px] uppercase font-bold text-slate-400">
                      {job.source}
                    </span>
                  </div>
                </div>

                {/* AI Copilot & Deep Match Actions */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-1 md:pt-0">
                  <button
                    onClick={() => onSelectMatch(job)}
                    className="px-3 py-1.5 bg-brand-600/90 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    title="View full match breakdown & gaps"
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    <span>Deep Match</span>
                  </button>

                  <button
                    onClick={() => onOpenBullets(job)}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-slate-600"
                    title="Generate tailored resume bullet points for this job"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span className="hidden sm:inline">AI Bullets</span>
                  </button>

                  <button
                    onClick={() => onOpenCoverLetter(job)}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-slate-600"
                    title="Draft a customized cover letter for this job"
                  >
                    <FileEdit className="h-3.5 w-3.5 text-sky-400" />
                    <span className="hidden sm:inline">Cover Letter</span>
                  </button>

                  <button
                    onClick={() => onOpenInterviewPrep(job)}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-slate-600"
                    title="Targeted interview questions & answers"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Interview Prep</span>
                  </button>

                  {job.apply_url && (
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Open job link on original site"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Skills Overlap Badges */}
              {(matched.length > 0 || missing.length > 0) && (
                <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-slate-400 font-medium">Skills:</span>
                  {matched.slice(0, 6).map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {s}
                    </span>
                  ))}

                  {missing.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-dashed border-amber-500/30 text-amber-300 font-medium"
                      title="Skill missing from your resume"
                    >
                      <AlertCircle className="h-3 w-3 text-amber-400" />
                      {s}
                    </span>
                  ))}

                  {matched.length + missing.length > 10 && (
                    <span className="text-slate-500 font-medium">
                      +{matched.length + missing.length - 10} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
