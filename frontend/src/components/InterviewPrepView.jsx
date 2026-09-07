import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, 
  Send, RefreshCw, Loader2, Award, ChevronDown, ChevronUp, Copy, BookOpen, MessageSquare
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'technical_skill', label: 'Technical Stack' },
  { id: 'project_defense', label: 'Project Defense' },
  { id: 'behavioral_star', label: 'Behavioral (STAR)' },
  { id: 'tricky_gap', label: 'Tricky & Gap Questions' },
  { id: 'reverse_interview', label: 'Questions for Interviewer' },
];

export default function InterviewPrepView({
  activeJob,
  activeResume,
  onNavigateTab
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [prepData, setPrepData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Mock Practice State per question
  const [activePracticeId, setActivePracticeId] = useState(null);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [evaluationResults, setEvaluationResults] = useState({});

  const fetchInterviewPrep = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getDeepInterviewPrep({
        job_id: activeJob?.id || null,
        custom_job_title: activeJob?.title || 'Software Engineer',
        custom_job_description: activeJob?.description || ''
      });
      setPrepData(response);
      if (response.questions && response.questions.length > 0) {
        setExpandedId(response.questions[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load interview preparation.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewPrep();
  }, [activeJob]);

  const handleEvaluateAnswer = async (question) => {
    const answer = practiceAnswers[question.id];
    if (!answer || !answer.trim()) return;

    setEvaluatingId(question.id);
    try {
      const evalResponse = await api.evaluateAnswer({
        question: question.question,
        user_answer: answer.trim(),
        job_title: prepData?.job_title || 'Software Engineer',
        category: question.category
      });
      setEvaluationResults(prev => ({ ...prev, [question.id]: evalResponse }));
    } catch (err) {
      alert(`Evaluation error: ${err.message}`);
    } finally {
      setEvaluatingId(null);
    }
  };

  const copyAnswer = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredQuestions = (prepData?.questions || []).filter(q => {
    if (selectedCategory === 'all') return true;
    return q.category === selectedCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Technical & Behavioral Interview Prep
            </span>
            <span className="text-xs text-slate-500">• Tailored to your Resume & Job</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
            Targeted Interview Preparation
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Master questions tailored specifically to your tailored projects, tech stack, and experience gaps. Includes interactive AI mock answer evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInterviewPrep}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Regenerate Questions</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Category Filter Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-16 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center animate-pulse">
            <Sparkles className="h-6 w-6 text-indigo-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Generating Tailored Interview Questions</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Formulating technical deep-dives, project defense inquiries, behavioral STAR scenarios, and winning model strategies...
            </p>
          </div>
        </div>
      )}

      {/* Question Cards List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q, idx) => {
              const isExpanded = expandedId === q.id;
              const isPracticing = activePracticeId === q.id;
              const evalResult = evaluationResults[q.id];

              return (
                <div 
                  key={q.id || idx}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
                >
                  {/* Question Header Accordion Trigger */}
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-850/60 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
                          {q.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          • {q.topic}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {q.question}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePracticeId(isPracticing ? null : q.id);
                          if (!isExpanded) setExpandedId(q.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          isPracticing
                            ? 'bg-brand-600 text-white border-brand-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isPracticing ? 'Close Practice' : 'Mock Practice'}
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 space-y-5 border-t border-slate-800/80 bg-slate-950/40">
                      
                      {/* Diagnostic Insights: Intent & Pitfalls */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                            🎯 Interviewer's Core Intent
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {q.interviewer_intent}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                            ⚠️ Pitfalls & Red Flags to Avoid
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {q.pitfalls_to_avoid}
                          </p>
                        </div>
                      </div>

                      {/* STAR Breakdown if present */}
                      {q.star_breakdown && (
                        <div className="p-4 rounded-xl bg-slate-900/90 border border-brand-500/20 space-y-2.5">
                          <span className="text-xs font-bold text-brand-300 uppercase tracking-wider block">
                            ⭐ STAR Response Blueprint
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                              <strong className="text-indigo-400 block mb-1">Situation:</strong>
                              <span className="text-slate-300">{q.star_breakdown.Situation}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                              <strong className="text-indigo-400 block mb-1">Task:</strong>
                              <span className="text-slate-300">{q.star_breakdown.Task}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                              <strong className="text-indigo-400 block mb-1">Action:</strong>
                              <span className="text-slate-300">{q.star_breakdown.Action}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                              <strong className="text-indigo-400 block mb-1">Result:</strong>
                              <span className="text-slate-300">{q.star_breakdown.Result}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Winning Model Answer */}
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Award className="h-4 w-4" />
                            <span>Staff-Level Winning Answer</span>
                          </span>
                          <button
                            onClick={() => copyAnswer(q.winning_model_answer, q.id)}
                            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>{copiedId === q.id ? 'Copied!' : 'Copy Answer'}</span>
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                          {q.winning_model_answer}
                        </p>
                      </div>

                      {/* Mock Practice Mode Accordion */}
                      {isPracticing && (
                        <div className="p-4 rounded-xl bg-slate-950 border border-brand-500/40 space-y-4 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-brand-400" />
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                Interactive Mock Simulator
                              </h4>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Type your real answer below to get instant AI scoring & critique.
                            </span>
                          </div>

                          <textarea
                            rows={3}
                            value={practiceAnswers[q.id] || ''}
                            onChange={(e) => setPracticeAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Type how you would answer this question in a real interview..."
                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                          />

                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-500">
                              Tip: Include quantifiable metrics and past engineering trade-offs.
                            </span>
                            <button
                              onClick={() => handleEvaluateAnswer(q)}
                              disabled={evaluatingId === q.id || !practiceAnswers[q.id]?.trim()}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-colors"
                            >
                              {evaluatingId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                              <span>Evaluate My Answer</span>
                            </button>
                          </div>

                          {/* Evaluation Results Card */}
                          {evalResult && (
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3 mt-3">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">Score:</span>
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-brand-500/20 text-brand-300">
                                    {evalResult.score}/10
                                  </span>
                                  <span className="text-xs text-emerald-400 font-medium">{evalResult.rating}</span>
                                </div>
                                <span className="text-[11px] text-slate-500">Evaluator: {evalResult.source}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                  <strong className="text-emerald-400 block mb-1">Identified Strengths:</strong>
                                  <ul className="space-y-1">
                                    {(evalResult.strengths || []).map((s, idx) => (
                                      <li key={idx} className="text-slate-300">• {s}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <strong className="text-amber-400 block mb-1">How to Level Up:</strong>
                                  <ul className="space-y-1">
                                    {(evalResult.areas_for_improvement || []).map((a, idx) => (
                                      <li key={idx} className="text-slate-300">• {a}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-800">
                                <strong className="text-indigo-300 text-xs block mb-1">Upgraded Answer Script:</strong>
                                <p className="text-xs text-slate-300 italic leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                  "{evalResult.upgraded_answer}"
                                </p>
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="p-10 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              No questions found in this category. Click 'All Questions' to view all preparation prompts.
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation CTA */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Need to master unfamiliar skills or project code?</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Visit the Beginner-Friendly Academy to learn every skill and build step-by-step projects from scratch.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab && onNavigateTab('learn')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0"
        >
          <BookOpen className="h-4 w-4" />
          <span>Open Beginner Learning Academy →</span>
        </button>
      </div>

    </div>
  );
}
