from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum, JSON, Float
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    SECURITY_OFFICER = "security_officer"


class RequestType(str, enum.Enum):
    ACCOUNT_CHANGE = "account_change"
    FAULT_REPORT = "fault_report"


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ROLLED_BACK = "rolled_back"


class ApprovalStage(str, enum.Enum):
    CHANGE_WINDOW = "change_window"
    ROLLBACK_PLAN = "rollback_plan"
    IMPLEMENTATION = "implementation"


class DeviceStatus(str, enum.Enum):
    NORMAL = "normal"
    WARNING = "warning"
    FAULTY = "faulty"
    MAINTENANCE = "maintenance"


class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    UNCONFIRMED = "unconfirmed"
    CONFIRMED = "confirmed"
    RESOLVED = "resolved"


class VulnerabilitySeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class VulnerabilityStatus(str, enum.Enum):
    IDENTIFIED = "identified"
    FIXING = "fixing"
    FIXED = "fixed"
    ACCEPTED = "accepted"


class LogAction(str, enum.Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    CREATE_REQUEST = "create_request"
    APPROVE_REQUEST = "approve_request"
    REJECT_REQUEST = "reject_request"
    UPDATE_CONFIG = "update_config"
    DELETE_CONFIG = "delete_config"
    CREATE_USER = "create_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    PERMISSION_DENIED = "permission_denied"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100))
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    department = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_requests = relationship("ChangeRequest", back_populates="requester", foreign_keys="ChangeRequest.requester_id")
    approvals = relationship("ApprovalRecord", back_populates="approver")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")


class ChangeRequest(Base):
    __tablename__ = "change_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_type = Column(Enum(RequestType), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, nullable=False)
    current_stage = Column(Enum(ApprovalStage), default=ApprovalStage.CHANGE_WINDOW)

    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requester = relationship("User", back_populates="created_requests", foreign_keys=[requester_id])

    target_account = Column(String(100))
    change_type = Column(String(50))
    change_details = Column(JSON)

    change_window_start = Column(DateTime)
    change_window_end = Column(DateTime)
    change_window_approved = Column(Boolean, default=False)
    change_window_approver_id = Column(Integer, ForeignKey("users.id"))
    change_window_comment = Column(Text)

    rollback_plan = Column(Text)
    rollback_plan_approved = Column(Boolean, default=False)
    rollback_plan_approver_id = Column(Integer, ForeignKey("users.id"))
    rollback_plan_comment = Column(Text)

    implementation_result = Column(Text)
    is_rolled_back = Column(Boolean, default=False)
    rollback_reason = Column(Text)

    fault_level = Column(String(50))
    fault_device = Column(String(200))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    approval_records = relationship("ApprovalRecord", back_populates="request", cascade="all, delete-orphan")


class ApprovalRecord(Base):
    __tablename__ = "approval_records"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("change_requests.id"), nullable=False)
    request = relationship("ChangeRequest", back_populates="approval_records")

    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approver = relationship("User", back_populates="approvals")

    stage = Column(Enum(ApprovalStage), nullable=False)
    action = Column(String(20), nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class DeviceInspection(Base):
    __tablename__ = "device_inspections"

    id = Column(Integer, primary_key=True, index=True)
    device_name = Column(String(200), nullable=False)
    device_type = Column(String(50))
    ip_address = Column(String(50))
    status = Column(Enum(DeviceStatus), default=DeviceStatus.NORMAL)
    location = Column(String(200))
    last_inspection = Column(DateTime)
    next_inspection = Column(DateTime)
    inspection_cycle_days = Column(Integer, default=30)
    remarks = Column(Text)
    config_details = Column(JSON)

    created_by = Column(Integer, ForeignKey("users.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.MEDIUM)
    status = Column(Enum(AlertStatus), default=AlertStatus.UNCONFIRMED)
    source = Column(String(100))
    device_name = Column(String(200))

    confirmed_by = Column(Integer, ForeignKey("users.id"))
    confirmed_at = Column(DateTime)
    confirmed_comment = Column(Text)

    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    resolution = Column(Text)

    created_by = Column(Integer, ForeignKey("users.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    cve_id = Column(String(50))
    severity = Column(Enum(VulnerabilitySeverity), default=VulnerabilitySeverity.MEDIUM)
    status = Column(Enum(VulnerabilityStatus), default=VulnerabilityStatus.IDENTIFIED)
    affected_devices = Column(JSON)
    fix_plan = Column(Text)
    fix_result = Column(Text)

    fixed_by = Column(Integer, ForeignKey("users.id"))
    fixed_at = Column(DateTime)

    created_by = Column(Integer, ForeignKey("users.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])

    action = Column(Enum(LogAction), nullable=False)
    resource_type = Column(String(50))
    resource_id = Column(Integer)
    description = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    details = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ApiErrorLog(Base):
    __tablename__ = "api_error_logs"

    id = Column(Integer, primary_key=True, index=True)
    method = Column(String(10), nullable=False)
    path = Column(String(500), nullable=False)
    status_code = Column(Integer)
    error_message = Column(Text)
    error_type = Column(String(100))
    request_body = Column(Text)
    query_params = Column(JSON)
    user_id = Column(Integer, ForeignKey("users.id"))
    ip_address = Column(String(50))
    retry_count = Column(Integer, default=0)
    last_result = Column(String(50))
    resolved = Column(Boolean, default=False)
    resolution_note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
