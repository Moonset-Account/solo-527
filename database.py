import os
from sqlalchemy import create_engine, Column, Integer, String, Date, DateTime, Float, ForeignKey, Text, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from config import Config

Base = declarative_base()


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200))
    phone = Column(String(50))
    position = Column(String(100))
    department = Column(String(100))
    channel = Column(String(100))
    recruiter = Column(String(100))
    current_stage = Column(String(50))
    application_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    stage_transitions = relationship("StageTransition", back_populates="candidate", cascade="all, delete-orphan")
    feedback = relationship("CandidateFeedback", back_populates="candidate", uselist=False, cascade="all, delete-orphan")


class StageTransition(Base):
    __tablename__ = "stage_transitions"

    id = Column(Integer, primary_key=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    stage_name = Column(String(50), nullable=False)
    stage_order = Column(Integer, nullable=False)
    enter_date = Column(Date, nullable=False)
    exit_date = Column(Date)
    interviewer = Column(String(100))
    duration_days = Column(Float)
    result = Column(String(50))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="stage_transitions")


class CandidateFeedback(Base):
    __tablename__ = "candidate_feedback"

    id = Column(Integer, primary_key=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    overall_rating = Column(Float)
    interview_experience = Column(Float)
    communication_rating = Column(Float)
    process_speed_rating = Column(Float)
    comments = Column(Text)
    feedback_date = Column(Date)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="feedback")


class SavedFilter(Base):
    __tablename__ = "saved_filters"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    filter_config = Column(Text, nullable=False)
    created_by = Column(String(100), default="system")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class DataQualityLog(Base):
    __tablename__ = "data_quality_logs"

    id = Column(Integer, primary_key=True)
    check_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    affected_fields = Column(Text)
    check_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    resolved = Column(Integer, default=0)


def get_engine():
    if "sqlite" in Config.DATABASE_URL:
        os.makedirs("data", exist_ok=True)
    return create_engine(Config.DATABASE_URL, echo=Config.DEBUG)


def get_session():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()


def init_db():
    engine = get_engine()
    Base.metadata.create_all(engine)

    if Config.DATABASE_MODE == "timescaledb":
        with engine.connect() as conn:
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb;"))
                conn.commit()
            except Exception as e:
                print(f"Warning: Could not create timescaledb extension: {e}")

            try:
                result = conn.execute(text(
                    "SELECT * FROM timescaledb_information.hypertable WHERE table_name = 'stage_transitions';"
                )).fetchone()
                if not result:
                    try:
                        conn.execute(text(
                            "SELECT create_hypertable('stage_transitions', 'created_at', if_not_exists => TRUE);"
                        ))
                        conn.commit()
                        print("Created TimescaleDB hypertable for stage_transitions")
                    except Exception as e:
                        print(f"Warning: Could not create hypertable: {e}")
            except Exception as e:
                print(f"TimescaleDB hypertable check skipped: {e}")

    return engine

