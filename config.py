"""
config.py
Centralised configuration loaded from .env file.
All modules import from here — never hardcode values elsewhere.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    # --- Security ---
    SECRET_KEY = os.environ.get("SECRET_KEY", "fallback_dev_key_change_me")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@2026")

    # --- Database ---
    _db_url = os.environ.get("DATABASE_URL", "sqlite:///database.db")
    if _db_url.startswith("sqlite:///"):
        # Convert relative sqlite path to absolute to avoid "unable to open database file" errors
        _rel_path = _db_url.replace("sqlite:///", "")
        _abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), _rel_path))
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{_abs_path}"
    else:
        SQLALCHEMY_DATABASE_URI = _db_url
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Session ---
    SESSION_TIMEOUT_MINUTES = int(os.environ.get("SESSION_TIMEOUT_MINUTES", 30))
    PERMANENT_SESSION_LIFETIME = timedelta(
        minutes=int(os.environ.get("SESSION_TIMEOUT_MINUTES", 30))
    )

    # --- File Uploads ---
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH_MB", 16)) * 1024 * 1024

    # --- Face Recognition ---
    FACE_MATCH_THRESHOLD = float(os.environ.get("FACE_MATCH_THRESHOLD", 0.5))

    # --- External Services ---
    APPS_SCRIPT_URL = os.environ.get(
        "APPS_SCRIPT_URL",
        "https://script.google.com/macros/s/AKfycbzUQ9_tMbFP86YO6nI8feohNFQRQPtKPwGvOJqPZrwfbMznhSAURBfjUlKY_0u6IRfY/exec",
    )
