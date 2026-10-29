"""
Arbeitnow Job Search Provider.
Uses Arbeitnow's authorized public API (https://www.arbeitnow.com/api/job-board-api)
for genuine tech, engineering, and remote/hybrid job vacancies.
"""
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

class ArbeitnowProvider(BaseJobProvider):
    """Arbeitnow genuine job feed provider."""

    def __init__(self):
        self.base_url = "https://www.arbeitnow.com/api/job-board-api"

    @property
    def provider_name(self) -> str:
        return "Arbeitnow"

    def is_configured(self) -> bool:
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
        """Fetch verified jobs from Arbeitnow."""
        params = {"page": page}
        headers = {"User-Agent": "GigSync/1.0 (Job Matching Platform)"}

        try:
            resp = requests.get(self.base_url, params=params, headers=headers, timeout=timeout)
            if resp.status_code != 200:
                logger.warning(f"Arbeitnow API returned HTTP {resp.status_code}")
                return []

            data = resp.json()
            raw_jobs = data.get("data", [])
            listings: List[UnifiedJobListing] = []

            for item in raw_jobs:
                title = item.get("title", "")
                company = item.get("company_name", "")
                loc_str = item.get("location", "") or "Remote"
                is_remote = bool(item.get("remote", False))
                tags = item.get("tags", [])
                desc = self._clean_html(item.get("description", ""))

                full_text = f"{title} {desc} {loc_str} {' '.join(tags)}".lower()

                # Filter by role keywords if specified
                if role and role.strip():
                    role_tokens = [t.lower() for t in re.split(r'[\s,&/]+', role) if len(t) > 2]
                    if role_tokens and not any(t in full_text for t in role_tokens):
                        continue

                # Filter by location if specified
                if location and location.strip():
                    req_loc = location.strip().lower()
                    if req_loc not in ["all", "any", "worldwide"]:
                        is_remote_search = req_loc in ["remote", "flexible", "wfh"]
                        loc_tokens = [t.strip() for t in re.split(r'[\s,]+', req_loc) if len(t.strip()) > 2]
                        matches_loc = any(t in loc_str.lower() for t in loc_tokens)

                        if is_remote_search:
                            if not is_remote:
                                continue
                        else:
                            if not (matches_loc or is_remote):
                                continue

                # Work mode detection
                detected_mode = "Remote" if is_remote else "On-site"
                if "hybrid" in full_text or "hybrid" in loc_str.lower():
                    detected_mode = "Hybrid"

                if work_mode and work_mode.lower() != "all" and detected_mode.lower() != work_mode.lower():
                    continue

                # Experience level inference
                detected_exp = "Entry-level"
                if "intern" in full_text:
                    detected_exp = "Internship"
                elif "junior" in full_text or "entry" in full_text:
                    detected_exp = "Entry-level"
                elif "mid" in full_text or "regular" in full_text:
                    detected_exp = "Junior"
                elif "senior" in full_text or "lead" in full_text or "principal" in full_text:
                    detected_exp = "Mid-level"

                if experience_level and experience_level.lower() != "all" and detected_exp.lower() != experience_level.lower():
                    continue

                extracted_skills = self._extract_skills(f"{title} {desc}")
                tag_skills = [t.strip().title() for t in tags if t.strip()]
                all_skills = list(dict.fromkeys(extracted_skills + tag_skills))
                essential_skills = all_skills[:5] if all_skills else ["Software Engineering", "Problem Solving"]
                pref_skills = all_skills[5:10] if len(all_skills) > 5 else []

                listing = UnifiedJobListing(
                    id=f"arbeitnow_{item.get('slug', item.get('url', ''))[-32:]}",
                    source="Arbeitnow",
                    sourceJobId=str(item.get("slug", "")),
                    title=title,
                    company=company,
                    location=f"Remote ({loc_str})" if is_remote and "remote" not in loc_str.lower() else loc_str,
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
                    postedAt=item.get("created_at", ""),
                    applyUrl=item.get("url", ""),
                    verified=True
                )
                listings.append(listing)
                if len(listings) >= limit:
                    break

            return listings

        except requests.exceptions.Timeout:
            raise TimeoutError("Arbeitnow API request timed out.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Arbeitnow API error: {e}")
            raise
