from sqlalchemy import Column, Integer, String, Boolean, Numeric, Date, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), default="inspector")
    display_name = Column(String(64), nullable=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    phone = Column(String(20))
    address = Column(String(256))
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class Plan(Base):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="draft")
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class BudgetVersion(Base):
    __tablename__ = "budget_versions"
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    version = Column(String(32), nullable=False)
    items = Column(JSONB, default=[])
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    budget_version_id = Column(Integer, ForeignKey("budget_versions.id"), nullable=True)
    status = Column(String(20), default="draft")
    amount = Column(Numeric(12, 2), default=0)
    start_date = Column(Date)
    end_date = Column(Date)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class AcceptanceTemplate(Base):
    __tablename__ = "acceptance_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    items = Column(JSONB, default=[])
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class InspectionTemplate(Base):
    __tablename__ = "inspection_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    check_items = Column(JSONB, default=[])
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class InspectionTask(Base):
    __tablename__ = "inspection_tasks"
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("inspection_templates.id"))
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    node_name = Column(String(128), nullable=False)
    status = Column(String(20), default="pending")
    deadline = Column(Date, nullable=False)
    is_delayed = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class InspectionRecord(Base):
    __tablename__ = "inspection_records"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("inspection_tasks.id"), nullable=False)
    quality_score = Column(Integer, default=0)
    description = Column(Text)
    photos = Column(JSONB, default=[])
    conclusion = Column(String(32))
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class SatisfactionRecord(Base):
    __tablename__ = "satisfaction_records"
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    level = Column(String(20), default="pending")
    comment = Column(Text)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(32), nullable=False)
    title = Column(String(256), nullable=False)
    content = Column(Text)
    is_read = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class ConfigChangeLog(Base):
    __tablename__ = "config_change_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(20), nullable=False)
    before_data = Column(JSONB)
    after_data = Column(JSONB)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
