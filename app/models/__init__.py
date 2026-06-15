from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, Date, Enum
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    CONSULTANT = "consultant"
    CUSTOMER_SERVICE = "customer_service"
    TENANT = "tenant"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    phone = Column(String(20), index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), default="tenant", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    consultant_profile = relationship("ConsultantProfile", back_populates="user", uselist=False)
    appointments_as_tenant = relationship("Appointment", foreign_keys="Appointment.tenant_id", back_populates="tenant")
    appointments_as_consultant = relationship("Appointment", foreign_keys="Appointment.consultant_id", back_populates="consultant")
    follow_ups = relationship("FollowUp", back_populates="operator")
    created_risks = relationship("ContractRisk", foreign_keys="ContractRisk.created_by_id", back_populates="created_by")
    handled_risks = relationship("ContractRisk", foreign_keys="ContractRisk.handled_by_id", back_populates="handled_by")
    change_logs = relationship("ChangeLog", back_populates="operator")


class ConsultantProfile(Base):
    __tablename__ = "consultant_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    employee_no = Column(String(50), unique=True, index=True)
    department = Column(String(100))
    position = Column(String(100))
    max_appointments_per_day = Column(Integer, default=5)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="consultant_profile")


class ApartmentStatus(str, enum.Enum):
    VACANT = "vacant"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"
    DECORATING = "decorating"


class Apartment(Base):
    __tablename__ = "apartments"

    id = Column(Integer, primary_key=True, index=True)
    apartment_no = Column(String(50), unique=True, index=True, nullable=False)
    building = Column(String(50))
    floor = Column(Integer)
    room_no = Column(String(20))
    area = Column(Float)
    bedrooms = Column(Integer)
    living_rooms = Column(Integer, default=1)
    bathrooms = Column(Integer, default=1)
    orientation = Column(String(20))
    floor_level = Column(String(20))
    decoration = Column(String(50))
    monthly_rent = Column(Float, nullable=False)
    deposit_months = Column(Float, default=1.0)
    status = Column(String(20), default="vacant", nullable=False)
    address = Column(String(255))
    description = Column(Text)
    facilities = Column(Text)
    tags = Column(String(255))
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    appointments = relationship("Appointment", back_populates="apartment")
    attachments = relationship("Attachment", back_populates="apartment")
    deposits = relationship("Deposit", back_populates="apartment")
    risks = relationship("ContractRisk", back_populates="apartment")
    vacancy_history = relationship("VacancyHistory", back_populates="apartment")
    change_logs = relationship("ChangeLog", primaryjoin="and_(ChangeLog.table_name=='apartments', foreign(ChangeLog.record_id)==Apartment.id)")


class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("users.id"))
    consultant_id = Column(Integer, ForeignKey("users.id"))
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(String(20), nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    tenant_name = Column(String(100))
    tenant_phone = Column(String(20))
    source_channel = Column(String(50))
    demand_description = Column(Text)
    remark = Column(Text)
    cancel_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    apartment = relationship("Apartment", back_populates="appointments")
    tenant = relationship("User", foreign_keys=[tenant_id], back_populates="appointments_as_tenant")
    consultant = relationship("User", foreign_keys=[consultant_id], back_populates="appointments_as_consultant")
    follow_ups = relationship("FollowUp", back_populates="appointment")


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    follow_type = Column(String(50))
    content = Column(Text, nullable=False)
    next_follow_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="follow_ups")
    operator = relationship("User", back_populates="follow_ups")


class DepositStatus(str, enum.Enum):
    PAID = "paid"
    REFUNDED = "refunded"
    DEDUCTED = "deducted"
    PARTIAL_REFUNDED = "partial_refunded"


class Deposit(Base):
    __tablename__ = "deposits"

    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    tenant_name = Column(String(100), nullable=False)
    tenant_phone = Column(String(20))
    id_card = Column(String(20))
    contract_no = Column(String(50))
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="paid", nullable=False)
    pay_date = Column(Date, nullable=False)
    refund_date = Column(Date)
    refund_amount = Column(Float, default=0)
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    apartment = relationship("Apartment", back_populates="deposits")


class ContractRiskStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    CLOSED = "closed"


class ContractRisk(Base):
    __tablename__ = "contract_risks"

    id = Column(Integer, primary_key=True, index=True)
    risk_no = Column(String(50), unique=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"))
    tenant_name = Column(String(100))
    tenant_phone = Column(String(20))
    risk_type = Column(String(50), nullable=False)
    risk_level = Column(String(20), default="medium")
    description = Column(Text, nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    handled_by_id = Column(Integer, ForeignKey("users.id"))
    handle_result = Column(Text)
    handle_reason = Column(Text)
    remark = Column(Text)
    closed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_risks")
    handled_by = relationship("User", foreign_keys=[handled_by_id], back_populates="handled_risks")
    apartment = relationship("Apartment", back_populates="risks")


class DictType(Base):
    __tablename__ = "dict_types"

    id = Column(Integer, primary_key=True, index=True)
    dict_code = Column(String(50), unique=True, index=True, nullable=False)
    dict_name = Column(String(100), nullable=False)
    description = Column(String(255))
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("DictItem", back_populates="dict_type")


class DictItem(Base):
    __tablename__ = "dict_items"

    id = Column(Integer, primary_key=True, index=True)
    dict_type_id = Column(Integer, ForeignKey("dict_types.id"), nullable=False)
    item_label = Column(String(100), nullable=False)
    item_value = Column(String(100), nullable=False)
    sort_order = Column(Integer, default=0)
    is_default = Column(Boolean, default=False)
    status = Column(String(20), default="active")
    remark = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    dict_type = relationship("DictType", back_populates="items")


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), unique=True, index=True, nullable=False)
    config_value = Column(Text)
    config_name = Column(String(100), nullable=False)
    config_group = Column(String(50))
    value_type = Column(String(20), default="string")
    remark = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"))
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size = Column(Integer)
    file_type = Column(String(50))
    category = Column(String(50))
    uploaded_by = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    apartment = relationship("Apartment", back_populates="attachments")


class ChangeLog(Base):
    __tablename__ = "change_logs"

    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String(50), nullable=False)
    record_id = Column(Integer, nullable=False)
    field_name = Column(String(50))
    old_value = Column(Text)
    new_value = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"))
    change_type = Column(String(20))
    remark = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    operator = relationship("User", back_populates="change_logs")


class VacancyHistory(Base):
    __tablename__ = "vacancy_history"

    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    from_status = Column(String(20))
    to_status = Column(String(20), nullable=False)
    change_date = Column(Date, nullable=False)
    days_vacant = Column(Integer, default=0)
    remark = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    apartment = relationship("Apartment", back_populates="vacancy_history")
