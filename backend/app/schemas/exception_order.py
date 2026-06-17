from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema, PageParams


class ExceptionOrderBase(BaseSchema):
    order_no: str
    lease_id: int
    bill_id: Optional[int] = None
    exception_type: str
    title: str
    description: str
    status: str = "pending"
    priority: str = "normal"
    assigned_to: Optional[int] = None
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    disputed_amount: Optional[float] = None


class ExceptionOrderCreate(BaseModel):
    lease_id: int
    bill_id: Optional[int] = None
    exception_type: str
    title: str
    description: str
    priority: str = "normal"
    assigned_to: Optional[int] = None
    disputed_amount: Optional[float] = None


class ExceptionOrderUpdate(BaseModel):
    exception_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None
    disputed_amount: Optional[float] = None


class ExceptionOrderResolve(BaseModel):
    resolution: str


class ExceptionOrderQuery(PageParams):
    keyword: Optional[str] = None
    exception_type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None
    lease_id: Optional[int] = None
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None
