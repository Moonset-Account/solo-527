import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    USE_SQLITE = os.getenv("USE_SQLITE", "1").lower() in ("1", "true", "yes")
    SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "sensor_prediction.db"))

    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", 5432))
    DB_NAME = os.getenv("DB_NAME", "sensor_prediction")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

    MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
    MLFLOW_EXPERIMENT_NAME = os.getenv("MLFLOW_EXPERIMENT_NAME", "sensor_anomaly_detection")
    MLFLOW_MODEL_REGISTRY_URI = os.getenv("MLFLOW_MODEL_REGISTRY_URI", "sqlite:///mlflow.db")
    MLFLOW_ARTIFACT_ROOT = os.getenv("MLFLOW_ARTIFACT_ROOT", "./mlruns")

    FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
    FLASK_PORT = int(os.getenv("FLASK_PORT", 8080))

    WINDOW_SIZE = int(os.getenv("WINDOW_SIZE", 60))
    SLIDING_STEP = int(os.getenv("SLIDING_STEP", 10))
    ALERT_THRESHOLD = float(os.getenv("ALERT_THRESHOLD", 0.85))

    SENSOR_SAMPLE_RATE = int(os.getenv("SENSOR_SAMPLE_RATE", 1))

    @classmethod
    def get_db_url(cls):
        if cls.USE_SQLITE:
            import pathlib
            db_path = pathlib.Path(cls.SQLITE_DB_PATH).resolve()
            db_path.parent.mkdir(parents=True, exist_ok=True)
            return f"sqlite:///{db_path}"
        return f"postgresql+psycopg2://{cls.DB_USER}:{cls.DB_PASSWORD}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"

    @classmethod
    def get_db_psycopg2_url(cls):
        if cls.USE_SQLITE:
            return None
        return f"host={cls.DB_HOST} port={cls.DB_PORT} dbname={cls.DB_NAME} user={cls.DB_USER} password={cls.DB_PASSWORD}"


FEEDBACK_TYPES = {
    "REAL_FAULT": "真实故障",
    "SENSOR_DRIFT": "传感器漂移",
    "FALSE_ALARM": "误报"
}

SHIFT_TYPES = ["早班", "中班", "晚班"]

ANOMALY_TYPES = ["轴承磨损", "传感器漂移", "正常"]

SENSOR_TYPES = ["温度", "振动", "电流", "转速"]
