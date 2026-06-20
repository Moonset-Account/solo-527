from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON, Date
from sqlalchemy.orm import relationship

from app.database import Base


class CrowdSegment(Base):
    __tablename__ = "crowd_segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(100), unique=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    segment_type = Column(String(50), default="dynamic")
    description = Column(Text)
    filter_conditions = Column(JSON, default=dict)
    estimated_count = Column(Integer, default=0)
    actual_count = Column(Integer, default=0)
    member_ids = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tasks = relationship("ReachTask", back_populates="crowd")
    versions = relationship("CrowdSegmentVersion", back_populates="segment")


class CrowdSegmentVersion(Base):
    __tablename__ = "crowd_segment_versions"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("crowd_segments.id"), nullable=False)
    version = Column(Integer, nullable=False)
    name = Column(String(200))
    data = Column(JSON, nullable=False)
    change_summary = Column(Text)
    changed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    segment = relationship("CrowdSegment", back_populates="versions")


class ReachTask(Base):
    __tablename__ = "reach_tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(100), unique=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    crowd_id = Column(Integer, ForeignKey("crowd_segments.id"), nullable=False)
    task_type = Column(String(50), nullable=False)
    channels = Column(JSON, default=list)
    content_template = Column(JSON, default=dict)
    coupon_template_id = Column(Integer, ForeignKey("coupon_templates.id"), nullable=True)
    benefit_id = Column(Integer, ForeignKey("point_benefits.id"), nullable=True)
    points_reward = Column(Integer, default=0)
    estimated_budget = Column(Float, default=0.0)
    actual_cost = Column(Float, default=0.0)
    schedule_type = Column(String(20), default="immediate")
    scheduled_at = Column(DateTime)
    status = Column(String(20), default="draft")
    target_count = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    read_count = Column(Integer, default=0)
    clicked_count = Column(Integer, default=0)
    converted_count = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0.0)
    remark = Column(Text)
    is_conflict_checked = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    crowd = relationship("CrowdSegment", back_populates="tasks")
    logs = relationship("ReachTaskLog", back_populates="task")
    versions = relationship("ReachTaskVersion", back_populates="task")
    attachments = relationship("Attachment", primaryjoin="and_(foreign(Attachment.entity_type)=='reach_task', foreign(Attachment.entity_id)==ReachTask.id)")
    notes = relationship("Note", primaryjoin="and_(foreign(Note.entity_type)=='reach_task', foreign(Note.entity_id)==ReachTask.id)")
    history = relationship("ChangeHistory", primaryjoin="and_(foreign(ChangeHistory.entity_type)=='reach_task', foreign(ChangeHistory.entity_id)==ReachTask.id)")


class ReachTaskVersion(Base):
    __tablename__ = "reach_task_versions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("reach_tasks.id"), nullable=False)
    version = Column(Integer, nullable=False)
    name = Column(String(200))
    data = Column(JSON, nullable=False)
    change_summary = Column(Text)
    changed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("ReachTask", back_populates="versions")


class ReachTaskLog(Base):
    __tablename__ = "reach_task_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("reach_tasks.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("member_profiles.id"), nullable=False)
    channel = Column(String(50))
    status = Column(String(20))
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    read_at = Column(DateTime)
    clicked_at = Column(DateTime)
    converted_at = Column(DateTime)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("ReachTask", back_populates="logs")
