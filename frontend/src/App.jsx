import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ResumeUploader from './components/ResumeUploader';
import ResumePreview from './components/ResumePreview';
import JobSearchPanel from './components/JobSearchPanel';
import JobList from './components/JobList';
import MatchModal from './components/MatchModal';
import TailorBulletsModal from './components/TailorBulletsModal';
import CoverLetterModal from './components/CoverLetterModal';
import InterviewPrepModal from './components/InterviewPrepModal';
import UrlScrapeModal from './components/UrlScrapeModal';
import ManualJobModal from './components/ManualJobModal';
import SettingsModal from './components/SettingsModal';
import { api } from './services/api';

export default function App() {
  const [activeResume, setActiveResume] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  // Modals state
  const [matchJob, setMatchJob] = useState(null);
  const [bulletsJob, setBulletsJob] = useState(null);
  const [coverLetterJob, setCoverLetterJob] = useState(null);
  const [interviewPrepJob, setInterviewPrepJob] = useState(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        const [resResume, resJobs, resSettings] = await Promise.all([
          api.getCurrentResume().catch(() => null),
          api.getJobs().catch(() => []),
          api.getSettings().catch(() => null),
        ]);

        if (resResume) setActiveResume(resResume);
        if (resJobs) setJobs(resJobs);
        if (resSettings) setSettings(resSettings);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  const handleResumeUploaded = (parsedResume) => {
    setActiveResume(parsedResume);
    // Automatically trigger match scoring if jobs exist
    if (jobs.length > 0) {
      handleRunMatching();
    }
  };

  const handleResumeUpdated = (updatedResume) => {
    setActiveResume(updatedResume);
    if (jobs.length > 0) {
      handleRunMatching();
    }
  };

  const handleScrapeJobs = async (params) => {
    setIsScraping(true);
    try {
      const newJobs = await api.scrapeJobs(params);
      setJobs(newJobs);
      // If we have an active resume, score the new jobs automatically!
      if (activeResume) {
        const scoredJobs = await api.matchAllJobs();
        setJobs(scoredJobs);
      }
    } catch (err) {
      alert(`Scraping error: ${err.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  const handleRunMatching = async () => {
    if (!activeResume) {
      alert('Please upload or paste a resume first.');
      return;
    }
    setIsMatching(true);
    try {
      const scoredJobs = await api.matchAllJobs();
      setJobs(scoredJobs);
    } catch (err) {
      alert(`Matching error: ${err.message}`);
    } finally {
      setIsMatching(false);
    }
  };

  const handleJobAdded = async (job) => {
    setJobs((prev) => [job, ...prev]);
    if (activeResume) {
      const scoredJobs = await api.matchAllJobs();
      setJobs(scoredJobs);
    }
  };

  const handleClearJobs = async () => {
    if (window.confirm('Are you sure you want to clear all stored jobs?')) {
      try {
        await api.clearAllJobs();
        setJobs([]);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        activeResume={activeResume}
        jobsCount={jobs.length}
        settings={settings}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Top Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Full-Stack Intelligent Job Hunter
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2.5">
                AI Job Scraper & ATS Resume Matcher
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Scrape live tech openings, evaluate ATS keyword compatibility & skill gaps, and auto-generate tailored bullets and cover letters.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Resume Upload & Extraction */}
        <ResumeUploader
          onResumeUploaded={handleResumeUploaded}
          currentResume={activeResume}
        />

        {/* Active Resume Details & Skill Taxonomy Cloud */}
        <ResumePreview
          resume={activeResume}
          onResumeUpdated={handleResumeUpdated}
        />

        {/* Section 2: Live Job Scraper & Actions */}
        <JobSearchPanel
          onScrapeJobs={handleScrapeJobs}
          onOpenUrlModal={() => setShowUrlModal(true)}
          onOpenManualModal={() => setShowManualModal(true)}
          onRunMatching={handleRunMatching}
          onClearJobs={handleClearJobs}
          isScraping={isScraping}
          isMatching={isMatching}
          jobsCount={jobs.length}
          hasActiveResume={!!activeResume}
        />

        {/* Section 3: Job Listings with Match Scores */}
        <JobList
          jobs={jobs}
          onSelectMatch={(job) => setMatchJob(job)}
          onOpenBullets={(job) => setBulletsJob(job)}
          onOpenCoverLetter={(job) => setCoverLetterJob(job)}
          onOpenInterviewPrep={(job) => setInterviewPrepJob(job)}
          activeResume={activeResume}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>AI Job Scraper & Resume Matcher • Powered by FastAPI & React • Dual Engine: Local Heuristic & Google Gemini GenAI</p>
      </footer>

      {/* Modals */}
      {matchJob && (
        <MatchModal
          job={matchJob}
          onClose={() => setMatchJob(null)}
          onOpenBullets={(job) => setBulletsJob(job)}
          onOpenCoverLetter={(job) => setCoverLetterJob(job)}
          onOpenInterviewPrep={(job) => setInterviewPrepJob(job)}
        />
      )}

      {bulletsJob && (
        <TailorBulletsModal
          job={bulletsJob}
          onClose={() => setBulletsJob(null)}
        />
      )}

      {coverLetterJob && (
        <CoverLetterModal
          job={coverLetterJob}
          onClose={() => setCoverLetterJob(null)}
        />
      )}

      {interviewPrepJob && (
        <InterviewPrepModal
          job={interviewPrepJob}
          onClose={() => setInterviewPrepJob(null)}
        />
      )}

      {showUrlModal && (
        <UrlScrapeModal
          onClose={() => setShowUrlModal(false)}
          onJobAdded={handleJobAdded}
        />
      )}

      {showManualModal && (
        <ManualJobModal
          onClose={() => setShowManualModal(false)}
          onJobAdded={handleJobAdded}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onSettingsUpdated={(updated) => setSettings(updated)}
        />
      )}
    </div>
  );
}
