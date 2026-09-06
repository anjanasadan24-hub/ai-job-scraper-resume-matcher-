import os
import json
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.core.config import UPLOADS_DIR
from app.core.database import get_db_connection
from app.services.resume_parser import extract_text_from_file, parse_resume
from app.models.schemas import ResumeResponse, ResumeUpdateRequest

router = APIRouter(prefix="/resume", tags=["Resume"])

def format_resume_row(row) -> ResumeResponse:
    return ResumeResponse(
        id=row["id"],
        filename=row["filename"],
        contact=json.loads(row["contact_json"]) if row["contact_json"] else {},
        summary=row["summary"],
        skills=json.loads(row["skills_json"]) if row["skills_json"] else [],
        categorized_skills={},
        experience=json.loads(row["experience_json"]) if row["experience_json"] else [],
        education=json.loads(row["education_json"]) if row["education_json"] else [],
        ats_score=row["ats_score"] or 0.0,
        ats_feedback=[],
        raw_text=row["raw_text"],
        created_at=row["created_at"]
    )

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None)
):
    if not file and not raw_text:
        raise HTTPException(status_code=400, detail="Must provide either a resume file or raw text.")

    filename = None
    extracted_text = ""

    if file:
        filename = file.filename
        file_path = UPLOADS_DIR / filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        extracted_text = extract_text_from_file(file_path)

    if not extracted_text and raw_text:
        extracted_text = raw_text.strip()
        filename = filename or "Pasted_Resume.txt"

    if not extracted_text:
        raise HTTPException(status_code=400, detail="Failed to extract readable text from the provided resume.")

    parsed = parse_resume(extracted_text, filename=filename)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Deactivate previous resumes
    cursor.execute("UPDATE resumes SET is_active = 0 WHERE is_active = 1")

    # Insert new resume
    cursor.execute("""
    INSERT INTO resumes (
        filename, raw_text, contact_json, summary, skills_json,
        experience_json, education_json, ats_score, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        filename,
        parsed["raw_text"],
        json.dumps(parsed["contact"]),
        parsed["summary"],
        json.dumps(parsed["skills"]),
        json.dumps(parsed["experience"]),
        json.dumps(parsed["education"]),
        parsed["ats_score"]
    ))
    conn.commit()
    resume_id = cursor.lastrowid
    conn.close()

    return ResumeResponse(
        id=resume_id,
        filename=filename,
        contact=parsed["contact"],
        summary=parsed["summary"],
        skills=parsed["skills"],
        categorized_skills=parsed["categorized_skills"],
        experience=[],
        education=[],
        ats_score=parsed["ats_score"],
        ats_feedback=parsed["ats_feedback"],
        raw_text=parsed["raw_text"]
    )

@router.get("/current", response_model=Optional[ResumeResponse])
def get_current_resume():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM resumes WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    res = format_resume_row(row)
    # Recalculate categorized skills on the fly
    from app.services.resume_parser import extract_skills, calculate_ats_score
    skills, categorized = extract_skills(res.raw_text)
    score, feedback = calculate_ats_score(res.raw_text, res.contact.model_dump(), res.skills)
    res.categorized_skills = categorized
    res.ats_feedback = feedback
    return res

@router.put("/skills", response_model=ResumeResponse)
def update_resume_skills(payload: ResumeUpdateRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM resumes WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="No active resume found.")

    updated_skills = payload.skills or []
    cursor.execute("UPDATE resumes SET skills_json = ? WHERE id = ?", (json.dumps(updated_skills), row["id"]))
    conn.commit()
    cursor.execute("SELECT * FROM resumes WHERE id = ?", (row["id"],))
    updated_row = cursor.fetchone()
    conn.close()

    return format_resume_row(updated_row)
