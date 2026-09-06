import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.services.job_scraper import scrape_all_sources

def test_live_scraping():
    print("Testing live job scraping across feeds...")
    jobs = scrape_all_sources(query="python", limit=6)
    print(f"Total jobs retrieved: {len(jobs)}")
    for j in jobs[:3]:
        print(f"- [{j['source']}] {j['title']} at {j['company']} ({len(j.get('requirements', []))} skills identified)")
    assert len(jobs) > 0, "Should have retrieved at least 1 job"
    print("[PASS] Live job scraper test passed!")

if __name__ == "__main__":
    test_live_scraping()
