"""
models.py
All SQLAlchemy database models in one place.
"""
from datetime import datetime
from extensions import db


class Student(db.Model):
    """Face-registered students with device binding."""
    __tablename__ = "student"

    id           = db.Column(db.Integer, primary_key=True)
    name         = db.Column(db.String(100), unique=True, nullable=False)
    face_encoding = db.Column(db.PickleType, nullable=False)
    device_id    = db.Column(db.String(100), nullable=True)
    device_info  = db.Column(db.String(255), nullable=True)
    mobile       = db.Column(db.String(20), nullable=True)
    email        = db.Column(db.String(150), nullable=True)
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "device_id": self.device_id or "Not Bound",
            "device_info": self.device_info or "N/A",
            "mobile": self.mobile or "N/A",
            "email": self.email or "N/A",
            "registered_at": self.registered_at.isoformat() if self.registered_at else None,
        }


class Attendance(db.Model):
    """Attendance log entries synced to Google Sheets."""
    __tablename__ = "attendance"

    id           = db.Column(db.Integer, primary_key=True)
    student_name = db.Column(db.String(100), nullable=False)
    date         = db.Column(db.String(20), nullable=False)
    in_time      = db.Column(db.String(20), nullable=True)
    out_time     = db.Column(db.String(20), nullable=True)
    confidence   = db.Column(db.Float, nullable=True)
    status       = db.Column(db.String(20), nullable=True, default="Present")

    def to_dict(self):
        return {
            "name": self.student_name,
            "date": self.date,
            "inTime": self.in_time,
            "outTime": self.out_time,
            "confidence": self.confidence,
            "status": self.status,
        }


class DeviceRequest(db.Model):
    """Phase 4 — Student-submitted device change requests awaiting admin approval."""
    __tablename__ = "device_request"

    id             = db.Column(db.Integer, primary_key=True)
    student_name   = db.Column(db.String(100), nullable=False)
    old_device_id  = db.Column(db.String(100), nullable=True)
    new_device_id  = db.Column(db.String(100), nullable=False)
    new_device_info = db.Column(db.String(255), nullable=True)
    reason         = db.Column(db.String(500), nullable=True)
    status         = db.Column(db.String(20), default="pending")   # pending | approved | rejected
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "studentName": self.student_name,
            "oldDeviceId": self.old_device_id or "N/A",
            "newDeviceId": self.new_device_id,
            "newDeviceInfo": self.new_device_info or "Unknown",
            "reason": self.reason,
            "status": self.status,
            "createdAt": self.created_at.strftime("%Y-%m-%d %H:%M") if self.created_at else "N/A",
        }


class User(db.Model):
    """Phase 2 — Registered user accounts with role-based access."""
    __tablename__ = "user"

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role          = db.Column(db.String(20), default="student")   # 'admin' | 'student'
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
        }
