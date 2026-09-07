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

    # 8. Test Advanced ATS Tailored Resume & Chances
    res = client.post("/api/ai/tailor-full-resume", json={"job_id": job_id})
    assert res.status_code == 200, f"Tailor full resume failed: {res.text}"
    tailor_res = res.json()
    assert "suggested_skills" in tailor_res
    assert "suggested_projects" in tailor_res
    assert len(tailor_res["suggested_projects"]) >= 2
    assert "job_chances" in tailor_res
    assert tailor_res["job_chances"]["probability_percentage"] > 0
    assert "ats_formatted_text" in tailor_res
    print(f"[PASS] /api/ai/tailor-full-resume verified: {len(tailor_res['suggested_projects'])} projects, ATS score: {tailor_res['ats_score']}, Odds: {tailor_res['job_chances']['probability_percentage']}%")

    # 9. Test Deep Interview Prep
    res = client.post("/api/ai/interview-prep-deep", json={"job_id": job_id})
    assert res.status_code == 200, f"Deep interview prep failed: {res.text}"
    deep_prep = res.json()
    assert len(deep_prep["questions"]) >= 5
    print(f"[PASS] /api/ai/interview-prep-deep generated {len(deep_prep['questions'])} deep questions with STAR & model answers.")

    # 10. Test Mock Answer Evaluator
    mock_payload = {
        "question": "How do you diagnose memory leaks in production?",
        "user_answer": "I check heap metrics in APM, isolate unclosed database connections in PostgreSQL, and add unit tests to verify memory cleanup.",
        "job_title": "Staff Backend Engineer",
        "category": "technical_skill"
    }
    res = client.post("/api/ai/evaluate-answer", json=mock_payload)
    assert res.status_code == 200, f"Evaluate answer failed: {res.text}"
    eval_data = res.json()
    assert eval_data["score"] >= 1
    assert len(eval_data["strengths"]) > 0
    print(f"[PASS] /api/ai/evaluate-answer scored candidate answer: {eval_data['score']}/10 ({eval_data['rating']})")

    # 11. Test Beginner Learning Academy
    res = client.post("/api/ai/learn-skills-projects", json={"job_id": job_id})
    assert res.status_code == 200, f"Learn skills projects failed: {res.text}"
    academy_data = res.json()
    assert len(academy_data["skills_tutorials"]) >= 3
    assert len(academy_data["project_tutorials"]) >= 1
    print(f"[PASS] /api/ai/learn-skills-projects returned {len(academy_data['skills_tutorials'])} ELI5 skill guides and {len(academy_data['project_tutorials'])} project blueprints.")

    # 12. Test Ask Career Question
    ask_payload = {
        "query": "How do I explain Redis in an interview?",
        "job_id": job_id,
        "context_type": "general"
    }
    res = client.post("/api/ai/ask-question", json=ask_payload)
    assert res.status_code == 200, f"Ask question failed: {res.text}"
    ask_data = res.json()
    assert len(ask_data["answer"]) > 50
    assert len(ask_data["suggested_followups"]) > 0
    print(f"[PASS] /api/ai/ask-question answered successfully with {len(ask_data['suggested_followups'])} follow-up suggestions.")

    print("\n============================================================")
    print("ALL API ENDPOINTS (INCLUDING 5 NEW AI COPILOT SUITES) PASSED!")
    print("============================================================")

if __name__ == "__main__":
    test_api()

