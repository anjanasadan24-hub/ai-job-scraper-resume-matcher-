import sys
import io
from pathlib import Path
from fastapi.testclient import TestClient

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app

def test_api():
    client = TestClient(app)

    # 1. Test settings
    res = client.get("/api/settings")
    assert res.status_code == 200, f"Settings failed: {res.status_code}"
    print(f"[PASS] /api/settings returned: {res.json()}")

    # 2. Test resume upload with text
    resume_payload = {
        "raw_text": """
        Alex Smith
        alex.smith@example.com | 415-555-0199 | San Francisco, CA
        https://linkedin.com/in/alexsmith

        SUMMARY
        Senior Full Stack Engineer with 7 years of experience in Python, FastAPI, React, PostgreSQL, Docker, and AWS.

        SKILLS
        Python, React, TypeScript, FastAPI, PostgreSQL, Docker, AWS, Redis, Git, Microservices

        EXPERIENCE
        Senior Engineer | CloudMatrix (2020 - Present)
        - Designed and deployed FastAPI backend services with 99.99% uptime.
        - Reduced query latency by 50% through Redis caching and PostgreSQL query tuning.
        """
    }
    res = client.post("/api/resume/upload", data=resume_payload)
    assert res.status_code == 200, f"Resume upload failed: {res.text}"
    resume_data = res.json()
    assert resume_data["contact"]["email"] == "alex.smith@example.com"
    print(f"[PASS] /api/resume/upload succeeded! ATS Score: {resume_data['ats_score']}")

    # 3. Test manual job creation
    job_payload = {
        "title": "Staff Backend Engineer",
        "company": "Apex Dynamics",
        "location": "Remote",
        "is_remote": True,
        "description": "Looking for a Staff Backend Engineer proficient in Python, FastAPI, AWS, Docker, and Kubernetes.",
        "salary": "$175,000 - $210,000"
    }
    res = client.post("/api/jobs/manual", json=job_payload)
    assert res.status_code == 200, f"Manual job failed: {res.text}"
    job_data = res.json()
    job_id = job_data["id"]
    print(f"[PASS] /api/jobs/manual created job id: {job_id}")

    # 4. Test matching
    res = client.post("/api/match/all")
    assert res.status_code == 200, f"Matching failed: {res.text}"
    matches = res.json()
    assert len(matches) > 0
    top_match = matches[0]
    print(f"[PASS] /api/match/all scored top job '{top_match['title']}' with score: {top_match['match_score']}%")

    # 5. Test AI Bullets
    res = client.post("/api/ai/tailor-bullets", json={"job_id": job_id})
    assert res.status_code == 200, f"AI bullets failed: {res.text}"
    bullets_data = res.json()
    print(f"[PASS] /api/ai/tailor-bullets generated output using engine: {bullets_data['source']}")

    # 6. Test Cover Letter
    res = client.post("/api/ai/cover-letter", json={"job_id": job_id, "tone": "professional"})
    assert res.status_code == 200, f"Cover letter failed: {res.text}"
    letter_data = res.json()
    print(f"[PASS] /api/ai/cover-letter generated letter using engine: {letter_data['source']}")

    # 7. Test Interview Prep
    res = client.post("/api/ai/interview-prep", json={"job_id": job_id})
    assert res.status_code == 200, f"Interview prep failed: {res.text}"
    prep_data = res.json()
    print(f"[PASS] /api/ai/interview-prep generated interview guide using engine: {prep_data['source']}")

    print("\nALL API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api()
