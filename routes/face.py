"""
routes/face.py
Phase 1 + Phase 8B — Face Recognition module.
Handles face registration, verification, and liveness detection.
"""
import base64
import os
import cv2
import numpy as np
import face_recognition
from flask import Blueprint, request, jsonify

from extensions import db
from models import Student
from utils.face_utils import calculate_match_percentage, compute_ear
from config import Config

face_bp = Blueprint("face", __name__)

# ─────────────────────────────────────────────
# Phase 1 — Face Registration
# ─────────────────────────────────────────────

@face_bp.route("/register_face", methods=["POST"])
def register_face():
    """
    Register or update a student's face encoding.
    Rejects:
      - no face detected
      - multiple faces in frame
      - face already registered to a different name (anti-spoofing)
      - re-registration from an unauthorised device
    """
    try:
        body       = request.json or {}
        image_data = body.get("image", "")
        name       = body.get("name", "").strip()
        mobile      = body.get("mobile", "").strip()
        email       = body.get("email", "").strip()
        device_id   = body.get("deviceId", "unknown")
        device_info = body.get("deviceInfo", "Unknown Device")

        if not name:
            return jsonify({"success": False, "message": "Name is required."})

        img = _decode_image(image_data)
        if img is None:
            return jsonify({"success": False, "message": "Invalid image format."})

        rgb    = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        boxes  = face_recognition.face_locations(rgb, number_of_times_to_upsample=1)
        encs   = face_recognition.face_encodings(rgb, boxes)

        if len(encs) == 0:
            return jsonify({"success": False, "message": "No face detected. Please look clearly at the camera."})
        if len(encs) > 1:
            return jsonify({"success": False, "message": f"Multiple faces ({len(encs)}) detected. Only one person allowed in frame."})

        new_enc = encs[0]

        # ── Duplicate / anti-fraud check ─────────────────────────
        all_students = Student.query.all()
        if all_students:
            known_encodings = [s.face_encoding for s in all_students]
            distances       = face_recognition.face_distance(known_encodings, new_enc)
            best_match_idx  = int(np.argmin(distances))
            min_dist        = float(distances[best_match_idx])

            # If the face is already in the DB (even under a different name)
            if min_dist < Config.FACE_MATCH_THRESHOLD:
                matched_student = all_students[best_match_idx]
                
                # If they are trying to register a NEW name but the face matches an OLD one
                if matched_student.name.lower() != name.lower():
                    return jsonify({
                        "success": False,
                        "message": f"Fraud Alert: This face is already registered to '{matched_student.name}'. Multiple accounts per person are not allowed.",
                        "match_name": matched_student.name
                    })
                # If they are updating their OWN face, that's fine (handled by existing logic below)

        # ── Save face image ───────────────────────────────────────
        faces_dir = os.path.join("instance", "faces")
        os.makedirs(faces_dir, exist_ok=True)
        cv2.imwrite(os.path.join(faces_dir, f"{name}.jpg"), img)

        # ── Upsert student record ────────────────────────────────
        existing = Student.query.filter(Student.name.ilike(name)).first()
        if existing:
            if existing.device_id and existing.device_id != device_id:
                return jsonify({
                    "success": False,
                    "message": "Security Alert: Unauthorized device. You cannot re-register from a new device. Contact admin.",
                })
            existing.face_encoding = new_enc
            existing.device_id     = device_id
            existing.device_info   = device_info
            existing.mobile        = mobile
            existing.email         = email
            message = f"Updated face profile for {name}."
        else:
            db.session.add(Student(
                name=name,
                face_encoding=new_enc,
                device_id=device_id,
                device_info=device_info,
                mobile=mobile,
                email=email,
            ))

            message = f"New face profile registered for {name}."

        db.session.commit()
        return jsonify({"success": True, "message": message})

    except Exception as exc:
        print(f"[register_face] Error: {exc}")
        return jsonify({"success": False, "error": str(exc)})


# ─────────────────────────────────────────────
# Phase 1 — Face Verification
# ─────────────────────────────────────────────

@face_bp.route("/verify_face", methods=["POST"])
def verify_face():
    """
    Verify a face against the registered database.
    Enforces device binding — rejects mismatches.
    """
    try:
        body       = request.json or {}
        image_data = body.get("image", "")
        device_id  = body.get("deviceId", "unknown")
        device_info = body.get("deviceInfo", "Unknown Device")

        img = _decode_image(image_data)
        if img is None:
            return jsonify({"success": False, "message": "Invalid image."})

        rgb  = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        boxes = face_recognition.face_locations(rgb, number_of_times_to_upsample=1)
        encs  = face_recognition.face_encodings(rgb, boxes)

        if len(encs) == 0:
            return jsonify({"success": False, "message": "No face detected."})
        if len(encs) > 1:
            return jsonify({"success": False, "message": "Multiple faces detected. Only one person in frame please."})

        students = Student.query.all()
        if not students:
            return jsonify({"success": False, "message": "No registered faces in the system yet."})

        distances = face_recognition.face_distance([s.face_encoding for s in students], encs[0])
        best_idx  = int(np.argmin(distances))
        min_dist  = float(distances[best_idx])
        match_pct = calculate_match_percentage(min_dist)

        if min_dist < Config.FACE_MATCH_THRESHOLD:
            student = students[best_idx]

            # ── Device binding check ──────────────────────────────
            if student.device_id and student.device_id != device_id:
                return jsonify({
                    "success": False,
                    "message": "Security Alert: Unauthorized Device. Please use your registered device or contact admin.",
                    "match_percentage": match_pct,
                })

            # Auto-bind device on first verification
            if not student.device_id:
                student.device_id   = device_id
                student.device_info = device_info
                db.session.commit()

            return jsonify({
                "success": True,
                "name": student.name,
                "confidence": match_pct / 100.0,
                "match_percentage": match_pct,
            })

        return jsonify({
            "success": False,
            "message": "Face not recognised.",
            "distance": min_dist,
            "match_percentage": match_pct,
        })

    except Exception as exc:
        print(f"[verify_face] Error: {exc}")
        return jsonify({"success": False, "error": str(exc)})


# ─────────────────────────────────────────────
# Phase 8B — Liveness Detection
# ─────────────────────────────────────────────

EAR_BLINK_THRESHOLD = 0.22

@face_bp.route("/api/liveness_check", methods=["POST"])
def liveness_check():
    """
    Detect a blink in a single frame to confirm the user is live (not a photo).
    Returns: { blink: bool, ear: float }
    """
    try:
        image_data = (request.json or {}).get("image", "")
        img = _decode_image(image_data)
        if img is None:
            return jsonify({"blink": False, "ear": 0})

        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        landmarks_list = face_recognition.face_landmarks(rgb)

        if not landmarks_list:
            return jsonify({"blink": False, "ear": 0, "message": "No face detected."})

        lm        = landmarks_list[0]
        left_eye  = lm.get("left_eye", [])
        right_eye = lm.get("right_eye", [])

        if len(left_eye) < 6 or len(right_eye) < 6:
            return jsonify({"blink": False, "ear": 0})

        avg_ear = (compute_ear(left_eye) + compute_ear(right_eye)) / 2.0
        return jsonify({"blink": avg_ear < EAR_BLINK_THRESHOLD, "ear": round(avg_ear, 4)})

    except Exception as exc:
        return jsonify({"blink": False, "ear": 0, "error": str(exc)})


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _decode_image(image_data: str):
    """Decode a base64 data-URL into an OpenCV BGR image. Returns None on failure."""
    try:
        if "," in image_data:
            image_data = image_data.split(",")[1]
        img_bytes = base64.b64decode(image_data)
        np_arr    = np.frombuffer(img_bytes, np.uint8)
        return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception:
        return None
