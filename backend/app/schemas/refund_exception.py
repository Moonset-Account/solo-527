from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.refund_exception import RefundExceptionStatus


class RefundExceptionBase(BaseModel):
    registration_id: int
    exception_type: Optional[str] = None
    description: Optional[str] = None
    refund_amount: int = 0


class RefundExceptionCreate(RefundExceptionBase):
    pass


class RefundExceptionUpdate(BaseModel):
    status: Optional[RefundExceptionStatus] = None
    description: Optional[str] = None
    refund_amount: Optional[int] = None
    actual_refund_amount: Optional[int] = None
    handle_result: Optional[str] = None


class RefundExceptionResponse(RefundExceptionBase):
    id: int
    status: RefundExceptionStatus
    actual_refund_amount: int = 0
    handled_by: Optional[str] = None
    handle_result: Optional[str] = None
    auto_generated: bool = False
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RefundExceptionListResponse(BaseModel):
    total: int
    items: List[RefundExceptionResponse]
