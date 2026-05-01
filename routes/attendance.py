"""
routes/attendance.py
Phase 6 — Attendance submission and Google Sheets sync.
"""
import requests as http_requests
from flask import Blueprint, request, jsonify, session

from extensions import db
from models import Attendance
from config import Config

attendance_bp = Blueprint("attendance", __name__)


# ─────────────────────────────────────────────
# Phase 6 — Submit attendance to Google Sheets
# ─────────────────────────────────────────────

@attendance_bp.route("/api/submit_to_apps_script", methods=["POST"])
def submit_to_apps_script():
    """
    Forward attendance data to Google Apps Script and log it locally.
    Payload: { name, date, inTime, outTime, confidence, status }
    """
    try:
        data = request.json or {}
        data["action"] = "attendance"

        response = http_requests.post(Config.APPS_SCRIPT_URL, json=data, timeout=10)

        if response.status_code != 200:
            return jsonify({"success": False, "message": f"Google error: HTTP {response.status_code}"}), 500

        # Parse Google's response
        msg = ""
        try:
            resp_json = response.json()
            msg = resp_json.get("msg", "")
        except Exception:
            pass

        if "Error" in msg or msg.startswith("❌"):
            return jsonify({"success": False, "message": msg})

        # ── Log locally ──────────────────────────────────────────
        db.session.add(Attendance(
            student_name=data.get("name"),
            date=data.get("date"),
            in_time=data.get("inTime"),
            out_time=data.get("outTime"),
            confidence=data.get("confidence", 1.0),
            status=data.get("status", "Present"),
        ))
        db.session.commit()

        return jsonify({"success": True, "message": msg or "Attendance marked successfully."})

    except Exception as exc:
        print(f"[submit_to_apps_script] Error: {exc}")
        return jsonify({"success": False, "message": str(exc)}), 500


# ─────────────────────────────────────────────
# Admin — View all attendance logs
# ─────────────────────────────────────────────

@attendance_bp.route("/api/admin/attendance")
def admin_attendance():
    if not session.get("is_admin"):
        return jsonify({"error": "Unauthorized"}), 401
    logs = Attendance.query.order_by(Attendance.id.desc()).all()
    return jsonify([log.to_dict() for log in logs])


# ─────────────────────────────────────────────
# Admin — Sync from Google Sheets to local DB
# ─────────────────────────────────────────────

@attendance_bp.route("/api/admin/sync_sheets")
def sync_sheets():
    if not session.get("is_admin"):
        return jsonify({"error": "Unauthorized"}), 401
    try:
        response = http_requests.get(Config.APPS_SCRIPT_URL, timeout=15)
        if response.status_code != 200:
            return jsonify({"success": False, "message": "Could not reach Google Sheets."})

        external = response.json()
        if isinstance(external, dict) and "data" in external:
            external = external["data"]

        Attendance.query.delete()
        count = 0
        for row in external:
            raw_date = row.get("Date") or row.get("date") or ""
            raw_in   = row.get("In-Time") or row.get("InTime") or row.get("inTime") or ""
            raw_out  = row.get("Out-Time") or row.get("OutTime") or row.get("outTime") or ""

            if not raw_date:
                continue

            def _fmt_date(d):
                d = str(d)
                return d.split("T")[0] if "T" in d else d

            def _fmt_time(t):
                t = str(t)
                return t.split("T")[1].split(".")[0][:8] if "T" in t else t

            db.session.add(Attendance(
                student_name=row.get("Name") or row.get("name") or "Unknown",
                date=_fmt_date(raw_date),
                in_time=_fmt_time(raw_in),
                out_time=_fmt_time(raw_out),
                confidence=1.0,
                status="Present",
            ))
            count += 1

        db.session.commit()
        return jsonify({"success": True, "message": f"Synced {count} records from Google Sheets."})

    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)})
