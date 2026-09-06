import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Award, Target, BookOpen, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function MatchModal({ job, onClose, onOpenBullets, onOpenCoverLetter, onOpenInterviewPrep }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!job) return;
    async function loadMatch() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getJobMatch(job.id);
        setMatchData(res.breakdown);
      } catch (err) {
        setError(err.message || 'Failed to load match breakdown');
      } finally {
        setLoading(false);
      }
    }
    loadMatch();
  }, [job]);

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-bold text-[10px] uppercase">
                {job.source}
              </span>
              <span className="text-xs text-slate-400">{job.location || 'Remote'}</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">{job.title}</h3>
            <p className="text-xs text-slate-400 font-medium">{job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-brand-400 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Analyzing skills gap and ATS compatibility...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {matchData && (
            <>
              {/* Score Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                  <div className="text-2xl font-black text-brand-400">
                    {Math.round(matchData.overall_score)}%
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Overall Match</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                  <div className="text-2xl font-black text-emerald-400">
                    {Math.round(matchData.skills_score)}%
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Skills Overlap</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                  <div className="text-2xl font-black text-sky-400">
                    {Math.round(matchData.experience_score)}%
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase mt-1">Experience Level</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                  <div className="text-2xl font-black text-indigo-400">
                    {Math.round(matchData.ats_score)}%
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase mt-1">ATS Hygiene</div>
                </div>
              </div>

              {/* Skills Analysis */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Matched Skills ({matchData.matched_skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {matchData.matched_skills.length > 0 ? (
                      matchData.matched_skills.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No direct skill matches detected.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Missing / Required Skills ({matchData.missing_skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {matchData.missing_skills.length > 0 ? (
                      matchData.missing_skills.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-dashed border-amber-500/40 text-amber-300 text-xs font-medium"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium">
                        Zero skill gaps! You match all primary job requirements.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {matchData.recommendations.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                  <h4 className="text-xs font-semibold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-4 w-4" />
                    Strategic Match Suggestions
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {matchData.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-brand-400 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Description Snippet */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Job Description Excerpt
                </h4>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-line font-sans">
                  {job.description}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with AI Quick Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { onClose(); onOpenBullets(job); }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Tailor Resume Bullets</span>
            </button>
            <button
              onClick={() => { onClose(); onOpenCoverLetter(job); }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Generate Cover Letter</span>
            </button>
            <button
              onClick={() => { onClose(); onOpenInterviewPrep(job); }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Interview Prep</span>
            </button>
          </div>

          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-brand-600/25"
            >
              <span>Apply on {job.source}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
