from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Index
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from datetime import datetime
from config import Config

Base = declarative_base()


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True)
    equipment_id = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    temperature = Column(Float)
    vibration = Column(Float)
    current = Column(Float)
    rpm = Column(Float)
    is_downtime = Column(Boolean, default=False, index=True)
    shift = Column(String(20))
    raw_label = Column(String(50))
    created_at = Column(DateTime, default=datetime.now)

    __table_args__ = (
        Index("idx_equipment_time", "equipment_id", "timestamp"),
    )


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True)
    equipment_id = Column(String(50), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    maintenance_type = Column(String(100))
    description = Column(Text)
    operator = Column(String(100))
    created_at = Column(DateTime, default=datetime.now)


class ShiftRecord(Base):
    __tablename__ = "shift_records"

    id = Column(Integer, primary_key=True)
    shift_name = Column(String(20), nullable=False)
    start_hour = Column(Integer, nullable=False)
    end_hour = Column(Integer, nullable=False)
    description = Column(Text)


FEATURE_SOURCE_UNCONFIRMED = "historical_unconfirmed"
FEATURE_SOURCE_ENGINEER_CONFIRMED = "engineer_confirmed"
FEATURE_SOURCE_AUTO_LABELED = "auto_labeled_seed"
FEATURE_SOURCE_RELABELED = "engineer_relabeled"
FEATURE_SOURCE_VALID_SOURCES = [
    FEATURE_SOURCE_UNCONFIRMED,
    FEATURE_SOURCE_ENGINEER_CONFIRMED,
    FEATURE_SOURCE_AUTO_LABELED,
    FEATURE_SOURCE_RELABELED,
]
FEATURE_SOURCE_LABELS = {
    FEATURE_SOURCE_UNCONFIRMED: "历史未确认(仅用于推理，不用于训练)",
    FEATURE_SOURCE_ENGINEER_CONFIRMED: "工程师人工确认反馈",
    FEATURE_SOURCE_AUTO_LABELED: "系统冷启动种子样本(仿真)",
    FEATURE_SOURCE_RELABELED: "工程师改标后样本",
}

TRAINING_ALLOWED_SOURCES = [
    FEATURE_SOURCE_ENGINEER_CONFIRMED,
    FEATURE_SOURCE_AUTO_LABELED,
    FEATURE_SOURCE_RELABELED,
]


class FeatureRecord(Base):
    __tablename__ = "feature_records"

    id = Column(Integer, primary_key=True)
    equipment_id = Column(String(50), nullable=False, index=True)
    window_start = Column(DateTime, nullable=False)
    window_end = Column(DateTime, nullable=False)
    features = Column(JSONB, nullable=False)
    data_version = Column(String(50), index=True)
    is_used_for_training = Column(Boolean, default=False)
    label = Column(String(50))
    source = Column(String(50), default=FEATURE_SOURCE_UNCONFIRMED, index=True)
    feedback_id = Column(Integer, ForeignKey("feedback_records.id"), nullable=True, index=True)
    confidence_label = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.now)

    feedback = relationship("FeedbackRecord", backref="feature_records")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    equipment_id = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    model_version = Column(String(50))
    feature_window_start = Column(DateTime)
    feature_window_end = Column(DateTime)
    sensor_snapshot = Column(JSONB)
    status = Column(String(20), default="pending", index=True)
    feedback_type = Column(String(50))
    feedback_note = Column(Text)
    feedback_user = Column(String(100))
    feedback_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)


class FeedbackRecord(Base):
    __tablename__ = "feedback_records"

    id = Column(Integer, primary_key=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False, index=True)
    feedback_type = Column(String(50), nullable=False)
    feedback_note = Column(Text)
    feedback_user = Column(String(100))
    feature_data = Column(JSONB)
    is_used_for_training = Column(Boolean, default=False, index=True)
    training_data_version = Column(String(50))
    created_at = Column(DateTime, default=datetime.now)

    alert = relationship("Alert", backref="feedback_records")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True)
    model_name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False, index=True)
    mlflow_run_id = Column(String(100))
    mlflow_model_uri = Column(String(500))
    training_data_version = Column(String(50), index=True)
    accuracy = Column(Float)
    precision_score = Column(Float)
    recall_score = Column(Float)
    f1_score = Column(Float)
    metrics = Column(JSONB)
    feature_names = Column(JSONB)
    is_deployed = Column(Boolean, default=False)
    description = Column(Text)
    trained_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.now)


class DataVersion(Base):
    __tablename__ = "data_versions"

    id = Column(Integer, primary_key=True)
    version = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text)
    record_count = Column(Integer)
    positive_count = Column(Integer)
    feature_count = Column(Integer)
    included_feedback_ids = Column(JSONB)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=datetime.now)


class RelabelRecord(Base):
    __tablename__ = "relabel_records"

    id = Column(Integer, primary_key=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    original_label = Column(String(50))
    new_label = Column(String(50))
    relabel_reason = Column(Text)
    relabel_user = Column(String(100))
    data_version = Column(String(50), index=True)
    created_at = Column(DateTime, default=datetime.now)


class Database:
    _instance = None
    _engine = None
    _SessionLocal = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._engine = create_engine(
                Config.get_db_url(),
                pool_size=20,
                max_overflow=30,
                pool_pre_ping=True
            )
            cls._SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=cls._engine
            )
        return cls._instance

    @classmethod
    def get_engine(cls):
        if cls._engine is None:
            cls()
        return cls._engine

    @classmethod
    def get_session(cls):
        if cls._SessionLocal is None:
            cls()
        return cls._SessionLocal()

    @classmethod
    def init_tables(cls, drop_first=False):
        engine = cls.get_engine()
        if drop_first:
            Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        cls._init_default_data()

    @classmethod
    def _init_default_data(cls):
        session = cls.get_session()
        try:
            if session.query(ShiftRecord).count() == 0:
                default_shifts = [
                    ShiftRecord(shift_name="早班", start_hour=8, end_hour=16, description="白天早班"),
                    ShiftRecord(shift_name="中班", start_hour=16, end_hour=0, description="下午中班"),
                    ShiftRecord(shift_name="晚班", start_hour=0, end_hour=8, description="夜间晚班"),
                ]
                session.add_all(default_shifts)
                session.commit()
        finally:
            session.close()


def get_db():
    db = Database.get_session()
    try:
        yield db
    finally:
        db.close()
