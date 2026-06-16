from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class SupplierRiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SupplierStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    SUSPENDED = "suspended"
    BLACKLISTED = "blacklisted"


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    contact_person = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(String(500))
    tax_number = Column(String(50))
    bank_account = Column(String(100))
    bank_name = Column(String(100))
    risk_level = Column(Enum(SupplierRiskLevel), default=SupplierRiskLevel.LOW)
    status = Column(Enum(SupplierStatus), default=SupplierStatus.PENDING)
    credit_rating = Column(Integer, default=60)
    on_time_delivery_rate = Column(Float, default=100.0)
    quality_score = Column(Float, default=100.0)
    total_orders = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    remarks = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    quotes = relationship("Quote", back_populates="supplier")
    risk_logs = relationship("SupplierRiskLog", back_populates="supplier")
    agreements = relationship("FrameworkAgreement", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


class SupplierRiskLog(Base):
    __tablename__ = "supplier_risk_logs"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    previous_level = Column(Enum(SupplierRiskLevel))
    new_level = Column(Enum(SupplierRiskLevel), nullable=False)
    reason = Column(Text, nullable=False)
    triggered_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    supplier = relationship("Supplier", back_populates="risk_logs")
