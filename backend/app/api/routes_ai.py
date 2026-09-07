import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from app.core.database import get_db_connection
from app.models.schemas import (
    TailorBulletsRequest, CoverLetterRequest, InterviewPrepRequest,
    TailorFullResumeRequest, TailoredResumeResponse,
    DeepInterviewPrepRequest, DeepInterviewPrepResponse,
    MockAnswerEvaluateRequest, MockAnswerEvaluateResponse,
    LearningAcademyRequest, LearningAcademyResponse,
    AskQuestionRequest, AskQuestionResponse
)
from app.services.gemini_service import (
    generate_tailored_bullets, generate_cover_letter, generate_interview_prep,
    generate_full_tailored_resume, generate_deep_interview_prep,
    evaluate_mock_answer, generate_beginner_learning_content, answer_career_question
)

router = APIRouter(prefix="/ai", tags=["AI Copilot"])

def resolve_resume_and_job(
    job_id: Optional[int] = None,
    custom_title: Optional[str] = None,
    custom_company: Optional[str] = None,
    custom_desc: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM resumes WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
    res_row = cursor.fetchone()

    if res_row:
        resume_data = {
            "raw_text": res_row["raw_text"],
            "contact": json.loads(res_row["contact_json"]) if res_row["contact_json"] else {},
            "skills": json.loads(res_row["skills_json"]) if res_row["skills_json"] else [],
            "experience": json.loads(res_row["experience_json"]) if res_row["experience_json"] else [],
            "education": json.loads(res_row["education_json"]) if res_row["education_json"] else []
        }
    else:
        # Default starter candidate profile if no resume uploaded yet
        resume_data = {
            "raw_text": "Alex Morgan\nalex.morgan@example.com | (555) 234-5678 | San Francisco, CA | linkedin.com/in/alexmorgan | github.com/alexmorgan\n\nSoftware Engineer with experience in building web applications, backend REST APIs, and database-driven services using Python, JavaScript, React, SQL, and Docker.",
            "contact": {
                "name": "Alex Morgan",
                "email": "alex.morgan@example.com",
                "phone": "(555) 234-5678",
                "location": "San Francisco, CA",
                "linkedin": "https://linkedin.com/in/alexmorgan",
                "github": "https://github.com/alexmorgan"
            },
            "skills": ["Python", "JavaScript", "React", "SQL", "Git", "Docker", "REST APIs", "FastAPI"],
            "experience": [
                {
                    "title": "Software Engineer",
                    "company": "Tech Solutions Inc.",
                    "duration": "2022 - Present",
                    "highlights": [
                        "Developed and maintained full-stack web applications serving 10k+ active users.",
                        "Engineered backend REST APIs with Python and SQL, improving database query response times.",
                        "Collaborated in Agile sprints and automated deployment testing with Docker and Git."
                    ]
                }
            ],
            "education": [
                {
                    "degree": "B.S. in Computer Science",
                    "institution": "State University",
                    "year": "2022"
                }
            ]
        }

    job_data = None
    if job_id:
        cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        job_row = cursor.fetchone()
        if job_row:
            job_data = {
                "title": job_row["title"],
                "company": job_row["company"],
                "description": job_row["description"],
                "requirements": json.loads(job_row["requirements_json"]) if job_row["requirements_json"] else []
            }

    conn.close()

    if not job_data:
        if custom_desc and custom_desc.strip():
            job_data = {
                "title": custom_title.strip() if custom_title and custom_title.strip() else "Software Engineer",
                "company": custom_company.strip() if custom_company and custom_company.strip() else "Target Company",
                "description": custom_desc.strip(),
                "requirements": []
            }
        else:
            job_data = {
                "title": "Full Stack Software Engineer",
                "company": "InnovateTech Global",
                "description": "We are seeking a Full Stack Software Engineer proficient in modern Python (FastAPI/Django), JavaScript/TypeScript (React), relational databases (PostgreSQL), Redis caching, and Docker containerization. You will architect distributed APIs, build responsive interfaces, and optimize production microservices.",
                "requirements": ["Python", "React", "FastAPI", "PostgreSQL", "Docker", "Redis", "REST APIs"]
            }

    return resume_data, job_data

@router.post("/tailor-bullets")
def tailor_resume_bullets(payload: TailorBulletsRequest):
    resume_data, job_data = resolve_resume_and_job(job_id=payload.job_id)
    result = generate_tailored_bullets(resume_data, job_data)
    return result

@router.post("/cover-letter")
def create_cover_letter(payload: CoverLetterRequest):
    resume_data, job_data = resolve_resume_and_job(job_id=payload.job_id)
    result = generate_cover_letter(
        resume=resume_data,
        job=job_data,
        tone=payload.tone,
        additional_notes=payload.additional_notes
    )
    return result

@router.post("/interview-prep")
def get_interview_prep(payload: InterviewPrepRequest):
    resume_data, job_data = resolve_resume_and_job(job_id=payload.job_id)
    result = generate_interview_prep(resume_data, job_data)
    return result

@router.post("/tailor-full-resume", response_model=TailoredResumeResponse)
def tailor_full_resume_endpoint(payload: TailorFullResumeRequest):
    resume_data, job_data = resolve_resume_and_job(
        job_id=payload.job_id,
        custom_title=payload.custom_job_title,
        custom_company=payload.custom_job_company,
        custom_desc=payload.custom_job_description
    )
    result = generate_full_tailored_resume(resume_data, job_data)
    return result

@router.post("/interview-prep-deep", response_model=DeepInterviewPrepResponse)
def deep_interview_prep_endpoint(payload: DeepInterviewPrepRequest):
    resume_data, job_data = resolve_resume_and_job(
        job_id=payload.job_id,
        custom_title=payload.custom_job_title,
        custom_desc=payload.custom_job_description
    )
    result = generate_deep_interview_prep(resume_data, job_data)
    return result

@router.post("/evaluate-answer", response_model=MockAnswerEvaluateResponse)
def evaluate_answer_endpoint(payload: MockAnswerEvaluateRequest):
    result = evaluate_mock_answer(
        question=payload.question,
        user_answer=payload.user_answer,
        job_title=payload.job_title,
        category=payload.category
    )
    return result

@router.post("/learn-skills-projects", response_model=LearningAcademyResponse)
def learn_skills_projects_endpoint(payload: LearningAcademyRequest):
    resume_data, job_data = resolve_resume_and_job(
        job_id=payload.job_id,
        custom_desc=payload.custom_job_description
    )
    result = generate_beginner_learning_content(resume_data, job_data)
    return result

@router.post("/ask-question", response_model=AskQuestionResponse)
def ask_career_question_endpoint(payload: AskQuestionRequest):
    resume_data, job_data = resolve_resume_and_job(job_id=payload.job_id)
    result = answer_career_question(
        query=payload.query,
        resume=resume_data,
        job=job_data,
        context_type=payload.context_type
    )
    return result

