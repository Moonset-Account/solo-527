from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema, PageParams


class LeaseBase(BaseSchema):
    lease_no: str
    property_id: int
    tenant_id: int
    lease_type: str
    start_date: date
    end_date: date
    rent_amount: float
    deposit_amount: float
    payment_cycle: str = "monthly"
    payment_day: int = 1
    status: str = "pending"
    consultant_id: Optional[int] = None
    sign_date: Optional[date] = None
    remark: Optional[str] = None


class LeaseCreate(BaseModel):
    property_id: int
    tenant_id: int
    lease_type: str
    start_date: date
    end_date: date
    rent_amount: float
    deposit_amount: float
    payment_cycle: str = "monthly"
    payment_day: int = 1
    consultant_id: Optional[int] = None
    sign_date: Optional[date] = None
    remark: Optional[str] = None


class LeaseUpdate(BaseModel):
    property_id: Optional[int] = None
    tenant_id: Optional[int] = None
    lease_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    rent_amount: Optional[float] = None
    deposit_amount: Optional[float] = None
    payment_cycle: Optional[str] = None
    payment_day: Optional[int] = None
    status: Optional[str] = None
    consultant_id: Optional[int] = None
    sign_date: Optional[date] = None
    remark: Optional[str] = None


class LeaseQuery(PageParams):
    keyword: Optional[str] = None
    lease_type: Optional[str] = None
    status: Optional[str] = None
    consultant_id: Optional[int] = None
    start_date_from: Optional[date] = None
    start_date_to: Optional[date] = None
    end_date_from: Optional[date] = None
    end_date_to: Optional[date] = None


class FollowUpRecordBase(BaseSchema):
    lease_id: int
    user_id: int
    follow_type: str
    content: str
    next_follow_date: Optional[date] = None


class FollowUpRecordCreate(BaseModel):
    lease_id: int
    follow_type: str
    content: str
    next_follow_date: Optional[date] = None


class FollowUpRecordUpdate(BaseModel):
    follow_type: Optional[str] = None
    content: Optional[str] = None
    next_follow_date: Optional[date] = None


class FollowUpRecordQuery(PageParams):
    lease_id: Optional[int] = None
    user_id: Optional[int] = None
    follow_type: Optional[str] = None
