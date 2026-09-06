import React, { useState } from 'react';
import { User, Mail, Phone, Linkedin, Github, CheckCircle, AlertTriangle, Plus, X, Award } from 'lucide-react';
import { api } from '../services/api';

export default function ResumePreview({ resume, onResumeUpdated }) {
  const [newSkill, setNewSkill] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!resume) return null;

  const { contact = {}, skills = [], categorized_skills = {}, ats_score = 0, ats_feedback = [] } = resume;

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    const skillToAdd = newSkill.trim();
    if (skills.includes(skillToAdd)) {
      setNewSkill('');
      return;
    }
    const updatedSkills = [...skills, skillToAdd];
    setIsUpdating(true);
    try {
      const updated = await api.updateResumeSkills(updatedSkills);
      onResumeUpdated(updated);
      setNewSkill('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updatedSkills = skills.filter((s) => s !== skillToRemove);
    setIsUpdating(true);
    try {
      const updated = await api.updateResumeSkills(updatedSkills);
      onResumeUpdated(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur mt-6">
      {/* Header Info & ATS Score */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-700/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-brand-400 text-base">
              {contact?.name ? contact.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {contact?.name || 'Parsed Candidate Profile'}
              </h3>
              <p className="text-xs text-slate-400">
                {resume.filename ? `Source: ${resume.filename}` : 'Active Resume'}
              </p>
            </div>
          </div>

          {/* Contact Details Pill Row */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-300">
            {contact?.email && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-700/60">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {contact.email}
              </span>
            )}
            {contact?.phone && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-700/60">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {contact.phone}
              </span>
            )}
            {contact?.linkedin && (
              <a
                href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-700/60 hover:text-brand-400 transition-colors"
              >
                <Linkedin className="h-3.5 w-3.5 text-blue-400" />
                LinkedIn
              </a>
            )}
            {contact?.github && (
              <a
                href={contact.github.startsWith('http') ? contact.github : `https://${contact.github}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-700/60 hover:text-brand-400 transition-colors"
              >
                <Github className="h-3.5 w-3.5 text-slate-300" />
                GitHub
              </a>
            )}
          </div>
        </div>

        {/* ATS Score Gauge Card */}
        <div className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border ${getScoreColor(ats_score)}`}>
          <div className="text-center">
            <div className="text-3xl font-black tracking-tight">{Math.round(ats_score)}%</div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">ATS Rating</div>
          </div>
          <div className="text-xs max-w-xs space-y-1">
            <div className="font-semibold flex items-center gap-1 text-slate-200">
              <Award className="h-3.5 w-3.5 text-brand-400" />
              ATS Health Check
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-2">
              {ats_feedback.length > 0 ? ats_feedback[0] : 'High keyword density and clear contact points.'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Section (if present) */}
      {resume.summary && (
        <div className="py-4 border-b border-slate-700/80">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Summary</h4>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800">
            {resume.summary}
          </p>
        </div>
      )}

      {/* Skills Section & Tag Cloud */}
      <div className="pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Detected Skills ({skills.length})
            </h4>
            <span className="text-[11px] text-slate-500">Click × to remove or add missing ones below</span>
          </div>

          {/* Add Skill Input */}
          <form onSubmit={handleAddSkill} className="flex items-center gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add skill (e.g. GraphQL)"
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 w-44"
            />
            <button
              type="submit"
              disabled={isUpdating || !newSkill.trim()}
              className="px-2.5 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Skill Chips */}
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900/90 border border-slate-700 text-slate-200 hover:border-brand-500/50 transition-colors"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="text-slate-500 hover:text-rose-400 p-0.5 rounded-full transition-colors"
                title={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {skills.length === 0 && (
            <p className="text-xs text-slate-500 italic">No skills extracted yet. Add some above!</p>
          )}
        </div>
      </div>
    </div>
  );
}
