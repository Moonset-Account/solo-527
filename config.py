import os

TIMESCALEDB_HOST = os.getenv("TIMESCALEDB_HOST", "localhost")
TIMESCALEDB_PORT = int(os.getenv("TIMESCALEDB_PORT", "5432"))
TIMESCALEDB_NAME = os.getenv("TIMESCALEDB_NAME", "course_analytics")
TIMESCALEDB_USER = os.getenv("TIMESCALEDB_USER", "postgres")
TIMESCALEDB_PASSWORD = os.getenv("TIMESCALEDB_PASSWORD", "postgres")

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

DATABASE_URL = (
    f"postgresql://{TIMESCALEDB_USER}:{TIMESCALEDB_PASSWORD}"
    f"@{TIMESCALEDB_HOST}:{TIMESCALEDB_PORT}/{TIMESCALEDB_NAME}"
)

APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "8050"))
APP_DEBUG = os.getenv("APP_DEBUG", "true").lower() == "true"

TRANSITION_WINDOW_DAYS = 3
