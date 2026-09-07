const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...options.headers,
  };

  // If body is not FormData, default to application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch (_) {
      errorDetail = await response.text() || response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'POST', body: data }),
  testApiKey: (data) => request('/settings/test-key', { method: 'POST', body: data }),

  // Resume
  uploadResumeFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/resume/upload', { method: 'POST', body: formData });
  },
  uploadResumeText: (rawText) => {
    const formData = new FormData();
    formData.append('raw_text', rawText);
    return request('/resume/upload', { method: 'POST', body: formData });
  },
  getCurrentResume: () => request('/resume/current'),
  updateResumeSkills: (skills) => request('/resume/skills', { method: 'PUT', body: { skills } }),

  // Jobs
  scrapeJobs: (params) => request('/jobs/scrape', { method: 'POST', body: params }),
  scrapeUrl: (url) => request('/jobs/scrape-url', { method: 'POST', body: { url } }),
  createManualJob: (data) => request('/jobs/manual', { method: 'POST', body: data }),
  getJobs: (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.query) queryParams.append('query', filters.query);
    if (filters.remote_only) queryParams.append('remote_only', 'true');
    if (filters.source) queryParams.append('source', filters.source);
    return request(`/jobs?${queryParams.toString()}`);
  },
  deleteJob: (jobId) => request(`/jobs/${jobId}`, { method: 'DELETE' }),
  clearAllJobs: () => request('/jobs', { method: 'DELETE' }),

  // Matching
  matchAllJobs: () => request('/match/all', { method: 'POST' }),
  getJobMatch: (jobId) => request(`/match/job/${jobId}`),

  // AI Copilot
  tailorBullets: (jobId, experienceText = null) => request('/ai/tailor-bullets', {
    method: 'POST',
    body: { job_id: jobId, experience_text: experienceText }
  }),
  generateCoverLetter: (jobId, tone = 'professional', additionalNotes = '') => request('/ai/cover-letter', {
    method: 'POST',
    body: { job_id: jobId, tone, additional_notes: additionalNotes }
  }),
  getInterviewPrep: (jobId) => request('/ai/interview-prep', {
    method: 'POST',
    body: { job_id: jobId }
  }),

  // Advanced ATS Resume Tailor & Odds
  tailorFullResume: (payload = {}) => request('/ai/tailor-full-resume', {
    method: 'POST',
    body: payload
  }),

  // Deep Interview Prep & Mock Evaluator
  getDeepInterviewPrep: (payload = {}) => request('/ai/interview-prep-deep', {
    method: 'POST',
    body: payload
  }),
  evaluateAnswer: (payload) => request('/ai/evaluate-answer', {
    method: 'POST',
    body: payload
  }),

  // Beginner-Friendly Learning Academy
  getLearningContent: (payload = {}) => request('/ai/learn-skills-projects', {
    method: 'POST',
    body: payload
  }),

  // Global Search & Career Assistant
  askQuestion: (payload) => request('/ai/ask-question', {
    method: 'POST',
    body: payload
  }),
};

