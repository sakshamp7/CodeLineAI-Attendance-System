"""
utils/migration.py
One-time migration from legacy flat files (.pkl, .json) to SQLite.
Runs automatically on first server boot when the DB is empty.
"""
import os
from extensions import db
from models import Student, Attendance


def migrate_legacy_data() -> None:
    """
    If the Student table is empty, attempt to import data from:
      - encodings.pkl  → Student rows
      - devices.json   → device_id / device_info per student
      - attendance.json → Attendance rows
    After a successful migration the legacy files are left in place (read-only).
    """
    if Student.query.first():
        return  # Already migrated — skip

    try:
        import pickle, json  # only needed here

        # ── Face encodings ──────────────────────────────────────
        face_data = {"encodings": [], "names": []}
        if os.path.exists("encodings.pkl"):
            with open("encodings.pkl", "rb") as f:
                face_data = pickle.load(f)
            print("[Migration] Loaded encodings.pkl")

        # ── Device registry ──────────────────────────────────────
        device_registry = {}
        if os.path.exists("devices.json"):
            with open("devices.json", "r") as f:
                device_registry = json.load(f)
            print("[Migration] Loaded devices.json")

        # ── Insert students ───────────────────────────────────────
        for i, name in enumerate(face_data.get("names", [])):
            encoding = face_data["encodings"][i]
            dev_data = device_registry.get(name, {})
            dev_id = dev_info = None
            if isinstance(dev_data, dict):
                dev_id   = dev_data.get("id")
                dev_info = dev_data.get("info")
            elif isinstance(dev_data, str):
                dev_id = dev_data

            db.session.add(Student(
                name=name,
                face_encoding=encoding,
                device_id=dev_id,
                device_info=dev_info,
            ))

        # ── Insert attendance logs ────────────────────────────────
        if os.path.exists("attendance.json"):
            with open("attendance.json", "r") as f:
                logs = json.load(f)
            for log in logs:
                db.session.add(Attendance(
                    student_name=log.get("name"),
                    date=log.get("date"),
                    in_time=log.get("inTime"),
                    out_time=log.get("outTime"),
                    confidence=log.get("confidence", 1.0),
                    status=log.get("status", "Present"),
                ))
            print(f"[Migration] Imported {len(logs)} attendance records.")

        db.session.commit()
        print("[Migration] Complete — all legacy data imported into SQLite.")

    except Exception as exc:
        db.session.rollback()
        print(f"[Migration] WARNING — could not complete: {exc}")


def add_missing_columns(engine) -> None:
    """
    SQLite does not support DROP/ADD via Alembic easily.
    This function safely adds new columns to existing tables
    so the app doesn't crash when a schema column is added.
    """
    _safe_add(engine, "ALTER TABLE student ADD COLUMN registered_at DATETIME")
    _safe_add(engine, "ALTER TABLE student ADD COLUMN mobile VARCHAR(20)")
    _safe_add(engine, "ALTER TABLE student ADD COLUMN email VARCHAR(150)")
    _safe_add(engine, "ALTER TABLE user ADD COLUMN created_at DATETIME")


def _safe_add(engine, statement: str) -> None:
    try:
        with engine.connect() as conn:
            conn.execute(db.text(statement))
            conn.commit()
    except Exception:
        pass  # Column already exists — ignore
