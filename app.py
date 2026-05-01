"""
app.py
Application entry point.

Architecture:
  config.py          → all .env-based configuration
  extensions.py      → shared Flask extensions (db)
  models.py          → SQLAlchemy models
  utils/face_utils.py → pure face-math helpers
  utils/migration.py  → one-time legacy data import
  routes/auth.py     → Phase 2: login / register
  routes/face.py     → Phase 1+8B: register_face / verify_face / liveness
  routes/attendance.py → Phase 6: submit + sync Google Sheets
  routes/admin_panel.py → Phase 5: admin dashboard API
  routes/devices.py  → Phase 4: device change request flow
"""
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="pkg_resources|face_recognition_models")

from flask import Flask, render_template

from config import Config
from extensions import db
from utils.migration import migrate_legacy_data, add_missing_columns

# ── Blueprint imports ────────────────────────────────────────────
from routes.auth        import auth_bp
from routes.face        import face_bp
from routes.attendance  import attendance_bp
from routes.admin_panel import admin_bp
from routes.devices     import devices_bp


def create_app(config_class=Config) -> Flask:
    app = Flask(
        __name__,
        template_folder=".",
        static_folder=".",
        static_url_path="",
    )
    app.config.from_object(config_class)

    # ── Extensions ───────────────────────────────────────────────
    db.init_app(app)

    # ── Blueprints ───────────────────────────────────────────────
    app.register_blueprint(auth_bp)
    app.register_blueprint(face_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(devices_bp)

    # ── Index page ───────────────────────────────────────────────
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/register")
    def register_page():
        return render_template("register.html")

    # ── DB setup + migration ─────────────────────────────────────
    with app.app_context():
        db.create_all()                       # create any missing tables
        add_missing_columns(db.engine)        # add any missing columns (safe for existing DBs)
        migrate_legacy_data()                 # import legacy .pkl / .json if DB is empty

    return app


# ── Entry point ──────────────────────────────────────────────────
app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)