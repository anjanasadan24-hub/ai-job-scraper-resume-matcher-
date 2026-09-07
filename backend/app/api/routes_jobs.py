import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.core.database import get_db_connection
from app.models.schemas import JobResponse, ScrapeRequest, UrlScrapeRequest, ManualJobRequest
from app.services.job_scraper import scrape_all_sources
from app.services.url_extractor import extract_job_from_url

router = APIRouter(prefix="/jobs", tags=["Jobs"])

def row_to_job(row) -> JobResponse:
    return JobResponse(
        id=row["id"],
        external_id=row["external_id"],
        source=row["source"],
        title=row["title"],
        company=row["company"],
        location=row["location"],
        is_remote=bool(row["is_remote"]),
        description=row["description"],
        requirements=json.loads(row["requirements_json"]) if row["requirements_json"] else [],
        tags=json.loads(row["tags_json"]) if row["tags_json"] else [],
        salary=row["salary"],
        apply_url=row["apply_url"],
        created_at=row["created_at"]
    )

@router.post("/scrape", response_model=List[JobResponse])
def scrape_jobs(payload: ScrapeRequest):
    scraped = scrape_all_sources(
        query=payload.keywords,
        sources=payload.sources,
        limit=payload.limit
    )

    conn = get_db_connection()
    cursor = conn.cursor()
    saved_jobs = []

    for item in scraped:
        try:
            cursor.execute("""
            INSERT INTO jobs (
                external_id, source, title, company, location, is_remote,
                description, requirements_json, tags_json, salary, apply_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(source, external_id) DO UPDATE SET
                description=excluded.description,
                requirements_json=excluded.requirements_json,
                tags_json=excluded.tags_json,
                salary=excluded.salary,
                apply_url=excluded.apply_url
            """, (
                item.get("external_id"),
                item.get("source"),
                item.get("title"),
                item.get("company"),
                item.get("location"),
                1 if item.get("is_remote") else 0,
                item.get("description"),
                json.dumps(item.get("requirements", [])),
                json.dumps(item.get("tags", [])),
                item.get("salary"),
                item.get("apply_url")
            ))
        except Exception as e:
            print(f"Error saving job: {e}")

    conn.commit()

    # Retrieve all recent jobs matching query
    cursor.execute("SELECT * FROM jobs ORDER BY id DESC LIMIT ?", (payload.limit,))
    rows = cursor.fetchall()
    conn.close()

    return [row_to_job(r) for r in rows]

@router.post("/scrape-url", response_model=JobResponse)
def scrape_by_url(payload: UrlScrapeRequest):
    try:
        data = extract_job_from_url(payload.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract job from URL: {str(e)}")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO jobs (
        external_id, source, title, company, location, is_remote,
        description, requirements_json, tags_json, salary, apply_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source, external_id) DO UPDATE SET
        title=excluded.title,
        company=excluded.company,
        description=excluded.description,
        requirements_json=excluded.requirements_json
    """, (
        data["external_id"],
        data["source"],
        data["title"],
        data["company"],
        data["location"],
        1 if data["is_remote"] else 0,
        data["description"],
        json.dumps(data["requirements"]),
        json.dumps(data["tags"]),
        data["salary"],
        data["apply_url"]
    ))
    conn.commit()
    job_id = cursor.lastrowid
    cursor.execute("SELECT * FROM jobs WHERE id = ? OR (source = ? AND external_id = ?)", (job_id, data["source"], data["external_id"]))
    row = cursor.fetchone()
    conn.close()

    return row_to_job(row)

@router.post("/manual", response_model=JobResponse)
def create_manual_job(payload: ManualJobRequest):
    from app.services.resume_parser import extract_skills
    skills, _ = extract_skills(f"{payload.title} {payload.description}")

    conn = get_db_connection()
    cursor = conn.cursor()
    import uuid
    unique_id = f"manual_{uuid.uuid4().hex[:10]}"
    cursor.execute("""
    INSERT INTO jobs (
        external_id, source, title, company, location, is_remote,
        description, requirements_json, tags_json, salary, apply_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        unique_id,
        "Manual Entry",
        payload.title,
        payload.company,
        payload.location,
        1 if payload.is_remote else 0,
        payload.description,
        json.dumps(skills),
        json.dumps(payload.tags or skills[:5]),
        payload.salary,
        payload.apply_url
    ))
    conn.commit()
    job_id = cursor.lastrowid
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()

    return row_to_job(row)

@router.get("", response_model=List[JobResponse])
def get_jobs(
    query: Optional[str] = None,
    remote_only: bool = False,
    source: Optional[str] = None,
    limit: int = 100
):
    conn = get_db_connection()
    cursor = conn.cursor()

    sql = "SELECT * FROM jobs WHERE 1=1"
    params = []

    if query:
        sql += " AND (title LIKE ? OR company LIKE ? OR description LIKE ?)"
        q_wild = f"%{query}%"
        params.extend([q_wild, q_wild, q_wild])

    if remote_only:
        sql += " AND is_remote = 1"

    if source:
        sql += " AND source = ?"
        params.append(source)

    sql += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    return [row_to_job(r) for r in rows]

@router.delete("/{job_id}")
def delete_job(job_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Job {job_id} deleted."}

@router.delete("")
def clear_all_jobs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM jobs")
    cursor.execute("DELETE FROM matches")
    conn.commit()
    conn.close()
    return {"status": "success", "message": "All jobs cleared."}
