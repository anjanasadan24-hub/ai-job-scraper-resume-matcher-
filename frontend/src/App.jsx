import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ResumeTailorView from './components/ResumeTailorView';
import InterviewPrepView from './components/InterviewPrepView';
import LearningHubView from './components/LearningHubView';
import AskQuestionModal from './components/AskQuestionModal';
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
  const [activeTab, setActiveTab] = useState('tailor'); // 'tailor' | 'interview' | 'learn' | 'jobs'
  const [activeResume, setActiveResume] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  // Modals state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [matchJob, setMatchJob] = useState(null);
  const [bulletsJob, setBulletsJob] = useState(null);
  const [coverLetterJob, setCoverLetterJob] = useState(null);
  const [interviewPrepJob, setInterviewPrepJob] = useState(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Global Ctrl+K / Cmd+K listener for Search Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        if (resJobs && resJobs.length > 0) {
          setJobs(resJobs);
          setSelectedJob(resJobs[0]);
        }
        if (resSettings) setSettings(resSettings);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  const handleResumeUploaded = (parsedResume) => {
    setActiveResume(parsedResume);
    setShowUploader(false);
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
      if (newJobs.length > 0 && !selectedJob) {
        setSelectedJob(newJobs[0]);
      }
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
    setSelectedJob(job);
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
        setSelectedJob(null);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenSearch={() => setShowSearchModal(true)}
        activeResume={activeResume}
        jobsCount={jobs.length}
        settings={settings}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Secondary Bar: Active Profile Toggle (Allows changing uploaded resume anytime) */}
        <div className="mb-6 flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">Active Candidate Profile:</span>
            <strong className="text-white">
              {activeResume?.contact?.name || activeResume?.filename || 'Alex Morgan (Starter Profile)'}
            </strong>
          </div>
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
          >
            {showUploader ? 'Hide Uploader' : 'Upload / Replace My Resume PDF/DOCX →'}
          </button>
        </div>

        {/* Collapsible Resume Uploader Drawer */}
        {showUploader && (
          <div className="mb-8 space-y-6 animate-in fade-in duration-150">
            <ResumeUploader
              onResumeUploaded={handleResumeUploaded}
              currentResume={activeResume}
            />
            <ResumePreview
              resume={activeResume}
              onResumeUpdated={handleResumeUpdated}
            />
          </div>
        )}

        {/* TAB 1: ATS RESUME TAILOR & JOB CHANCES */}
        {activeTab === 'tailor' && (
          <ResumeTailorView
            activeResume={activeResume}
            jobs={jobs}
            selectedJob={selectedJob}
            onSelectJob={(job) => setSelectedJob(job)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* TAB 2: INTERVIEW PREPARATION */}
        {activeTab === 'interview' && (
          <InterviewPrepView
            activeJob={selectedJob || (jobs.length > 0 ? jobs[0] : null)}
            activeResume={activeResume}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* TAB 3: BEGINNER-FRIENDLY SKILL & PROJECT ACADEMY */}
        {activeTab === 'learn' && (
          <LearningHubView
            activeJob={selectedJob || (jobs.length > 0 ? jobs[0] : null)}
            activeResume={activeResume}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* TAB 4: JOB BOARD & SCRAPER */}
        {activeTab === 'jobs' && (
          <div className="space-y-8">
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

            <JobList
              jobs={jobs}
              onSelectMatch={(job) => {
                setSelectedJob(job);
                setMatchJob(job);
              }}
              onOpenBullets={(job) => {
                setSelectedJob(job);
                setBulletsJob(job);
              }}
              onOpenCoverLetter={(job) => {
                setSelectedJob(job);
                setCoverLetterJob(job);
              }}
              onOpenInterviewPrep={(job) => {
                setSelectedJob(job);
                setActiveTab('interview');
              }}
              activeResume={activeResume}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>TailorATS & AI Career Copilot • Dual Engine: Local Heuristic & Google Gemini GenAI • ATS Single-Column Certified</p>
      </footer>

      {/* Global Ask Question Modal */}
      <AskQuestionModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        activeJob={selectedJob || (jobs.length > 0 ? jobs[0] : null)}
        activeResume={activeResume}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setShowSearchModal(false);
        }}
      />

      {/* Existing Feature Modals */}
      {matchJob && (
        <MatchModal
          job={matchJob}
          onClose={() => setMatchJob(null)}
          onOpenBullets={(job) => setBulletsJob(job)}
          onOpenCoverLetter={(job) => setCoverLetterJob(job)}
          onOpenInterviewPrep={(job) => {
            setMatchJob(null);
            setSelectedJob(job);
            setActiveTab('interview');
          }}
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

