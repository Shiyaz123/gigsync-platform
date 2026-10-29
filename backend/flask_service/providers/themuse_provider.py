"""
The Muse Job Search Provider.
Uses The Muse's authorized public developer REST API for verified corporate job listings.
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

class TheMuseProvider(BaseJobProvider):
    """The Muse public API integration."""

    def __init__(self):
        self.base_url = "https://www.themuse.com/api/public/jobs"
        self.api_key = os.environ.get("THE_MUSE_API_KEY", "").strip()

    @property
    def provider_name(self) -> str:
        return "The Muse"

    def is_configured(self) -> bool:
        # Public API accessible without key, key optional for higher rate limits
        return True

    def _clean_html(self, raw_html: str) -> str:
        if not raw_html:
            return ""
        clean = re.sub(r'<[^>]+>', ' ', raw_html)
        clean = html.unescape(clean)
        return re.sub(r'\s+', ' ', clean).strip()

    def _extract_skills(self, text: str) -> List[str]:
        skill_catalog = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C++",
            "C#", "SQL", "PostgreSQL", "MySQL", "MongoDB", "AWS", "Azure", "GCP",
            "Docker", "Kubernetes", "Git", "REST APIs", "FastAPI", "Django", "Flask",
            "HTML5", "CSS3", "Linux", "GraphQL", "Redis", "CI/CD", "Machine Learning"
        ]
        text_lower = text.lower()
        found = []
        for sk in skill_catalog:
            if re.search(r'\b' + re.escape(sk.lower()) + r'\b', text_lower):
                found.append(sk)
        return found

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
        """Fetch verified jobs from The Muse."""
        muse_page = max(0, page - 1)
        params: Dict[str, Any] = {
            "page": muse_page,
            "category": "Software Engineering"
        }
        if self.api_key:
            params["api_key"] = self.api_key

        if location and location.strip():
            loc_clean = location.strip()
            # If user explicitly specified Remote, set location filter or handle post-filter
            if loc_clean.lower() in ["remote", "flexible", "work from home"]:
                params["location"] = "Flexible / Remote"
            else:
                params["location"] = loc_clean

        # Level mapping
        if experience_level and experience_level.lower() != "all":
            lvl = experience_level.lower()
            if "intern" in lvl:
                params["level"] = "Internship"
            elif "entry" in lvl:
                params["level"] = "Entry Level"
            elif "junior" in lvl:
                params["level"] = "Entry Level"
            elif "mid" in lvl:
                params["level"] = "Mid Level"

        headers = {
            "User-Agent": "GigSync/1.0 (Authorized Job Discovery Agent)"
        }

        try:
            resp = requests.get(self.base_url, params=params, headers=headers, timeout=timeout)
            if resp.status_code == 401 or resp.status_code == 403:
                # If location query was rejected or blocked by cloudflare
                logger.warning(f"The Muse API returned HTTP {resp.status_code}")
                return []
            if resp.status_code != 200:
                logger.warning(f"The Muse API returned HTTP {resp.status_code}")
                return []

            data = resp.json()
            raw_results = data.get("results", [])
            listings: List[UnifiedJobListing] = []

            for item in raw_results:
                title = item.get("name", "Software Engineer")
                company = item.get("company", {}).get("name", "Company")
                locations_list = [l.get("name", "") for l in item.get("locations", [])]
                loc_str = ", ".join(locations_list) if locations_list else "Flexible / Remote"
                desc = self._clean_html(item.get("contents", ""))
                full_text = f"{title} {desc} {loc_str}".lower()

                # Role query filtering
                if role and role.strip():
                    role_terms = role.strip().lower().split()
                    # At least one major role term must appear in title or desc
                    if not any(term in full_text for term in role_terms):
                        continue

                # Location strictly respected:
                if location and location.strip():
                    req_loc = location.strip().lower()
                    if req_loc not in ["all", "any", "worldwide"]:
                        is_remote_search = req_loc in ["remote", "flexible / remote", "flexible", "wfh"]
                        # Extract city / region tokens (e.g. 'San Jose, CA' -> ['san jose', 'ca'])
                        loc_tokens = [t.strip() for t in re.split(r'[\s,]+', req_loc) if len(t.strip()) > 2]
                        is_loc_match = any(t in loc_str.lower() for t in loc_tokens) or any(
                            any(t in l.lower() for t in loc_tokens) for l in locations_list
                        )
                        is_job_remote = "flexible / remote" in loc_str.lower() or "remote" in loc_str.lower()

                        if is_remote_search:
                            if not is_job_remote:
                                continue
                        else:
                            # User searched for a specific city/country (e.g. San Jose, CA or Bengaluru)
                            if not (is_loc_match or is_job_remote):
                                continue

                # Work mode detection
                detected_mode = "On-site"
                if "flexible / remote" in loc_str.lower() or "remote" in loc_str.lower() or "remote" in title.lower():
                    detected_mode = "Remote"
                elif "hybrid" in full_text:
                    detected_mode = "Hybrid"

                if work_mode and work_mode.lower() != "all" and detected_mode.lower() != work_mode.lower():
                    continue

                # Level mapping
                levels = [lvl.get("name", "") for lvl in item.get("levels", [])]
                detected_exp = "Entry-level"
                if any("intern" in l.lower() for l in levels):
                    detected_exp = "Internship"
                elif any("entry" in l.lower() for l in levels):
                    detected_exp = "Entry-level"
                elif any("mid" in l.lower() for l in levels):
                    detected_exp = "Junior"
                elif any("senior" in l.lower() for l in levels):
                    detected_exp = "Mid-level"

                if experience_level and experience_level.lower() != "all" and detected_exp.lower() != experience_level.lower():
                    continue

                extracted_skills = self._extract_skills(f"{title} {desc}")
                essential_skills = extracted_skills[:5] if extracted_skills else ["Software Engineering", "Problem Solving"]
                pref_skills = extracted_skills[5:10] if len(extracted_skills) > 5 else []

                landing_url = item.get("refs", {}).get("landing_page") or f"https://www.themuse.com/job/redirect/{item.get('id')}"

                listing = UnifiedJobListing(
                    id=f"themuse_{item.get('id')}",
                    source="The Muse",
                    sourceJobId=str(item.get("id")),
                    title=title,
                    company=company,
                    location=loc_str,
                    workMode=detected_mode,
                    experienceLevel=detected_exp,
                    salaryRange="Competitive / Level-based",
                    description=desc[:1200] + "..." if len(desc) > 1200 else desc,
                    requirements=JobRequirementsModel(
                        essentialSkills=essential_skills,
                        preferredSkills=pref_skills,
                        constraints=[f"Eligible for {detected_mode} work in {loc_str}"],
                        minYearsExperience=0 if detected_exp in ["Internship", "Entry-level"] else 1
                    ),
                    postedAt=item.get("publication_date", ""),
                    applyUrl=landing_url,
                    verified=True
                )
                listings.append(listing)
                if len(listings) >= limit:
                    break

            return listings

        except requests.exceptions.Timeout:
            raise TimeoutError("The Muse API request timed out.")
        except requests.exceptions.RequestException as e:
            logger.error(f"The Muse API request error: {e}")
            raise
