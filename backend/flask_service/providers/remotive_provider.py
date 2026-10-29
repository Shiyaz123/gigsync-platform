"""
Remotive Job Search Provider.
Uses Remotive's authorized public API for genuine remote software engineering and tech jobs.
Includes candidate eligibility location checks (e.g. Worldwide, USA Only, India, Europe).
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

class RemotiveProvider(BaseJobProvider):
    """Remotive Remote Tech Jobs API."""

    def __init__(self):
        self.base_url = "https://remotive.com/api/remote-jobs"

    @property
    def provider_name(self) -> str:
        return "Remotive"

    def is_configured(self) -> bool:
        return True

    def _clean_html(self, raw_html: str) -> str:
        if not raw_html:
            return ""
        clean = re.sub(r'<[^>]+>', ' ', raw_html)
        clean = html.unescape(clean)
        return re.sub(r'\s+', ' ', clean).strip()

    def _is_eligible_location(self, candidate_loc: Optional[str], required_loc: str) -> bool:
        """
        Validates location eligibility.
        Does NOT assume a US-only remote job is available to applicants in India or elsewhere.
        """
        if not candidate_loc or candidate_loc.lower() in ["all", "any", "worldwide", "remote"]:
            return True

        cand_lower = candidate_loc.lower()
        req_lower = required_loc.lower()

        # If job is worldwide or anywhere, it is universally eligible
        if any(term in req_lower for term in ["worldwide", "anywhere", "global", "all"]):
            return True

        # Check country matches
        if "india" in cand_lower or "bengaluru" in cand_lower or "bangalore" in cand_lower or "mumbai" in cand_lower or "delhi" in cand_lower:
            if "india" in req_lower or "apac" in req_lower or "asia" in req_lower:
                return True
            # If the job strictly says "USA only" or "Americas only", it is NOT eligible
            if any(term in req_lower for term in ["usa only", "us only", "north america", "europe only", "uk only"]):
                return False

        if "united states" in cand_lower or "usa" in cand_lower or "us" in cand_lower or "california" in cand_lower or "texas" in cand_lower:
            if any(term in req_lower for term in ["usa", "us", "americas", "north america"]):
                return True

        if "united kingdom" in cand_lower or "uk" in cand_lower or "london" in cand_lower:
            if any(term in req_lower for term in ["uk", "united kingdom", "europe", "emea"]):
                return True

        # Direct containment
        return cand_lower in req_lower or req_lower in cand_lower

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
        """Fetch verified remote jobs from Remotive."""
        if work_mode and work_mode.lower() in ["on-site", "hybrid"]:
            # Remotive is remote-only
            return []

        search_query = role or ""
        if skills:
            search_query += " " + " ".join(skills)

        params: Dict[str, Any] = {
            "category": "software-dev",
            "limit": limit * 2  # Fetch extra to filter on location eligibility
        }
        if search_query.strip():
            params["search"] = search_query.strip()

        headers = {
            "User-Agent": "GigSync/1.0 (Authorized Job Discovery Agent)"
        }

        try:
            resp = requests.get(self.base_url, params=params, headers=headers, timeout=timeout)
            if resp.status_code != 200:
                logger.warning(f"Remotive API returned HTTP {resp.status_code}")
                return []

            data = resp.json()
            raw_jobs = data.get("jobs", [])
            listings: List[UnifiedJobListing] = []

            for item in raw_jobs:
                title = item.get("title", "Software Engineer")
                company = item.get("company_name", "Tech Company")
                cand_req_loc = item.get("candidate_required_location") or "Worldwide"
                desc = self._clean_html(item.get("description", ""))
                salary = item.get("salary") or "Competitive / Disclosed upon interview"
                tags = item.get("tags", [])

                # Verify location eligibility
                if location and location.strip():
                    if not self._is_eligible_location(location.strip(), cand_req_loc):
                        continue

                # Experience level inference
                full_text = f"{title} {desc}".lower()
                detected_exp = "Entry-level"
                if "intern" in full_text:
                    detected_exp = "Internship"
                elif "junior" in full_text or "associate" in full_text or "entry" in full_text:
                    detected_exp = "Junior"
                elif "senior" in full_text or "lead" in full_text:
                    detected_exp = "Mid-level"

                if experience_level and experience_level.lower() != "all" and detected_exp.lower() != experience_level.lower():
                    continue

                # Format essential & preferred skills from tags
                cleaned_tags = [t.strip().title() for t in tags if t.strip()]
                essential_skills = cleaned_tags[:5] if cleaned_tags else ["Software Engineering", "Python"]
                pref_skills = cleaned_tags[5:10] if len(cleaned_tags) > 5 else []

                display_loc = f"Remote ({cand_req_loc})"

                listing = UnifiedJobListing(
                    id=f"remotive_{item.get('id')}",
                    source="Remotive",
                    sourceJobId=str(item.get("id")),
                    title=title,
                    company=company,
                    location=display_loc,
                    workMode="Remote",
                    experienceLevel=detected_exp,
                    salaryRange=salary,
                    description=desc[:1200] + "..." if len(desc) > 1200 else desc,
                    requirements=JobRequirementsModel(
                        essentialSkills=essential_skills,
                        preferredSkills=pref_skills,
                        constraints=[f"Eligible location: {cand_req_loc}"],
                        minYearsExperience=0 if detected_exp in ["Internship", "Entry-level"] else 1
                    ),
                    postedAt=item.get("publication_date", ""),
                    applyUrl=item.get("url", ""),
                    verified=True
                )
                listings.append(listing)
                if len(listings) >= limit:
                    break

            return listings

        except requests.exceptions.Timeout:
            raise TimeoutError("Remotive API request timed out.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Remotive API request error: {e}")
            raise
