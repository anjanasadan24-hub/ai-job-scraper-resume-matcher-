import re
from typing import Dict, List, Tuple, Any, Optional
from pathlib import Path
import pypdf
import docx

SKILL_TAXONOMY = {
    "Languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "golang", "go", "rust",
        "ruby", "php", "swift", "kotlin", "scala", "r", "sql", "bash", "shell", "html", "css"
    ],
    "Frameworks & Libraries": [
        "react", "react.js", "next.js", "vue", "vue.js", "angular", "node.js", "nodejs", "express",
        "fastapi", "flask", "django", "spring boot", "asp.net", "laravel", "rails",
        "pytorch", "tensorflow", "keras", "pandas", "numpy", "scikit-learn", "scipy",
        "tailwind", "tailwind css", "bootstrap", "graphql", "rest", "restful"
    ],
    "Cloud & DevOps": [
        "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes",
        "k8s", "terraform", "ansible", "jenkins", "github actions", "gitlab ci", "ci/cd",
        "linux", "unix", "nginx", "apache", "helm", "prometheus", "grafana"
    ],
    "Databases & Messaging": [
        "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
        "cassandra", "dynamodb", "kafka", "rabbitmq", "snowflake", "bigquery"
    ],
    "Tools & Concepts": [
        "git", "github", "gitlab", "jira", "agile", "scrum", "microservices",
        "system design", "rest api", "unit testing", "tdd", "ci/cd pipelines",
        "object-oriented programming", "oop", "distributed systems"
    ]
}

ALL_SKILLS = set()
for category, skills in SKILL_TAXONOMY.items():
    for s in skills:
        ALL_SKILLS.add(s.lower())

def extract_text_from_file(file_path: Path) -> str:
    ext = file_path.suffix.lower()
    text = ""
    try:
        if ext == ".pdf":
            reader = pypdf.PdfReader(str(file_path))
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        elif ext in [".docx", ".doc"]:
            doc = docx.Document(str(file_path))
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif ext in [".txt", ".md"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    return text.strip()

def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
    # Email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else None

    # Phone (US and international patterns)
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', text)
    phone = phone_match.group(0) if phone_match else None

    # LinkedIn
    linkedin_match = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[\w-]+', text, re.IGNORECASE)
    linkedin = linkedin_match.group(0) if linkedin_match else None

    # GitHub
    github_match = re.search(r'(https?://)?(www\.)?github\.com/[\w-]+', text, re.IGNORECASE)
    github = github_match.group(0) if github_match else None

    # Name: Attempt to extract from the first 3 lines
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    name = None
    if lines:
        first_line = lines[0]
        # Ignore if first line looks like an email or URL
        if "@" not in first_line and not first_line.lower().startswith("http") and len(first_line) < 50:
            name = first_line

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "github": github,
        "location": None
    }

def extract_skills(text: str) -> Tuple[List[str], Dict[str, List[str]]]:
    text_lower = " " + text.lower() + " "
    # Normalize punctuation to allow boundary matches for words like c++, node.js
    found_skills = set()
    categorized: Dict[str, List[str]] = {cat: [] for cat in SKILL_TAXONOMY}

    for cat, skills in SKILL_TAXONOMY.items():
        for skill in skills:
            pattern = r'(?<![a-zA-Z0-9])' + re.escape(skill) + r'(?![a-zA-Z0-9])'
            if re.search(pattern, text_lower):
                # Standardize display format
                display_name = skill.title()
                if skill in ["aws", "gcp", "sql", "html", "css", "ci/cd", "rest", "oop", "k8s", "api", "tdd"]:
                    display_name = skill.upper()
                elif skill in ["react.js", "node.js", "next.js", "vue.js"]:
                    display_name = skill
                found_skills.add(display_name)
                categorized[cat].append(display_name)

    # Clean empty categories
    categorized = {k: v for k, v in categorized.items() if v}
    return sorted(list(found_skills)), categorized

def extract_sections(text: str) -> Dict[str, Any]:
    lines = text.split('\n')
    sections = {
        "summary": "",
        "experience": [],
        "education": []
    }

    current_section = None
    buffer = []

    summary_pattern = re.compile(r'^(summary|professional summary|objective|about me|profile)', re.IGNORECASE)
    exp_pattern = re.compile(r'^(experience|work experience|employment|history|professional experience)', re.IGNORECASE)
    edu_pattern = re.compile(r'^(education|academic background|qualifications)', re.IGNORECASE)

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        # Check section headers
        if len(stripped) < 40:
            if summary_pattern.match(stripped):
                current_section = "summary"
                continue
            elif exp_pattern.match(stripped):
                if current_section == "summary" and buffer:
                    sections["summary"] = "\n".join(buffer).strip()
                    buffer = []
                current_section = "experience"
                continue
            elif edu_pattern.match(stripped):
                if current_section == "summary" and buffer:
                    sections["summary"] = "\n".join(buffer).strip()
                    buffer = []
                current_section = "education"
                continue

        if current_section:
            buffer.append(stripped)

    if current_section == "summary" and buffer:
        sections["summary"] = "\n".join(buffer).strip()
    elif not sections["summary"] and lines:
        # Fallback: take top paragraphs as potential summary
        sections["summary"] = "\n".join(lines[1:5]).strip()

    return sections

def calculate_ats_score(text: str, contact: Dict[str, Any], skills: List[str]) -> Tuple[float, List[str]]:
    score = 100.0
    feedback = []

    # 1. Contact Info Checks
    if not contact.get("email"):
        score -= 15
        feedback.append("Missing contact email address.")
    if not contact.get("phone"):
        score -= 10
        feedback.append("Missing phone number.")
    if not contact.get("linkedin"):
        score -= 5
        feedback.append("No LinkedIn profile URL detected.")

    # 2. Length check
    word_count = len(text.split())
    if word_count < 150:
        score -= 20
        feedback.append("Resume content is quite short (< 150 words). Expand your bullet points.")
    elif word_count > 1200:
        score -= 10
        feedback.append("Resume is somewhat lengthy (> 1,200 words). Aim for 1-2 pages.")

    # 3. Skills check
    if len(skills) < 5:
        score -= 25
        feedback.append("Low technical keyword density. Add a dedicated Skills section.")
    elif len(skills) < 10:
        score -= 10
        feedback.append("Consider adding more relevant tools and frameworks.")

    # 4. Action Verbs Check
    action_verbs = [
        "built", "developed", "led", "architected", "implemented", "managed",
        "designed", "created", "improved", "optimized", "increased", "decreased", "delivered"
    ]
    found_verbs = [v for v in action_verbs if re.search(r'\b' + v + r'\b', text.lower())]
    if len(found_verbs) < 3:
        score -= 10
        feedback.append("Use more strong action verbs (e.g., 'architected', 'optimized', 'delivered').")

    # 5. Quantifiable metrics check
    numbers = re.findall(r'\b\d+(\.\d+)?%|\$\d+|\b\d+\b', text)
    if len(numbers) < 4:
        score -= 10
        feedback.append("Include more quantifiable achievements (e.g., 'reduced latency by 35%', 'managed team of 5').")

    score = max(20.0, min(100.0, score))
    if not feedback:
        feedback.append("Excellent ATS layout! High keyword density and clear contact points.")

    return round(score, 1), feedback

def parse_resume(raw_text: str, filename: Optional[str] = None) -> Dict[str, Any]:
    contact = extract_contact_info(raw_text)
    skills, categorized_skills = extract_skills(raw_text)
    sections = extract_sections(raw_text)
    ats_score, ats_feedback = calculate_ats_score(raw_text, contact, skills)

    return {
        "filename": filename,
        "raw_text": raw_text,
        "contact": contact,
        "summary": sections.get("summary", ""),
        "skills": skills,
        "categorized_skills": categorized_skills,
        "experience": sections.get("experience", []),
        "education": sections.get("education", []),
        "ats_score": ats_score,
        "ats_feedback": ats_feedback
    }
