import re
from typing import Dict, List, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.resume_parser import extract_skills

def compute_tfidf_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(sim)
    except Exception as e:
        print(f"Error computing TF-IDF similarity: {e}")
        return 0.0

def detect_seniority(text: str) -> str:
    text_lower = text.lower()
    if any(k in text_lower for k in ["lead", "principal", "staff", "architect", "director", "head of"]):
        return "lead"
    elif any(k in text_lower for k in ["senior", "sr.", "sr "]):
        return "senior"
    elif any(k in text_lower for k in ["junior", "jr.", "jr ", "entry level", "intern"]):
        return "junior"
    return "mid"

def evaluate_experience_match(resume_text: str, job_title: str, job_desc: str) -> float:
    job_seniority = detect_seniority(f"{job_title} {job_desc[:300]}")
    resume_seniority = detect_seniority(resume_text)

    seniority_order = {"junior": 1, "mid": 2, "senior": 3, "lead": 4}
    j_level = seniority_order.get(job_seniority, 2)
    r_level = seniority_order.get(resume_seniority, 2)

    diff = abs(j_level - r_level)
    if diff == 0:
        return 100.0
    elif diff == 1:
        return 80.0
    elif diff == 2:
        return 60.0
    else:
        return 40.0

def match_resume_to_job(resume: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, Any]:
    resume_text = resume.get("raw_text", "")
    resume_skills = set(s.lower() for s in resume.get("skills", []))

    job_title = job.get("title", "")
    job_desc = job.get("description", "")
    job_text = f"{job_title}\n{job_desc}"

    # Extract skills from job if not already present
    job_skills_list = job.get("requirements") or []
    if not job_skills_list:
        extracted, _ = extract_skills(job_text)
        job_skills_list = extracted

    # Combine with tags
    job_tags = job.get("tags") or []
    for tag in job_tags:
        if tag.lower() not in [s.lower() for s in job_skills_list]:
            job_skills_list.append(tag)

    job_skills_set = set(s.lower() for s in job_skills_list)

    # 1. Skills Comparison
    matched_skills = []
    missing_skills = []

    for s in job_skills_list:
        s_clean = s.lower()
        # Direct match or substring match (e.g., 'react' in 'react.js')
        if s_clean in resume_skills or any(s_clean in rs or rs in s_clean for rs in resume_skills):
            matched_skills.append(s)
        else:
            missing_skills.append(s)

    # Deduplicate while preserving order
    matched_skills = list(dict.fromkeys(matched_skills))
    missing_skills = list(dict.fromkeys(missing_skills))

    total_req_skills = max(len(job_skills_list), 1)
    skills_score = (len(matched_skills) / total_req_skills) * 100.0
    skills_score = min(100.0, max(0.0, skills_score))

    # 2. Semantic Similarity
    semantic_sim = compute_tfidf_similarity(resume_text, job_text)
    # TF-IDF cosine similarity between resume and job is typically between 0.15 and 0.65; scale reasonably
    semantic_score = min(100.0, max(10.0, semantic_sim * 160.0))

    # 3. Experience Alignment
    experience_score = evaluate_experience_match(resume_text, job_title, job_desc)

    # 4. ATS Score
    ats_score = resume.get("ats_score", 75.0)

    # 5. Weighted Overall Match Score
    overall_score = (
        (skills_score * 0.45) +
        (semantic_score * 0.35) +
        (experience_score * 0.10) +
        (ats_score * 0.10)
    )
    overall_score = round(min(98.0, max(20.0, overall_score)), 1)

    # Generate targeted recommendations
    recommendations = []
    if missing_skills:
        top_missing = missing_skills[:4]
        recommendations.append(f"Add key required skills to your resume: {', '.join(top_missing)}.")
    if skills_score < 60:
        recommendations.append("Align your project descriptions to emphasize the exact technologies mentioned in the job post.")
    if experience_score < 70:
        recommendations.append(f"Highlight leadership or specific milestones to match the {detect_seniority(job_title).title()} level expectations.")
    if ats_score < 75:
        recommendations.append("Enhance your ATS score by adding clear metrics and action verbs in your experience bullet points.")
    if not recommendations:
        recommendations.append("Strong alignment! Your skills and background closely match this role's profile.")

    return {
        "overall_score": overall_score,
        "skills_score": round(skills_score, 1),
        "experience_score": round(experience_score, 1),
        "ats_score": round(ats_score, 1),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "recommendations": recommendations
    }
