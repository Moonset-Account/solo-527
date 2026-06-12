from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional, List

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey,
    Date, Enum, Numeric, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.database import Base
from app.config import settings


class RunMode(str, PyEnum):
    PRODUCTION = "production"
    TEST = "test"
    DEMO = "demo"


class UserRole(str, PyEnum):
    ADMIN = "admin"
    FARMER = "farmer"
    WORKER = "worker"
    AUDITOR = "auditor"


class HarvestStatus(str, PyEnum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BatchStatus(str, PyEnum):
    HARVESTED = "harvested"
    SORTING = "sorting"
    PACKED = "packed"
    SOLD = "sold"


class AlertLevel(str, PyEnum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertStatus(str, PyEnum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class SubsidyStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"


class SortingResult(str, PyEnum):
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    REWORKED = "reworked"
    DISCOUNTED = "discounted"


class SocialImpact(str, PyEnum):
    NONE = "none"
    REPUTATION_RISK = "reputation_risk"
    CONSUMER_COMPLAINT = "consumer_complaint"
    REGULATORY_ATTENTION = "regulatory_attention"
    COMMUNITY_POSITIVE = "community_positive"


class DownloadRecordType(str, PyEnum):
    HARVEST_REPORT = "harvest_report"
    BATCH_REPORT = "batch_report"
    SUBSIDY_REPORT = "subsidy_report"
    ALERT_REPORT = "alert_report"
    SORTING_REPORT = "sorting_report"
    FULL_REPORT = "full_report"


class BaseMixin:
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    run_mode: Mapped[str] = mapped_column(String(20), default=lambda: settings.run_mode, nullable=False, index=True)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)


class User(Base, BaseMixin):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.FARMER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user", foreign_keys="Notification.user_id"
    )
    download_records: Mapped[List["DownloadRecord"]] = relationship(
        "DownloadRecord", back_populates="user", foreign_keys="DownloadRecord.user_id"
    )


class Plot(Base, BaseMixin):
    __tablename__ = "plots"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    area_mu: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    soil_type: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    varieties: Mapped[List["Variety"]] = relationship("Variety", back_populates="plot")
    harvests: Mapped[List["HarvestRecord"]] = relationship("HarvestRecord", back_populates="plot")


class Variety(Base, BaseMixin):
    __tablename__ = "varieties"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    fruit_type: Mapped[str] = mapped_column(String(80), nullable=False)
    plot_id: Mapped[int] = mapped_column(Integer, ForeignKey("plots.id"), nullable=False, index=True)
    plant_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    expected_yield_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    maturity_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="varieties")
    harvests: Mapped[List["HarvestRecord"]] = relationship("HarvestRecord", back_populates="variety")


class HarvestRecord(Base, BaseMixin):
    __tablename__ = "harvest_records"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    plot_id: Mapped[int] = mapped_column(Integer, ForeignKey("plots.id"), nullable=False, index=True)
    variety_id: Mapped[int] = mapped_column(Integer, ForeignKey("varieties.id"), nullable=False, index=True)
    harvest_date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[HarvestStatus] = mapped_column(Enum(HarvestStatus), default=HarvestStatus.PLANNED, nullable=False)
    weather: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    temperature_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    humidity_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    workers_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actual_yield_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    predicted_yield_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    yield_deviation_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="harvests")
    variety: Mapped["Variety"] = relationship("Variety", back_populates="harvests")
    batches: Mapped[List["HarvestBatch"]] = relationship("HarvestBatch", back_populates="harvest")
    alerts: Mapped[List["Alert"]] = relationship("Alert", back_populates="harvest")
    predictions: Mapped[List["YieldPrediction"]] = relationship("YieldPrediction", back_populates="harvest")
    subsidy_vouchers: Mapped[List["SubsidyVoucher"]] = relationship("SubsidyVoucher", back_populates="harvest")


class HarvestBatch(Base, BaseMixin):
    __tablename__ = "harvest_batches"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    harvest_id: Mapped[int] = mapped_column(Integer, ForeignKey("harvest_records.id"), nullable=False, index=True)
    variety_id: Mapped[int] = mapped_column(Integer, ForeignKey("varieties.id"), nullable=False, index=True)
    batch_date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[BatchStatus] = mapped_column(Enum(BatchStatus), default=BatchStatus.HARVESTED, nullable=False)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    container_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    storage_location: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    quality_grade: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    handler_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    handled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    harvest: Mapped["HarvestRecord"] = relationship("HarvestRecord", back_populates="batches")
    subsidy_vouchers: Mapped[List["SubsidyVoucher"]] = relationship("SubsidyVoucher", back_populates="batch")
    sorting_records: Mapped[List["SortingDifference"]] = relationship("SortingDifference", back_populates="batch")


class EnvReading(Base, BaseMixin):
    __tablename__ = "env_readings"

    plot_id: Mapped[int] = mapped_column(Integer, ForeignKey("plots.id"), nullable=False, index=True)
    variety_id: Mapped[int] = mapped_column(Integer, ForeignKey("varieties.id"), nullable=False, index=True)
    reading_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    temperature_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    humidity_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    soil_moisture_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ph_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    light_lux: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    wind_speed_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rainfall_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sensor_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    __table_args__ = (
        Index("idx_env_plot_time", "plot_id", "reading_time"),
    )


class Threshold(Base, BaseMixin):
    __tablename__ = "thresholds"
    __table_args__ = (
        UniqueConstraint("variety_id", "metric", "run_mode", name="uq_threshold_variety_metric_mode"),
    )

    variety_id: Mapped[int] = mapped_column(Integer, ForeignKey("varieties.id"), nullable=False, index=True)
    metric: Mapped[str] = mapped_column(String(50), nullable=False)
    min_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    alert_level: Mapped[AlertLevel] = mapped_column(Enum(AlertLevel), default=AlertLevel.WARNING, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class Alert(Base, BaseMixin):
    __tablename__ = "alerts"

    harvest_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("harvest_records.id"), nullable=True, index=True)
    plot_id: Mapped[int] = mapped_column(Integer, ForeignKey("plots.id"), nullable=False, index=True)
    variety_id: Mapped[int] = mapped_column(Integer, ForeignKey("varieties.id"), nullable=False, index=True)
    level: Mapped[AlertLevel] = mapped_column(Enum(AlertLevel), nullable=False)
    status: Mapped[AlertStatus] = mapped_column(Enum(AlertStatus), default=AlertStatus.OPEN, nullable=False)
    metric: Mapped[str] = mapped_column(String(50), nullable=False)
    actual_value: Mapped[float] = mapped_column(Float, nullable=False)
    threshold_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    threshold_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    triggered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    acknowledged_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    resolved_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    harvest: Mapped[Optional["HarvestRecord"]] = relationship("HarvestRecord", back_populates="alerts")


class YieldPrediction(Base, BaseMixin):
    __tablename__ = "yield_predictions"

    harvest_id: Mapped[int] = mapped_column(Integer, ForeignKey("harvest_records.id"), nullable=False, index=True)
    plot_id: Mapped[int] = mapped_column(Integer, ForeignKey("plots.id"), nullable=False, index=True)
    variety_id: Mapped[int] = mapped_column(Integer, ForeignKey("varieties.id"), nullable=False, index=True)
    prediction_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    predicted_yield_kg: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), default="v1.0", nullable=False)
    features_used: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reminder_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    harvest: Mapped["HarvestRecord"] = relationship("HarvestRecord", back_populates="predictions")


class SubsidyVoucher(Base, BaseMixin):
    __tablename__ = "subsidy_vouchers"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    harvest_id: Mapped[int] = mapped_column(Integer, ForeignKey("harvest_records.id"), nullable=False, index=True)
    batch_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("harvest_batches.id"), nullable=True, index=True)
    variety_id: Mapped[int] = mapped_column(Integer, ForeignKey("varieties.id"), nullable=False, index=True)
    subsidy_type: Mapped[str] = mapped_column(String(80), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[SubsidyStatus] = mapped_column(Enum(SubsidyStatus), default=SubsidyStatus.PENDING, nullable=False)
    applicant_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    reviewer_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    documents_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    harvest: Mapped["HarvestRecord"] = relationship("HarvestRecord", back_populates="subsidy_vouchers")
    batch: Mapped[Optional["HarvestBatch"]] = relationship("HarvestBatch", back_populates="subsidy_vouchers")


class SortingDifference(Base, BaseMixin):
    __tablename__ = "sorting_differences"

    batch_id: Mapped[int] = mapped_column(Integer, ForeignKey("harvest_batches.id"), nullable=False, index=True)
    harvest_id: Mapped[int] = mapped_column(Integer, ForeignKey("harvest_records.id"), nullable=False, index=True)
    variety_id: Mapped[int] = mapped_column(Integer, ForeignKey("varieties.id"), nullable=False, index=True)
    reported_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    actual_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    diff_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    diff_pct: Mapped[float] = mapped_column(Float, nullable=False)
    reported_grade: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    actual_grade: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    remarks: Mapped[str] = mapped_column(Text, nullable=False)
    result: Mapped[SortingResult] = mapped_column(Enum(SortingResult), nullable=False)
    social_impact: Mapped[SocialImpact] = mapped_column(Enum(SocialImpact), default=SocialImpact.NONE, nullable=False)
    impact_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    handled_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    handled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    batch: Mapped["HarvestBatch"] = relationship("HarvestBatch", back_populates="sorting_records")


class Notification(Base, BaseMixin):
    __tablename__ = "notifications"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), default="system", nullable=False)
    related_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    related_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    channel: Mapped[str] = mapped_column(String(30), default="inapp", nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="notifications", foreign_keys=[user_id])


class DownloadRecord(Base, BaseMixin):
    __tablename__ = "download_records"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    record_type: Mapped[DownloadRecordType] = mapped_column(Enum(DownloadRecordType), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    filters_used: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    downloaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    include_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="download_records", foreign_keys=[user_id])
