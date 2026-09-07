from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ContactInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    location: Optional[str] = None

class ExperienceEntry(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    highlights: List[str] = []

class EducationEntry(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None

class ResumeResponse(BaseModel):
    id: int
    filename: Optional[str] = None
    contact: ContactInfo
    summary: Optional[str] = None
    skills: List[str] = []
    categorized_skills: Dict[str, List[str]] = {}
    experience: List[ExperienceEntry] = []
    education: List[EducationEntry] = []
    ats_score: float = 0.0
    ats_feedback: List[str] = []
    raw_text: str
    created_at: Optional[str] = None

class ResumeUpdateRequest(BaseModel):
    skills: Optional[List[str]] = None
    summary: Optional[str] = None

class JobResponse(BaseModel):
    id: int
    external_id: Optional[str] = None
    source: str
    title: str
    company: str
    location: Optional[str] = None
    is_remote: bool = True
    description: str
    requirements: List[str] = []
    tags: List[str] = []
    salary: Optional[str] = None
    apply_url: Optional[str] = None
    created_at: Optional[str] = None
    match_score: Optional[float] = None
    matched_skills: Optional[List[str]] = None
    missing_skills: Optional[List[str]] = None

class ScrapeRequest(BaseModel):
    keywords: str = "python developer"
    location: Optional[str] = None
    remote_only: bool = True
    sources: List[str] = ["remoteok", "jobicy", "arbeitnow"]
    limit: int = 30

class UrlScrapeRequest(BaseModel):
    url: str

class ManualJobRequest(BaseModel):
    title: str
    company: str
    location: Optional[str] = "Remote"
    is_remote: bool = True
    description: str
    tags: List[str] = []
    salary: Optional[str] = None
    apply_url: Optional[str] = None

class MatchBreakdown(BaseModel):
    overall_score: float
    skills_score: float
    experience_score: float
    ats_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    recommendations: List[str] = []

class MatchResponse(BaseModel):
    job: JobResponse
    breakdown: MatchBreakdown

class TailorBulletsRequest(BaseModel):
    job_id: int
    experience_text: Optional[str] = None

class CoverLetterRequest(BaseModel):
    job_id: int
    tone: str = "professional"  # professional, enthusiastic, concise, technical
    additional_notes: Optional[str] = None

class InterviewPrepRequest(BaseModel):
    job_id: int

class SettingsPayload(BaseModel):
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None

class TailoredProject(BaseModel):
    title: str
    tagline: str
    tech_stack: List[str] = []
    architecture_overview: str
    bullets: List[str] = []

class JobChances(BaseModel):
    probability_percentage: int
    rating: str
    factors: Dict[str, int] = {}
    strengths: List[str] = []
    critical_gaps: List[str] = []
    chance_booster_tips: List[str] = []

class TailorFullResumeRequest(BaseModel):
    job_id: Optional[int] = None
    custom_job_title: Optional[str] = None
    custom_job_company: Optional[str] = None
    custom_job_description: Optional[str] = None

class TailoredResumeResponse(BaseModel):
    job_title: str
    company: str
    candidate_name: str
    tailored_summary: str
    suggested_skills: Dict[str, List[str]] = {}
    suggested_projects: List[TailoredProject] = []
    tailored_experience: List[Dict[str, Any]] = []
    ats_formatted_text: str
    ats_score: int
    ats_checks: List[Dict[str, Any]] = []
    job_chances: JobChances
    source: str = "local_engine"

class DeepInterviewQuestion(BaseModel):
    id: str
    category: str  # technical_skill, project_defense, behavioral_star, tricky_gap, reverse_interview
    topic: str
    question: str
    interviewer_intent: str
    pitfalls_to_avoid: str
    winning_model_answer: str
    star_breakdown: Optional[Dict[str, str]] = None

class DeepInterviewPrepRequest(BaseModel):
    job_id: Optional[int] = None
    custom_job_title: Optional[str] = None
    custom_job_description: Optional[str] = None

class DeepInterviewPrepResponse(BaseModel):
    job_title: str
    company: str
    questions: List[DeepInterviewQuestion] = []
    source: str = "local_engine"

class MockAnswerEvaluateRequest(BaseModel):
    question: str
    user_answer: str
    job_title: Optional[str] = None
    category: Optional[str] = None

class MockAnswerEvaluateResponse(BaseModel):
    score: int
    rating: str
    strengths: List[str] = []
    areas_for_improvement: List[str] = []
    upgraded_answer: str
    source: str = "local_engine"

class SkillTutorial(BaseModel):
    skill_name: str
    category: str
    eli5_summary: str
    why_companies_use_it: str
    crash_course_guide: str
    code_example: str
    interview_talking_script: str

class ProjectTutorial(BaseModel):
    project_title: str
    tech_stack: List[str] = []
    plain_english_architecture: str
    how_to_build_step_by_step: List[Dict[str, str]] = []
    elevator_pitch_60s: str
    interview_q_and_a: List[Dict[str, str]] = []

class LearningAcademyRequest(BaseModel):
    job_id: Optional[int] = None
    custom_job_description: Optional[str] = None

class LearningAcademyResponse(BaseModel):
    job_title: str
    skills_tutorials: List[SkillTutorial] = []
    project_tutorials: List[ProjectTutorial] = []
    source: str = "local_engine"

class AskQuestionRequest(BaseModel):
    query: str
    job_id: Optional[int] = None
    context_type: Optional[str] = "general"

class AskQuestionResponse(BaseModel):
    query: str
    answer: str
    suggested_followups: List[str] = []
    relevant_links: List[Dict[str, str]] = []
    source: str = "local_engine"

