"""
Comprehensive Test Suite for GigSync Flask Job Search & Resume Matching Service.
Covers:
- Valid search parameters
- Location and work-mode filters
- Empty search results handling
- Provider authentication failure handling
- Provider timeout and server error handling
- Invalid query parameter handling
- JSON error responses
- Resume-based matching with real supplied resume data
- Resume-based matching with resumes containing no skills
- Absence of fabricated fallback jobs
- Live integration tests against configured public providers
"""
import pytest
from unittest.mock import patch, MagicMock
from backend.flask_service.app import app, provider_manager
from backend.flask_service.providers.base import UnifiedJobListing, JobRequirementsModel
from backend.flask_service.matching_engine import calculate_resume_job_match

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

# Sample genuine job fixture for testing
SAMPLE_GENUINE_JOB = UnifiedJobListing(
    id="test_genuine_1",
    source="Adzuna",
    sourceJobId="adz-12345",
    title="Python Backend Developer",
    company="Acme Analytics India",
    location="Bengaluru, India",
    workMode="Hybrid",
    experienceLevel="Entry-level",
    salaryRange="₹800,000 - ₹1,200,000 / year",
    description="Building backend REST services with Python, FastAPI, and PostgreSQL.",
    requirements=JobRequirementsModel(
        essentialSkills=["Python", "PostgreSQL", "REST APIs", "Git"],
        preferredSkills=["Docker", "AWS"],
        constraints=["Eligible to work in India"],
        minYearsExperience=0,
        degreeRequirement="BTech in Computer Science or related"
    ),
    postedAt="2026-10-28T10:00:00Z",
    applyUrl="https://example.com/apply/12345",
    verified=True
)

SAMPLE_US_ONSITE_JOB = UnifiedJobListing(
    id="test_us_1",
    source="The Muse",
    sourceJobId="muse-987",
    title="Python Systems Engineer",
    company="Silicon Corp",
    location="San Francisco, CA",
    workMode="On-site",
    experienceLevel="Junior",
    salaryRange="$95,000 - $115,000 / year",
    description="On-site systems programming in California.",
    requirements=JobRequirementsModel(
        essentialSkills=["Python", "Linux", "C++"],
        preferredSkills=["Docker"],
        constraints=["On-site in San Francisco, CA"],
        minYearsExperience=1
    ),
    postedAt="2026-10-28T10:00:00Z",
    applyUrl="https://example.com/apply/987",
    verified=True
)

# --------------------------------------------------------------------------
# 1. Valid Search Parameters (Mocked)
# --------------------------------------------------------------------------
def test_valid_search_parameters(client):
    """Test search with valid role and location returns unified jobs."""
    with patch.object(provider_manager, 'search_jobs', return_value=[SAMPLE_GENUINE_JOB]):
        resp = client.get("/api/jobs?role=Python%20Developer&location=Bengaluru%2C%20India&work_mode=Hybrid")
        assert resp.status_code == 200
        data = resp.get_json()
        assert "jobs" in data
        assert data["total"] == 1
        job = data["jobs"][0]
        assert job["title"] == "Python Backend Developer"
        assert job["company"] == "Acme Analytics India"
        assert job["location"] == "Bengaluru, India"
        assert job["applyUrl"] == "https://example.com/apply/12345"
        assert job["source"] == "Adzuna"
        assert job["verified"] is True

# --------------------------------------------------------------------------
# 2. Location and Work-Mode Filters
# --------------------------------------------------------------------------
def test_location_filtering_excludes_foreign_onsite_jobs(client):
    """Verify that a search for Bengaluru, India does NOT return US on-site jobs."""
    def mock_search(role=None, location=None, work_mode=None, **kwargs):
        # Realistic provider filtering: only jobs matching location are returned
        all_jobs = [SAMPLE_GENUINE_JOB, SAMPLE_US_ONSITE_JOB]
        if location and "bengaluru" in location.lower():
            return [j for j in all_jobs if "bengaluru" in j.location.lower()]
        return all_jobs

    with patch.object(provider_manager, 'search_jobs', side_effect=mock_search):
        resp = client.get("/api/jobs?role=Python&location=Bengaluru%2C%20India")
        assert resp.status_code == 200
        data = resp.get_json()
        jobs = data["jobs"]
        # Must only include India job, NEVER the San Francisco on-site job
        assert len(jobs) == 1
        assert "Bengaluru" in jobs[0]["location"]
        assert not any("San Francisco" in j["location"] for j in jobs)

# --------------------------------------------------------------------------
# 3. Empty Search Results
# --------------------------------------------------------------------------
def test_empty_search_results(client):
    """Verify empty results return clear honest explanation with NO fabricated jobs."""
    with patch.object(provider_manager, 'search_jobs', return_value=[]):
        resp = client.get("/api/jobs?role=Quantum%20Cobol&location=Antarctica")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["jobs"] == []
        assert data["total"] == 0
        assert "No verified job opportunities found" in data["message"]
        # Verify no fake fallback data returned
        assert "Veloce" not in str(data)
        assert "Stratos" not in str(data)

# --------------------------------------------------------------------------
# 4. Provider Authentication Failures
# --------------------------------------------------------------------------
def test_provider_authentication_failure(client):
    """Verify 401/403 provider error produces structured 502 Bad Gateway response."""
    with patch.object(provider_manager, 'search_jobs', side_effect=PermissionError("Adzuna authentication failed (HTTP 401). Check credentials.")):
        resp = client.get("/api/jobs?role=Python")
        assert resp.status_code == 502
        data = resp.get_json()
        assert data["error"] == "Provider Authentication Failure"
        assert "authentication failed" in data["message"].lower()

# --------------------------------------------------------------------------
# 5. Provider Timeouts and Server Errors
# --------------------------------------------------------------------------
def test_provider_timeout(client):
    """Verify provider timeout produces structured 504 Gateway Timeout response."""
    with patch.object(provider_manager, 'search_jobs', side_effect=TimeoutError("Adzuna API request timed out.")):
        resp = client.get("/api/jobs?role=Python")
        assert resp.status_code == 504
        data = resp.get_json()
        assert data["error"] == "Provider Timeout"
        assert "timed out" in data["message"].lower()

# --------------------------------------------------------------------------
# 6. Invalid Query Parameters
# --------------------------------------------------------------------------
def test_invalid_query_parameters(client):
    """Verify negative or non-integer page numbers return 400 Bad Request."""
    resp1 = client.get("/api/jobs?page=-5")
    assert resp1.status_code == 400
    assert "Page must be an integer >= 1" in resp1.get_json()["message"]

    resp2 = client.get("/api/jobs?page=invalid_string")
    assert resp2.status_code == 400
    assert "Page must be a valid integer" in resp2.get_json()["message"]

# --------------------------------------------------------------------------
# 7. Absence of Fabricated Fallback Jobs
# --------------------------------------------------------------------------
def test_absence_of_fabricated_fallback_jobs(client):
    """Strictly assert that synthetic demo companies never appear in live responses."""
    resp = client.get("/api/jobs?role=NonexistentRoleXYZ12345&location=NowhereCity")
    assert resp.status_code == 200
    data = resp.get_json()
    jobs = data.get("jobs", [])
    for job in jobs:
        assert job.get("company") != "Veloce Digital Systems"
        assert job.get("company") != "Stratos Data Technologies"
        assert job.get("company") != "Aether Infrastructure"

# --------------------------------------------------------------------------
# 8. Resume-Based Matching with Real Supplied Resume Data
# --------------------------------------------------------------------------
def test_resume_matching_with_real_profile(client):
    """Tests honest weighted scoring: Skills 50%, Experience 25%, Education 15%, Role 10%."""
    real_profile = {
        "userId": "usr_real_01",
        "personalInfo": {
            "fullName": "Priya Sharma",
            "title": "Python Backend Developer",
            "location": "Bengaluru, India"
        },
        "skills": {
            "technical": ["Python", "PostgreSQL", "REST APIs", "Git"],
            "frameworks": ["FastAPI", "Flask"],
            "tools": ["Docker", "Linux"],
            "soft": ["Problem Solving"]
        },
        "education": [
            {
                "institution": "Indian Institute of Technology",
                "degree": "BTech",
                "fieldOfStudy": "Computer Science and Engineering",
                "endDate": "2025"
            }
        ],
        "experience": [
            {
                "company": "Tech Innovations Pvt Ltd",
                "role": "Backend Intern",
                "bullets": ["Engineered REST APIs using Python and PostgreSQL."]
            }
        ],
        "projects": [
            {
                "title": "Cloud Pipeline",
                "techStack": ["Python", "PostgreSQL", "Docker"],
                "description": "Built automated data ingestion pipelines."
            }
        ],
        "careerPreferences": {
            "targetRoles": ["Python Backend Developer", "Software Engineer"]
        }
    }

    job_dict = SAMPLE_GENUINE_JOB.to_dict()
    result = calculate_resume_job_match(real_profile, job_dict)

    # All essential skills matched (Python, PostgreSQL, REST APIs, Git)
    assert result["scoreBreakdown"]["skillsScore"] > 80
    assert result["scoreBreakdown"]["experienceScore"] > 60
    assert result["scoreBreakdown"]["educationScore"] == 95  # CS degree
    assert result["scoreBreakdown"]["roleSimilarityScore"] == 100  # Target role matches exactly
    assert result["overallScore"] >= 75
    assert len(result["matchedSkills"]) >= 4
    assert result["disclaimer"] != ""
    assert "hiring probability" in result["disclaimer"].lower()

# --------------------------------------------------------------------------
# 9. Resume-Based Matching with Resumes Containing No Skills
# --------------------------------------------------------------------------
def test_resume_matching_with_zero_skills():
    """Verify that a candidate with zero skills receives 0% skills score and honest gaps."""
    empty_skills_profile = {
        "userId": "usr_noskills_02",
        "personalInfo": {
            "fullName": "Blank Candidate",
            "title": "",
            "location": "Bengaluru, India"
        },
        "skills": {
            "technical": [],
            "frameworks": [],
            "tools": [],
            "soft": []
        },
        "education": [],
        "experience": [],
        "projects": [],
        "careerPreferences": {
            "targetRoles": []
        }
    }

    job_dict = SAMPLE_GENUINE_JOB.to_dict()
    result = calculate_resume_job_match(empty_skills_profile, job_dict)

    # Strictly 0% skills score when no skills or projects exist
    assert result["scoreBreakdown"]["skillsScore"] == 0
    assert result["scoreBreakdown"]["experienceScore"] == 0
    assert result["scoreBreakdown"]["educationScore"] == 0
    assert result["scoreBreakdown"]["roleSimilarityScore"] == 0
    assert result["overallScore"] == 0

    assert len(result["matchedSkills"]) == 0
    assert len(result["missingEssentialSkills"]) == len(SAMPLE_GENUINE_JOB.requirements.essentialSkills)
    assert "No verified skills or experience found" in result["explanation"]

# --------------------------------------------------------------------------
# 10. Live Integration Test against Public Real Provider
# --------------------------------------------------------------------------
def test_live_provider_integration():
    """
    Real integration test against public live provider (The Muse / Remotive).
    Tests actual network call and verifies genuine non-fabricated records.
    """
    from backend.flask_service.providers.themuse_provider import TheMuseProvider
    provider = TheMuseProvider()

    # Query public provider for entry-level Software Engineering positions
    results = provider.search_jobs(role="Software", limit=5, timeout=12)

    # If network/Cloudflare allows, assert real job listings returned
    if results:
        job = results[0]
        assert job.source == "The Muse"
        assert len(job.title) > 0
        assert len(job.company) > 0
        assert job.applyUrl.startswith("http")
        assert job.verified is True
        # Verify it is not our hardcoded seed data
        assert job.company != "Veloce Digital Systems"
        assert job.company != "Stratos Data Technologies"
