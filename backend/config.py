import os

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DB_URI = os.getenv(
    "DATABASE_URI",
    f"sqlite:///{os.path.join(_PROJECT_ROOT, 'training_load.db')}",
)

TIMESCALEDB_SCHEMA = os.getenv("TIMESCALEDB_SCHEMA", "public")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-prod")

COACH_ROLE = "coach"
ATHLETE_ROLE = "athlete"

AGG_DIMENSIONS = ["team", "athlete", "program", "training_day", "exercise", "metric"]

EXPORT_DIR = os.path.join(os.path.dirname(__file__), "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)
