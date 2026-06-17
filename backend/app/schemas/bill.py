from typing import Optional, List
from datetime import date
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema, PageParams


class BillBase(BaseSchema):
    bill_no: str
    lease_id: int
    bill_type: str
    bill_period: Optional[str] = None
    bill_date: date
    due_date: date
    amount: float
    paid_amount: float = 0
    status: str = "pending"
    remark: Optional[str] = None


class BillCreate(BaseModel):
    lease_id: int
    bill_type: str
    bill_period: Optional[str] = None
    bill_date: date
    due_date: date
    amount: float
    remark: Optional[str] = None


class BillUpdate(BaseModel):
    bill_date: Optional[date] = None
    due_date: Optional[date] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    remark: Optional[str] = None


class BillQuery(PageParams):
    keyword: Optional[str] = None
    bill_type: Optional[str] = None
    status: Optional[str] = None
    lease_id: Optional[int] = None
    bill_date_from: Optional[date] = None
    bill_date_to: Optional[date] = None
    due_date_from: Optional[date] = None
    due_date_to: Optional[date] = None


class BillPaymentBase(BaseSchema):
    bill_id: int
    payment_no: str
    amount: float
    payment_date: date
    payment_method: str
    payer: Optional[str] = None
    remark: Optional[str] = None


class BillPaymentCreate(BaseModel):
    bill_id: int
    amount: float
    payment_date: date
    payment_method: str
    payer: Optional[str] = None
    remark: Optional[str] = None


class BillGenerateRequest(BaseModel):
    lease_ids: Optional[List[int]] = None
    bill_type: str = "rent"
    bill_period: str
    bill_date: date
    due_date: date


class CollectionProgressItem(BaseModel):
    period: str
    total_amount: float
    paid_amount: float
    unpaid_amount: float
    collection_rate: float
    bill_count: int
    paid_count: int
    unpaid_count: int


class CollectionProgressResponse(BaseModel):
    items: List[CollectionProgressItem]
    total_amount: float
    total_paid: float
    total_unpaid: float
    overall_rate: float
