import React, { useState } from 'react';
import { Search, Globe, Link2, PlusCircle, RefreshCw, Zap, Trash2, Filter } from 'lucide-react';

export default function JobSearchPanel({
  onScrapeJobs,
  onOpenUrlModal,
  onOpenManualModal,
  onRunMatching,
  onClearJobs,
  isScraping,
  isMatching,
  jobsCount,
  hasActiveResume
}) {
  const [keywords, setKeywords] = useState('python developer');
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [sources, setSources] = useState(['remoteok', 'jobicy', 'arbeitnow']);

  const toggleSource = (sourceKey) => {
    if (sources.includes(sourceKey)) {
      if (sources.length > 1) {
        setSources(sources.filter((s) => s !== sourceKey));
      }
    } else {
      setSources([...sources, sourceKey]);
    }
  };

  const handleScrapeSubmit = (e) => {
    e.preventDefault();
    onScrapeJobs({
      keywords,
      remote_only: remoteOnly,
      sources,
      limit: 30
    });
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur mt-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand-400" />
            Live Job Scraper & Aggregator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Query active tech job feeds (RemoteOK, Jobicy, Arbeitnow) or extract from any external URL.
          </p>
        </div>

        {/* Quick External Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenUrlModal}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/80 hover:bg-slate-600 border border-slate-600 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Link2 className="h-3.5 w-3.5 text-brand-400" />
            <span>Scrape from URL</span>
          </button>
          <button
            type="button"
            onClick={onOpenManualModal}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/80 hover:bg-slate-600 border border-slate-600 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Add Manual Job</span>
          </button>
          {jobsCount > 0 && (
            <button
              type="button"
              onClick={onClearJobs}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Clear all stored jobs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scraper Search Form */}
      <form onSubmit={handleScrapeSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Job title, keywords, or tech stack (e.g. Python, React, DevOps, Data Engineer)"
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={isScraping}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-600/25 whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScraping ? 'animate-spin' : ''}`} />
            <span>{isScraping ? 'Scraping Feeds...' : 'Scrape Live Jobs'}</span>
          </button>
        </div>

        {/* Source Badges & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 font-medium">Job Sources:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={sources.includes('remoteok')}
                onChange={() => toggleSource('remoteok')}
                className="rounded border-slate-700 text-brand-500 focus:ring-0 bg-slate-900"
              />
              <span>RemoteOK</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={sources.includes('jobicy')}
                onChange={() => toggleSource('jobicy')}
                className="rounded border-slate-700 text-brand-500 focus:ring-0 bg-slate-900"
              />
              <span>Jobicy</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={sources.includes('arbeitnow')}
                onChange={() => toggleSource('arbeitnow')}
                className="rounded border-slate-700 text-brand-500 focus:ring-0 bg-slate-900"
              />
              <span>Arbeitnow</span>
            </label>

            <div className="h-4 w-[1px] bg-slate-700 hidden sm:block mx-1"></div>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="rounded border-slate-700 text-brand-500 focus:ring-0 bg-slate-900"
              />
              <span>Remote Only</span>
            </label>
          </div>

          {/* AI Match Button */}
          <div>
            <button
              type="button"
              onClick={onRunMatching}
              disabled={isMatching || jobsCount === 0 || !hasActiveResume}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              title={!hasActiveResume ? 'Upload a resume first to run match analysis' : 'Match all jobs with your resume'}
            >
              <Zap className={`h-3.5 w-3.5 ${isMatching ? 'animate-bounce text-amber-300' : 'text-amber-300'}`} />
              <span>{isMatching ? 'Scoring Resumes vs Jobs...' : `Match All Jobs (${jobsCount})`}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
