from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Boolean, Text, ForeignKey, Enum, create_engine
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(Enum("coach", "athlete", name="user_role"), nullable=False)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=True)

    athlete = relationship("Athlete", back_populates="user")


class Athlete(Base):
    __tablename__ = "athletes"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    team = Column(String(100), nullable=False)
    position = Column(String(50))
    age = Column(Integer)
    weight_kg = Column(Float)
    height_cm = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="athlete")
    heart_rates = relationship("HeartRate", back_populates="athlete")
    paces = relationship("Pace", back_populates="athlete")
    strength_tests = relationship("StrengthTest", back_populates="athlete")
    recovery_scores = relationship("RecoveryScore", back_populates="athlete")
    injuries = relationship("Injury", back_populates="athlete")
    training_logs = relationship("TrainingLog", back_populates="athlete")


class TrainingPlan(Base):
    __tablename__ = "training_plans"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    team = Column(String(100), nullable=False)
    phase = Column(String(50))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    description = Column(Text)

    sessions = relationship("TrainingSession", back_populates="plan")


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    session_date = Column(Date, nullable=False)
    session_type = Column(String(50))
    intensity_zone = Column(Integer)
    notes = Column(Text)

    plan = relationship("TrainingPlan", back_populates="sessions")
    exercises = relationship("TrainingExercise", back_populates="session")


class TrainingExercise(Base):
    __tablename__ = "training_exercises"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=False)
    exercise_name = Column(String(200), nullable=False)
    exercise_category = Column(String(50))
    sets = Column(Integer)
    reps = Column(Integer)
    load_kg = Column(Float)
    duration_min = Column(Float)
    rest_sec = Column(Integer)
    rpe = Column(Integer)
    order_index = Column(Integer)

    session = relationship("TrainingSession", back_populates="exercises")


class TrainingLog(Base):
    __tablename__ = "training_logs"

    id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("training_exercises.id"), nullable=True)
    actual_sets = Column(Integer)
    actual_reps = Column(Integer)
    actual_load_kg = Column(Float)
    actual_duration_min = Column(Float)
    actual_rpe = Column(Integer)
    completed = Column(Boolean, default=True)
    notes = Column(Text)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    athlete = relationship("Athlete", back_populates="training_logs")


class HeartRate(Base):
    __tablename__ = "heart_rates"

    id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    recorded_at = Column(DateTime, nullable=False, index=True)
    hr_bpm = Column(Integer, nullable=False)
    hr_zone = Column(Integer)
    activity = Column(String(100))
    is_anomaly = Column(Boolean, default=False)
    notes = Column(Text)

    athlete = relationship("Athlete", back_populates="heart_rates")


class Pace(Base):
    __tablename__ = "paces"

    id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    recorded_at = Column(DateTime, nullable=False, index=True)
    pace_min_per_km = Column(Float, nullable=False)
    distance_km = Column(Float)
    duration_min = Column(Float)
    activity = Column(String(100))
    is_anomaly = Column(Boolean, default=False)
    notes = Column(Text)

    athlete = relationship("Athlete", back_populates="paces")


class StrengthTest(Base):
    __tablename__ = "strength_tests"

    id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    test_date = Column(Date, nullable=False)
    exercise_name = Column(String(200), nullable=False)
    one_rm_kg = Column(Float)
    max_reps = Column(Integer)
    max_reps_load_kg = Column(Float)
    velocity_ms = Column(Float)
    power_w = Column(Float)
    is_anomaly = Column(Boolean, default=False)
    notes = Column(Text)

    athlete = relationship("Athlete", back_populates="strength_tests")


class RecoveryScore(Base):
    __tablename__ = "recovery_scores"

    id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    score_date = Column(Date, nullable=False)
    overall_score = Column(Float, nullable=False)
    sleep_score = Column(Float)
    fatigue_score = Column(Float)
    stress_score = Column(Float)
    soreness_score = Column(Float)
    hrv_ms = Column(Float)
    is_anomaly = Column(Boolean, default=False)
    notes = Column(Text)

    athlete = relationship("Athlete", back_populates="recovery_scores")


class Injury(Base):
    __tablename__ = "injuries"

    id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    injury_date = Column(Date, nullable=False)
    body_part = Column(String(100), nullable=False)
    injury_type = Column(String(100))
    severity = Column(Enum("mild", "moderate", "severe", name="injury_severity"))
    status = Column(Enum("active", "recovering", "resolved", name="injury_status"))
    coach_notes = Column(Text)
    athlete_notes = Column(Text)
    return_date = Column(Date)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    athlete = relationship("Athlete", back_populates="injuries")
