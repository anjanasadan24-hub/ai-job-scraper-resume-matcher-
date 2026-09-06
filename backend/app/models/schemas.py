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
