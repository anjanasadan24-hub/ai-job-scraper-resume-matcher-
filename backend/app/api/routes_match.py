import json
from typing import List
from fastapi import APIRouter, HTTPException
from app.core.database import get_db_connection
from app.models.schemas import JobResponse, MatchBreakdown, MatchResponse
from app.services.matching_engine import match_resume_to_job
from app.api.routes_resume import format_resume_row
from app.api.routes_jobs import row_to_job

router = APIRouter(prefix="/match", tags=["Matching"])

@router.post("/all", response_model=List[JobResponse])
def match_all_jobs():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch active resume
    cursor.execute("SELECT * FROM resumes WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
    res_row = cursor.fetchone()
    if not res_row:
        conn.close()
        raise HTTPException(status_code=400, detail="Please upload or paste a resume first before running matching.")

    resume_data = {
        "raw_text": res_row["raw_text"],
        "skills": json.loads(res_row["skills_json"]) if res_row["skills_json"] else [],
        "ats_score": res_row["ats_score"] or 75.0
    }

    # Fetch all jobs
    cursor.execute("SELECT * FROM jobs ORDER BY id DESC")
    job_rows = cursor.fetchall()

    results = []
    for j_row in job_rows:
        job_dict = {
            "title": j_row["title"],
            "description": j_row["description"],
            "requirements": json.loads(j_row["requirements_json"]) if j_row["requirements_json"] else [],
            "tags": json.loads(j_row["tags_json"]) if j_row["tags_json"] else []
        }

        match_res = match_resume_to_job(resume_data, job_dict)

        # Upsert into matches table
        cursor.execute("""
        INSERT INTO matches (
            resume_id, job_id, overall_score, skills_score, experience_score,
            ats_score, matched_skills_json, missing_skills_json, breakdown_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(resume_id, job_id) DO UPDATE SET
            overall_score=excluded.overall_score,
            skills_score=excluded.skills_score,
            experience_score=excluded.experience_score,
            ats_score=excluded.ats_score,
            matched_skills_json=excluded.matched_skills_json,
            missing_skills_json=excluded.missing_skills_json,
            breakdown_json=excluded.breakdown_json
        """, (
            res_row["id"],
            j_row["id"],
            match_res["overall_score"],
            match_res["skills_score"],
            match_res["experience_score"],
            match_res["ats_score"],
            json.dumps(match_res["matched_skills"]),
            json.dumps(match_res["missing_skills"]),
            json.dumps(match_res)
        ))

        job_resp = row_to_job(j_row)
        job_resp.match_score = match_res["overall_score"]
        job_resp.matched_skills = match_res["matched_skills"]
        job_resp.missing_skills = match_res["missing_skills"]
        results.append(job_resp)

    conn.commit()
    conn.close()

    # Sort descending by match score
    results.sort(key=lambda x: (x.match_score or 0), reverse=True)
    return results

@router.get("/job/{job_id}", response_model=MatchResponse)
def get_job_match(job_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM resumes WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
    res_row = cursor.fetchone()
    if not res_row:
        conn.close()
        raise HTTPException(status_code=400, detail="No active resume found.")

    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    j_row = cursor.fetchone()
    if not j_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Job not found.")

    resume_data = {
        "raw_text": res_row["raw_text"],
        "skills": json.loads(res_row["skills_json"]) if res_row["skills_json"] else [],
        "ats_score": res_row["ats_score"] or 75.0
    }

    job_dict = {
        "title": j_row["title"],
        "description": j_row["description"],
        "requirements": json.loads(j_row["requirements_json"]) if j_row["requirements_json"] else [],
        "tags": json.loads(j_row["tags_json"]) if j_row["tags_json"] else []
    }

    match_res = match_resume_to_job(resume_data, job_dict)
    job_resp = row_to_job(j_row)
    job_resp.match_score = match_res["overall_score"]
    job_resp.matched_skills = match_res["matched_skills"]
    job_resp.missing_skills = match_res["missing_skills"]

    conn.close()

    return MatchResponse(
        job=job_resp,
        breakdown=MatchBreakdown(
            overall_score=match_res["overall_score"],
            skills_score=match_res["skills_score"],
            experience_score=match_res["experience_score"],
            ats_score=match_res["ats_score"],
            matched_skills=match_res["matched_skills"],
            missing_skills=match_res["missing_skills"],
            recommendations=match_res["recommendations"]
        )
    )
