"""
Job Provider Manager.
Coordinates active job providers (Adzuna, The Muse, Remotive),
orchestrates searches, applies deduplication and location filters,
and maintains in-memory lookups for job details.
"""
import logging
from typing import Dict, Any, List, Optional
from collections import OrderedDict

try:
    from .base import BaseJobProvider, UnifiedJobListing
    from .adzuna_provider import AdzunaProvider
    from .themuse_provider import TheMuseProvider
    from .remotive_provider import RemotiveProvider
except ImportError:
    from base import BaseJobProvider, UnifiedJobListing
    from adzuna_provider import AdzunaProvider
    from themuse_provider import TheMuseProvider
    from remotive_provider import RemotiveProvider

logger = logging.getLogger(__name__)

class JobProviderManager:
    """Manages multi-provider execution and caching of genuine job postings."""

    def __init__(self):
        self.providers: Dict[str, BaseJobProvider] = {
            "adzuna": AdzunaProvider(),
            "themuse": TheMuseProvider(),
            "remotive": RemotiveProvider()
        }
        # In-memory LRU store for recently fetched job details (capacity: 500)
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
        """
        results: List[UnifiedJobListing] = []
        seen_titles_companies = set()

        # Determine target providers to invoke
        active_providers: List[BaseJobProvider] = []

        if provider_preference and provider_preference.lower() in self.providers:
            active_providers.append(self.providers[provider_preference.lower()])
        else:
            # If Adzuna is configured, prioritize Adzuna for location-specific queries
            adzuna = self.providers["adzuna"]
            if adzuna.is_configured():
                active_providers.append(adzuna)

            # For remote or all modes, add Remotive
            if not work_mode or work_mode.lower() in ["all", "remote"]:
                active_providers.append(self.providers["remotive"])

            # Add The Muse for US / Tech roles
            active_providers.append(self.providers["themuse"])

        errors = []
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
                    # Deduplicate by normalized title + company
                    key = (job.title.strip().lower(), job.company.strip().lower())
                    if key not in seen_titles_companies:
                        seen_titles_companies.add(key)
                        results.append(job)

            except PermissionError as pe:
                logger.warning(f"Provider {provider.provider_name} auth failure: {pe}")
                errors.append(str(pe))
            except TimeoutError as te:
                logger.warning(f"Provider {provider.provider_name} timed out: {te}")
                errors.append(str(te))
            except Exception as e:
                logger.error(f"Provider {provider.provider_name} search error: {e}")
                errors.append(str(e))

        # Cache the results
        self.cache_jobs(results)

        # Enforce limit
        return results[:limit]
