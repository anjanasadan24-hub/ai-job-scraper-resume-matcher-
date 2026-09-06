import React from 'react';
import { Briefcase, FileText, Sparkles, Settings as SettingsIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Navbar({ activeResume, jobsCount, settings, onOpenSettings }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 backdrop-blur bg-slate-900/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">AI Job Scraper</span>
              <span className="text-slate-500 font-medium">&</span>
              <span className="font-bold text-lg text-brand-400 tracking-tight">Resume Matcher</span>
            </div>
            <p className="text-xs text-slate-400">Live Scraper • ATS Gap Analysis • GenAI Tailoring</p>
          </div>
        </div>

        {/* Status Indicators & Settings Button */}
        <div className="flex items-center space-x-4">
          {/* Active Resume Status */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400">Resume:</span>
            {activeResume ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1 truncate max-w-[140px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {activeResume.contact?.name || activeResume.filename || 'Uploaded'}
              </span>
            ) : (
              <span className="text-amber-400">Not Uploaded</span>
            )}
          </div>

          {/* AI Engine Status */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <span className="text-slate-400">AI Engine:</span>
            {settings?.has_api_key ? (
              <span className="text-brand-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Gemini Active
              </span>
            ) : (
              <span className="text-slate-400 font-medium flex items-center gap-1">
                Offline Mode (Local)
              </span>
            )}
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Configure Gemini API and App Settings"
          >
            <SettingsIcon className="h-4 w-4 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
