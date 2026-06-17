from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, Enum,
    Text, JSON
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class FeedbackType(str, enum.Enum):
    WORK = "work"
    CLASS = "class"
    HOMEWORK = "homework"
    OTHER = "other"


class WorkFeedback(Base):
    __tablename__ = "work_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    feedback_code = Column(String(50), unique=True, index=True, nullable=False)
    type = Column(Enum(FeedbackType), default=FeedbackType.WORK, index=True)
    class_id = Column(Integer, ForeignKey("class_groups.id"), index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey("course_schedules.id"), index=True)
    homework_id = Column(Integer, ForeignKey("homeworks.id"), index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    score = Column(Integer)
    max_score = Column(Integer, default=100)
    level = Column(String(20))
    strengths = Column(Text)
    weaknesses = Column(Text)
    suggestions = Column(Text)
    work_images = Column(JSON)
    is_private = Column(Boolean, default=False)
    parent_seen = Column(Boolean, default=False)
    parent_seen_at = Column(DateTime)
    parent_reply = Column(Text)
    parent_reply_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="feedbacks")


class HomeworkStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"


class Homework(Base):
    __tablename__ = "homeworks"

    id = Column(Integer, primary_key=True, index=True)
    homework_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    class_id = Column(Integer, ForeignKey("class_groups.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey("course_schedules.id"), index=True)
    publish_date = Column(DateTime)
    deadline = Column(DateTime, index=True)
    max_score = Column(Integer, default=100)
    status = Column(Enum(HomeworkStatus), default=HomeworkStatus.DRAFT, index=True)
    allow_late_submission = Column(Boolean, default=True)
    late_hours = Column(Integer, default=24)
    attachments = Column(JSON)
    total_submissions = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_group = relationship("ClassGroup", back_populates="homeworks")
    submissions = relationship("HomeworkSubmission", back_populates="homework", cascade="all, delete-orphan")


class SubmissionStatus(str, enum.Enum):
    NOT_SUBMITTED = "not_submitted"
    SUBMITTED = "submitted"
    LATE = "late"
    GRADED = "graded"
    RESUBMIT_REQUIRED = "resubmit_required"


class HomeworkSubmission(Base):
    __tablename__ = "homework_submissions"

    id = Column(Integer, primary_key=True, index=True)
    homework_id = Column(Integer, ForeignKey("homeworks.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    submit_time = Column(DateTime, index=True)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.NOT_SUBMITTED, index=True)
    content = Column(Text)
    attachments = Column(JSON)
    score = Column(Integer)
    feedback = Column(Text)
    graded_by = Column(Integer, ForeignKey("users.id"))
    graded_at = Column(DateTime)
    resubmit_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    homework = relationship("Homework", back_populates="submissions")
    student = relationship("Student", back_populates="homeworks")
