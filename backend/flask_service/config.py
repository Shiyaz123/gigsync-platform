"""
Configuration settings for GigSync Flask Job Search & Matching Service.
"""
import os
from dotenv import load_dotenv

# Load .env from project root or backend folder if present
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

class Config:
    PORT = int(os.environ.get("FLASK_PORT", 5001))
    HOST = os.environ.get("FLASK_HOST", "0.0.0.0")
    DEBUG = os.environ.get("FLASK_DEBUG", "false").lower() in ["true", "1", "yes"]

    # Adzuna API credentials
    ADZUNA_APP_ID = os.environ.get("ADZUNA_APP_ID", "").strip()
    ADZUNA_APP_KEY = os.environ.get("ADZUNA_APP_KEY", "").strip()

    # The Muse API credentials (optional, works without key)
    THE_MUSE_API_KEY = os.environ.get("THE_MUSE_API_KEY", "").strip()

    # Allowed CORS origins
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")
