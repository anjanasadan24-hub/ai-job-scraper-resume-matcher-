import html
import re
from typing import List, Dict, Any, Optional
import requests
from bs4 import BeautifulSoup
from app.services.resume_parser import extract_skills

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "html.parser")
    # Remove script and style tags
    for s in soup(["script", "style"]):
        s.extract()
    text = soup.get_text(separator=" ")
    text = html.unescape(text)
    # Clean whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def scrape_remoteok(query: str = "", limit: int = 30) -> List[Dict[str, Any]]:
    jobs = []
    try:
        url = "https://remoteok.com/api"
        headers = {"User-Agent": USER_AGENT}
        resp = requests.get(url, headers=headers, timeout=12)
        if resp.status_code == 200:
            data = resp.json()
            # First element is usually legal disclaimer/metadata
            items = [item for item in data if isinstance(item, dict) and "position" in item]
            query_lower = query.lower().strip()
            
            for item in items:
                title = item.get("position", "")
                company = item.get("company", "")
                desc = clean_html(item.get("description", ""))
                tags = [str(t).lower() for t in item.get("tags", []) if t]
                combined_text = f"{title} {company} {' '.join(tags)} {desc}".lower()

                # Filter by query if provided
                if query_lower and query_lower not in combined_text:
                    continue

                salary = None
                s_min = item.get("salary_min")
                s_max = item.get("salary_max")
                if s_min and s_max:
                    salary = f"${s_min:,} - ${s_max:,}"
                elif s_min:
                    salary = f"${s_min:,}+"

                skills, _ = extract_skills(f"{title} {desc} {' '.join(tags)}")

                jobs.append({
                    "external_id": str(item.get("id") or item.get("slug")),
                    "source": "RemoteOK",
                    "title": title,
                    "company": company,
                    "location": item.get("location") or "Worldwide Remote",
                    "is_remote": True,
                    "description": desc,
                    "requirements": skills,
                    "tags": tags,
                    "salary": salary,
                    "apply_url": item.get("url") or f"https://remoteok.com/l/{item.get('id')}"
                })

                if len(jobs) >= limit:
                    break
    except Exception as e:
        print(f"Error scraping RemoteOK: {e}")
    return jobs

def scrape_jobicy(query: str = "", limit: int = 30) -> List[Dict[str, Any]]:
    jobs = []
    try:
        url = f"https://jobicy.com/api/v2/remote-jobs?count={max(limit, 30)}"
        headers = {"User-Agent": USER_AGENT}
        resp = requests.get(url, headers=headers, timeout=12)
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("jobs", [])
            query_lower = query.lower().strip()

            for item in items:
                title = item.get("jobTitle", "")
                company = item.get("companyName", "")
                desc = clean_html(item.get("jobDescription", ""))
                tags = [t.strip().lower() for t in item.get("jobIndustry", []) if t]
                combined_text = f"{title} {company} {' '.join(tags)} {desc}".lower()

                if query_lower and query_lower not in combined_text:
                    continue

                salary = None
                s_min = item.get("annualSalaryMin")
                s_max = item.get("annualSalaryMax")
                cur = item.get("salaryCurrency", "$")
                if s_min and s_max:
                    salary = f"{cur}{s_min:,} - {cur}{s_max:,}"
                elif s_min:
                    salary = f"{cur}{s_min:,}+"

                skills, _ = extract_skills(f"{title} {desc}")

                jobs.append({
                    "external_id": str(item.get("id")),
                    "source": "Jobicy",
                    "title": title,
                    "company": company,
                    "location": item.get("jobGeo") or "Remote",
                    "is_remote": True,
                    "description": desc,
                    "requirements": skills,
                    "tags": tags,
                    "salary": salary,
                    "apply_url": item.get("url")
                })

                if len(jobs) >= limit:
                    break
    except Exception as e:
        print(f"Error scraping Jobicy: {e}")
    return jobs

def scrape_arbeitnow(query: str = "", limit: int = 30) -> List[Dict[str, Any]]:
    jobs = []
    try:
        url = "https://www.arbeitnow.com/api/job-board-api"
        headers = {"User-Agent": USER_AGENT}
        resp = requests.get(url, headers=headers, timeout=12)
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("data", [])
            query_lower = query.lower().strip()

            for item in items:
                title = item.get("title", "")
                company = item.get("company_name", "")
                desc = clean_html(item.get("description", ""))
                tags = [t.lower() for t in item.get("tags", []) if t]
                combined_text = f"{title} {company} {' '.join(tags)} {desc}".lower()

                if query_lower and query_lower not in combined_text:
                    continue

                skills, _ = extract_skills(f"{title} {desc}")

                jobs.append({
                    "external_id": str(item.get("slug")),
                    "source": "Arbeitnow",
                    "title": title,
                    "company": company,
                    "location": item.get("location") or "Remote / Europe",
                    "is_remote": bool(item.get("remote")),
                    "description": desc,
                    "requirements": skills,
                    "tags": tags,
                    "salary": None,
                    "apply_url": item.get("url")
                })

                if len(jobs) >= limit:
                    break
    except Exception as e:
        print(f"Error scraping Arbeitnow: {e}")
    return jobs

def scrape_all_sources(query: str = "", sources: Optional[List[str]] = None, limit: int = 30) -> List[Dict[str, Any]]:
    if not sources:
        sources = ["remoteok", "jobicy", "arbeitnow"]

    all_jobs = []
    per_source_limit = max(10, limit // len(sources) + 5)

    if "remoteok" in sources:
        all_jobs.extend(scrape_remoteok(query=query, limit=per_source_limit))
    if "jobicy" in sources:
        all_jobs.extend(scrape_jobicy(query=query, limit=per_source_limit))
    if "arbeitnow" in sources:
        all_jobs.extend(scrape_arbeitnow(query=query, limit=per_source_limit))

    # Deduplicate by title + company
    seen = set()
    deduped = []
    for j in all_jobs:
        key = (j["title"].lower().strip(), j["company"].lower().strip())
        if key not in seen:
            seen.add(key)
            deduped.append(j)

    return deduped[:limit]
