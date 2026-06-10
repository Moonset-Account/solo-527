from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

UserRole = Enum("ADMIN", "CLIENT", name="user_role", create_constraint=False)
BillStatus = Enum("DRAFT", "ISSUED", "PARTIAL", "PAID", "OVERDUE", "VOID", name="bill_status", create_constraint=False)
InvoiceStatus = Enum(
    "PENDING", "APPROVED", "REJECTED", "ISSUING", "ISSUED", "MAILED", "SENT", "ERROR", name="invoice_status", create_constraint=False
)
InvoiceType = Enum("VAT_SPECIAL", "VAT_NORMAL", "ELECTRONIC", name="invoice_type", create_constraint=False)
TxnMatchStatus = Enum(
    "UNMATCHED", "PARTIAL", "MATCHED", "ANOMALY", name="txn_match_status", create_constraint=False
)
MatchType = Enum("AUTO", "MANUAL", "PREPAID", name="match_type", create_constraint=False)
PrepaidTxnType = Enum(
    "RECHARGE", "DEDUCT", "REFUND", "ADJUST", name="prepaid_txn_type", create_constraint=False
)
AnomalyType = Enum(
    "TXN_UNMATCHED",
    "INVOICE_ERROR",
    "AMOUNT_DIFF",
    "OVERDUE_LIMIT",
    "FORECAST_WARN",
    name="anomaly_type",
    create_constraint=False,
)
AnomalySeverity = Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="anomaly_severity", create_constraint=False)
AnomalyStatus = Enum(
    "OPEN", "PROCESSING", "RESOLVED", "IGNORED", name="anomaly_status", create_constraint=False
)
ReminderType = Enum(
    "BEFORE_DUE", "OVERDUE_DAILY", "OVERDUE_LIMIT", name="reminder_type", create_constraint=False
)
ReminderChannel = Enum("EMAIL", "IN_APP", "SMS", name="reminder_channel", create_constraint=False)
ReminderStatus = Enum("PENDING", "SENT", "FAILED", name="reminder_status", create_constraint=False)
ExportKind = Enum(
    "CASHFLOW",
    "INVOICE_ERRORS",
    "CHANGE_LOG",
    "BILL_DETAIL",
    "RECONCILIATION",
    name="export_type",
    create_constraint=False,
)
ExportStatus = Enum("PENDING", "PROCESSING", "COMPLETED", "FAILED", name="export_status", create_constraint=False)
AuditEntity = Enum(
    "BILL", "INVOICE", "TXN", "CLIENT", "PREPAID", name="audit_entity", create_constraint=False
)


def _uuid_pk() -> Mapped[UUID]:
    return mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid4)


def _now() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = _uuid_pk()
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(UserRole, default="CLIENT")
    client_id: Mapped[Optional[UUID]] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("clients.id", ondelete="SET NULL"), index=True, nullable=True
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = _now()
    updated_at: Mapped[datetime] = _now()

    client: Mapped[Optional["Client"]] = relationship(back_populates="users", foreign_keys=[client_id])


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(200), index=True)
    tax_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)
    contact_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    bank_account: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    prepaid_balance: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    created_at: Mapped[datetime] = _now()
    updated_at: Mapped[datetime] = _now()

    users: Mapped[list["User"]] = relationship(back_populates="client", foreign_keys="User.client_id")
    orders: Mapped[list["Order"]] = relationship(back_populates="client")
    bills: Mapped[list["Bill"]] = relationship(back_populates="client")
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="client")
    prepaid_account: Mapped[Optional["PrepaidAccount"]] = relationship(
        back_populates="client", uselist=False, foreign_keys="PrepaidAccount.client_id"
    )


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[UUID] = _uuid_pk()
    client_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("clients.id"), index=True)
    order_no: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    product_name: Mapped[str] = mapped_column(String(200))
    plan_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", index=True)
    created_at: Mapped[datetime] = _now()
    updated_at: Mapped[datetime] = _now()

    client: Mapped["Client"] = relationship(back_populates="orders")
    bills: Mapped[list["Bill"]] = relationship(back_populates="order")


class Bill(Base):
    __tablename__ = "bills"

    id: Mapped[UUID] = _uuid_pk()
    bill_no: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    client_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("clients.id"), index=True)
    order_id: Mapped[Optional[UUID]] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("orders.id"), nullable=True
    )
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    issue_date: Mapped[date] = mapped_column(Date, index=True)
    due_date: Mapped[date] = mapped_column(Date, index=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    status: Mapped[str] = mapped_column(BillStatus, default="DRAFT", index=True)
    days_overdue: Mapped[int] = mapped_column(Integer, default=0)
    invoice_requested: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    forecast_impact_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = _now()
    updated_at: Mapped[datetime] = _now()

    client: Mapped["Client"] = relationship(back_populates="bills")
    order: Mapped[Optional["Order"]] = relationship(back_populates="bills")
    payments: Mapped[list["Payment"]] = relationship(
        back_populates="bill", cascade="all, delete-orphan", foreign_keys="Payment.bill_id"
    )
    notes: Mapped[list["Note"]] = relationship(
        back_populates="bill", cascade="all, delete-orphan", foreign_keys="Note.bill_id"
    )
    attachments: Mapped[list["Attachment"]] = relationship(
        back_populates="bill", cascade="all, delete-orphan", foreign_keys="Attachment.bill_id"
    )
    reminders: Mapped[list["Reminder"]] = relationship(
        back_populates="bill", cascade="all, delete-orphan", foreign_keys="Reminder.bill_id"
    )
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="bill", foreign_keys="Invoice.bill_id")
    prepaid_txns: Mapped[list["PrepaidTransaction"]] = relationship(
        back_populates="bill", foreign_keys="PrepaidTransaction.related_bill_id"
    )

    __table_args__ = (
        Index("ix_bills_remaining", "total_amount", "paid_amount", postgresql_where=text("(total_amount - paid_amount) > 0")),
        Index("ix_bills_composite", "status", "due_date", "total_amount"),
    )


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id: Mapped[UUID] = _uuid_pk()
    txn_no: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    txn_date: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    direction: Mapped[str] = mapped_column(String(10))
    counterparty: Mapped[Optional[str]] = mapped_column(String(300), index=True, nullable=True)
    counterparty_account: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    balance_after: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    match_status: Mapped[str] = mapped_column(TxnMatchStatus, default="UNMATCHED", index=True)
    matched_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    matched_bill_ids: Mapped[list[Any]] = mapped_column(
        ARRAY(PgUUID(as_uuid=True)), default=list, server_default=text("ARRAY[]::uuid[]")
    )
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    import_batch: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    imported_at: Mapped[datetime] = _now()
    created_at: Mapped[datetime] = _now()

    payments: Mapped[list["Payment"]] = relationship(
        back_populates="transaction", foreign_keys="Payment.transaction_id"
    )


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[UUID] = _uuid_pk()
    transaction_id: Mapped[Optional[UUID]] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("bank_transactions.id"), index=True, nullable=True
    )
    bill_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("bills.id", ondelete="CASCADE"), index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    match_type: Mapped[str] = mapped_column(MatchType, index=True)
    matched_by: Mapped[Optional[UUID]] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    remark: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    matched_at: Mapped[datetime] = _now()
    created_at: Mapped[datetime] = _now()

    transaction: Mapped[Optional["BankTransaction"]] = relationship(back_populates="payments")
    bill: Mapped["Bill"] = relationship(back_populates="payments")


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[UUID] = _uuid_pk()
    invoice_no: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    bill_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("bills.id"), index=True)
    client_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("clients.id"), index=True)
    title: Mapped[str] = mapped_column(String(300))
    tax_id: Mapped[str] = mapped_column(String(50), index=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    bank_account: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    type: Mapped[str] = mapped_column(InvoiceType, default="VAT_NORMAL")
    status: Mapped[str] = mapped_column(InvoiceStatus, default="PENDING", index=True)
    validation_errors: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, server_default=text("'{}'::jsonb"))
    applied_by: Mapped[Optional[UUID]] = mapped_column(PgUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    applied_at: Mapped[datetime] = _now()
    approved_by: Mapped[Optional[UUID]] = mapped_column(PgUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    issued_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    mailed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    tracking_no: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    remark: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = _now()
    updated_at: Mapped[datetime] = _now()

    bill: Mapped["Bill"] = relationship(back_populates="invoices")
    client: Mapped["Client"] = relationship(back_populates="invoices")
    attachments: Mapped[list["Attachment"]] = relationship(
        back_populates="invoice", foreign_keys="Attachment.invoice_id"
    )


class PrepaidAccount(Base):
    __tablename__ = "prepaid_accounts"

    id: Mapped[UUID] = _uuid_pk()
    client_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("clients.id"), unique=True)
    current_balance: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    total_recharged: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    total_deducted: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0)
    expired_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = _now()
    created_at: Mapped[datetime] = _now()

    client: Mapped["Client"] = relationship(back_populates="prepaid_account")
    transactions: Mapped[list["PrepaidTransaction"]] = relationship(
        back_populates="account", cascade="all, delete-orphan"
    )


class PrepaidTransaction(Base):
    __tablename__ = "prepaid_transactions"

    id: Mapped[UUID] = _uuid_pk()
    account_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("prepaid_accounts.id"), index=True
    )
    type: Mapped[str] = mapped_column(PrepaidTxnType, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    balance_before: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    balance_after: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    related_bill_id: Mapped[Optional[UUID]] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("bills.id"), nullable=True
    )
    operator_id: Mapped[Optional[UUID]] = mapped_column(PgUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    remark: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = _now()

    account: Mapped["PrepaidAccount"] = relationship(back_populates="transactions")
    bill: Mapped[Optional["Bill"]] = relationship(back_populates="prepaid_txns")


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[UUID] = _uuid_pk()
    bill_id: Mapped[Optional[UUID]] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("bills.id", ondelete="CASCADE"), index=True, nullable=True
    )
    invoice_id: Mapped[Optional[UUID]] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), index=True, nullable=True
    )
    txn_id: Mapped[Optional[UUID]] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("bank_transactions.id", ondelete="CASCADE"), index=True, nullable=True
    )
    filename: Mapped[str] = mapped_column(String(200))
    original_name: Mapped[str] = mapped_column(String(300))
    file_size: Mapped[int] = mapped_column(Integer)
    mime_type: Mapped[str] = mapped_column(String(100))
    storage_path: Mapped[str] = mapped_column(String(500))
    uploaded_by: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("users.id"))
    uploaded_at: Mapped[datetime] = _now()

    bill: Mapped[Optional["Bill"]] = relationship(back_populates="attachments")
    invoice: Mapped[Optional["Invoice"]] = relationship(back_populates="attachments")


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[UUID] = _uuid_pk()
    bill_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("bills.id", ondelete="CASCADE"), index=True
    )
    content: Mapped[str] = mapped_column(Text)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    author_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("users.id"))
    mentions: Mapped[list[Any]] = mapped_column(JSONB, default=list, server_default=text("'[]'::jsonb"))
    created_at: Mapped[datetime] = _now()

    bill: Mapped["Bill"] = relationship(back_populates="notes")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[UUID] = _uuid_pk()
    entity_type: Mapped[str] = mapped_column(AuditEntity)
    entity_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True))
    field_name: Mapped[str] = mapped_column(String(100))
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    operator_id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    operator_name: Mapped[str] = mapped_column(String(100))
    operator_ip: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    change_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = _now()

    __table_args__ = (Index("ix_audit_entity", "entity_type", "entity_id"),)


class Anomaly(Base):
    __tablename__ = "anomalies"

    id: Mapped[UUID] = _uuid_pk()
    type: Mapped[str] = mapped_column(AnomalyType, index=True)
    severity: Mapped[str] = mapped_column(AnomalySeverity, index=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    related_entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    related_entity_id: Mapped[Optional[UUID]] = mapped_column(PgUUID(as_uuid=True), nullable=True)
    status: Mapped[str] = mapped_column(AnomalyStatus, default="OPEN", index=True)
    assignee_id: Mapped[Optional[UUID]] = mapped_column(PgUUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = _now()
    updated_at: Mapped[datetime] = _now()


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[UUID] = _uuid_pk()
    bill_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("bills.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[str] = mapped_column(ReminderType, index=True)
    days_before: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    channel: Mapped[str] = mapped_column(ReminderChannel, default="EMAIL")
    status: Mapped[str] = mapped_column(ReminderStatus, default="PENDING", index=True)
    template_vars: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, server_default=text("'{}'::jsonb"))
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = _now()

    bill: Mapped["Bill"] = relationship(back_populates="reminders")


class ExportTask(Base):
    __tablename__ = "export_tasks"

    id: Mapped[UUID] = _uuid_pk()
    type: Mapped[str] = mapped_column(ExportKind, index=True)
    status: Mapped[str] = mapped_column(ExportStatus, default="PENDING", index=True)
    parameters: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, server_default=text("'{}'::jsonb"))
    file_name: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    row_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = _now()
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
