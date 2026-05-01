"""
routes/devices.py
Phase 4 — Device Change Request module.
Students can request a device change; admin approves or rejects.
"""
from flask import Blueprint, request, jsonify, session

from extensions import db
from models import Student, DeviceRequest

devices_bp = Blueprint("devices", __name__)


# ─────────────────────────────────────────────
# Student — Submit device change request
# ─────────────────────────────────────────────

@devices_bp.route("/api/request_device_change", methods=["POST"])
def request_device_change():
    """
    Called when a student's face matches but their device doesn't.
    Creates a DeviceRequest row with status='pending'.
    """
    try:
        data         = request.json or {}
        student_name = data.get("name", "").strip()
        new_device_id   = data.get("newDeviceId", "unknown")
        new_device_info = data.get("newDeviceInfo", "Unknown Device")
        reason       = data.get("reason", "").strip()

        if not student_name:
            return jsonify({"success": False, "message": "Student name is required."})
        if not reason:
            return jsonify({"success": False, "message": "Please provide a reason for the device change."})

        student = Student.query.filter(Student.name.ilike(student_name)).first()
        if not student:
            return jsonify({"success": False, "message": f"Student '{student_name}' not found. Check your name."})

        # Prevent duplicate pending requests
        if DeviceRequest.query.filter_by(student_name=student.name, status="pending").first():
            return jsonify({
                "success": False,
                "message": "You already have a pending request. Please wait for admin approval.",
            })

        db.session.add(DeviceRequest(
            student_name=student.name,
            old_device_id=student.device_id,
            new_device_id=new_device_id,
            new_device_info=new_device_info,
            reason=reason,
        ))
        db.session.commit()
        print(f"[DeviceRequest] Submitted by {student.name}")
        return jsonify({"success": True, "message": "Request submitted! Admin will review and approve your new device."})

    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)})


# ─────────────────────────────────────────────
# Admin — List all requests
# ─────────────────────────────────────────────

@devices_bp.route("/api/admin/device_requests")
def admin_device_requests():
    if not session.get("is_admin"):
        return jsonify({"error": "Unauthorized"}), 401

    reqs = DeviceRequest.query.order_by(DeviceRequest.created_at.desc()).all()
    return jsonify([r.to_dict() for r in reqs])


# ─────────────────────────────────────────────
# Admin — Approve request → update student device
# ─────────────────────────────────────────────

@devices_bp.route("/api/admin/approve_device", methods=["POST"])
def approve_device():
    if not session.get("is_admin"):
        return jsonify({"error": "Unauthorized"}), 401
    try:
        req_id = (request.json or {}).get("requestId")
        req    = DeviceRequest.query.get(req_id)

        if not req or req.status != "pending":
            return jsonify({"success": False, "message": "Request not found or already processed."})

        student = Student.query.filter_by(name=req.student_name).first()
        if not student:
            return jsonify({"success": False, "message": "Student not found."})

        student.device_id   = req.new_device_id
        student.device_info = req.new_device_info
        req.status = "approved"
        db.session.commit()
        print(f"[DeviceRequest] Approved for {student.name}")
        return jsonify({
            "success": True,
            "message": f"Device approved for {student.name}. They can now mark attendance from their new device.",
        })
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)})


# ─────────────────────────────────────────────
# Admin — Reject request
# ─────────────────────────────────────────────

@devices_bp.route("/api/admin/reject_device", methods=["POST"])
def reject_device():
    if not session.get("is_admin"):
        return jsonify({"error": "Unauthorized"}), 401
    try:
        req_id = (request.json or {}).get("requestId")
        req    = DeviceRequest.query.get(req_id)

        if not req or req.status != "pending":
            return jsonify({"success": False, "message": "Request not found or already processed."})

        req.status = "rejected"
        db.session.commit()
        print(f"[DeviceRequest] Rejected for {req.student_name}")
        return jsonify({"success": True, "message": f"Device request rejected for {req.student_name}."})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)})
