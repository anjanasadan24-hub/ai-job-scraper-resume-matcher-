import json
from fastapi import APIRouter, HTTPException
from app.core.database import get_db_connection
from app.models.schemas import TailorBulletsRequest, CoverLetterRequest, InterviewPrepRequest
from app.services.gemini_service import generate_tailored_bullets, generate_cover_letter, generate_interview_prep

router = APIRouter(prefix="/ai", tags=["AI Copilot"])

def get_resume_and_job(job_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM resumes WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
    res_row = cursor.fetchone()
    if not res_row:
        conn.close()
        raise HTTPException(status_code=400, detail="Please upload or paste a resume first.")

    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    job_row = cursor.fetchone()
    if not job_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Job not found.")

    conn.close()

    resume_data = {
        "raw_text": res_row["raw_text"],
        "contact": json.loads(res_row["contact_json"]) if res_row["contact_json"] else {},
        "skills": json.loads(res_row["skills_json"]) if res_row["skills_json"] else []
    }

    job_data = {
        "title": job_row["title"],
        "company": job_row["company"],
        "description": job_row["description"],
        "requirements": json.loads(job_row["requirements_json"]) if job_row["requirements_json"] else []
    }

    return resume_data, job_data

@router.post("/tailor-bullets")
def tailor_resume_bullets(payload: TailorBulletsRequest):
    resume_data, job_data = get_resume_and_job(payload.job_id)
    result = generate_tailored_bullets(resume_data, job_data)
    return result

@router.post("/cover-letter")
def create_cover_letter(payload: CoverLetterRequest):
    resume_data, job_data = get_resume_and_job(payload.job_id)
    result = generate_cover_letter(
        resume=resume_data,
        job=job_data,
        tone=payload.tone,
        additional_notes=payload.additional_notes
    )
    return result

@router.post("/interview-prep")
def get_interview_prep(payload: InterviewPrepRequest):
    resume_data, job_data = get_resume_and_job(payload.job_id)
    result = generate_interview_prep(resume_data, job_data)
    return result
