"""
Base Job Provider Interface for GigSync Platform.
Defines the standard interface and unified data model for all external job search providers.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict

@dataclass
class JobRequirementsModel:
    essentialSkills: List[str] = field(default_factory=list)
    preferredSkills: List[str] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)
    minYearsExperience: int = 0
    degreeRequirement: Optional[str] = None

@dataclass
class UnifiedJobListing:
    id: str
    source: str
    sourceJobId: str
    title: str
    company: str
    location: str
    workMode: str  # 'Remote' | 'Hybrid' | 'On-site'
    experienceLevel: str  # 'Internship' | 'Entry-level' | 'Junior' | 'Mid-level'
    salaryRange: str
    description: str
    requirements: JobRequirementsModel
    postedAt: str
    applyUrl: str
    verified: bool = True
    stale: bool = False
    rawLocation: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        return d

class BaseJobProvider(ABC):
    """Abstract base class for all job search providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g. 'Adzuna', 'The Muse', 'Remotive')."""
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if the provider has necessary API keys or is ready to use."""
        pass

    @abstractmethod
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
        """
        Execute job search against external provider.
        Must return a list of genuine UnifiedJobListing instances.
        Must NOT fabricate results or return synthetic fallback data.
        """
        pass
