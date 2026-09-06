import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import { api } from '../services/api';

export default function InterviewPrepModal({ job, onClose }) {
  const [prepContent, setPrepContent] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!job) return;
    async function fetchPrep() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getInterviewPrep(job.id);
        setPrepContent(res.content);
        setSource(res.source);
      } catch (err) {
        setError(err.message || 'Failed to generate interview prep');
      } finally {
        setLoading(false);
      }
    }
    fetchPrep();
  }, [job]);

  const handleCopy = () => {
    navigator.clipboard.writeText(prepContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden my-8 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Targeted Interview Preparation</h3>
              <p className="text-xs text-slate-400">Role: {job.title} at {job.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-2" />
              <p className="text-xs text-slate-300 font-medium">Formulating targeted interview questions & strategies...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {prepContent && !loading && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Engine: <strong className="text-slate-200 uppercase">{source}</strong>
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                {prepContent}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
