from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    COACH = "coach"
    RUNNER = "runner"


class TaskStatus(str, enum.Enum):
    NEW = "new"
    PENDING_CONFIRM = "pending_confirm"
    IN_PROGRESS = "in_progress"
    EXCEPTION_REVIEW = "exception_review"
    ARCHIVED = "archived"


class TaskType(str, enum.Enum):
    TRAINING_PLAN = "training_plan"
    CHECKIN = "checkin"
    ACTIVITY_SIGNUP = "activity_signup"
    PACE_FEEDBACK = "pace_feedback"
    INJURY_REPORT = "injury_report"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100))
    phone = Column(String(20))
    role = Column(Enum(UserRole), default=UserRole.RUNNER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    runner_profile = relationship("RunnerProfile", back_populates="user", uselist=False)
    created_plans = relationship("TrainingPlan", foreign_keys="TrainingPlan.created_by", back_populates="creator")
    checkins = relationship("Checkin", back_populates="runner")
    injury_notes = relationship("InjuryNote", foreign_keys="InjuryNote.runner_id", back_populates="runner")
    activity_signups = relationship("ActivitySignup", back_populates="runner")
    tasks = relationship("Task", back_populates="assigned_user")


class RunnerProfile(Base):
    __tablename__ = "runner_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    age = Column(Integer)
    gender = Column(String(10))
    weight = Column(Float)
    height = Column(Float)
    weekly_mileage = Column(Float)
    target_race = Column(String(100))
    target_date = Column(DateTime)
    pace_zones = relationship("PaceZone", back_populates="runner_profile")
    user = relationship("User", back_populates="runner_profile")


class PaceZone(Base):
    __tablename__ = "pace_zones"

    id = Column(Integer, primary_key=True, index=True)
    runner_profile_id = Column(Integer, ForeignKey("runner_profiles.id"))
    zone_name = Column(String(50), nullable=False)
    min_pace = Column(String(10), nullable=False)
    max_pace = Column(String(10), nullable=False)
    description = Column(String(200))
    runner_profile = relationship("RunnerProfile", back_populates="pace_zones")


class TrainingPlan(Base):
    __tablename__ = "training_plans"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    plan_date = Column(DateTime, nullable=False)
    distance_km = Column(Float)
    target_pace = Column(String(20))
    warm_up = Column(String(200))
    main_set = Column(Text)
    cool_down = Column(String(200))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_published = Column(Boolean, default=False)

    creator = relationship("User", foreign_keys=[created_by], back_populates="created_plans")
    checkins = relationship("Checkin", back_populates="training_plan")


class Checkin(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    runner_id = Column(Integer, ForeignKey("users.id"))
    training_plan_id = Column(Integer, ForeignKey("training_plans.id"))
    checkin_date = Column(DateTime(timezone=True), server_default=func.now())
    distance_km = Column(Float, nullable=False)
    duration_seconds = Column(Integer)
    avg_pace = Column(String(20))
    avg_heart_rate = Column(Integer)
    perceived_effort = Column(Integer)
    notes = Column(Text)
    track_points = Column(JSON)
    location_alias = Column(String(100))
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING_CONFIRM)
    pace_analysis = Column(JSON)

    runner = relationship("User", back_populates="checkins")
    training_plan = relationship("TrainingPlan", back_populates="checkins")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    activity_date = Column(DateTime, nullable=False)
    meeting_point = Column(String(200))
    max_participants = Column(Integer)
    registration_deadline = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_published = Column(Boolean, default=False)

    signups = relationship("ActivitySignup", back_populates="activity")


class ActivitySignup(Base):
    __tablename__ = "activity_signups"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    runner_id = Column(Integer, ForeignKey("users.id"))
    signed_up_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING_CONFIRM)
    emergency_contact = Column(String(100))
    emergency_phone = Column(String(20))

    activity = relationship("Activity", back_populates="signups")
    runner = relationship("User", back_populates="activity_signups")


class InjuryNote(Base):
    __tablename__ = "injury_notes"

    id = Column(Integer, primary_key=True, index=True)
    runner_id = Column(Integer, ForeignKey("users.id"))
    reported_by = Column(Integer, ForeignKey("users.id"))
    injury_type = Column(String(100), nullable=False)
    injury_date = Column(DateTime(timezone=True))
    severity = Column(String(20))
    notes = Column(Text)
    treatment_notes = Column(Text)
    expected_recovery_date = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime)
    is_resolved = Column(Boolean, default=False)

    runner = relationship("User", foreign_keys=[runner_id], back_populates="injury_notes")
    reporter = relationship("User", foreign_keys=[reported_by])


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    task_type = Column(Enum(TaskType), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.NEW)
    assigned_user_id = Column(Integer, ForeignKey("users.id"))
    related_id = Column(Integer)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    due_date = Column(DateTime)
    notes = Column(Text)

    assigned_user = relationship("User", back_populates="tasks")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200), nullable=False)
    message = Column(Text)
    notification_type = Column(String(50))
    is_read = Column(Boolean, default=False)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    sent_at = Column(DateTime(timezone=True))
    last_retry_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
