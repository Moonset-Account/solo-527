from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Date, Enum, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    STORE_MANAGER = "store_manager"
    BAKER = "baker"
    CASHIER = "cashier"


class BatchStatus(str, enum.Enum):
    PREPARING = "preparing"
    BAKING = "baking"
    COOLING = "cooling"
    COMPLETED = "completed"
    PARTIAL_DAMAGED = "partial_damaged"
    FULLY_DAMAGED = "fully_damaged"


class LossType(str, enum.Enum):
    BAKING_FAILURE = "baking_failure"
    OVERBAKE = "overbake"
    UNDERBAKE = "underbake"
    DECORATION_ERROR = "decoration_error"
    EXPIRED = "expired"
    DAMAGE = "damage"
    OTHER = "other"


class InventoryStatus(str, enum.Enum):
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    RESERVED = "reserved"


class InspectionStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    NEEDS_REVIEW = "needs_review"


class RectificationStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"
    RE_INSPECTED = "re_inspected"


class CashFlowType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"


class ModuleType(str, enum.Enum):
    INVENTORY = "inventory"
    INSPECTION = "inspection"
    RECTIFICATION = "rectification"
    CASH_FLOW = "cash_flow"
    BATCH = "batch"
    LOSS = "loss"
    LABOR_COST = "labor_cost"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.BAKER)
    store_id = Column(Integer, ForeignKey("stores.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store = relationship("Store", back_populates="users")


class Store(Base):
    __tablename__ = "stores"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255))
    phone = Column(String(20))
    manager_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    users = relationship("User", back_populates="store", foreign_keys=[User.store_id])
    batches = relationship("BakingBatch", back_populates="store")
    inventory_items = relationship("InventoryItem", back_populates="store")
    inspections = relationship("InspectionTask", back_populates="store")
    cash_flows = relationship("CashFlow", back_populates="store")
    labor_records = relationship("LaborRecord", back_populates="store")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    sku = Column(String(50), unique=True, index=True)
    category = Column(String(50))
    unit = Column(String(20), default="个")
    standard_cost = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    recipe = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batches = relationship("BakingBatch", back_populates="product")


class Ingredient(Base):
    __tablename__ = "ingredients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    sku = Column(String(50), unique=True, index=True)
    category = Column(String(50))
    unit = Column(String(20), default="kg")
    unit_price = Column(Float, default=0.0)
    min_stock = Column(Float, default=10.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inventory_items = relationship("InventoryItem", back_populates="ingredient")
    loss_records = relationship("LossRecord", back_populates="ingredient")


class BakingBatch(Base):
    __tablename__ = "baking_batches"
    id = Column(Integer, primary_key=True, index=True)
    batch_no = Column(String(50), unique=True, index=True, nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    baker_id = Column(Integer, ForeignKey("users.id"))
    planned_quantity = Column(Float, nullable=False)
    actual_quantity = Column(Float)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    status = Column(Enum(BatchStatus), default=BatchStatus.PREPARING)
    temperature = Column(Float)
    humidity = Column(Float)
    baking_time = Column(Integer)
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store = relationship("Store", back_populates="batches")
    product = relationship("Product", back_populates="batches")
    baker = relationship("User", foreign_keys=[baker_id])
    loss_records = relationship("LossRecord", back_populates="batch")


class LossRecord(Base):
    __tablename__ = "loss_records"
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("baking_batches.id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    loss_type = Column(Enum(LossType), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(20))
    unit_price = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    reported_by = Column(Integer, ForeignKey("users.id"))
    handler_id = Column(Integer, ForeignKey("users.id"))
    remark = Column(Text)
    handle_result = Column(Text)
    handled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("BakingBatch", back_populates="loss_records")
    ingredient = relationship("Ingredient", back_populates="loss_records")
    reporter = relationship("User", foreign_keys=[reported_by])
    handler = relationship("User", foreign_keys=[handler_id])


class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    quantity = Column(Float, default=0.0)
    min_stock = Column(Float, default=10.0)
    status = Column(Enum(InventoryStatus), default=InventoryStatus.IN_STOCK)
    last_restocked = Column(DateTime(timezone=True))
    last_check = Column(DateTime(timezone=True))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store = relationship("Store", back_populates="inventory_items")
    ingredient = relationship("Ingredient", back_populates="inventory_items")
    stock_alerts = relationship("StockAlert", back_populates="inventory_item")


class StockAlert(Base):
    __tablename__ = "stock_alerts"
    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"))
    alert_level = Column(String(20), default="warning")
    current_quantity = Column(Float)
    min_stock = Column(Float)
    handler_id = Column(Integer, ForeignKey("users.id"))
    remark = Column(Text)
    handle_result = Column(Text)
    is_handled = Column(Boolean, default=False)
    handled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inventory_item = relationship("InventoryItem", back_populates="stock_alerts")
    handler = relationship("User", foreign_keys=[handler_id])


class InspectionTask(Base):
    __tablename__ = "inspection_tasks"
    id = Column(Integer, primary_key=True, index=True)
    task_no = Column(String(50), unique=True, index=True, nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    supervisor_id = Column(Integer, ForeignKey("users.id"))
    store_manager_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    check_items = Column(JSON)
    status = Column(Enum(InspectionStatus), default=InspectionStatus.PENDING)
    scheduled_date = Column(Date)
    actual_start = Column(DateTime(timezone=True))
    actual_end = Column(DateTime(timezone=True))
    score = Column(Float)
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store = relationship("Store", back_populates="inspections")
    supervisor = relationship("User", foreign_keys=[supervisor_id])
    store_manager = relationship("User", foreign_keys=[store_manager_id])
    rectifications = relationship("RectificationTask", back_populates="inspection")
    check_records = relationship("InspectionCheckRecord", back_populates="inspection")


class InspectionCheckRecord(Base):
    __tablename__ = "inspection_check_records"
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspection_tasks.id"), nullable=False)
    check_item = Column(String(200), nullable=False)
    category = Column(String(100))
    is_pass = Column(Boolean, default=False)
    remark = Column(Text)
    image_urls = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inspection = relationship("InspectionTask", back_populates="check_records")


class RectificationTask(Base):
    __tablename__ = "rectification_tasks"
    id = Column(Integer, primary_key=True, index=True)
    rectification_no = Column(String(50), unique=True, index=True, nullable=False)
    inspection_id = Column(Integer, ForeignKey("inspection_tasks.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"))
    supervisor_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    requirement = Column(Text)
    deadline = Column(DateTime(timezone=True))
    status = Column(Enum(RectificationStatus), default=RectificationStatus.PENDING)
    rectification_result = Column(Text)
    re_inspection_result = Column(Text)
    image_urls = Column(JSON)
    completed_at = Column(DateTime(timezone=True))
    re_inspected_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    inspection = relationship("InspectionTask", back_populates="rectifications")
    assignee = relationship("User", foreign_keys=[assignee_id])
    supervisor = relationship("User", foreign_keys=[supervisor_id])


class CashFlow(Base):
    __tablename__ = "cash_flows"
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    flow_type = Column(Enum(CashFlowType), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100))
    description = Column(String(255))
    operator_id = Column(Integer, ForeignKey("users.id"))
    transaction_time = Column(DateTime(timezone=True), server_default=func.now())
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    store = relationship("Store", back_populates="cash_flows")
    operator = relationship("User", foreign_keys=[operator_id])


class LaborRecord(Base):
    __tablename__ = "labor_records"
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    work_date = Column(Date, nullable=False)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    regular_hours = Column(Float, default=0.0)
    overtime_hours = Column(Float, default=0.0)
    hourly_rate = Column(Float, default=0.0)
    overtime_rate = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    work_content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    store = relationship("Store", back_populates="labor_records")
    user = relationship("User", foreign_keys=[user_id])


class SystemSetting(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    module = Column(Enum(ModuleType), nullable=False)
    key = Column(String(100), nullable=False)
    value = Column(Text)
    value_type = Column(String(20), default="string")
    description = Column(String(255))
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('module', 'key', name='_module_key_uc'),
    )
