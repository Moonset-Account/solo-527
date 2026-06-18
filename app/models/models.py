import uuid
from datetime import datetime, date

from sqlalchemy import String, Float, Integer, Boolean, Text, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PowerStation(Base):
    __tablename__ = "power_station"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    capacity_kw: Mapped[float] = mapped_column(Float, nullable=False)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    equipment: Mapped[list["Equipment"]] = relationship(back_populates="station", cascade="all, delete-orphan")
    alarms: Mapped[list["Alarm"]] = relationship(back_populates="station", cascade="all, delete-orphan")
    electricity_prices: Mapped[list["ElectricityPrice"]] = relationship(back_populates="station", cascade="all, delete-orphan")
    subsidy_rules: Mapped[list["SubsidyRule"]] = relationship(back_populates="station", cascade="all, delete-orphan")
    revenue_records: Mapped[list["RevenueRecord"]] = relationship(back_populates="station", cascade="all, delete-orphan")
    energy_consumptions: Mapped[list["EnergyConsumption"]] = relationship(back_populates="station", cascade="all, delete-orphan")
    reminders: Mapped[list["Reminder"]] = relationship(back_populates="station", cascade="all, delete-orphan")


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("power_station.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    device_type: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="normal")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    station: Mapped["PowerStation"] = relationship(back_populates="equipment")
    alarms: Mapped[list["Alarm"]] = relationship(back_populates="equipment", cascade="all, delete-orphan")


class Alarm(Base):
    __tablename__ = "alarm"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("equipment.id"), nullable=False)
    station_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("power_station.id"), nullable=False)
    alarm_type: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    equipment: Mapped["Equipment"] = relationship(back_populates="alarms")
    station: Mapped["PowerStation"] = relationship(back_populates="alarms")
    responses: Mapped[list["AlarmResponse"]] = relationship(back_populates="alarm", cascade="all, delete-orphan")


class AlarmResponse(Base):
    __tablename__ = "alarm_response"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alarm_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("alarm.id"), nullable=False)
    responder_id: Mapped[str] = mapped_column(String, nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    response_duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    root_cause: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    alarm: Mapped["Alarm"] = relationship(back_populates="responses")


class ElectricityPrice(Base):
    __tablename__ = "electricity_price"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("power_station.id"), nullable=False)
    period_type: Mapped[str] = mapped_column(String, nullable=False)
    price_per_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_by: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    station: Mapped["PowerStation"] = relationship(back_populates="electricity_prices")


class SubsidyRule(Base):
    __tablename__ = "subsidy_rule"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("power_station.id"), nullable=False)
    rule_name: Mapped[str] = mapped_column(String, nullable=False)
    subsidy_type: Mapped[str] = mapped_column(String, nullable=False)
    rate_per_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_by: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    station: Mapped["PowerStation"] = relationship(back_populates="subsidy_rules")


class RevenueRecord(Base):
    __tablename__ = "revenue_record"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("power_station.id"), nullable=False)
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    generation_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    consumption_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    grid_feed_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    electricity_revenue: Mapped[float] = mapped_column(Float, nullable=False)
    subsidy_revenue: Mapped[float] = mapped_column(Float, nullable=False)
    total_revenue: Mapped[float] = mapped_column(Float, nullable=False)
    peak_load_kw: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    station: Mapped["PowerStation"] = relationship(back_populates="revenue_records")


class EnergyConsumption(Base):
    __tablename__ = "energy_consumption"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("power_station.id"), nullable=False)
    record_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    active_power_kw: Mapped[float] = mapped_column(Float, nullable=False)
    reactive_power_kvar: Mapped[float | None] = mapped_column(Float, nullable=True)
    irradiance_w_m2: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    station: Mapped["PowerStation"] = relationship(back_populates="energy_consumptions")


class Dictionary(Base):
    __tablename__ = "dictionary"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dict_code: Mapped[str] = mapped_column(String, nullable=False)
    dict_key: Mapped[str] = mapped_column(String, nullable=False)
    dict_value: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str | None] = mapped_column(String, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    versions: Mapped[list["DictionaryVersion"]] = relationship(back_populates="dictionary", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("dict_code", "dict_key", name="uq_dict_code_key"),
    )


class DictionaryVersion(Base):
    __tablename__ = "dictionary_version"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dictionary_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("dictionary.id"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    dict_value: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str | None] = mapped_column(String, nullable=True)
    changed_by: Mapped[str] = mapped_column(String, nullable=False)
    change_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    dictionary: Mapped["Dictionary"] = relationship(back_populates="versions")


class Reminder(Base):
    __tablename__ = "reminder"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("power_station.id"), nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    reminder_type: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[str] = mapped_column(String, nullable=False, default="info")
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    target_role: Mapped[str] = mapped_column(String, nullable=False)
    created_by: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    station: Mapped["PowerStation | None"] = relationship(back_populates="reminders")
    versions: Mapped[list["ReminderVersion"]] = relationship(back_populates="reminder", cascade="all, delete-orphan")


class ReminderVersion(Base):
    __tablename__ = "reminder_version"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reminder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("reminder.id"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    changed_by: Mapped[str] = mapped_column(String, nullable=False)
    change_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    reminder: Mapped["Reminder"] = relationship(back_populates="versions")
