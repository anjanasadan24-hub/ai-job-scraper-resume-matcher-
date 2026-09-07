import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Code2, Layers, Sparkles, CheckCircle2, Copy, 
  ArrowRight, Lightbulb, Terminal, MessageSquare, ExternalLink, RefreshCw, Loader2 
} from 'lucide-react';
import { api } from '../services/api';

export default function LearningHubView({
  activeJob,
  activeResume,
  onNavigateTab
}) {
  const [activeSubTab, setActiveSubTab] = useState('skills'); // 'skills' | 'projects'
  const [isLoading, setIsLoading] = useState(false);
  const [learningData, setLearningData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [selectedSkillIdx, setSelectedSkillIdx] = useState(0);
  const [selectedProjectIdx, setSelectedProjectIdx] = useState(0);

  const fetchLearningContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getLearningContent({
        job_id: activeJob?.id || null,
        custom_job_description: activeJob?.description || ''
      });
      setLearningData(response);
    } catch (err) {
      setError(err.message || 'Failed to load learning tutorials.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningContent();
  }, [activeJob]);

  const copySnippet = (code, key) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const skillsList = learningData?.skills_tutorials || [];
  const projectsList = learningData?.project_tutorials || [];
  const currentSkill = skillsList[selectedSkillIdx] || null;
  const currentProject = projectsList[selectedProjectIdx] || null;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Beginner-Friendly Academy
            </span>
            <span className="text-xs text-slate-500">• Zero-Jargon Mental Models & Code</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
            Master Resume Skills & Projects
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Never feel impostor syndrome again. Learn every technology and project suggested on your tailored resume from the ground up, with ELI5 analogies, code walkthroughs, and interview talking scripts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLearningContent}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Refresh Curriculum</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Mode Navigation Switcher */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shadow-md">
          <button
            onClick={() => setActiveSubTab('skills')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'skills'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="h-4 w-4" />
            <span>Teach Me the Skills (ELI5 & Crash Courses)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('projects')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'projects'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Teach Me the Projects (Step-by-Step Blueprint)</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-16 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse">
            <BookOpen className="h-6 w-6 text-emerald-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Synthesizing Beginner Tutorials</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Drafting plain-English mental models, code snippets, project build phases, and interview talking scripts...
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 1: TEACH ME THE SKILLS */}
      {!isLoading && activeSubTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Skill Selector Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              Select Skill to Learn:
            </h3>
            <div className="space-y-2">
              {skillsList.map((skill, idx) => {
                const isSelected = selectedSkillIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedSkillIdx(idx)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500/60 ring-1 ring-brand-500/40 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white truncate">{skill.skill_name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {skill.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {skill.eli5_summary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skill Deep Dive Card */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            {currentSkill ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {currentSkill.category}
                    </span>
                    <h2 className="text-xl font-black text-white mt-1.5">
                      {currentSkill.skill_name}
                    </h2>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full self-start sm:self-auto">
                    Beginner-Friendly Crash Course
                  </span>
                </div>

                {/* ELI5 (Explain Like I'm 5) Box */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Lightbulb className="h-4 w-4" />
                    <span>Explain Like I'm 5 (Plain English Mental Model)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {currentSkill.eli5_summary}
                  </p>
                </div>

                {/* Why Companies Use It */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <strong className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                    🏢 Real-World Production Use Case (Why Companies Care)
                  </strong>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentSkill.why_companies_use_it}
                  </p>
                </div>

                {/* 10-Minute Crash Course Guide */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <strong className="text-xs font-bold text-white uppercase tracking-wider block">
                    ⚡ 10-Minute Beginner Crash Course & Terminology
                  </strong>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line space-y-1">
                    {currentSkill.crash_course_guide}
                  </div>
                </div>

                {/* Practical Code Snippet */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <Terminal className="h-4 w-4 text-brand-400" />
                      <span>Live Syntax & Code Example</span>
                    </div>
                    <button
                      onClick={() => copySnippet(currentSkill.code_example, `code_${selectedSkillIdx}`)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedKey === `code_${selectedSkillIdx}` ? 'Copied Snippet!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                    <code>{currentSkill.code_example}</code>
                  </pre>
                </div>

                {/* Interview Talking Script */}
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    <MessageSquare className="h-4 w-4" />
                    <span>How to Talk About This in Your Interview (Script)</span>
                  </div>
                  <blockquote className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                    {currentSkill.interview_talking_script}
                  </blockquote>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">
                Select a skill from the sidebar to view its tutorial.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: TEACH ME THE PROJECTS */}
      {!isLoading && activeSubTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Project Selector Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              Select Project to Build:
            </h3>
            <div className="space-y-2">
              {projectsList.map((project, idx) => {
                const isSelected = selectedProjectIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedProjectIdx(idx)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <h4 className="text-xs font-bold text-white">{project.project_title}</h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.tech_stack.map((t, tIdx) => (
                        <span key={tIdx} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Deep Dive Blueprint */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            {currentProject ? (
              <>
                <div className="border-b border-slate-800 pb-4 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {currentProject.tech_stack.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {t}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {currentProject.project_title}
                  </h2>
                </div>

                {/* Plain-English Architecture */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <strong className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                    🗺️ Plain-English Architecture Flow
                  </strong>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {currentProject.plain_english_architecture}
                  </p>
                </div>

                {/* 60-Second Elevator Pitch */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <MessageSquare className="h-4 w-4" />
                      <span>60-Second Interview Elevator Pitch (Memorize This)</span>
                    </div>
                    <button
                      onClick={() => copySnippet(currentProject.elevator_pitch_60s, `pitch_${selectedProjectIdx}`)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedKey === `pitch_${selectedProjectIdx}` ? 'Copied!' : 'Copy Pitch'}</span>
                    </button>
                  </div>
                  <blockquote className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                    {currentProject.elevator_pitch_60s}
                  </blockquote>
                </div>

                {/* Step-by-Step Build Blueprint */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    🛠️ Step-by-Step Implementation Blueprint
                  </h3>
                  <div className="space-y-3">
                    {(currentProject.how_to_build_step_by_step || []).map((step, sIdx) => (
                      <div key={sIdx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-400">
                            {step.phase}: {step.title}
                          </span>
                          {step.code_snippet && (
                            <button
                              onClick={() => copySnippet(step.code_snippet, `step_code_${sIdx}`)}
                              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              <Copy className="h-3 w-3" />
                              <span>{copiedKey === `step_code_${sIdx}` ? 'Copied!' : 'Copy Code'}</span>
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {step.description}
                        </p>
                        {step.code_snippet && (
                          <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                            <code>{step.code_snippet}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Defense Q&A for this Project */}
                {currentProject.interview_q_and_a && currentProject.interview_q_and_a.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      🎯 Tough Interview Questions on This Specific Project
                    </h3>
                    <div className="space-y-3">
                      {currentProject.interview_q_and_a.map((qa, qIdx) => (
                        <div key={qIdx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <div className="text-xs font-bold text-white flex items-start gap-2">
                            <span className="text-indigo-400">Q:</span>
                            <span>{qa.question}</span>
                          </div>
                          <div className="text-xs text-slate-300 leading-relaxed flex items-start gap-2 pl-4 border-l-2 border-indigo-500/40">
                            <span className="text-emerald-400 font-bold">A:</span>
                            <span>{qa.answer}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">
                Select a project from the sidebar to view its blueprint.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
