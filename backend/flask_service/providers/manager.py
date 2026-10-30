"""
Job Provider Manager.
Coordinates active job providers (Adzuna, The Muse, Remotive, Arbeitnow),
orchestrates searches, prioritizes local on-site vacancies before remote options,
and maintains in-memory lookups for job details.
"""
import re
import logging
from typing import Dict, Any, List, Optional
from collections import OrderedDict

try:
    from .base import BaseJobProvider, UnifiedJobListing
    from .adzuna_provider import AdzunaProvider
    from .themuse_provider import TheMuseProvider, CITY_ALIASES
    from .remotive_provider import RemotiveProvider
    from .arbeitnow_provider import ArbeitnowProvider
except ImportError:
    from base import BaseJobProvider, UnifiedJobListing
    from adzuna_provider import AdzunaProvider
    from themuse_provider import TheMuseProvider, CITY_ALIASES
    from remotive_provider import RemotiveProvider
    from arbeitnow_provider import ArbeitnowProvider

logger = logging.getLogger(__name__)

class JobProviderManager:
    """Manages multi-provider execution and caching of genuine job postings."""

    def __init__(self):
        self.providers: Dict[str, BaseJobProvider] = {
            "adzuna": AdzunaProvider(),
            "themuse": TheMuseProvider(),
            "remotive": RemotiveProvider(),
            "arbeitnow": ArbeitnowProvider()
        }
        self._job_cache: OrderedDict[str, UnifiedJobListing] = OrderedDict()
        self._max_cache_size = 500

    def get_configured_providers(self) -> List[Dict[str, Any]]:
        """Reports provider readiness."""
        return [
            {
                "name": name,
                "provider_title": provider.provider_name,
                "is_configured": provider.is_configured()
            }
            for name, provider in self.providers.items()
        ]

    def cache_jobs(self, jobs: List[UnifiedJobListing]):
        """Caches genuine job records for subsequent detail and match queries."""
        for j in jobs:
            self._job_cache[j.id] = j
            if len(self._job_cache) > self._max_cache_size:
                self._job_cache.popitem(last=False)

    def get_job_by_id(self, job_id: str) -> Optional[UnifiedJobListing]:
        """Retrieves a cached job by ID."""
        return self._job_cache.get(job_id)

    def search_jobs(
        self,
        role: Optional[str] = None,
        location: Optional[str] = None,
        work_mode: Optional[str] = None,
        experience_level: Optional[str] = None,
        skills: Optional[List[str]] = None,
        page: int = 1,
        limit: int = 20,
        provider_preference: Optional[str] = None,
        timeout: int = 10
    ) -> List[UnifiedJobListing]:
        """
        Executes search across eligible providers.
        Guarantees that results are genuine and meet location criteria.
        Prioritizes verified local on-site matches before remote listings.
        """
        results: List[UnifiedJobListing] = []
        seen_titles_companies = set()

        loc_lower = (location or "").strip().lower()
        is_specific_city = any(c in loc_lower for c in CITY_ALIASES)
        is_remote_mode = (work_mode or "").lower() == "remote"
        is_onsite_mode = (work_mode or "").lower() == "on-site"

        # Determine target providers to invoke
        active_providers: List[BaseJobProvider] = []

        if provider_preference and provider_preference.lower() in self.providers:
            active_providers.append(self.providers[provider_preference.lower()])
        else:
            # 1. Prioritize local location providers (The Muse, Adzuna)
            adzuna = self.providers["adzuna"]
            if adzuna.is_configured():
                active_providers.append(adzuna)

            active_providers.append(self.providers["themuse"])

            # 2. Add Arbeitnow for EU / Germany / remote
            if not any(k in loc_lower for k in ["india", "bengaluru", "mumbai", "delhi", "san jose", "san francisco"]):
                active_providers.append(self.providers["arbeitnow"])

            # 3. For remote or general country searches, add Remotive
            # If user specified a specific city on-site/all, do NOT flood with Remotive
            if not is_onsite_mode:
                if is_remote_mode or not is_specific_city:
                    active_providers.append(self.providers["remotive"])

        local_matches: List[UnifiedJobListing] = []
        remote_matches: List[UnifiedJobListing] = []

        for provider in active_providers:
            try:
                provider_jobs = provider.search_jobs(
                    role=role,
                    location=location,
                    work_mode=work_mode,
                    experience_level=experience_level,
                    skills=skills,
                    page=page,
                    limit=limit,
                    timeout=timeout
                )
                for job in provider_jobs:
                    key = (job.title.strip().lower(), job.company.strip().lower())
                    if key not in seen_titles_companies:
                        seen_titles_companies.add(key)
                        if job.workMode == "Remote":
                            remote_matches.append(job)
                        else:
                            local_matches.append(job)

            except PermissionError as pe:
                logger.warning(f"Provider {provider.provider_name} auth failure: {pe}")
            except TimeoutError as te:
                logger.warning(f"Provider {provider.provider_name} timed out: {te}")
            except Exception as e:
                logger.error(f"Provider {provider.provider_name} search error: {e}")

        # Local listings are always prioritized before remote
        results.extend(local_matches)
        results.extend(remote_matches)

        # Cache the results
        self.cache_jobs(results)

        # Enforce limit
        return results[:limit]
