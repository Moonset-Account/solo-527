from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, ForeignKey, Text,
    Boolean, Numeric, Enum, JSON, BigInteger
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum
from datetime import datetime


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PURCHASER = "purchaser"
    WAREHOUSE = "warehouse"
    MANAGER = "manager"
    VIEWER = "viewer"


class BatchStatus(str, enum.Enum):
    IN_STOCK = "in_stock"
    PARTIAL = "partial"
    SOLD_OUT = "sold_out"
    EXPIRED = "expired"
    RECALLED = "recalled"


class FlowType(str, enum.Enum):
    PURCHASE_IN = "purchase_in"
    SALES_OUT = "sales_out"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    ADJUSTMENT = "adjustment"
    RETURN_IN = "return_in"
    RETURN_OUT = "return_out"
    SCRAP = "scrap"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReminderStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    IGNORED = "ignored"


class AbnormalStatus(str, enum.Enum):
    OPEN = "open"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    CLOSED = "closed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role = Column(Enum(UserRole), default=UserRole.PURCHASER, nullable=False)
    department = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    created_batches = relationship("Batch", back_populates="creator", foreign_keys="Batch.created_by")
    handled_reminders = relationship("ExpiryReminder", back_populates="handler", foreign_keys="ExpiryReminder.handled_by")
    created_risks = relationship("StockRisk", back_populates="creator", foreign_keys="StockRisk.created_by")
    handled_abnormal = relationship("AbnormalRecord", back_populates="handler", foreign_keys="AbnormalRecord.handled_by")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False, index=True)
    license_no = Column(String(100))
    contact_person = Column(String(50))
    contact_phone = Column(String(20))
    contact_email = Column(String(100))
    address = Column(String(500))
    bank_info = Column(String(500))
    tax_no = Column(String(100))
    rating = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    medicines = relationship("Medicine", back_populates="supplier")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False, index=True)
    generic_name = Column(String(200))
    specification = Column(String(200), nullable=False)
    dosage_form = Column(String(50))
    manufacturer = Column(String(200))
    approval_no = Column(String(100))
    unit = Column(String(20), default="盒")
    category = Column(String(100))
    storage_condition = Column(String(200))
    shelf_life_days = Column(Integer)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), index=True)
    safety_stock = Column(Integer, default=50)
    max_stock = Column(Integer, default=1000)
    reorder_point = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    supplier = relationship("Supplier", back_populates="medicines")
    batches = relationship("Batch", back_populates="medicine")
    replenish_suggestions = relationship("ReplenishSuggestion", back_populates="medicine")


class WarehouseLocation(Base):
    __tablename__ = "warehouse_locations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    zone = Column(String(100))
    area = Column(String(100))
    row = Column(String(20))
    column = Column(String(20))
    level = Column(String(20))
    temperature_zone = Column(String(50))
    max_capacity = Column(Integer, default=1000)
    is_active = Column(Boolean, default=True)
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    stocks = relationship("Stock", back_populates="location")


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_no = Column(String(100), nullable=False, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), index=True)
    production_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    received_quantity = Column(Integer, default=0)
    purchase_price = Column(Numeric(12, 2), default=0)
    selling_price = Column(Numeric(12, 2), default=0)
    location_id = Column(Integer, ForeignKey("warehouse_locations.id"), index=True)
    status = Column(Enum(BatchStatus), default=BatchStatus.IN_STOCK, index=True)
    inspection_status = Column(String(50), default="待检验")
    inspection_report_no = Column(String(100))
    purchase_order_no = Column(String(100))
    certificate_no = Column(String(200))
    sign_difference = Column(Numeric(12, 2), default=0)
    sign_difference_remark = Column(Text)
    remark = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    medicine = relationship("Medicine", back_populates="batches")
    creator = relationship("User", back_populates="created_batches", foreign_keys=[created_by])
    stocks = relationship("Stock", back_populates="batch")
    flows = relationship("BatchFlow", back_populates="batch")
    expiry_reminders = relationship("ExpiryReminder", back_populates="batch")


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("warehouse_locations.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    locked_quantity = Column(Integer, default=0)
    available_quantity = Column(Integer, default=0)
    last_move_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    batch = relationship("Batch", back_populates="stocks")
    location = relationship("WarehouseLocation", back_populates="stocks")


class BatchFlow(Base):
    __tablename__ = "batch_flows"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    flow_type = Column(Enum(FlowType), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    reference_no = Column(String(100), index=True)
    from_location_id = Column(Integer, ForeignKey("warehouse_locations.id"))
    to_location_id = Column(Integer, ForeignKey("warehouse_locations.id"))
    counterparty = Column(String(200))
    operator_id = Column(Integer, ForeignKey("users.id"))
    operation_time = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("Batch", back_populates="flows")
    operator = relationship("User", foreign_keys=[operator_id])
    from_location = relationship("WarehouseLocation", foreign_keys=[from_location_id])
    to_location = relationship("WarehouseLocation", foreign_keys=[to_location_id])


class ExpiryReminder(Base):
    __tablename__ = "expiry_reminders"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    days_to_expiry = Column(Integer, nullable=False)
    reminder_level = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM, index=True)
    status = Column(Enum(ReminderStatus), default=ReminderStatus.PENDING, index=True)
    current_stock = Column(Integer)
    suggested_action = Column(String(500))
    handled_by = Column(Integer, ForeignKey("users.id"))
    handled_at = Column(DateTime(timezone=True))
    handle_remark = Column(Text)
    handle_duration_minutes = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    batch = relationship("Batch", back_populates="expiry_reminders")
    handler = relationship("User", back_populates="handled_reminders", foreign_keys=[handled_by])


class StockRisk(Base):
    __tablename__ = "stock_risks"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False, index=True)
    risk_type = Column(String(50), nullable=False)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM, index=True)
    current_stock = Column(Integer)
    avg_daily_consumption = Column(Numeric(12, 2))
    days_of_stock = Column(Numeric(12, 2))
    description = Column(String(500))
    status = Column(Enum(ReminderStatus), default=ReminderStatus.PENDING, index=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    medicine = relationship("Medicine")
    creator = relationship("User", back_populates="created_risks", foreign_keys=[created_by])


class ReplenishSuggestion(Base):
    __tablename__ = "replenish_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False, index=True)
    current_stock = Column(Integer)
    safety_stock = Column(Integer)
    reorder_point = Column(Integer)
    suggested_quantity = Column(Integer)
    max_stock = Column(Integer)
    avg_monthly_consumption = Column(Numeric(12, 2))
    estimated_arrival_days = Column(Integer, default=7)
    priority = Column(Enum(RiskLevel), default=RiskLevel.LOW, index=True)
    status = Column(String(50), default="pending")
    purchaser_id = Column(Integer, ForeignKey("users.id"), index=True)
    last_order_date = Column(Date)
    suggestion_reason = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    medicine = relationship("Medicine", back_populates="replenish_suggestions")
    purchaser = relationship("User", foreign_keys=[purchaser_id])


class AbnormalRecord(Base):
    __tablename__ = "abnormal_records"

    id = Column(Integer, primary_key=True, index=True)
    abnormal_type = Column(String(50), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), index=True)
    description = Column(Text, nullable=False)
    status = Column(Enum(AbnormalStatus), default=AbnormalStatus.OPEN, index=True)
    severity = Column(Enum(RiskLevel), default=RiskLevel.MEDIUM)
    found_by = Column(Integer, ForeignKey("users.id"))
    found_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    handled_by = Column(Integer, ForeignKey("users.id"))
    handled_at = Column(DateTime(timezone=True))
    handle_duration_minutes = Column(Integer)
    handle_solution = Column(Text)
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    batch = relationship("Batch")
    medicine = relationship("Medicine")
    founder = relationship("User", foreign_keys=[found_by])
    handler = relationship("User", back_populates="handled_abnormal", foreign_keys=[handled_by])


class Dictionary(Base):
    __tablename__ = "dictionaries"

    id = Column(Integer, primary_key=True, index=True)
    dict_type = Column(String(100), nullable=False, index=True)
    dict_code = Column(String(100), nullable=False, index=True)
    dict_value = Column(String(500), nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    effective_from = Column(DateTime(timezone=True), server_default=func.now())
    effective_to = Column(DateTime(timezone=True))
    parent_id = Column(Integer, ForeignKey("dictionaries.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    parent = relationship("Dictionary", remote_side=[id])
    creator = relationship("User", foreign_keys=[created_by])


class ReminderStrategy(Base):
    __tablename__ = "reminder_strategies"

    id = Column(Integer, primary_key=True, index=True)
    strategy_name = Column(String(200), nullable=False)
    strategy_type = Column(String(50), nullable=False, index=True)
    conditions = Column(JSON, nullable=False)
    actions = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    effective_from = Column(DateTime(timezone=True), server_default=func.now())
    effective_to = Column(DateTime(timezone=True))
    priority = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id"))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by])


class ReportExport(Base):
    __tablename__ = "report_exports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(100), nullable=False, index=True)
    report_name = Column(String(200), nullable=False)
    filters = Column(JSON)
    file_path = Column(String(500))
    file_size = Column(BigInteger)
    total_records = Column(Integer)
    status = Column(String(50), default="generating")
    generated_by = Column(Integer, ForeignKey("users.id"))
    generated_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    generator = relationship("User", foreign_keys=[generated_by])


class SignDifference(Base):
    __tablename__ = "sign_differences"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    purchase_order_no = Column(String(100), index=True)
    expected_quantity = Column(Integer)
    actual_quantity = Column(Integer)
    difference_quantity = Column(Integer)
    difference_amount = Column(Numeric(12, 2), default=0)
    difference_reason = Column(String(500))
    status = Column(String(50), default="pending")
    handled_by = Column(Integer, ForeignKey("users.id"))
    handled_at = Column(DateTime(timezone=True))
    handle_duration_minutes = Column(Integer)
    handle_solution = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("Batch")
    handler = relationship("User", foreign_keys=[handled_by])
