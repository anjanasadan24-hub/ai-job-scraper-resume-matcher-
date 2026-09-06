import sys
import io
from pathlib import Path

# Ensure UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.services.resume_parser import parse_resume, extract_skills, calculate_ats_score
from app.services.matching_engine import match_resume_to_job
from app.services.gemini_service import generate_tailored_bullets, generate_cover_letter

def test_resume_parser():
    sample_text = """
    Jane Doe
    jane.doe@example.com | 555-123-4567 | San Francisco, CA
    https://linkedin.com/in/janedoe | https://github.com/janedoe

    SUMMARY
    Senior Full Stack Software Engineer with 6 years building distributed applications in Python, React, and AWS.

    SKILLS
    Python, FastAPI, Django, React, TypeScript, Docker, Kubernetes, AWS, PostgreSQL, Redis, CI/CD, Git

    EXPERIENCE
    Senior Engineer | TechCorp (2021 - Present)
    - Architected scalable microservices handling 20,000 requests per minute using Python and FastAPI.
    - Improved database query performance by 40% with PostgreSQL indexing and Redis caching.
    - Led automated deployments using Docker and GitHub Actions CI/CD pipelines.
    """

    parsed = parse_resume(sample_text, filename="jane_doe_resume.txt")
    assert parsed["contact"]["email"] == "jane.doe@example.com", f"Expected email match, got {parsed['contact']['email']}"
    assert "Python" in parsed["skills"], "Expected 'Python' in parsed skills"
    assert "React" in parsed["skills"], "Expected 'React' in parsed skills"
    assert any(s.upper() == "AWS" for s in parsed["skills"]), "Expected AWS in skills"
    assert parsed["ats_score"] >= 65, f"Expected ATS score >= 65, got {parsed['ats_score']}"
    print("[PASS] test_resume_parser passed!")
    return parsed

def test_matching_engine(parsed_resume):
    sample_job = {
        "title": "Senior Python Backend Engineer",
        "company": "NextGen Cloud",
        "description": "We are seeking a Senior Python Engineer experienced in FastAPI, Docker, PostgreSQL, and AWS to architect distributed services.",
        "requirements": ["Python", "FastAPI", "Docker", "PostgreSQL", "AWS", "Kafka", "Kubernetes"],
        "tags": ["python", "backend", "cloud"]
    }

    match = match_resume_to_job(parsed_resume, sample_job)
    assert match["overall_score"] > 60, f"Expected match score > 60%, got {match['overall_score']}%"
    assert "Python" in match["matched_skills"], "Python should be matched"
    assert "Kafka" in match["missing_skills"], "Kafka should be detected as missing"
    print(f"[PASS] test_matching_engine passed! Score: {match['overall_score']}%, Matched: {len(match['matched_skills'])}, Missing: {len(match['missing_skills'])}")

def test_gemini_fallback(parsed_resume):
    sample_job = {
        "title": "Senior Python Backend Engineer",
        "company": "NextGen Cloud",
        "description": "FastAPI, Docker, PostgreSQL, and AWS architecture."
    }

    bullets = generate_tailored_bullets(parsed_resume, sample_job)
    assert "content" in bullets and len(bullets["content"]) > 50, "Bullets should contain content"

    letter = generate_cover_letter(parsed_resume, sample_job)
    assert "content" in letter and "NextGen Cloud" in letter["content"], "Cover letter should reference company"
    print(f"[PASS] test_gemini_fallback passed! Bullets source: {bullets['source']}, Letter source: {letter['source']}")

if __name__ == "__main__":
    resume = test_resume_parser()
    test_matching_engine(resume)
    test_gemini_fallback(resume)
    print("\nALL AUTOMATED TESTS PASSED SUCCESSFULLY!")
