import os


class Config:
    CLICKHOUSE_HOST = os.environ.get("CLICKHOUSE_HOST", "localhost")
    CLICKHOUSE_PORT = int(os.environ.get("CLICKHOUSE_PORT", 9000))
    CLICKHOUSE_USER = os.environ.get("CLICKHOUSE_USER", "default")
    CLICKHOUSE_PASSWORD = os.environ.get("CLICKHOUSE_PASSWORD", "")
    CLICKHOUSE_DB = os.environ.get("CLICKHOUSE_DB", "cold_chain")

    REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
    REDIS_DB = int(os.environ.get("REDIS_DB", 0))
    REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", "")
    CACHE_TTL = int(os.environ.get("CACHE_TTL", 300))

    FLASK_HOST = os.environ.get("FLASK_HOST", "0.0.0.0")
    FLASK_PORT = int(os.environ.get("FLASK_PORT", 5100))
    DEBUG = os.environ.get("DEBUG", "True").lower() in ("true", "1", "yes")

    MOCK_DATA_DIR = os.environ.get(
        "MOCK_DATA_DIR",
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "db", "mock_data"),
    )
