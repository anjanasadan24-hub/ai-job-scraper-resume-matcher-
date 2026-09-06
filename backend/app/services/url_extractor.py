import re
from typing import Dict, Any
import requests
from bs4 import BeautifulSoup
import trafilatura
from app.services.resume_parser import extract_skills

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def extract_job_from_url(url: str) -> Dict[str, Any]:
    headers = {"User-Agent": USER_AGENT}
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    html_content = resp.text

    # Extract main text using trafilatura
    extracted_text = trafilatura.extract(html_content, include_comments=False, include_tables=True)
    if not extracted_text:
        # Fallback to BeautifulSoup
        soup = BeautifulSoup(html_content, "html.parser")
        for s in soup(["script", "style", "nav", "footer", "header"]):
            s.extract()
        extracted_text = soup.get_text(separator="\n").strip()

    # Parse metadata using BeautifulSoup
    soup = BeautifulSoup(html_content, "html.parser")
    title = None
    company = None
    location = "Remote / Unspecified"

    # Try OpenGraph / Twitter meta tags
    og_title = soup.find("meta", property="og:title") or soup.find("meta", attrs={"name": "twitter:title"})
    if og_title and og_title.get("content"):
        title_raw = og_title["content"].strip()
        # Common formats: "Software Engineer at Stripe", "Stripe - Software Engineer"
        if " at " in title_raw:
            parts = title_raw.split(" at ")
            title = parts[0].strip()
            company = parts[1].strip()
        elif " - " in title_raw:
            parts = title_raw.split(" - ")
            title = parts[0].strip()
            company = parts[1].strip()
        else:
            title = title_raw

    # Look for H1 if title not found
    if not title:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text().strip()

    # Look for Company in meta tags or URL
    if not company:
        og_site = soup.find("meta", property="og:site_name")
        if og_site and og_site.get("content"):
            company = og_site["content"].strip()
        else:
            # Fallback: extract domain name
            match = re.search(r'https?://(?:www\.)?([^/]+)', url)
            if match:
                domain = match.group(1).split('.')[0].title()
                company = domain

    if not title:
        title = "Job Opportunity"

    # Extract skills from the job content
    skills, _ = extract_skills(f"{title} {extracted_text}")

    return {
        "source": "URL Scraper",
        "external_id": url,
        "title": title[:100],
        "company": company[:60] if company else "Company",
        "location": location,
        "is_remote": True,
        "description": extracted_text,
        "requirements": skills,
        "tags": skills[:5],
        "salary": None,
        "apply_url": url
    }
