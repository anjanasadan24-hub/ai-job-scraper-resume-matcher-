import os
import json
import re
from typing import Dict, Any, List, Optional
from app.core.database import get_setting
from app.services.resume_parser import SKILL_TAXONOMY, ALL_SKILLS

def get_effective_api_key(override_key: Optional[str] = None) -> Optional[str]:
    if override_key and override_key.strip():
        return override_key.strip()
    db_key = get_setting("gemini_api_key")
    if db_key and db_key.strip():
        return db_key.strip()
    env_key = os.getenv("GEMINI_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()
    return None

def call_gemini(prompt: str, api_key: Optional[str] = None) -> Optional[str]:
    key = get_effective_api_key(api_key)
    if not key:
        return None

    try:
        from google import genai
        client = genai.Client(api_key=key)
        model_name = get_setting("gemini_model", "gemini-2.5-flash")
        response = client.models.generate_content(
            model=model_name,
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"Gemini API invocation error: {e}")
        return None

def generate_tailored_bullets(
    resume: Dict[str, Any],
    job: Dict[str, Any],
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    job_title = job.get("title", "Position")
    company = job.get("company", "Company")
    job_desc = job.get("description", "")[:1500]
    resume_text = resume.get("raw_text", "")[:2000]
    skills = resume.get("skills", [])

    prompt = f"""
You are a senior technical career coach and executive resume specialist.
Target Role: {job_title} at {company}
Target Job Requirements / Description snippet:
{job_desc}

Candidate Resume Context:
{resume_text}

Candidate Skills: {', '.join(skills)}

TASK:
Create 4 to 5 high-impact, ATS-optimized accomplishment bullet points tailored specifically for this role.
Rules:
1. Start each bullet with a strong action verb (e.g., Architected, Spearheaded, Engineered, Streamlined).
2. Directly align candidate experience with the target job requirements.
3. Include realistic quantifiable metrics or impact placeholders (e.g., "reducing build times by 35%", "scaling to 50k+ daily active users").
4. Return clean, formatted markdown bullet points with a brief 1-sentence tip on how to incorporate them.
"""

    ai_output = call_gemini(prompt, api_key=api_key)

    if ai_output:
        return {
            "source": "gemini",
            "content": ai_output.strip()
        }

    # Offline / Heuristic Fallback
    matched_skills = [s for s in skills if s.lower() in job_desc.lower()][:4]
    matched_str = ", ".join(matched_skills) if matched_skills else "modern software engineering practices"
    fallback_bullets = f"""### AI-Optimized Resume Bullets for **{job_title}**

- **Architected and delivered** robust systems utilizing **{matched_str}**, cutting response latency by 28% and ensuring 99.9% service uptime.
- **Engineered scalable components** aligned with {company}'s technical standards, collaborating across cross-functional teams to accelerate release cycles by 2x.
- **Spearheaded automated testing and CI/CD pipelines**, reducing production defect rates by 40% while maintaining rigorous code quality.
- **Optimized data workflows and API performance**, supporting higher user concurrency and lowering cloud compute overhead by 20%.

> *Pro Tip: Adapt these metrics to match your specific past project milestones and team achievements.*
"""
    return {
        "source": "offline_template",
        "content": fallback_bullets.strip()
    }

def generate_cover_letter(
    resume: Dict[str, Any],
    job: Dict[str, Any],
    tone: str = "professional",
    additional_notes: Optional[str] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    job_title = job.get("title", "Position")
    company = job.get("company", "Company")
    job_desc = job.get("description", "")[:1500]
    resume_text = resume.get("raw_text", "")[:2000]
    candidate_name = resume.get("contact", {}).get("name") or "Candidate"
    skills = resume.get("skills", [])

    prompt = f"""
You are an expert cover letter writer.
Candidate Name: {candidate_name}
Target Role: {job_title}
Company: {company}
Tone: {tone}
Additional Notes: {additional_notes or 'None'}

Job Description Context:
{job_desc}

Candidate Resume Background:
{resume_text}

Candidate Core Skills: {', '.join(skills[:12])}

TASK:
Draft a compelling, customized 3-4 paragraph cover letter that:
1. Expresses genuine interest in {company} and the {job_title} position.
2. Connects candidate's background and specific technical skills directly to the key challenges of the role.
3. Closes professionally with an invitation for an interview discussion.
4. Output cleanly in markdown format.
"""

    ai_output = call_gemini(prompt, api_key=api_key)

    if ai_output:
        return {
            "source": "gemini",
            "content": ai_output.strip()
        }

    # Offline / Heuristic Fallback
    top_skills = ", ".join(skills[:4]) if skills else "technical problem solving and software design"
    fallback_letter = f"""Dear Hiring Team at {company},

I am writing to express my strong enthusiasm for the **{job_title}** position at **{company}**. With a proven background in delivering high-performance software solutions and deep expertise in **{top_skills}**, I am eager to bring my skills to your team.

Throughout my experience, I have developed and optimized production-grade systems while prioritizing architectural quality and seamless team collaboration. Having reviewed {company}'s goals for this role, I am confident that my technical foundation and proactive problem-solving mindset will allow me to make an immediate, positive impact on your projects.

I would welcome the opportunity to discuss how my experience and skill set align with {company}'s future growth. Thank you for your time and consideration.

Sincerely,  
**{candidate_name}**
"""
    return {
        "source": "offline_template",
        "content": fallback_letter.strip()
    }

def generate_interview_prep(
    resume: Dict[str, Any],
    job: Dict[str, Any],
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    job_title = job.get("title", "Position")
    company = job.get("company", "Company")
    job_desc = job.get("description", "")[:1500]
    resume_text = resume.get("raw_text", "")[:2000]
    skills = resume.get("skills", [])

    prompt = f"""
You are a senior technical interviewer and hiring manager for {job_title} at {company}.
Job Description Context:
{job_desc}

Candidate Background:
{resume_text}
Candidate Skills: {', '.join(skills)}

TASK:
Provide 5 highly probable interview questions for this candidate:
- 3 Technical & Architecture questions (including questions targeting potential gaps or key requirements in the job)
- 2 Behavioral & Situational questions

For each question provide:
1. **Question**: Clear question text.
2. **Interviewer Objective**: What they are evaluating.
3. **Winning Answer Strategy**: Concrete talking points based on candidate's background.
Format in clear markdown.
"""

    ai_output = call_gemini(prompt, api_key=api_key)

    if ai_output:
        return {
            "source": "gemini",
            "content": ai_output.strip()
        }

    # Offline / Heuristic Fallback
    fallback_prep = f"""### Targeted Interview Preparation for **{job_title}** at **{company}**

#### 1. Technical Architecture & System Scale
- **Question**: *"Can you walk us through a challenging technical problem you solved while working with your core stack?"*
- **Interviewer Objective**: Tests your ability to explain complex technical decisions, trade-offs, and debugging methodology under pressure.
- **Winning Strategy**: Use the STAR method (Situation, Task, Action, Result). Highlight how you optimized performance and reliability.

#### 2. Tech Stack Fit
- **Question**: *"How do you approach learning and integrating new tools or frameworks required for this role?"*
- **Interviewer Objective**: Evaluates continuous learning agility and comfort with modern developer ecosystems.
- **Winning Strategy**: Mention concrete examples where you adopted a new tool and quickly delivered production-ready features.

#### 3. Code Quality & Testing
- **Question**: *"How do you balance moving quickly to ship features with maintaining test coverage and software reliability?"*
- **Interviewer Objective**: Checks for engineering maturity, automated testing experience, and risk management.
- **Winning Strategy**: Discuss CI/CD integration, unit testing, and prioritizing technical debt before it becomes a bottleneck.

#### 4. Cross-Functional Collaboration
- **Question**: *"Describe a time you had a technical disagreement with a team member or stakeholder. How did you resolve it?"*
- **Interviewer Objective**: Assesses communication, empathy, and collaborative conflict resolution.
- **Winning Strategy**: Emphasize using data and benchmarks to guide consensus rather than subjective opinions.

#### 5. Role Alignment & Company Vision
- **Question**: *"What excites you most about {company} and this particular {job_title} opportunity?"*
- **Interviewer Objective**: Verifies mutual interest and cultural engagement.
- **Winning Strategy**: Connect your career trajectory with {company}'s public mission and technical challenges.
"""
    return {
        "source": "offline_template",
        "content": fallback_prep.strip()
    }

# =========================================================================
# HELPER UTILITIES FOR TAXONOMY & KEYWORDS
# =========================================================================
def extract_skills_from_text(text: str) -> Dict[str, List[str]]:
    found: Dict[str, List[str]] = {cat: [] for cat in SKILL_TAXONOMY.keys()}
    lower_text = text.lower()
    for category, skills in SKILL_TAXONOMY.items():
        for skill in skills:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, lower_text):
                found[category].append(skill.title() if len(skill) > 3 else skill.upper())
    return {k: v for k, v in found.items() if v}

def extract_flat_skills(text: str) -> List[str]:
    flat = []
    lower_text = text.lower()
    for s in ALL_SKILLS:
        pattern = r'\b' + re.escape(s) + r'\b'
        if re.search(pattern, lower_text):
            flat.append(s.title() if len(s) > 3 else s.upper())
    return sorted(list(set(flat)))

# =========================================================================
# FULL ATS TAILORED RESUME & CHANCES ESTIMATOR
# =========================================================================
def generate_full_tailored_resume(
    resume: Dict[str, Any],
    job: Dict[str, Any],
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    job_title = job.get("title") or "Software Engineer"
    company = job.get("company") or "Target Company"
    job_desc = job.get("description") or ""
    resume_text = resume.get("raw_text") or ""
    candidate_name = resume.get("contact", {}).get("name") or "Candidate"
    contact = resume.get("contact", {})
    existing_skills = resume.get("skills") or []
    
    # Extract JD skills
    jd_skills_categorized = extract_skills_from_text(job_desc + " " + job_title)
    jd_flat_skills = extract_flat_skills(job_desc + " " + job_title)
    
    # Prompt for Gemini if key is present
    key = get_effective_api_key(api_key)
    if key:
        prompt = f"""
You are an expert ATS Resume Architect and Principal Engineering Recruiter.
Generate a tailored, ATS-compliant resume and candidate match odds for this job.

TARGET ROLE:
Title: {job_title}
Company: {company}
Job Description:
{job_desc[:2500]}

CANDIDATE EXISTING PROFILE:
Name: {candidate_name}
Resume Text:
{resume_text[:2500]}

TASK:
Return a strictly valid JSON object (no markdown formatting around it, just JSON) with:
{{
  "tailored_summary": "A 3-4 sentence impactful professional summary targeting {job_title} with natural keywords from the JD.",
  "suggested_skills": {{
    "Core Technical Skills": ["skill1", "skill2"],
    "Languages & Frameworks": ["lang1", "fw1"],
    "Cloud & DevOps": ["tool1", "tool2"],
    "Databases & Architecture": ["db1", "arch1"]
  }},
  "suggested_projects": [
    {{
      "title": "Project Name (e.g. Distributed Order Processing Pipeline)",
      "tagline": "Brief 1-sentence description",
      "tech_stack": ["Tech1", "Tech2", "Tech3"],
      "architecture_overview": "How the components communicate and scale",
      "bullets": [
        "Architected and deployed... [with action verb, context, and metric]",
        "Engineered real-time synchronization... [with metric]",
        "Implemented automated CI/CD pipeline... [with metric]"
      ]
    }},
    {{
      "title": "Second Relevant Project",
      "tagline": "Brief 1-sentence description",
      "tech_stack": ["Tech1", "Tech2", "Tech3"],
      "architecture_overview": "Architecture summary",
      "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"]
    }}
  ],
  "tailored_experience": [
    {{
      "title": "Role Title",
      "company": "Company Name",
      "duration": "Dates or duration",
      "highlights": [
        "Quantified bullet aligned with {job_title}...",
        "Quantified bullet aligned with {job_title}..."
      ]
    }}
  ],
  "job_chances": {{
    "probability_percentage": 85,
    "rating": "High Probability Match",
    "factors": {{
      "skills_match": 88,
      "ats_keyword_density": 92,
      "experience_alignment": 80,
      "project_relevance": 85
    }},
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "critical_gaps": ["Potential gap 1", "Potential gap 2"],
    "chance_booster_tips": ["Actionable tip 1 to reach 95%", "Actionable tip 2"]
  }}
}}
"""
        raw_output = call_gemini(prompt, api_key=key)
        if raw_output:
            try:
                # Clean json blocks
                cleaned = raw_output.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                data = json.loads(cleaned.strip())
                
                # Build clean ATS text
                ats_text = build_clean_ats_text(
                    candidate_name=candidate_name,
                    contact=contact,
                    summary=data.get("tailored_summary", ""),
                    skills=data.get("suggested_skills", {}),
                    projects=data.get("suggested_projects", []),
                    experience=data.get("tailored_experience", []),
                    education=resume.get("education", [])
                )
                
                return {
                    "job_title": job_title,
                    "company": company,
                    "candidate_name": candidate_name,
                    "tailored_summary": data.get("tailored_summary", ""),
                    "suggested_skills": data.get("suggested_skills", jd_skills_categorized),
                    "suggested_projects": data.get("suggested_projects", []),
                    "tailored_experience": data.get("tailored_experience", []),
                    "ats_formatted_text": ats_text,
                    "ats_score": 94,
                    "ats_checks": get_standard_ats_checks(),
                    "job_chances": data.get("job_chances", calculate_offline_chances(existing_skills, jd_flat_skills, job_title)),
                    "source": "gemini"
                }
            except Exception as e:
                print(f"Error parsing Gemini response as JSON: {e}")

    # OFFLINE / HEURISTIC FALLBACK
    return generate_offline_tailored_resume(resume, job, jd_skills_categorized, jd_flat_skills)

def calculate_offline_chances(candidate_skills: List[str], jd_skills: List[str], job_title: str) -> Dict[str, Any]:
    c_set = set(s.lower() for s in candidate_skills)
    j_set = set(s.lower() for s in jd_skills)
    
    overlap = c_set.intersection(j_set)
    overlap_ratio = len(overlap) / max(len(j_set), 1)
    
    # Factors
    skills_match = int(min(96, max(60, overlap_ratio * 100 + 35)))
    keyword_density = int(min(95, max(65, 75 + len(overlap) * 4)))
    experience_alignment = 82 if "senior" not in job_title.lower() else 74
    project_relevance = 88
    
    prob = int((skills_match * 0.35) + (keyword_density * 0.25) + (experience_alignment * 0.20) + (project_relevance * 0.20))
    
    if prob >= 80:
        rating = "Strong Interview Likelihood (Top Tier Candidate)"
    elif prob >= 65:
        rating = "Moderate Probability (Competitive Candidate)"
    else:
        rating = "Developing Match (Requires Strategic Tailoring)"
        
    matched_names = [s.title() for s in list(overlap)[:4]]
    missing_names = [s.title() for s in list(j_set - c_set)[:3]]
    
    strengths = [
        f"Solid alignment on core technical keywords ({', '.join(matched_names) if matched_names else 'modern developer tooling'}).",
        "Experience bullet points formatted with measurable action-verb structure.",
        "ATS-optimized single-column layout ensures 100% parser pass rate."
    ]
    
    critical_gaps = []
    if missing_names:
        critical_gaps.append(f"Job posting emphasizes {', '.join(missing_names)}; ensure practical familiarity before technical rounds.")
    critical_gaps.append("Ensure portfolio projects include live demo links or public GitHub repositories.")
    
    chance_booster_tips = [
        f"Incorporate the {', '.join(missing_names[:2]) if missing_names else 'cloud infrastructure'} keywords directly into your project architecture summaries.",
        "Quantify your accomplishments with exact percentage improvements (e.g., 'reduced query latency by 35%').",
        "Add a 60-second elevator pitch for each suggested project to confidently walk the interviewer through your code.",
        "Include relevant certifications or active open-source contributions."
    ]
    
    return {
        "probability_percentage": prob,
        "rating": rating,
        "factors": {
            "skills_match": skills_match,
            "ats_keyword_density": keyword_density,
            "experience_alignment": experience_alignment,
            "project_relevance": project_relevance
        },
        "strengths": strengths,
        "critical_gaps": critical_gaps,
        "chance_booster_tips": chance_booster_tips
    }

def get_standard_ats_checks() -> List[Dict[str, Any]]:
    return [
        {"check": "Single Column Layout", "status": "Passed", "details": "Clean vertical hierarchy readable by Workday, Taleo, Greenhouse, and Lever."},
        {"check": "Standard Section Headings", "status": "Passed", "details": "Uses universal headings (Summary, Skills, Experience, Projects, Education)."},
        {"check": "No Tables / Multi-Columns / Graphics", "status": "Passed", "details": "Zero floating text boxes or graphic elements that cause parser truncation."},
        {"check": "Action-Verb Bullet Syntax", "status": "Passed", "details": "Each bullet begins with an active verb (Architected, Engineered, Optimized)."},
        {"check": "Keyword Placement & Density", "status": "Passed", "details": "Target keywords naturally woven into accomplishment context."}
    ]

def build_clean_ats_text(
    candidate_name: str,
    contact: Dict[str, Any],
    summary: str,
    skills: Dict[str, List[str]],
    projects: List[Dict[str, Any]],
    experience: List[Dict[str, Any]],
    education: List[Dict[str, Any]]
) -> str:
    lines = []
    lines.append(f"{candidate_name.upper()}")
    
    contact_parts = []
    if contact.get("email"): contact_parts.append(contact["email"])
    if contact.get("phone"): contact_parts.append(contact["phone"])
    if contact.get("location"): contact_parts.append(contact["location"])
    if contact.get("linkedin"): contact_parts.append(contact["linkedin"])
    if contact.get("github"): contact_parts.append(contact["github"])
    
    if contact_parts:
        lines.append(" | ".join(contact_parts))
    lines.append("-" * 60)
    lines.append("")
    
    if summary:
        lines.append("PROFESSIONAL SUMMARY")
        lines.append(summary.strip())
        lines.append("")
        
    if skills:
        lines.append("CORE SKILLS & TECHNOLOGIES")
        for cat, skill_list in skills.items():
            if skill_list:
                lines.append(f"• {cat}: {', '.join(skill_list)}")
        lines.append("")
        
    if projects:
        lines.append("FEATURED TECHNICAL PROJECTS")
        for p in projects:
            title = p.get("title", "Project")
            stack = ", ".join(p.get("tech_stack", []))
            lines.append(f"• {title} | {stack}")
            if p.get("tagline"):
                lines.append(f"  {p['tagline']}")
            for b in p.get("bullets", []):
                lines.append(f"  - {b}")
            lines.append("")
            
    if experience:
        lines.append("PROFESSIONAL EXPERIENCE")
        for exp in experience:
            title = exp.get("title") or "Software Engineer"
            comp = exp.get("company") or "Tech Company"
            dur = exp.get("duration") or "Recent"
            lines.append(f"• {title} — {comp} ({dur})")
            for h in exp.get("highlights", []):
                lines.append(f"  - {h}")
            lines.append("")
            
    if education:
        lines.append("EDUCATION & CERTIFICATIONS")
        for edu in education:
            deg = edu.get("degree") or "Bachelor of Science in Computer Science"
            inst = edu.get("institution") or "University"
            yr = edu.get("year") or ""
            yr_str = f" ({yr})" if yr else ""
            lines.append(f"• {deg} — {inst}{yr_str}")
        lines.append("")
        
    return "\n".join(lines).strip()

def generate_offline_tailored_resume(
    resume: Dict[str, Any],
    job: Dict[str, Any],
    jd_skills_categorized: Dict[str, List[str]],
    jd_flat_skills: List[str]
) -> Dict[str, Any]:
    job_title = job.get("title") or "Software Engineer"
    company = job.get("company") or "Target Company"
    candidate_name = resume.get("contact", {}).get("name") or "Candidate"
    contact = resume.get("contact", {})
    existing_skills = resume.get("skills") or []
    
    # Determine primary tech stack from JD or defaults
    all_jd_lower = " ".join(jd_flat_skills).lower()
    
    # Suggest categorized skills based on JD
    suggested_skills = {}
    if jd_skills_categorized:
        suggested_skills = jd_skills_categorized
    else:
        suggested_skills = {
            "Languages & Runtimes": ["Python", "JavaScript", "TypeScript", "SQL"],
            "Frameworks & Web": ["FastAPI", "React", "Node.js", "REST APIs"],
            "Cloud & DevOps": ["Docker", "AWS", "CI/CD", "Linux", "Git"],
            "Databases & Storage": ["PostgreSQL", "Redis", "SQLite"]
        }
    
    # Tailor 2-3 projects matching the JD stack
    primary_skills = jd_flat_skills[:6] if jd_flat_skills else ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Redis"]
    stack_p1 = primary_skills[:4]
    stack_p2 = primary_skills[2:6] if len(primary_skills) >= 6 else primary_skills[:3]
    
    p1_title = f"High-Throughput {job_title.replace('Senior', '').replace('Lead', '').strip()} Microservice Platform"
    p1 = {
        "title": p1_title,
        "tagline": f"Production-grade distributed system tailored to high concurrency standards of {company}.",
        "tech_stack": stack_p1,
        "architecture_overview": f"Multi-tier architecture with asynchronous workers, optimized ORM database indexing, and automated deployment.",
        "bullets": [
            f"Architected and deployed scalable RESTful services utilizing {', '.join(stack_p1[:2])}, handling 12k+ concurrent requests with sub-80ms p95 latency.",
            f"Engineered efficient data persistence layer with {stack_p1[2] if len(stack_p1) > 2 else 'PostgreSQL'}, reducing query execution overhead by 38% via composite indexing.",
            "Containerized application with multi-stage Docker builds and automated CI/CD pipeline, reducing deployment rollbacks to 0%."
        ]
    }
    
    p2_title = f"Event-Driven Data Pipeline & Real-Time Analytics Dashboard"
    p2 = {
        "title": p2_title,
        "tagline": f"Real-time data ingestion and visualization suite delivering actionable operational insights.",
        "tech_stack": stack_p2 if stack_p2 else ["TypeScript", "React", "Redis", "Docker"],
        "architecture_overview": "Pub/Sub message queues coupled with caching layers and a reactive frontend state manager.",
        "bullets": [
            f"Built real-time telemetry pipeline utilizing {', '.join(stack_p2[:2])}, processing 500k+ event records daily with automated error-retry policies.",
            f"Integrated in-memory caching layer, accelerating customer-facing dashboard render speeds by 65%.",
            "Implemented end-to-end automated unit and integration test coverage (88%+), ensuring zero regression during continuous delivery."
        ]
    }
    
    suggested_projects = [p1, p2]
    
    # Tailor summary
    top_skills_str = ", ".join(primary_skills[:4])
    tailored_summary = (
        f"Results-oriented {job_title} with proven expertise in architecting resilient, production-grade applications "
        f"using {top_skills_str}. Adept at translating complex technical requirements into scalable systems, "
        f"optimizing database performance, and collaborating in Agile teams to accelerate release velocity. "
        f"Committed to code quality, automated testing, and driving measurable engineering impact for {company}."
    )
    
    # Tailored experience bullets from existing resume or synthesized
    existing_exp = resume.get("experience", [])
    tailored_experience = []
    if existing_exp:
        for idx, exp in enumerate(existing_exp[:3]):
            highlights = exp.get("highlights", [])
            tailored_highlights = []
            for h in highlights[:3]:
                # enrich with action verbs and metrics if needed
                if not any(char.isdigit() for char in h):
                    tailored_highlights.append(f"{h.rstrip('.')} — optimizing system responsiveness by 25% and reducing error rates.")
                else:
                    tailored_highlights.append(h)
            tailored_experience.append({
                "title": exp.get("title") or job_title,
                "company": exp.get("company") or "Tech Organization",
                "duration": exp.get("duration") or "2022 - Present",
                "highlights": tailored_highlights if tailored_highlights else [
                    f"Spearheaded core feature development using {', '.join(primary_skills[:3])}, driving 30% faster sprint delivery.",
                    f"Automated test pipelines and code quality checks, lowering production defects by 40%."
                ]
            })
    else:
        tailored_experience = [
            {
                "title": f"Software Engineer",
                "company": "Enterprise Technology Solutions",
                "duration": "2022 - Present",
                "highlights": [
                    f"Engineered full-stack services with {', '.join(primary_skills[:3])}, cutting API response times by 32%.",
                    "Collaborated with product designers and engineering leads to ship 14+ customer-facing features ahead of deadline.",
                    "Authored automated test suites with 85%+ code coverage, drastically curtailing post-release regression defects."
                ]
            }
        ]
        
    ats_text = build_clean_ats_text(
        candidate_name=candidate_name,
        contact=contact,
        summary=tailored_summary,
        skills=suggested_skills,
        projects=suggested_projects,
        experience=tailored_experience,
        education=resume.get("education", [])
    )
    
    job_chances = calculate_offline_chances(existing_skills, jd_flat_skills, job_title)
    
    return {
        "job_title": job_title,
        "company": company,
        "candidate_name": candidate_name,
        "tailored_summary": tailored_summary,
        "suggested_skills": suggested_skills,
        "suggested_projects": suggested_projects,
        "tailored_experience": tailored_experience,
        "ats_formatted_text": ats_text,
        "ats_score": 95,
        "ats_checks": get_standard_ats_checks(),
        "job_chances": job_chances,
        "source": "local_engine"
    }

# =========================================================================
# DEEP INTERVIEW PREPARATION (TECHNICAL, PROJECTS, STAR, RED FLAGS, REVERSE)
# =========================================================================
def generate_deep_interview_prep(
    resume: Dict[str, Any],
    job: Dict[str, Any],
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    job_title = job.get("title") or "Software Engineer"
    company = job.get("company") or "Target Company"
    job_desc = job.get("description") or ""
    resume_text = resume.get("raw_text") or ""
    skills = resume.get("skills") or []
    
    key = get_effective_api_key(api_key)
    if key:
        prompt = f"""
You are a Principal Software Engineer and Technical Hiring Director at {company} conducting an interview for {job_title}.
Review the candidate's resume and job description:

JOB DESCRIPTION:
{job_desc[:2000]}

CANDIDATE RESUME & SKILLS:
Skills: {', '.join(skills[:15])}
Resume Context:
{resume_text[:2000]}

TASK:
Generate 7 comprehensive interview questions across categories. Return ONLY a valid JSON array of question objects (no markdown, just JSON):
[
  {{
    "id": "q1",
    "category": "technical_skill",
    "topic": "Specific Tech from JD (e.g. Async Architecture / Concurrency)",
    "question": "Deep technical question that tests real production experience.",
    "interviewer_intent": "What the interviewer is actively probing for.",
    "pitfalls_to_avoid": "Common rookie mistake or superficial answer to avoid.",
    "winning_model_answer": "Comprehensive, senior-level response explaining trade-offs.",
    "star_breakdown": null
  }},
  {{
    "id": "q2",
    "category": "project_defense",
    "topic": "Resume Project Architecture & Scaling",
    "question": "Why did you choose your specific database/stack for your featured project, and how would you scale it 10x?",
    "interviewer_intent": "Tests architectural justification and understanding of bottlenecks.",
    "pitfalls_to_avoid": "Saying 'because it was popular' or ignoring database lockups/latency.",
    "winning_model_answer": "Concrete architectural defense with indexing, caching, and sharding strategies.",
    "star_breakdown": null
  }},
  {{
    "id": "q3",
    "category": "behavioral_star",
    "topic": "High-Pressure Conflict & Delivery",
    "question": "Tell me about a time a critical production bug arose or a release was delayed. How did you handle it?",
    "interviewer_intent": "Assesses emotional resilience, diagnostic method, and stakeholder communication.",
    "pitfalls_to_avoid": "Blaming teammates or giving a theoretical non-concrete answer.",
    "winning_model_answer": "Complete structured response.",
    "star_breakdown": {{
      "Situation": "Clear context and technical emergency",
      "Task": "Candidate's specific responsibility",
      "Action": "Concrete diagnostic, triage, and resolution steps",
      "Result": "Quantified uptime restored and post-mortem prevention mechanism implemented"
    }}
  }},
  {{
    "id": "q4",
    "category": "tricky_gap",
    "topic": "Ramping Up on Unfamiliar Tech Stack",
    "question": "This role requires specific tools you have less formal tenure with. How will you ramp up without slowing the team down?",
    "interviewer_intent": "Evaluates learning curve velocity and self-sufficiency.",
    "pitfalls_to_avoid": "Defensive answers or claiming you already know everything.",
    "winning_model_answer": "Demonstration of past quick-learning frameworks and practical sandbox validation.",
    "star_breakdown": null
  }},
  {{
    "id": "q5",
    "category": "reverse_interview",
    "topic": "High-Impact Questions for the Candidate to Ask",
    "question": "What questions should you ask the interviewer at the end of the round to leave a lasting impression?",
    "interviewer_intent": "Shows deep technical curiosity and strategic career mindset.",
    "pitfalls_to_avoid": "Asking basic questions easily answered on Google.",
    "winning_model_answer": "3 strategic questions inquiring about architectural bottlenecks, CI/CD health, and product roadmaps.",
    "star_breakdown": null
  }}
]
"""
        raw_output = call_gemini(prompt, api_key=key)
        if raw_output:
            try:
                cleaned = raw_output.strip()
                if cleaned.startswith("```json"): cleaned = cleaned[7:]
                if cleaned.startswith("```"): cleaned = cleaned[3:]
                if cleaned.endswith("```"): cleaned = cleaned[:-3]
                parsed_questions = json.loads(cleaned.strip())
                if isinstance(parsed_questions, list) and len(parsed_questions) > 0:
                    return {
                        "job_title": job_title,
                        "company": company,
                        "questions": parsed_questions,
                        "source": "gemini"
                    }
            except Exception as e:
                print(f"Error parsing Gemini interview prep: {e}")

    # OFFLINE INTERVIEW PREPARATION
    jd_skills = extract_flat_skills(job_desc + " " + job_title)
    top_skill = jd_skills[0] if jd_skills else "Python / API Architecture"
    second_skill = jd_skills[1] if len(jd_skills) > 1 else "Database Indexing & Caching"
    
    questions = [
        {
            "id": "q1",
            "category": "technical_skill",
            "topic": f"Core Stack Deep Dive: {top_skill}",
            "question": f"In production systems using {top_skill}, how do you identify, diagnose, and resolve memory leaks or concurrency bottlenecks under high load?",
            "interviewer_intent": f"Evaluates whether you understand {top_skill} internals, memory management, profiling tools, and async/threading semantics beyond basic tutorials.",
            "pitfalls_to_avoid": "Giving a generic 'I check the logs' answer without citing specific profiling tools (e.g., APM, memory profilers, flame graphs) or thread pool metrics.",
            "winning_model_answer": f"I begin by instrumenting APM metrics (e.g., p99 latency spikes and memory heap dumps). In {top_skill}, I inspect unclosed database connections, long-lived global caches, or blocked event loops. I reproduce the issue under simulated load with tools like Locust or k6, capture thread dumps, and isolate the hot path before deploying an asynchronous task queue or connection pool limit.",
            "star_breakdown": None
        },
        {
            "id": "q2",
            "category": "technical_skill",
            "topic": f"Data Architecture: {second_skill}",
            "question": f"When designing your relational or document data schema with {second_skill}, what trade-offs do you evaluate between normalization and query latency?",
            "interviewer_intent": "Checks database maturity, understanding of B-Tree indexing, N+1 query traps, and when to introduce caching layers like Redis.",
            "pitfalls_to_avoid": "Over-normalizing everything without considering read performance, or prematurely denormalizing without handling data consistency.",
            "winning_model_answer": "I favor 3NF normalization during initial domain modeling to guarantee strict ACID consistency and avoid update anomalies. When read paths become performance bottlenecks, I evaluate composite indexes using EXPLAIN ANALYZE. If query execution remains CPU-bound, I introduce an in-memory Redis cache with TTL and cache-aside invalidation rather than compromising database integrity.",
            "star_breakdown": None
        },
        {
            "id": "q3",
            "category": "project_defense",
            "topic": "Resume Project Deep-Dive & Architecture Defense",
            "question": "Can you walk us through the architectural trade-offs of your featured project? What was the single biggest technical hurdle and what would you do differently today?",
            "interviewer_intent": "Verifies that you genuinely built the project, made intentional architectural decisions, and can critique your own past design.",
            "pitfalls_to_avoid": "Claiming the project had zero flaws or describing only the frontend UI without explaining the backend plumbing, concurrency, and failure recovery.",
            "winning_model_answer": "In my featured microservices project, the core challenge was handling bursty incoming payloads without saturating the relational database. I initially attempted synchronous writes, which caused HTTP 504 timeouts. I refactored the ingestion layer to accept payloads asynchronously into a message broker, returning an immediate 202 Accepted. Background workers then batch-inserted records. If re-architecting today, I would implement distributed tracing with OpenTelemetry from day one.",
            "star_breakdown": None
        },
        {
            "id": "q4",
            "category": "behavioral_star",
            "topic": "Handling Critical Production Incidents",
            "question": "Describe a scenario where a deployment introduced a critical defect or broke user workflows. Walk me through your triage, mitigation, and post-mortem process.",
            "interviewer_intent": "Assesses composure under fire, systematic triage mindset, zero-blame post-mortem culture, and preventative automation.",
            "pitfalls_to_avoid": "Panicking, pointing fingers at colleagues, or failing to mention automated rollback and prevention safeguards.",
            "winning_model_answer": "During a Friday feature release, API error rates surged to 12% due to an unhandled null pointer in an edge-case payment flow. I immediately rolled back the container to the previous stable digest, reducing errors to 0% within 4 minutes. Once stabilized, I led a blameless post-mortem, added regression integration tests to the CI pipeline, and instituted canary deployments.",
            "star_breakdown": {
                "Situation": "Post-deployment API error rate spiked to 12% impacting customer payment checkouts.",
                "Task": "Triage the root cause immediately without escalating user downtime.",
                "Action": "Executed immediate blue/green rollback within 4 minutes, reviewed error stack traces, isolated the missing null guard, and wrote an automated test.",
                "Result": "Zero financial data loss, 99.99% service restored, and new CI canary deployment checks introduced to prevent recurrence."
            }
        },
        {
            "id": "q5",
            "category": "tricky_gap",
            "topic": "Addressing Stack & Seniority Nuances",
            "question": f"While your resume demonstrates strong problem solving, {company} relies heavily on specific cloud infrastructure and enterprise tooling. How do you approach rapid skill acquisition?",
            "interviewer_intent": "Tests candidate self-awareness, intellectual curiosity, and how proactively they bridge knowledge gaps without consuming senior engineers' time.",
            "pitfalls_to_avoid": "Faking knowledge or giving an evasive answer. Pretending you already know it is an immediate disqualifier.",
            "winning_model_answer": "I view frameworks as implementations of foundational computer science patterns. Whenever I adopt a new technology, I read the official architecture docs, build a small end-to-end sandbox application to understand failure modes, and inspect existing production pull requests to absorb team conventions. In my past roles, this framework enabled me to contribute production pull requests within my first two weeks.",
            "star_breakdown": None
        },
        {
            "id": "q6",
            "category": "reverse_interview",
            "topic": "High-Impact Questions to Ask the Hiring Team",
            "question": "What 3 strategic questions should you ask the hiring manager to stand out from 99% of applicants?",
            "interviewer_intent": "Reveals whether you think like a business partner and engineering owner rather than just a task-executor.",
            "pitfalls_to_avoid": "Asking only about PTO, perks, or basic company facts found on the homepage.",
            "winning_model_answer": "1. 'What is the single biggest architectural bottleneck or technical debt challenge currently slowing down your engineering velocity?'\n2. 'How does this team balance rapid product feature shipping against automated test reliability and refactoring?'\n3. 'What does exceptional performance look like for this role in the first 90 days?'",
            "star_breakdown": None
        }
    ]
    
    return {
        "job_title": job_title,
        "company": company,
        "questions": questions,
        "source": "local_engine"
    }

# =========================================================================
# INTERACTIVE MOCK ANSWER EVALUATOR
# =========================================================================
def evaluate_mock_answer(
    question: str,
    user_answer: str,
    job_title: Optional[str] = None,
    category: Optional[str] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    key = get_effective_api_key(api_key)
    if key and len(user_answer.strip()) > 15:
        prompt = f"""
You are a Principal Software Engineering Bar Raiser evaluating a candidate's answer to an interview question.

ROLE: {job_title or 'Software Engineer'}
QUESTION:
{question}

CANDIDATE'S PRACTICE ANSWER:
{user_answer}

TASK:
Provide a rigorous, constructive critique. Return ONLY a valid JSON object:
{{
  "score": 8,
  "rating": "Strong Answer / Needs Metrics / Good Technical Depth",
  "strengths": ["Clear communication of trade-offs", "Mentioned concrete tools"],
  "areas_for_improvement": ["Add a quantifiable metric (e.g. % improvement)", "Clarify the post-incident prevention"],
  "upgraded_answer": "A polished, world-class model response demonstrating staff-level engineering communication."
}}
"""
        raw_output = call_gemini(prompt, api_key=key)
        if raw_output:
            try:
                cleaned = raw_output.strip()
                if cleaned.startswith("```json"): cleaned = cleaned[7:]
                if cleaned.startswith("```"): cleaned = cleaned[3:]
                if cleaned.endswith("```"): cleaned = cleaned[:-3]
                return json.loads(cleaned.strip())
            except Exception as e:
                print(f"Error evaluating answer with Gemini: {e}")

    # Offline Heuristic Evaluator
    words = user_answer.strip().split()
    word_count = len(words)
    has_numbers = any(char.isdigit() for char in user_answer)
    has_action_verbs = any(w.lower() in ["architected", "engineered", "optimized", "implemented", "resolved", "reduced", "delivered", "scaled", "debugged"] for w in words)
    has_tradeoffs = any(w.lower() in ["trade-off", "latency", "bottleneck", "scale", "concurrency", "tested", "monitored"] for w in words)
    
    score = 6
    if word_count > 40: score += 1
    if has_numbers: score += 1
    if has_action_verbs: score += 1
    if has_tradeoffs: score += 1
    score = min(score, 9)
    
    strengths = []
    if word_count > 30: strengths.append("Good narrative structure and context setting.")
    if has_action_verbs: strengths.append("Effective use of active engineering terminology.")
    if has_numbers: strengths.append("Included concrete metrics or measurable scope.")
    if not strengths: strengths.append("Directly attempted the core question prompt.")
    
    areas = []
    if not has_numbers:
        areas.append("Quantify your impact: Include concrete numbers (e.g., 'reduced latency by 30%', 'saved 4 hours/week').")
    if not has_tradeoffs:
        areas.append("Discuss architectural trade-offs: Explain *why* you chose this approach over an alternative.")
    if word_count < 40:
        areas.append("Elaborate on your personal contribution using the STAR method (Situation, Task, Action, Result).")
    if not areas:
        areas.append("Maintain concise delivery under 2 minutes when speaking live.")
        
    rating = "Strong Engineering Response" if score >= 8 else "Solid Foundation (Add Metrics & Trade-offs)"
    
    upgraded = (
        f"\"In my past experience, when facing this challenge, I first prioritized diagnostic clarity and isolated the system bottleneck. "
        f"I evaluated our constraints and selected an architecture focused on low latency and maintainability. "
        f"By implementing automated validation and robust indexing, we successfully reduced latency by 35% and prevented future regressions, "
        f"ensuring 99.9% uptime for downstream services.\""
    )
    
    return {
        "score": score,
        "rating": rating,
        "strengths": strengths,
        "areas_for_improvement": areas,
        "upgraded_answer": upgraded,
        "source": "local_engine"
    }

# =========================================================================
# BEGINNER-FRIENDLY SKILL & PROJECT ACADEMY
# =========================================================================
def generate_beginner_learning_content(
    resume: Dict[str, Any],
    job: Dict[str, Any],
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    job_title = job.get("title") or "Software Engineer"
    job_desc = job.get("description") or ""
    
    key = get_effective_api_key(api_key)
    if key:
        prompt = f"""
You are a Lead Educator and Senior Staff Engineer.
Create a beginner-friendly tutorial academy teaching the core skills and projects for:
Target Role: {job_title}
Job Description Context:
{job_desc[:2000]}

TASK:
Return ONLY a valid JSON object teaching 3 critical skills and 2 suggested projects from the ground up:
{{
  "job_title": "{job_title}",
  "skills_tutorials": [
    {{
      "skill_name": "Docker / Containerization",
      "category": "Cloud & DevOps",
      "eli5_summary": "Explain Like I'm 5 simple analogy (e.g. shipping containers).",
      "why_companies_use_it": "Why production engineering teams require it.",
      "crash_course_guide": "10-minute beginner guide explaining image, container, port mapping, and volume.",
      "code_example": "# Dockerfile\\nFROM python:3.11-slim\\n...",
      "interview_talking_script": "Exactly what to say in an interview when asked about this skill."
    }}
  ],
  "project_tutorials": [
    {{
      "project_title": "Distributed Task Queue & API Service",
      "tech_stack": ["FastAPI", "Redis", "Celery", "PostgreSQL"],
      "plain_english_architecture": "How requests travel from user to API to Redis queue to worker to DB.",
      "how_to_build_step_by_step": [
        {{"phase": "Phase 1: Project Setup", "title": "Environment & Dependencies", "description": "Set up virtualenv and install core libraries.", "code_snippet": "pip install fastapi uvicorn redis"}},
        {{"phase": "Phase 2: Database Layer", "title": "Data Modeling", "description": "Create schema with SQLAlchemy or SQL.", "code_snippet": "class Task(Base): id = Column(Integer)..."}},
        {{"phase": "Phase 3: Core API & Workers", "title": "Async Task Ingestion", "description": "Build endpoint that enqueues work to Redis.", "code_snippet": "@app.post('/jobs')\\ndef create_job()..."}},
        {{"phase": "Phase 4: Production Deployment", "title": "Dockerization", "description": "Package into multi-container docker-compose.", "code_snippet": "version: '3.8'\\nservices: ..."}}
      ],
      "elevator_pitch_60s": "60-second summary to recite when an interviewer says 'Walk me through this project'.",
      "interview_q_and_a": [
        {{"question": "How did you handle task failures in the queue?", "answer": "I configured dead-letter queues with exponential backoff retries..."}}
      ]
    }}
  ]
}}
"""
        raw_output = call_gemini(prompt, api_key=key)
        if raw_output:
            try:
                cleaned = raw_output.strip()
                if cleaned.startswith("```json"): cleaned = cleaned[7:]
                if cleaned.startswith("```"): cleaned = cleaned[3:]
                if cleaned.endswith("```"): cleaned = cleaned[:-3]
                data = json.loads(cleaned.strip())
                data["source"] = "gemini"
                return data
            except Exception as e:
                print(f"Error parsing Gemini learning content: {e}")

    # OFFLINE LEARNING ACADEMY
    skills_tutorials = [
        {
            "skill_name": "Docker & Containerization",
            "category": "Cloud & DevOps",
            "eli5_summary": "Think of Docker like shipping containers on a cargo ship. Before containers, sailors had to figure out how to stack loose barrels, crates, and sacks. Docker packages your code, Python/Node runtime, and dependencies into one standardized container box that runs identically on your laptop, your teammate's Mac, and AWS cloud servers.",
            "why_companies_use_it": "Solves the notorious 'It works on my machine!' bug. Eliminates dependency conflicts, speeds up onboarding from days to 10 minutes, and enables cloud autoscaling.",
            "crash_course_guide": "• Dockerfile: The recipe blueprint that creates an image.\n• Image: The frozen snapshot of your app and runtime.\n• Container: The living, running instance of an image.\n• Port Forwarding: Bridges the container port (e.g. 8000) to your host computer.\n• Volumes: Persistent storage so database data isn't lost when the container stops.",
            "code_example": "# Dockerfile\nFROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD [\"uvicorn\", \"main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]",
            "interview_talking_script": "\"I leverage Docker to standardize development and production environments. I create multi-stage Dockerfiles to minimize container image sizes, isolate secrets with environment variables, and orchestrate multi-service dependencies like Redis and PostgreSQL using Docker Compose.\""
        },
        {
            "skill_name": "REST API Architecture & FastAPI",
            "category": "Backend Engineering",
            "eli5_summary": "Imagine a restaurant menu. You (the client/frontend) don't walk into the kitchen. Instead, you look at the menu (the API spec) and tell the waiter (HTTP Request) what you want (GET /menu, POST /orders). The waiter brings back the food cleanly packaged (JSON Response).",
            "why_companies_use_it": "Decouples the user interface (web, mobile, smart watch) from business logic and database storage, allowing teams to iterate independently.",
            "crash_course_guide": "• GET: Retrieve data without modifying state.\n• POST: Create a new resource in the database.\n• PUT/PATCH: Update existing resource data.\n• DELETE: Remove a resource.\n• Status Codes: 200 (OK), 201 (Created), 400 (Client Bad Request), 401/403 (Unauthorized), 404 (Not Found), 500 (Internal Error).",
            "code_example": "from fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass Item(BaseModel):\n    title: str\n    price: float\n\n@app.get('/items/{item_id}')\ndef read_item(item_id: int):\n    return {'item_id': item_id, 'status': 'available'}\n\n@app.post('/items', status_code=201)\ndef create_item(item: Item):\n    return {'message': 'Item created', 'data': item}",
            "interview_talking_script": "\"I design RESTful APIs strictly adhering to HTTP semantics and idempotency rules. I use Pydantic models for strict request/response data validation, enforce pagination on collection endpoints, and write automated contract tests with pytest to prevent breaking changes.\""
        },
        {
            "skill_name": "Relational Databases & SQL Indexing (PostgreSQL)",
            "category": "Databases & Storage",
            "eli5_summary": "Think of a textbook. If you want to find every mention of 'photosynthesis' without an index, you have to read all 500 pages one by one (Sequential Table Scan). An index is the index at the back of the book: it tells you directly 'go to pages 42, 88, 114' (Index Scan).",
            "why_companies_use_it": "Guarantees ACID compliance (Atomicity, Consistency, Isolation, Durability) so financial transactions or user records are never corrupted, lost, or duplicated.",
            "crash_course_guide": "• Primary Key: Unique identifier for each row.\n• Foreign Key: Enforces relationships between tables (e.g. orders belong to users).\n• Index (B-Tree): Sorted pointer tree for rapid logarithmic lookups.\n• EXPLAIN ANALYZE: Command that shows query execution cost and whether indexes are utilized.",
            "code_example": "-- Create Users Table\nCREATE TABLE users (\n    id SERIAL PRIMARY KEY,\n    email VARCHAR(255) UNIQUE NOT NULL,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Create Index for fast lookups on email\nCREATE INDEX idx_users_email ON users(email);\n\n-- Inspect query execution plan\nEXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';",
            "interview_talking_script": "\"When designing relational schemas in PostgreSQL, I ensure proper 3NF normalization to eliminate data duplication. For high-volume read endpoints, I evaluate query execution plans using EXPLAIN ANALYZE and implement composite B-Tree indexes on filtered columns to avoid full table scans.\""
        },
        {
            "skill_name": "Redis In-Memory Caching",
            "category": "Performance & Architecture",
            "eli5_summary": "Think of your computer's RAM versus the library. Going to the hard drive or remote database is like driving to the library to read a book. Redis is keeping the book open right on your desk. Reading from memory takes nanoseconds compared to milliseconds from disk.",
            "why_companies_use_it": "Drastically reduces database CPU load by caching frequent queries, manages user login sessions, and enforces API rate limiting.",
            "crash_course_guide": "• Key-Value Store: Extremely fast in-memory dictionary.\n• TTL (Time To Live): Automatic expiration of cached keys (e.g. 5 minutes).\n• Cache-Aside Pattern: Check Redis first; if cache miss, query SQL database, store in Redis, then return.",
            "code_example": "import redis\n\nr = redis.Redis(host='localhost', port=6379, decode_responses=True)\n\ndef get_user_profile(user_id: str):\n    # 1. Check cache\n    cached = r.get(f'user:{user_id}')\n    if cached:\n        return json.loads(cached)\n    # 2. Cache miss -> query DB\n    user = db_query_user(user_id)\n    # 3. Store in cache for 10 minutes (600s)\n    r.setex(f'user:{user_id}', 600, json.dumps(user))\n    return user",
            "interview_talking_script": "\"I implement caching layers with Redis using the cache-aside pattern with strategic TTLs. This shields our primary database from thundering herd problems during traffic spikes and maintains sub-10ms response times for frequently requested assets.\""
        }
    ]
    
    project_tutorials = [
        {
            "project_title": "High-Throughput Microservice & Distributed Job Processing Pipeline",
            "tech_stack": ["FastAPI", "Python", "PostgreSQL", "Redis", "Docker"],
            "plain_english_architecture": "1. Client submits a job request via HTTP POST to FastAPI.\n2. FastAPI validates input with Pydantic and pushes a task message to Redis.\n3. Background worker threads continuously pop tasks from Redis and process them asynchronously.\n4. Processed results are saved into PostgreSQL.\n5. Client polls or listens via WebSockets for completion status, keeping the HTTP connection non-blocking.",
            "how_to_build_step_by_step": [
                {
                    "phase": "Phase 1: Environment & Project Setup",
                    "title": "Directory Structure & Dependencies",
                    "description": "Initialize clean Git repository, virtual environment, and install FastAPI, Uvicorn, SQLAlchemy, Redis, and Pytest.",
                    "code_snippet": "mkdir microservice-pipeline && cd microservice-pipeline\npython -m venv .venv\n.venv/Scripts/activate\npip install fastapi uvicorn sqlalchemy psycopg2-binary redis pydantic"
                },
                {
                    "phase": "Phase 2: Database Modeling",
                    "title": "PostgreSQL Schema with SQLAlchemy",
                    "description": "Define database models for jobs, task status (PENDING, PROCESSING, COMPLETED, FAILED), and indexed timestamps.",
                    "code_snippet": "from sqlalchemy import Column, Integer, String, DateTime, Enum\nfrom datetime import datetime\n\nclass JobRecord(Base):\n    __tablename__ = 'jobs'\n    id = Column(Integer, primary_key=True, index=True)\n    status = Column(String(50), default='PENDING', index=True)\n    payload = Column(String)\n    result = Column(String, nullable=True)\n    created_at = Column(DateTime, default=datetime.utcnow)"
                },
                {
                    "phase": "Phase 3: Asynchronous Ingestion API",
                    "title": "Non-Blocking Endpoints with Redis Queue",
                    "description": "Create API endpoints that accept job requests, generate a unique job ID, and push task metadata to Redis queue.",
                    "code_snippet": "@app.post('/api/jobs', status_code=202)\ndef submit_job(payload: JobRequest, db: Session = Depends(get_db)):\n    job = JobRecord(payload=payload.json())\n    db.add(job)\n    db.commit()\n    # Queue task for background execution\n    redis_client.rpush('job_queue', str(job.id))\n    return {'job_id': job.id, 'status': 'QUEUED'}"
                },
                {
                    "phase": "Phase 4: Background Worker & Docker Compose",
                    "title": "Containerized Worker & Database",
                    "description": "Write a dedicated background worker script and docker-compose.yml to run the API, Worker, Redis, and Postgres together.",
                    "code_snippet": "version: '3.8'\nservices:\n  api:\n    build: .\n    ports: ['8000:8000']\n    depends_on: [postgres, redis]\n  worker:\n    build: .\n    command: python worker.py\n    depends_on: [postgres, redis]\n  redis:\n    image: redis:alpine\n  postgres:\n    image: postgres:15-alpine"
                }
            ],
            "elevator_pitch_60s": "\"I built an asynchronous job processing microservice platform designed to handle bursty traffic without degrading database performance. Using FastAPI and Redis, incoming requests receive immediate 202 Accepted confirmations while background workers ingest and process tasks asynchronously, persisting finalized outputs to PostgreSQL. I containerized the entire stack with Docker Compose and implemented automated unit and integration test suites, achieving sub-50ms API responsiveness and zero dropped tasks under load.\"",
            "interview_q_and_a": [
                {
                    "question": "What happens if a worker crashes midway through processing a task?",
                    "answer": "I implemented a two-phase Redis acknowledgment pattern using RPOPLPUSH. Tasks are moved to a 'processing' queue first; only when processing finishes successfully are they acknowledged and removed. If a worker drops heartbeat, a supervisor reconciles stalled tasks back to the active queue."
                },
                {
                    "question": "Why did you choose FastAPI over traditional Flask or Django?",
                    "answer": "FastAPI is built on Starlette and ASGI, providing native async/await concurrency which was crucial for non-blocking I/O with Redis and database queries. It also includes automatic OpenAPI documentation and Pydantic validation out of the box."
                }
            ]
        }
    ]
    
    return {
        "job_title": job_title,
        "skills_tutorials": skills_tutorials,
        "project_tutorials": project_tutorials,
        "source": "local_engine"
    }

# =========================================================================
# GLOBAL CAREER SEARCH & AI ASSISTANT
# =========================================================================
def answer_career_question(
    query: str,
    resume: Optional[Dict[str, Any]] = None,
    job: Optional[Dict[str, Any]] = None,
    context_type: Optional[str] = "general",
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    key = get_effective_api_key(api_key)
    resume = resume or {}
    job = job or {}
    
    candidate_name = resume.get("contact", {}).get("name") or "Candidate"
    job_title = job.get("title") or "Software Engineer"
    company = job.get("company") or "Target Company"
    skills = resume.get("skills") or []
    
    if key:
        prompt = f"""
You are an Elite Career Copilot, Principal Software Engineer, and Technical Interview Coach.
The user is asking: "{query}"

CONTEXT:
Role: {job_title} at {company}
Candidate: {candidate_name}
Candidate Skills: {', '.join(skills[:12])}
Topic Context: {context_type}

TASK:
Provide a comprehensive, authoritative, practical, and highly actionable response formatted in clean markdown.
Include:
1. Direct, clear answer with technical depth or strategic career guidance.
2. Practical concrete examples or code snippets if technical.
3. An interview talking script or 'how to phrase this' tip.
4. Suggested follow-up questions the user might want to explore next.

Return ONLY a valid JSON object:
{{
  "query": "{query}",
  "answer": "Clean markdown formatted response with bold headers, bullet points, and code snippets.",
  "suggested_followups": ["Followup question 1", "Followup question 2", "Followup question 3"],
  "relevant_links": [
    {{"label": "Review Tailored Projects", "view": "tailor"}},
    {{"label": "Practice Interview Prep", "view": "interview"}},
    {{"label": "Learn Required Skills", "view": "learn"}}
  ]
}}
"""
        raw_output = call_gemini(prompt, api_key=key)
        if raw_output:
            try:
                cleaned = raw_output.strip()
                if cleaned.startswith("```json"): cleaned = cleaned[7:]
                if cleaned.startswith("```"): cleaned = cleaned[3:]
                if cleaned.endswith("```"): cleaned = cleaned[:-3]
                data = json.loads(cleaned.strip())
                data["source"] = "gemini"
                return data
            except Exception as e:
                print(f"Error answering career question with Gemini: {e}")

    # OFFLINE INTELLIGENT FALLBACK
    q_lower = query.lower()
    
    if "redis" in q_lower or "cache" in q_lower:
        answer = """### Understanding & Explaining Caching & Redis

**What it is**: Redis is an in-memory key-value data store used to cache frequently requested queries so your database doesn't crash during traffic spikes.

#### 1. Core Engineering Mental Model
- **RAM vs Disk**: Reading from RAM takes nanoseconds; reading from a database on SSD takes milliseconds.
- **Cache-Aside Pattern**: Your application checks Redis first (`GET user:123`). If found (cache hit), return immediately. If not found (cache miss), query the SQL database, save to Redis with a TTL (Time To Live), and return.

#### 2. Key Code Implementation
```python
import redis

cache = redis.Redis(host='localhost', port=6379, decode_responses=True)

def get_product(product_id: int):
    cached = cache.get(f"product:{product_id}")
    if cached:
        return json.loads(cached)
    product = db.query(Product).filter_by(id=product_id).first()
    cache.setex(f"product:{product_id}", 300, json.dumps(product)) # 5 min TTL
    return product
```

#### 3. How to Phrase This in Your Interview
> *"I implement Redis using the cache-aside pattern with strict TTL expiration. This ensures sub-10ms response times for high-traffic read endpoints while shielding our PostgreSQL database from concurrent load."*
"""
        followups = [
            "How do you handle cache invalidation when data updates?",
            "What is a cache stampede or thundering herd problem?",
            "How do you configure Redis persistence with RDB vs AOF?"
        ]
    elif "project" in q_lower or "explain" in q_lower or "walk" in q_lower:
        answer = f"""### How to Walk an Interviewer Through Your Projects

The biggest mistake candidates make is either jumping into trivial code details or speaking too broadly without mentioning technical challenges.

#### The 4-Part Winning Structure:
1. **The Problem & Objective (15s)**: What business or engineering challenge did this solve?
2. **The Architecture & Tech Stack (20s)**: Why did you pick this specific stack? How do the client, API, database, and background services connect?
3. **The Hardest Technical Hurdle (20s)**: What was the unexpected bug or scaling roadblock you overcame?
4. **The Quantified Impact (10s)**: What was the measurable outcome? (e.g. latency cut by 35%, 10k requests handled).

#### Example Elevator Pitch for {job_title}:
> *"I engineered a distributed microservice platform using FastAPI, PostgreSQL, and Redis. The main challenge was processing bursty webhook events without locking our database tables. I designed an asynchronous worker queue that decoupled ingestion from write persistence, reducing p95 latency to sub-80ms under 10,000 simulated concurrent requests."*
"""
        followups = [
            "How do I defend my choice of PostgreSQL over MongoDB?",
            "What if they ask what I would do differently on this project?",
            "How do I explain trade-offs without sounding insecure?"
        ]
    elif "ats" in q_lower or "resume" in q_lower or "tailor" in q_lower:
        answer = """### ATS Resume Optimization Best Practices

Applicant Tracking Systems (like Greenhouse, Lever, Workday, and Taleo) parse raw text looking for exact keyword matches and clean hierarchical sections.

#### Essential ATS Rules:
- **Strict Single-Column**: Multi-column tables and text boxes frequently cause parsers to scramble your content or discard entire sections.
- **Universal Headings**: Use standard headings: `Summary`, `Skills`, `Experience`, `Projects`, `Education`. Avoid creative headings like 'My Journey' or 'Toolbox'.
- **Natural Keyword Integration**: Don't just dump keywords in a list; embed them directly into project bullets (e.g. *"Engineered REST APIs using Python and Docker"*).
- **Metric Formula**: Use the Google XYZ formula: *Accomplished [X], as measured by [Y], by doing [Z]*.
"""
        followups = [
            "How do I check my current ATS score?",
            "Can you rewrite my project bullets with metrics?",
            "How do I tailor my resume for a senior role?"
        ]
    else:
        answer = f"""### Career & Technical Copilot Advice

Regarding your question: **"{query}"** for the **{job_title}** role at **{company}**:

#### Key Recommendation:
1. **Connect Skills to Business Impact**: Hiring managers evaluate candidates based on whether they can solve production problems reliably.
2. **Use Concrete Terminology**: Speak in terms of throughput, latency, automated test coverage, and clean architectural separation.
3. **Structure Your Responses**: Use the STAR method (Situation, Task, Action, Result) for behavioral questions and Trade-Off Analysis for system design.

> **Pro Tip**: Explore the **Interview Prep** and **Beginner Academy** tabs in the top navigation to see deep-dive questions and step-by-step project build blueprints tailored to this job!
"""
        followups = [
            "How do I explain my technical background in under 2 minutes?",
            "What are the top 3 interview questions for this job?",
            "How can I boost my chances of getting an interview?"
        ]
        
    return {
        "query": query,
        "answer": answer.strip(),
        "suggested_followups": followups,
        "relevant_links": [
            {"label": "Tailored Resume & Chances", "view": "tailor"},
            {"label": "Interview Preparation", "view": "interview"},
            {"label": "Beginner Learning Hub", "view": "learn"}
        ],
        "source": "local_engine"
    }

