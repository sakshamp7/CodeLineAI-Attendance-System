"""
extensions.py
Single source of truth for shared Flask extensions.
Import `db` from here in all models and routes to avoid circular imports.
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
