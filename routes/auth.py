"""
routes/auth.py
Phase 2 — Authentication module.
Handles admin session login/logout and student account registration/login.
"""
import os
from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__)


# ─────────────────────────────────────────────
# Page Routes
# ─────────────────────────────────────────────

@auth_bp.route("/login")
def login_page():
    return render_template("login.html")


# ─────────────────────────────────────────────
# Admin Auth (session-based)
# ─────────────────────────────────────────────

@auth_bp.route("/api/admin/login", methods=["POST"])
def admin_login():
    """Validate admin password and start a permanent session."""
    password = request.json.get("password", "")
    if password == os.environ.get("ADMIN_PASSWORD", "Admin@2026"):
        session.permanent = True
        session["is_admin"] = True
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Incorrect password."})


@auth_bp.route("/api/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("auth.login_page"))


# ─────────────────────────────────────────────
# Student Auth (Phase 2)
# ─────────────────────────────────────────────

@auth_bp.route("/api/register", methods=["POST"])
def user_register():
    """Student self-registration: name + email + password."""
    data     = request.json or {}
    name     = data.get("name", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"success": False, "message": "Name, email, and password are required."})
    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters."})
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "An account with this email already exists."})

    user = User(name=name, email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({"success": True, "message": "Account created! You can now register your face."})


@auth_bp.route("/api/login", methods=["POST"])
def user_login():
    """Student/admin login — sets session, returns role."""
    data     = request.json or {}
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"success": False, "message": "Invalid email or password."})

    session.permanent = True
    session["user_id"]   = user.id
    session["user_name"] = user.name
    session["user_role"] = user.role
    if user.role == "admin":
        session["is_admin"] = True

    return jsonify({
        "success": True,
        "name": user.name,
        "role": user.role,
        "message": f"Welcome back, {user.name}!",
    })
