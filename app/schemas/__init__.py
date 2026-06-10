from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Generic, List, Literal, Optional, TypeVar, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

P = TypeVar("P")
T = TypeVar("T")

BillStatus = Literal["DRAFT", "ISSUED", "PARTIAL", "PAID", "OVERDUE", "VOID"]
InvoiceStatus = Literal["PENDING", "APPROVED", "ISSUING", "ISSUED", "MAILED", "ERROR"]
InvoiceType = Literal["VAT_SPECIAL", "VAT_NORMAL", "ELECTRONIC"]
TxnMatchStatus = Literal["UNMATCHED", "PARTIAL", "MATCHED", "ANOMALY"]
MatchType = Literal["AUTO", "MANUAL", "PREPAID"]
PrepaidTxnType = Literal["RECHARGE", "DEDUCT", "REFUND", "ADJUST"]
AnomalyType = Literal["TXN_UNMATCHED", "INVOICE_ERROR", "AMOUNT_DIFF", "OVERDUE_LIMIT", "FORECAST_WARN"]
AnomalySeverity = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
AnomalyStatus = Literal["OPEN", "PROCESSING", "RESOLVED", "IGNORED"]
UserRole = Literal["ADMIN", "CLIENT"]
ExportType = Literal["CASHFLOW", "INVOICE_ERRORS", "CHANGE_LOG", "BILL_DETAIL", "RECONCILIATION"]
ExportStatus = Literal["PENDING", "PROCESSING", "COMPLETED", "FAILED"]
AuditEntity = Literal["BILL", "INVOICE", "TXN", "CLIENT", "PREPAID"]
ForecastImpact = Literal["INCREASE", "DECREASE", "NONE"]


def format_currency(v: Any) -> str:
    try:
        d = Decimal(str(v))
        return f"¥{d:,.2f}"
    except Exception:
        return str(v)


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True, populate_by_name=True)


class PaginationIn(BaseSchema):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=200)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class PaginatedOut(BaseSchema, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageOut(BaseSchema):
    message: str
    code: int = 0


# ============= 用户相关 =============
class UserLoginIn(BaseSchema):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserRegisterIn(BaseSchema):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1, max_length=100)
    company_name: Optional[str] = None


class UserOut(BaseSchema):
    id: UUID
    email: str
    name: str
    role: UserRole
    client_id: Optional[UUID] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime


class SessionUser(BaseSchema):
    id: UUID
    email: str
    name: str
    role: UserRole
    client_id: Optional[UUID] = None


# ============= 客户相关 =============
class ClientOut(BaseSchema):
    id: UUID
    name: str
    tax_id: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    prepaid_balance: Decimal
    credit_limit: Decimal
    created_at: datetime


# ============= 订单 =============
class OrderOut(BaseSchema):
    id: UUID
    order_no: str
    client_id: UUID
    product_name: str
    amount: Decimal
    start_date: date
    end_date: date
    status: str


# ============= 账单相关 =============
class BillPriorityTags(BaseSchema):
    invoice_status: Optional[InvoiceStatus] = None
    invoice_requested: bool = False
    prepaid_sufficient: bool = True
    prepaid_balance: Optional[Decimal] = None
    forecast_impact: ForecastImpact = "NONE"
    forecast_score: Decimal = Decimal("0")


class BillOut(BaseSchema):
    id: UUID
    bill_no: str
    client_id: UUID
    client_name: str = ""
    order_id: Optional[UUID] = None
    period_start: date
    period_end: date
    issue_date: date
    due_date: date
    total_amount: Decimal
    paid_amount: Decimal
    remaining_amount: Decimal
    status: BillStatus
    days_overdue: int
    created_at: datetime
    priority: BillPriorityTags = BillPriorityTags()

    @property
    def is_overdue(self) -> bool:
        return self.status == "OVERDUE" or self.days_overdue > 0

    @property
    def due_date_class(self) -> str:
        if self.days_overdue > 30:
            return "text-red-700 font-bold"
        if self.days_overdue > 0:
            return "text-red-600 font-semibold"
        delta = (self.due_date - date.today()).days
        if delta <= 3:
            return "text-red-500"
        if delta <= 7:
            return "text-amber-600"
        return "text-emerald-700"


class BillListFilter(BaseSchema):
    keyword: Optional[str] = None
    status: Optional[List[BillStatus]] = None
    client_id: Optional[UUID] = None
    invoice_status: Optional[List[InvoiceStatus]] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    due_from: Optional[date] = None
    due_to: Optional[date] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    only_overdue: bool = False
    invoice_requested: Optional[bool] = None
    sort_by: Literal["due_date", "amount", "status", "priority", "created"] = "due_date"
    sort_desc: bool = True


class BillCreateIn(BaseSchema):
    client_id: UUID
    order_id: Optional[UUID] = None
    period_start: date
    period_end: date
    issue_date: date
    due_date: date
    total_amount: Decimal = Field(..., gt=0)


class BillUpdateIn(BaseSchema):
    status: Optional[BillStatus] = None
    due_date: Optional[date] = None
    total_amount: Optional[Decimal] = Field(default=None, gt=0)
    change_reason: Optional[str] = None


# ============= 银行流水 =============
class TransactionOut(BaseSchema):
    id: UUID
    txn_no: str
    txn_date: date
    amount: Decimal
    direction: Literal["IN", "OUT"]
    counterparty: Optional[str] = None
    summary: Optional[str] = None
    match_status: TxnMatchStatus
    matched_amount: Decimal
    confidence_score: Optional[float] = None
    import_batch: Optional[str] = None
    imported_at: datetime


class TransactionImportResult(BaseSchema):
    batch: str
    total: int
    success: int
    skipped: int
    auto_matched: int


# ============= 发票 =============
class InvoiceError(BaseSchema):
    field: str
    error_code: str
    message: str
    severity: Literal["WARNING", "ERROR"]


class InvoiceOut(BaseSchema):
    id: UUID
    invoice_no: Optional[str] = None
    bill_id: UUID
    client_id: UUID
    title: str
    tax_id: str
    address: Optional[str] = None
    phone: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    amount: Decimal
    type: InvoiceType
    status: InvoiceStatus
    validation_errors: List[InvoiceError] = []
    applied_at: datetime
    issued_at: Optional[datetime] = None
    mailed_at: Optional[datetime] = None


class InvoiceCreateIn(BaseSchema):
    bill_id: UUID
    title: str
    tax_id: str
    address: Optional[str] = None
    phone: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    amount: Decimal = Field(..., gt=0)
    type: InvoiceType = "VAT_NORMAL"


class InvoiceUpdateIn(BaseSchema):
    status: Optional[InvoiceStatus] = None
    invoice_no: Optional[str] = None
    tracking_no: Optional[str] = None


# ============= 预存账户 =============
class PrepaidAccountOut(BaseSchema):
    id: UUID
    client_id: UUID
    client_name: str = ""
    current_balance: Decimal
    total_recharged: Decimal
    total_deducted: Decimal
    updated_at: datetime


class PrepaidTxnOut(BaseSchema):
    id: UUID
    account_id: UUID
    type: PrepaidTxnType
    amount: Decimal
    balance_before: Decimal
    balance_after: Decimal
    related_bill_id: Optional[UUID] = None
    remark: Optional[str] = None
    created_at: datetime


# ============= 附件 / 备注 / 审计 =============
class AttachmentOut(BaseSchema):
    id: UUID
    filename: str
    original_name: str
    file_size: int
    mime_type: str
    uploaded_by_name: str = ""
    uploaded_at: datetime


class NoteOut(BaseSchema):
    id: UUID
    bill_id: UUID
    content: str
    is_internal: bool
    author_id: UUID
    author_name: str
    created_at: datetime


class NoteCreateIn(BaseSchema):
    content: str = Field(..., min_length=1)
    is_internal: bool = True


class AuditLogOut(BaseSchema):
    id: UUID
    entity_type: AuditEntity
    entity_id: UUID
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    operator_id: UUID
    operator_name: str
    operator_ip: Optional[str] = None
    change_reason: Optional[str] = None
    created_at: datetime


# ============= 异常 =============
class AnomalyOut(BaseSchema):
    id: UUID
    type: AnomalyType
    severity: AnomalySeverity
    title: str
    description: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None
    status: AnomalyStatus
    assignee_id: Optional[UUID] = None
    created_at: datetime


class AnomalyResolveIn(BaseSchema):
    status: AnomalyStatus
    resolved_note: Optional[str] = None
    assignee_id: Optional[UUID] = None


# ============= 导出 =============
class ExportTaskOut(BaseSchema):
    id: UUID
    type: ExportType
    status: ExportStatus
    parameters: dict[str, Any] = {}
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    row_count: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    expires_at: datetime


class ExportCreateIn(BaseSchema):
    type: ExportType
    parameters: dict[str, Any] = {}


# ============= 看板 / 工作台 =============
class TodayTasks(BaseSchema):
    today_bills_count: int = 0
    today_due_amount: Decimal = Decimal("0")
    unmatched_txns_count: int = 0
    unmatched_txns_amount: Decimal = Decimal("0")
    pending_invoices_count: int = 0
    pending_invoices_amount: Decimal = Decimal("0")
    open_anomalies_count: int = 0


class KPIData(BaseSchema):
    total_outstanding: Decimal = Decimal("0")
    total_outstanding_change_pct: float = 0.0
    collected_this_month: Decimal = Decimal("0")
    collected_change_pct: float = 0.0
    collection_rate: float = 0.0
    overdue_rate: float = 0.0
    total_anomalies: int = 0


class AgingBucket(BaseSchema):
    count: int = 0
    amount: Decimal = Decimal("0")


class TrendPoint(BaseSchema):
    month: str
    billed: Decimal
    collected: Decimal
    rate: float


class ForecastItem(BaseSchema):
    total_expected: Decimal = Decimal("0")
    bills_count: int = 0
    overdue_expected: Decimal = Decimal("0")
    prepaid_offset: Decimal = Decimal("0")


class TopClientItem(BaseSchema):
    client_name: str
    amount: Decimal


class TopAnomalyItem(BaseSchema):
    type: str
    severity: Optional[str] = None
    entity_no: Optional[str] = None
    amount: Optional[Decimal] = None
    description: str = ""
    created_at: Optional[str] = None


class DashboardStats(BaseSchema):
    _today: str = ""
    tasks: TodayTasks
    kpi: KPIData
    aging_buckets: dict[str, AgingBucket]
    monthly_trend: list[TrendPoint]
    anomaly_counts: dict[str, int]
    top_anomalies: list[TopAnomalyItem]
    top_clients_collected: list[TopClientItem]
    forecast_30: ForecastItem
    forecast_60: ForecastItem
    forecast_90: ForecastItem


# ============= 客户端 =============
class ClientBillCard(BaseSchema):
    id: UUID
    bill_no: str
    period_start: date
    period_end: date
    issue_date: date
    due_date: date
    total_amount: Decimal
    paid_amount: Decimal
    remaining_amount: Decimal
    status: BillStatus
    days_overdue: int
    invoice_requested: bool
    invoice_status: Optional[InvoiceStatus] = None
    prepaid_sufficient: bool

    @property
    def subscription_period(self) -> str:
        return f"{self.period_start.isoformat()} 至 {self.period_end.isoformat()}"


class ClientPayPreview(BaseSchema):
    bill_id: UUID
    bill_no: str
    remaining_amount: Decimal
    use_prepaid: bool = False
    prepaid_deduct: Decimal = Decimal("0")
    actual_pay: Decimal = Decimal("0")
    prepaid_balance: Decimal = Decimal("0")
