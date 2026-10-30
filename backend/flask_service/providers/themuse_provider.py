"""
The Muse Job Provider.
Fetches genuine jobs directly from The Muse API.
Strictly maps verified locations and prevents false city/country matches.
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

CITY_ALIASES: Dict[str, List[str]] = {
    'bengaluru': ['bengaluru', 'bangalore'],
    'bangalore': ['bengaluru', 'bangalore'],
    'mumbai': ['mumbai', 'bombay'],
    'delhi': ['delhi', 'new delhi'],
    'new delhi': ['new delhi', 'delhi'],
    'gurgaon': ['gurgaon', 'gurugram'],
    'gurugram': ['gurugram', 'gurgaon'],
    'noida': ['noida'],
    'hyderabad': ['hyderabad'],
    'chennai': ['chennai', 'madras'],
    'pune': ['pune'],
    'kolkata': ['kolkata', 'calcutta'],
    'san jose': ['san jose'],
    'san francisco': ['san francisco', 'sf'],
    'sunnyvale': ['sunnyvale'],
    'palo alto': ['palo alto'],
    'mountain view': ['mountain view'],
    'los angeles': ['los angeles', 'la'],
    'san diego': ['san diego'],
    'new york': ['new york', 'nyc', 'manhattan'],
    'nyc': ['new york', 'nyc', 'manhattan'],
    'seattle': ['seattle'],
    'bellevue': ['bellevue'],
    'redmond': ['redmond'],
    'austin': ['austin'],
    'boston': ['boston'],
    'chicago': ['chicago'],
    'london': ['london'],
    'berlin': ['berlin'],
    'munich': ['munich'],
    'reykjavik': ['reykjavik']
}

class TheMuseProvider(BaseJobProvider):
    """Integrates The Muse Public Jobs API with strict location mapping."""

    def __init__(self, api_key: Optional[str] = None):
        self.base_url = "https://www.themuse.com/api/public/jobs"
        self.api_key = api_key

    @property
    def provider_name(self) -> str:
        return "The Muse"

    def is_configured(self) -> bool:
        return True

    def _clean_html(self, raw_html: str) -> str:
        if not raw_html:
            return ""
        clean = re.sub(r'<[^>]+>', ' ', raw_html)
        clean = html.unescape(clean)
        return re.sub(r'\s+', ' ', clean).strip()

    def _extract_skills(self, text: str) -> List[str]:
        catalog = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C++",
            "C#", "SQL", "PostgreSQL", "MySQL", "MongoDB", "AWS", "Azure", "GCP",
            "Docker", "Kubernetes", "Git", "REST APIs", "FastAPI", "Django", "Flask",
            "HTML5", "CSS3", "Linux", "GraphQL", "Redis", "CI/CD", "Machine Learning"
        ]
        found = []
        lower = text.lower()
        for sk in catalog:
            pattern = rf"(^|[^a-zA-Z0-9]){re.escape(sk.lower())}([^a-zA-Z0-9]|$)"
            if re.search(pattern, lower):
                found.append(sk)
        return found

    def _detect_requested_city(self, loc_lower: str) -> Optional[str]:
        for city_key in CITY_ALIASES:
            if city_key in loc_lower:
                return city_key
        return None

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
        """Fetch verified jobs from The Muse with strict geographic boundary enforcement."""
        muse_page = max(0, page - 1)
        params: Dict[str, Any] = {
            "page": muse_page,
            "category": "Software Engineering"
        }
        if self.api_key:
            params["api_key"] = self.api_key

        detected_city: Optional[str] = None
        is_india_search = False
        is_us_search = False

        if location and location.strip():
            loc_clean = location.strip()
            loc_lower = loc_clean.lower()
            detected_city = self._detect_requested_city(loc_lower)

            if "india" in loc_lower or detected_city in ['bengaluru', 'bangalore', 'mumbai', 'delhi', 'new delhi', 'gurgaon', 'gurugram', 'noida', 'hyderabad', 'chennai', 'pune']:
                is_india_search = True
            elif "united states" in loc_lower or "usa" in loc_lower or "us" in loc_lower or detected_city in ['san jose', 'san francisco', 'sunnyvale', 'palo alto', 'new york', 'nyc', 'seattle', 'austin', 'boston', 'chicago']:
                is_us_search = True

            # If user explicitly specified Remote, set location filter
            if loc_lower in ["remote", "flexible", "work from home"]:
                params["location"] = "Flexible / Remote"
            elif detected_city in ["bengaluru", "bangalore"]:
                params["location"] = "Bangalore, India"
            elif detected_city == "mumbai":
                params["location"] = "Mumbai, India"
            elif detected_city in ["gurgaon", "gurugram", "delhi", "new delhi", "noida"]:
                params["location"] = "Gurgaon, India"
            elif detected_city == "hyderabad":
                params["location"] = "Hyderabad, India"
            elif detected_city == "chennai":
                params["location"] = "Chennai, India"
            elif detected_city == "san jose":
                params["location"] = "San Jose, CA"
            elif detected_city == "san francisco":
                params["location"] = "San Francisco, CA"
            elif detected_city in ["new york", "nyc"]:
                params["location"] = "New York, NY"
            elif detected_city == "seattle":
                params["location"] = "Seattle, WA"
            elif detected_city == "austin":
                params["location"] = "Austin, TX"
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
                all_locs_lower = f"{loc_str} {' '.join(locations_list)}".lower()

                # Role query filtering
                if role and role.strip():
                    role_terms = [t for t in role.strip().lower().split() if len(t) > 2]
                    if role_terms and not any(term in full_text for term in role_terms):
                        continue

                is_job_remote = "flexible / remote" in loc_str.lower() or "remote" in loc_str.lower()

                # Strict Location Filtering
                if location and location.strip():
                    req_loc = location.strip().lower()
                    if req_loc not in ["all", "any", "worldwide"]:
                        is_remote_search = req_loc in ["remote", "flexible / remote", "flexible", "wfh"]

                        if is_remote_search:
                            if not is_job_remote:
                                continue
                        elif detected_city:
                            # Match FULL city aliases (e.g. 'san jose', 'bangalore')
                            aliases = CITY_ALIASES.get(detected_city, [detected_city])
                            matches_city = any(
                                re.search(rf"(^|[^a-zA-Z0-9]){re.escape(alias)}([^a-zA-Z0-9]|$)", all_locs_lower)
                                for alias in aliases
                            )
                            if not matches_city:
                                continue
                        elif is_india_search:
                            # Must be located in India
                            if not any(k in all_locs_lower for k in ["india", "bangalore", "mumbai", "delhi", "gurgaon", "hyderabad", "chennai"]):
                                continue
                        elif is_us_search:
                            # Must be located in US
                            if not any(k in all_locs_lower for k in ["united states", "usa", ", us", "ca", "tx", "ny", "wa", "il", "ma"]):
                                continue
                        else:
                            # Unrecognized location string - do not claim match
                            return []

                # Work mode detection & filtering
                detected_mode = "On-site"
                if is_job_remote:
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
                        constraints=[f"Verified Location: {loc_str}"],
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
