import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles, Send, ArrowRight, CornerDownLeft, BookOpen, FileText, CheckCircle2, Loader2, HelpCircle } from 'lucide-react';
import { api } from '../services/api';

const QUICK_PROMPTS = [
  "How do I explain Redis caching in my project?",
  "How do I walk an interviewer through my project architecture?",
  "What if they ask about a skill I just learned?",
  "How do I answer 'Tell me about yourself' for this role?",
  "What are 3 smart questions I should ask the hiring manager?",
  "What makes a resume strictly ATS-compliant?"
];

export default function AskQuestionModal({ isOpen, onClose, activeJob, activeResume, onNavigateTab }) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAsk = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q || !q.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.askQuestion({
        query: q.trim(),
        job_id: activeJob?.id || null,
        context_type: 'general'
      });
      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to get answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Search Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/60 gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-brand-400" />
          </div>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything (e.g. 'How do I explain my project?', 'Docker ELI5', 'STAR answer for conflict')..."
              className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none pr-8"
              disabled={isLoading}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => handleAsk()}
            disabled={!query.trim() || isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all shrink-0"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>Ask</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Active Context Banner */}
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>Context:</span>
              <strong className="text-slate-200 truncate">
                {activeJob ? `${activeJob.title} @ ${activeJob.company}` : 'General Tech Interview & ATS Copilot'}
              </strong>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">Press Esc to close</span>
          </div>

          {/* Answer Section if available */}
          {result && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    AI Career Answer
                  </span>
                  <span className="text-xs text-slate-500">Source: {result.source}</span>
                </div>
              </div>

              {/* Formatted Markdown Content */}
              <div className="text-sm text-slate-200 space-y-3 leading-relaxed whitespace-pre-line font-normal">
                {result.answer}
              </div>

              {/* Relevant Navigation Links */}
              {result.relevant_links && result.relevant_links.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Explore Related Pages:</span>
                  {result.relevant_links.map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onClose();
                        if (onNavigateTab) onNavigateTab(link.view);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-brand-300 font-medium transition-colors"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              {/* Follow-up Prompts */}
              {result.suggested_followups && result.suggested_followups.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5 text-brand-400" />
                    Suggested Next Questions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.suggested_followups.map((fu, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(fu);
                          handleAsk(fu);
                        }}
                        className="text-left text-xs px-2.5 py-1 rounded-md bg-slate-800/90 hover:bg-brand-600/20 hover:text-brand-300 border border-slate-700/60 text-slate-300 transition-colors"
                      >
                        {fu}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Prompts if no answer yet or to spark ideas */}
          {!result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span>Popular Career & Interview Questions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(prompt);
                      handleAsk(prompt);
                    }}
                    className="p-3 text-left rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-brand-500/40 text-xs text-slate-200 transition-all group flex items-start justify-between gap-2"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-brand-400 shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Ask anything about skills, project defense, STAR answers, or ATS guidelines.</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400">Enter</kbd>
            <span>to submit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
