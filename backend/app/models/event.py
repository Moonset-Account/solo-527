from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    lng: Mapped[float | None] = mapped_column(Float)
    lat: Mapped[float | None] = mapped_column(Float)
    address: Mapped[str | None] = mapped_column(String(300))
    reporter_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    assignee_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_events")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_events")
    photos = relationship("EventPhoto", back_populates="event", cascade="all, delete-orphan")
    flows = relationship("EventFlow", back_populates="event", cascade="all, delete-orphan")


class EventPhoto(Base):
    __tablename__ = "event_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    tag: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    event = relationship("Event", back_populates="photos")


class EventFlow(Base):
    __tablename__ = "event_flows"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    operator_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    event = relationship("Event", back_populates="flows")
    operator = relationship("User")


class FacilityStatus(Base):
    __tablename__ = "facility_status"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    facility_name: Mapped[str] = mapped_column(String(200), nullable=False)
    is_intact: Mapped[bool] = mapped_column(Boolean, default=True)
    checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
