import os

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TIMESCALEDB_URI = os.getenv(
    "TIMESCALEDB_URI",
    "postgresql://training:training@localhost:5434/training_load",
)

TIMESCALEDB_SCHEMA = os.getenv("TIMESCALEDB_SCHEMA", "public")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-prod")

COACH_ROLE = "coach"
ATHLETE_ROLE = "athlete"

AGG_DIMENSIONS = ["team", "athlete", "program", "training_day", "exercise", "metric"]

EXPORT_DIR = os.path.join(os.path.dirname(__file__), "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)
