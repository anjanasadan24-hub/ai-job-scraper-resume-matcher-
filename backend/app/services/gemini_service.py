import os
from typing import Dict, Any, List, Optional
from app.core.database import get_setting

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
