import os
from sqlalchemy import create_engine, Column, Integer, String, Date, DateTime, Float, ForeignKey, Text
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
    position = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    channel = Column(String(100), nullable=False)
    recruiter = Column(String(100), nullable=False)
    current_stage = Column(String(50), nullable=False)
    application_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    stage_transitions = relationship("StageTransition", back_populates="candidate")
    feedback = relationship("CandidateFeedback", back_populates="candidate", uselist=False)


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
    created_at = Column(DateTime, default=datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="feedback")


class SavedFilter(Base):
    __tablename__ = "saved_filters"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    filter_config = Column(Text, nullable=False)
    created_by = Column(String(100), default="system")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DataQualityLog(Base):
    __tablename__ = "data_quality_logs"

    id = Column(Integer, primary_key=True)
    check_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    affected_fields = Column(Text)
    check_date = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Integer, default=0)


def get_engine():
    os.makedirs("data", exist_ok=True)
    return create_engine(Config.DATABASE_URL, echo=Config.DEBUG)


def get_session():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()


def init_db():
    engine = get_engine()
    Base.metadata.create_all(engine)
    return engine
