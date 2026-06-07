import os

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_SQLITE_PATH = os.path.join(_PROJECT_ROOT, "training_load.db")

DB_URI = os.getenv(
    "DATABASE_URI",
    f"sqlite:///{_SQLITE_PATH}",
)

TIMESCALEDB_URI = os.getenv(
    "TIMESCALEDB_URI",
    "postgresql://training:training@localhost:5432/training_load",
)

TIMESCALEDB_SCHEMA = os.getenv("TIMESCALEDB_SCHEMA", "public")

DB_ENGINE = os.getenv("DB_ENGINE", "sqlite")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-prod")

COACH_ROLE = "coach"
ATHLETE_ROLE = "athlete"

AGG_DIMENSIONS = ["team", "athlete", "program", "training_day", "exercise", "metric"]

EXPORT_DIR = os.path.join(os.path.dirname(__file__), "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)
