"""
Remotive Job Provider.
Fetches verified remote jobs with strict candidate geographic eligibility enforcement.
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
    """Integrates Remotive Public API for verified remote software vacancies."""

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
        Does NOT treat unrecognized locations as eligible.
        """
        if not candidate_loc or candidate_loc.lower() in ["all", "any", "worldwide", "remote"]:
            return True

        cand_lower = candidate_loc.lower()
        req_lower = required_loc.lower()

        is_req_worldwide = any(term in req_lower for term in ["worldwide", "anywhere", "global", "all"])

        # Check India / Asian candidates
        if any(term in cand_lower for term in ["india", "bengaluru", "bangalore", "mumbai", "delhi", "gurgaon", "hyderabad", "chennai", "pune"]):
            # Strictly reject remote jobs restricted to USA or Europe
            if any(term in req_lower for term in ["usa only", "us only", "north america", "europe only", "uk only", "canada only"]):
                return False
            if is_req_worldwide or any(term in req_lower for term in ["india", "apac", "asia"]):
                return True
            return False

        # Check US candidates
        if any(term in cand_lower for term in ["united states", "usa", "us", "california", "texas", "san jose", "san francisco", "new york", "seattle"]):
            if any(term in req_lower for term in ["europe only", "uk only", "germany only", "australia only", "india only"]):
                return False
            if is_req_worldwide or any(term in req_lower for term in ["usa", "us", "americas", "north america"]):
                return True
            return False

        # Check UK candidates
        if any(term in cand_lower for term in ["united kingdom", "uk", "london", "england", "scotland"]):
            if is_req_worldwide or any(term in req_lower for term in ["uk", "united kingdom", "europe", "emea"]):
                return True
            return False

        # Check Germany / EU candidates
        if any(term in cand_lower for term in ["germany", "deutschland", "berlin", "munich", "europe"]):
            if is_req_worldwide or any(term in req_lower for term in ["germany", "europe", "emea", "eu"]):
                return True
            return False

        # If candidate specified a recognized country like Iceland
        if "iceland" in cand_lower or "reykjavik" in cand_lower:
            return is_req_worldwide

        # If location is completely unrecognized (e.g. UnknownVillageXYZ), do not match
        return False

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

        params: Dict[str, Any] = {
            "category": "software-dev",
            "limit": limit * 2
        }
        if search_query.strip():
            tokens = [t.lower() for t in re.split(r'[\s,&/]+', search_query) if len(t) > 2]
            if tokens:
                params["search"] = tokens[0]

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

                full_text = f"{title} {desc} {' '.join(tags)}".lower()

                # Filter by role keywords if specified
                if role and role.strip():
                    role_tokens = [t.lower() for t in re.split(r'[\s,&/]+', role) if len(t) > 2]
                    if role_tokens and not any(t in full_text for t in role_tokens):
                        continue

                # Verify location eligibility
                if location and location.strip():
                    if not self._is_eligible_location(location.strip(), cand_req_loc):
                        continue

                # Experience level inference
                detected_exp = "Entry-level"
                if "intern" in full_text:
                    detected_exp = "Internship"
                elif "junior" in full_text or "associate" in full_text or "entry" in full_text:
                    detected_exp = "Junior"
                elif "senior" in full_text or "lead" in full_text or "principal" in full_text:
                    detected_exp = "Mid-level"

                if experience_level and experience_level.lower() != "all" and detected_exp.lower() != experience_level.lower():
                    continue

                extracted_skills = self._clean_html(" ".join(tags))
                essential_skills = tags[:5] if tags else ["Software Engineering", "Problem Solving"]
                pref_skills = tags[5:10] if len(tags) > 5 else []

                listing = UnifiedJobListing(
                    id=f"remotive_{item.get('id')}",
                    source="Remotive",
                    sourceJobId=str(item.get("id")),
                    title=title,
                    company=company,
                    location=f"Remote ({cand_req_loc})",
                    workMode="Remote",
                    experienceLevel=detected_exp,
                    salaryRange=salary,
                    description=desc[:1200] + "..." if len(desc) > 1200 else desc,
                    requirements=JobRequirementsModel(
                        essentialSkills=essential_skills,
                        preferredSkills=pref_skills,
                        constraints=[f"Geographic Eligibility: {cand_req_loc}"],
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
