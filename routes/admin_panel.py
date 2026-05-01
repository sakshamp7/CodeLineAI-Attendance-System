"""
routes/admin_panel.py
Phase 5 — Admin dashboard routes.
Students management, stats, device control, and student registration.
"""
import os
from datetime import datetime
from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from werkzeug.security import generate_password_hash

from extensions import db
from models import Student, Attendance, User, DeviceRequest

admin_bp = Blueprint("admin", __name__)


# ─────────────────────────────────────────────
# Guard helper
# ─────────────────────────────────────────────

def _admin_only():
    """Return a 401 response if the session is not an admin session."""
    if not session.get("is_admin"):
        return jsonify({"error": "Unauthorized"}), 401
    return None


# ─────────────────────────────────────────────
# Page
# ─────────────────────────────────────────────

@admin_bp.route("/admin")
def admin_page():
    if not session.get("is_admin"):
        return redirect(url_for("auth.login_page"))
    return render_template("admin.html")


# ─────────────────────────────────────────────
# Dashboard Stats
# ─────────────────────────────────────────────

@admin_bp.route("/api/admin/stats")
def admin_stats():
    err = _admin_only()
    if err:
        return err

    today        = datetime.now().strftime("%Y-%m-%d")
    total_students   = Student.query.count()
    today_attendance = Attendance.query.filter_by(date=today).count()
    total_records    = Attendance.query.count()
    pending_requests = DeviceRequest.query.filter_by(status="pending").count()

    return jsonify({
        "total_students":    total_students,
        "today_attendance":  today_attendance,
        "total_records":     total_records,
        "pending_requests":  pending_requests,
    })


@admin_bp.route("/api/admin/pending_count")
def pending_count():
    err = _admin_only()
    if err:
        return err
    count = DeviceRequest.query.filter_by(status="pending").count()
    return jsonify({"count": count})


# ─────────────────────────────────────────────
# Students
# ─────────────────────────────────────────────

@admin_bp.route("/api/admin/students")
def admin_students():
    err = _admin_only()
    if err:
        return err

    result = []
    for s in Student.query.all():
        img_path = os.path.join("faces", f"{s.name}.jpg")
        reg_date = (
            datetime.fromtimestamp(os.path.getctime(img_path)).strftime("%Y-%m-%d")
            if os.path.exists(img_path) else "N/A"
        )
        result.append({"name": s.name, "reg_date": reg_date})
    return jsonify(result)


@admin_bp.route("/api/admin/delete_student", methods=["POST"])
def delete_student():
    err = _admin_only()
    if err:
        return err
    try:
        name    = (request.json or {}).get("name", "")
        student = Student.query.filter_by(name=name).first()
        if not student:
            return jsonify({"success": False, "message": "Student not found."})

        db.session.delete(student)
        db.session.commit()

        img_path = os.path.join("faces", f"{name}.jpg")
        if os.path.exists(img_path):
            os.remove(img_path)

        return jsonify({"success": True, "message": f"Deleted {name}."})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)})


# ─────────────────────────────────────────────
# Device bindings (read + reset)
# ─────────────────────────────────────────────

@admin_bp.route("/api/admin/devices")
def admin_devices():
    err = _admin_only()
    if err:
        return err
    return jsonify([
        {
            "name":       s.name,
            "deviceId":   s.device_id or "Not Bound",
            "deviceInfo": s.device_info or "N/A",
        }
        for s in Student.query.all()
    ])


@admin_bp.route("/api/admin/reset_device", methods=["POST"])
def reset_device():
    err = _admin_only()
    if err:
        return err
    name    = (request.json or {}).get("name", "")
    student = Student.query.filter_by(name=name).first()
    if not student or not student.device_id:
        return jsonify({"success": False, "message": "No device bound for this student."})

    student.device_id   = None
    student.device_info = None
    db.session.commit()
    return jsonify({"success": True, "message": f"Device reset for {name}. They can now register a new device."})


# ─────────────────────────────────────────────
# Phase 5 — Register student from admin panel
# ─────────────────────────────────────────────

@admin_bp.route("/api/admin/register_student", methods=["POST"])
def admin_register_student():
    """
    Admin creates a User account (name + email + temp password).
    The student must then go to the portal and register their face.
    """
    err = _admin_only()
    if err:
        return err
    try:
        data     = request.json or {}
        name     = data.get("name", "").strip()
        email    = data.get("email", "").strip().lower()
        password = data.get("password", "").strip() or "changeme123"

        if not name or not email:
            return jsonify({"success": False, "message": "Name and email are required."})
        if User.query.filter_by(email=email).first():
            return jsonify({"success": False, "message": f"Email '{email}' is already registered."})

        user = User(name=name, email=email, password_hash=generate_password_hash(password))
        db.session.add(user)
        db.session.commit()
        print(f"[Admin] Registered student: {name} ({email})")
        return jsonify({
            "success": True,
            "message": f"Student '{name}' registered. They must register their face at the attendance portal.",
        })
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)})
