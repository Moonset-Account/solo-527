from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


class OrderBase(BaseModel):
    order_no: str = Field(..., max_length=50)
    pet_id: int
    customer_id: int
    service_type: str = Field(..., max_length=100)
    package_id: Optional[int] = None
    appointment_time: datetime
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    status: str = Field(default="pending", max_length=20)
    amount: Decimal
    remark: Optional[str] = None


class OrderCreate(BaseModel):
    pet_id: int
    customer_id: int
    service_type: str = Field(..., max_length=100)
    package_id: Optional[int] = None
    appointment_time: datetime
    amount: Decimal
    remark: Optional[str] = None


class OrderUpdate(BaseModel):
    pet_id: Optional[int] = None
    customer_id: Optional[int] = None
    service_type: Optional[str] = Field(None, max_length=100)
    package_id: Optional[int] = None
    appointment_time: Optional[datetime] = None
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    status: Optional[str] = Field(None, max_length=20)
    amount: Optional[Decimal] = None
    remark: Optional[str] = None


class OrderResponse(OrderBase):
    id: int
    pet_name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    package_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    total: int
    items: List[OrderResponse]


class AfterSaleBase(BaseModel):
    order_id: int
    problem_type: str = Field(..., max_length=100)
    description: str
    solution: str
    refund_amount: Optional[Decimal] = None
    handled_by: int


class AfterSaleCreate(BaseModel):
    order_id: int
    problem_type: str = Field(..., max_length=100)
    description: str
    solution: str
    refund_amount: Optional[Decimal] = None


class AfterSaleUpdate(BaseModel):
    problem_type: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    solution: Optional[str] = None
    refund_amount: Optional[Decimal] = None


class AfterSaleResponse(AfterSaleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
