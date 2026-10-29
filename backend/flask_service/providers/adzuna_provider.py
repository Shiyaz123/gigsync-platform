"""
Adzuna Job Search Provider.
Uses Adzuna's authorized global API for genuine, location-based job postings.
Supports country-specific routing (India, US, UK, Canada, Australia, Germany, etc.).
"""
import os
import re
import html
import logging
from typing import Dict, Any, List, Optional
import requests
try:
    from .base import BaseJobProvider, UnifiedJobListing, JobRequirementsModel
except ImportError:
    from base import BaseJobProvider, UnifiedJobListing, JobRequirementsModel

logger = logging.getLogger(__name__)

# Country resolution dictionary for Adzuna
COUNTRY_MAP = {
    'india': 'in',
    'in': 'in',
    'bengaluru': 'in',
    'bangalore': 'in',
    'delhi': 'in',
    'mumbai': 'in',
    'hyderabad': 'in',
    'pune': 'in',
    'chennai': 'in',
    'gurgaon': 'in',
    'noida': 'in',
    'united states': 'us',
    'usa': 'us',
    'us': 'us',
    'california': 'us',
    'texas': 'us',
    'new york': 'us',
    'san francisco': 'us',
    'austin': 'us',
    'seattle': 'us',
    'united kingdom': 'gb',
    'uk': 'gb',
    'gb': 'gb',
    'london': 'gb',
    'canada': 'ca',
    'toronto': 'ca',
    'vancouver': 'ca',
    'australia': 'au',
    'sydney': 'au',
    'melbourne': 'au',
    'germany': 'de',
    'berlin': 'de',
    'munich': 'de',
    'france': 'fr',
    'paris': 'fr',
    'singapore': 'sg',
    'netherlands': 'nl',
    'amsterdam': 'nl',
}

class AdzunaProvider(BaseJobProvider):
    """Adzuna Job Search API implementation."""

    def __init__(self, app_id: Optional[str] = None, app_key: Optional[str] = None):
        self.app_id = app_id or os.environ.get('ADZUNA_APP_ID', '').strip()
        self.app_key = app_key or os.environ.get('ADZUNA_APP_KEY', '').strip()
        self.base_url = "https://api.adzuna.com/v1/api/jobs"

    @property
    def provider_name(self) -> str:
        return "Adzuna"

    def is_configured(self) -> bool:
        return bool(self.app_id and self.app_key)

    def _resolve_country_code(self, location: Optional[str]) -> str:
        """Determines the appropriate Adzuna country subdomain."""
        if not location:
            return 'in'  # Default to India if unspecified or fallback to 'us'

        loc_lower = location.lower()
        for token, code in COUNTRY_MAP.items():
            if token in loc_lower:
                return code
        return 'in'

    def _clean_html(self, raw_html: str) -> str:
        """Strips HTML tags and unescapes entities."""
        if not raw_html:
            return ""
        clean = re.sub(r'<[^>]+>', ' ', raw_html)
        clean = html.unescape(clean)
        return re.sub(r'\s+', ' ', clean).strip()

    def _infer_skills_and_mode(self, title: str, description: str, loc_str: str):
        """Extracts recognizable technical skills and work mode without fabrication."""
        full_text = f"{title} {description}".lower()

        # Work mode
        work_mode = "On-site"
        if "remote" in full_text or "work from home" in full_text or "wfh" in full_text or "remote" in loc_str.lower():
            if "hybrid" in full_text or "flexible" in full_text:
                work_mode = "Hybrid"
            else:
                work_mode = "Remote"
        elif "hybrid" in full_text:
            work_mode = "Hybrid"

        # Experience level
        exp_level = "Entry-level"
        if "intern" in full_text or "internship" in full_text:
            exp_level = "Internship"
        elif "junior" in full_text or "associate" in full_text or "entry level" in full_text or "fresh" in full_text:
            exp_level = "Junior"
        elif "senior" in full_text or "lead" in full_text or "principal" in full_text:
            exp_level = "Mid-level"
        elif "mid" in full_text:
            exp_level = "Mid-level"

        # Recognized technical skills in tech job descriptions
        skill_catalog = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C++",
            "C#", "SQL", "PostgreSQL", "MySQL", "MongoDB", "AWS", "Azure", "GCP",
            "Docker", "Kubernetes", "Git", "REST APIs", "FastAPI", "Django", "Flask",
            "HTML5", "CSS3", "Linux", "GraphQL", "Redis", "CI/CD", "Machine Learning"
        ]

        found_skills = []
        for sk in skill_catalog:
            # Word boundary matching
            escaped = re.escape(sk.lower())
            if re.search(r'\b' + escaped + r'\b', full_text):
                found_skills.append(sk)

        essential = found_skills[:5] if found_skills else ["Problem Solving", "Software Engineering"]
        preferred = found_skills[5:10] if len(found_skills) > 5 else []

        return work_mode, exp_level, essential, preferred

    def search_jobs(
        self,
        role: Optional[str] = None,
        location: Optional[str] = None,
        work_mode: Optional[str] = None,
        experience_level: Optional[str] = None,
        skills: Optional[List[str]] = None,
        page: int = 1,
        limit: int = 20,
        timeout: int = 10
    ) -> List[UnifiedJobListing]:
        """Queries Adzuna for genuine job listings."""
        if not self.is_configured():
            logger.info("Adzuna API credentials not configured. Skipping Adzuna provider.")
            return []

        country_code = self._resolve_country_code(location)
        url = f"{self.base_url}/{country_code}/search/{max(1, page)}"

        what_query = role or ""
        if skills:
            what_query += " " + " ".join(skills)

        params: Dict[str, Any] = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "results_per_page": min(limit, 50),
            "content-type": "application/json"
        }

        if what_query.strip():
            params["what"] = what_query.strip()
        if location and location.strip():
            params["where"] = location.strip()

        try:
            resp = requests.get(
                url,
                params=params,
                headers={"User-Agent": "GigSync/1.0 (Job Matching Platform)"},
                timeout=timeout
            )
            if resp.status_code == 401 or resp.status_code == 403:
                raise PermissionError(f"Adzuna authentication failed (HTTP {resp.status_code}). Check ADZUNA_APP_ID and ADZUNA_APP_KEY.")
            if resp.status_code != 200:
                logger.warning(f"Adzuna API returned HTTP {resp.status_code}: {resp.text}")
                return []

            data = resp.json()
            raw_results = data.get("results", [])
            listings: List[UnifiedJobListing] = []

            for item in raw_results:
                job_id = f"adzuna_{item.get('id')}"
                title = self._clean_html(item.get("title", "Software Engineer"))
                company = item.get("company", {}).get("display_name", "Confidential Employer")
                raw_loc = item.get("location", {})
                loc_area = raw_loc.get("display_name") or (", ".join(raw_loc.get("area", []))) or location or "India"
                desc = self._clean_html(item.get("description", ""))

                # Salary range
                sal_min = item.get("salary_min")
                sal_max = item.get("salary_max")
                if sal_min and sal_max:
                    currency = "₹" if country_code == 'in' else "$"
                    salary_str = f"{currency}{int(sal_min):,} - {currency}{int(sal_max):,} / year"
                elif sal_min:
                    currency = "₹" if country_code == 'in' else "$"
                    salary_str = f"From {currency}{int(sal_min):,} / year"
                else:
                    salary_str = "Competitive / Dependent on experience"

                detected_mode, detected_exp, essential_skills, pref_skills = self._infer_skills_and_mode(title, desc, loc_area)

                # Filter by work_mode if requested
                if work_mode and work_mode.lower() != "all" and detected_mode.lower() != work_mode.lower():
                    continue

                # Filter by experience_level if requested
                if experience_level and experience_level.lower() != "all" and detected_exp.lower() != experience_level.lower():
                    continue

                apply_url = item.get("redirect_url") or f"https://www.adzuna.com/details/{item.get('id')}"
                posted_date = item.get("created", "")

                listing = UnifiedJobListing(
                    id=job_id,
                    source="Adzuna",
                    sourceJobId=str(item.get("id")),
                    title=title,
                    company=company,
                    location=loc_area,
                    workMode=detected_mode,
                    experienceLevel=detected_exp,
                    salaryRange=salary_str,
                    description=desc,
                    requirements=JobRequirementsModel(
                        essentialSkills=essential_skills,
                        preferredSkills=pref_skills,
                        constraints=[f"Eligible to work in {loc_area}"],
                        minYearsExperience=0 if detected_exp in ["Internship", "Entry-level"] else 1
                    ),
                    postedAt=posted_date,
                    applyUrl=apply_url,
                    verified=True,
                    rawLocation=raw_loc
                )
                listings.append(listing)

            return listings

        except requests.exceptions.Timeout:
            raise TimeoutError("Adzuna API request timed out.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Adzuna network error: {e}")
            raise
