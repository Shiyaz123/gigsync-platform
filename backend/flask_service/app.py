"""
GigSync Python Flask REST API Service.
Handles genuine location-based job search, external provider integration,
and honest resume-to-job requirement matching.
"""
import logging
from typing import Dict, Any, List, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    from .config import Config
    from .providers.manager import JobProviderManager
    from .matching_engine import calculate_resume_job_match
except ImportError:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from config import Config
    from providers.manager import JobProviderManager
    from matching_engine import calculate_resume_job_match

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("gigsync.flask_service")

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for frontend and API gateway
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Provider Manager Singleton
provider_manager = JobProviderManager()

@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        "error": "Bad Request",
        "message": getattr(error, "description", str(error)),
        "status": 400
    }), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Not Found",
        "message": getattr(error, "description", "Resource not found"),
        "status": 404
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({
        "error": "Internal Server Error",
        "message": "An unexpected error occurred while processing your request.",
        "status": 500
    }), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint indicating active providers and status."""
    configured_providers = provider_manager.get_configured_providers()
    return jsonify({
        "status": "healthy",
        "service": "GigSync Python Flask Job Service",
        "version": "1.0.0",
        "providers": configured_providers
    }), 200

@app.route("/api/jobs", methods=["GET"])
def get_jobs():
    """
    Genuine location-based job search endpoint.
    Filters:
      - role / keyword (e.g., 'Python Developer')
      - location (e.g., 'Bengaluru, India', 'Austin, TX', 'Remote')
      - work_mode / workMode ('Remote', 'Hybrid', 'On-site', 'All')
      - experience / experience_level / experienceLevel ('Internship', 'Entry-level', 'Junior', 'All')
      - skills (comma-separated list)
      - page (integer >= 1)
      - limit (integer 1-50)
    """
    # Parse and validate query parameters
    role = request.args.get("role") or request.args.get("keyword") or ""
    location = request.args.get("location") or ""
    work_mode = request.args.get("work_mode") or request.args.get("workMode") or "All"
    experience_level = (
        request.args.get("experience") or
        request.args.get("experience_level") or
        request.args.get("experienceLevel") or
        "All"
    )

    skills_raw = request.args.get("skills") or ""
    skills = [s.strip() for s in skills_raw.split(",") if s.strip()] if skills_raw else None

    # Pagination validation
    page_str = request.args.get("page", "1")
    try:
        page = int(page_str)
        if page < 1:
            return jsonify({"error": "Invalid parameter", "message": "Page must be an integer >= 1."}), 400
    except ValueError:
        return jsonify({"error": "Invalid parameter", "message": "Page must be a valid integer."}), 400

    limit_str = request.args.get("limit", "20")
    try:
        limit = min(max(1, int(limit_str)), 50)
    except ValueError:
        limit = 20

    provider_preference = request.args.get("provider")

    try:
        jobs = provider_manager.search_jobs(
            role=role,
            location=location,
            work_mode=work_mode,
            experience_level=experience_level,
            skills=skills,
            page=page,
            limit=limit,
            provider_preference=provider_preference
        )

        job_dicts = [j.to_dict() for j in jobs]

        # Optional profile match computation if passed via query/header or basic profile
        # Note: If no jobs match, return empty array with honest explanation
        msg = None
        if len(job_dicts) == 0:
            loc_msg = f" in '{location}'" if location else ""
            role_msg = f" for '{role}'" if role else ""
            msg = f"No verified job opportunities found{role_msg}{loc_msg}. Try broadening your search or selecting 'Remote'."

        return jsonify({
            "jobs": job_dicts,
            "total": len(job_dicts),
            "page": page,
            "filters": {
                "role": role,
                "location": location,
                "work_mode": work_mode,
                "experience_level": experience_level
            },
            "message": msg
        }), 200

    except PermissionError as pe:
        return jsonify({
            "error": "Provider Authentication Failure",
            "message": str(pe),
            "status": 502
        }), 502
    except TimeoutError as te:
        return jsonify({
            "error": "Provider Timeout",
            "message": str(te),
            "status": 504
        }), 504
    except Exception as e:
        logger.error(f"Error querying job search providers: {e}", exc_info=True)
        return jsonify({
            "error": "Job Search Error",
            "message": f"Unable to fetch jobs from provider: {str(e)}",
            "status": 502
        }), 502

@app.route("/api/jobs/<job_id>", methods=["GET"])
def get_job_by_id(job_id: str):
    """Retrieves full details for a verified job listing."""
    job = provider_manager.get_job_by_id(job_id)
    if not job:
        return jsonify({
            "error": "Not Found",
            "message": f"Job listing with ID '{job_id}' was not found in active cache. Please perform a new search.",
            "status": 404
        }), 404

    return jsonify({
        "job": job.to_dict()
    }), 200

@app.route("/api/jobs/match", methods=["POST"])
@app.route("/api/match", methods=["POST"])
def match_resume_to_job():
    """
    Computes honest, evidence-grounded resume-to-job matching.
    Payload:
      - profile: CandidateProfile dict
      - job: UnifiedJobListing dict OR jobId: string
    """
    data = request.get_json(silent=True) or {}
    profile = data.get("profile")

    if not profile or not isinstance(profile, dict):
        return jsonify({
            "error": "Bad Request",
            "message": "Candidate profile is required for matching."
        }), 400

    job_data = data.get("job")
    job_id = data.get("jobId")

    if not job_data and job_id:
        cached_job = provider_manager.get_job_by_id(job_id)
        if cached_job:
            job_data = cached_job.to_dict()

    if not job_data or not isinstance(job_data, dict):
        return jsonify({
            "error": "Bad Request",
            "message": "A valid job object or cached jobId is required for matching."
        }), 400

    try:
        match_result = calculate_resume_job_match(profile, job_data)
        return jsonify(match_result), 200
    except Exception as e:
        logger.error(f"Matching calculation error: {e}", exc_info=True)
        return jsonify({
            "error": "Matching Error",
            "message": f"Failed to compute job match: {str(e)}"
        }), 500

if __name__ == "__main__":
    port = Config.PORT
    host = Config.HOST
    logger.info(f"Starting GigSync Flask Job Search Service on http://{host}:{port}")
    app.run(host=host, port=port, debug=Config.DEBUG)
