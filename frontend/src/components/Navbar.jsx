import React from 'react';
import { 
  Briefcase, FileText, Sparkles, Settings as SettingsIcon, 
  CheckCircle2, Search, BookOpen, Target, Layers, HelpCircle 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  onTabChange, 
  onOpenSearch, 
  activeResume, 
  jobsCount, 
  settings, 
  onOpenSettings 
}) {
  const navItems = [
    { id: 'tailor', label: 'ATS Resume Tailor & Odds', icon: Target },
    { id: 'interview', label: 'Interview Prep', icon: HelpCircle },
    { id: 'learn', label: 'Beginner Academy', icon: BookOpen },
    { id: 'jobs', label: `Job Board (${jobsCount})`, icon: Briefcase },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 backdrop-blur bg-slate-900/95 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo & Title */}
        <div 
          onClick={() => onTabChange && onTabChange('tailor')}
          className="flex items-center space-x-3 cursor-pointer shrink-0"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-base text-white tracking-tight">TailorATS</span>
              <span className="text-slate-500 font-medium">•</span>
              <span className="font-bold text-sm text-brand-400 tracking-tight">Career Copilot</span>
            </div>
            <p className="text-[11px] text-slate-400">ATS Tailor • Odds • Interview Prep • Academy</p>
          </div>
        </div>

        {/* Center Page Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Search Button + Settings */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          
          {/* Prominent Search / Ask Question Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-brand-500/50 shadow-sm transition-all group"
            title="Ask any question about skills, projects, or interviews (Ctrl+K)"
          >
            <Search className="h-3.5 w-3.5 text-brand-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-slate-300 group-hover:text-white hidden sm:inline">Ask Question / Search</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400 font-mono">
              Ctrl K
            </kbd>
          </button>

          {/* Active Resume Status (Tablet+) */}
          <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            {activeResume ? (
              <span className="text-emerald-400 font-medium truncate max-w-[110px]">
                {activeResume.contact?.name || activeResume.filename || 'Uploaded'}
              </span>
            ) : (
              <span className="text-amber-400">No Resume</span>
            )}
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
            title="Configure Gemini API and App Settings"
          >
            <SettingsIcon className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden border-t border-slate-800 bg-slate-950 px-3 py-2 flex items-center justify-around gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

