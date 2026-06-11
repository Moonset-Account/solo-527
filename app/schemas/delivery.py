from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


class DeliveryRecordBase(BaseModel):
    purchase_id: int
    delivered_quantity: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    delivery_date: date
    invoice_status_code: Optional[str] = None
    remark: Optional[str] = None


class DeliveryRecordCreate(DeliveryRecordBase):
    pass


class DeliveryRecordUpdate(BaseModel):
    delivered_quantity: Optional[Decimal] = None
    delivery_date: Optional[date] = None
    invoice_status_code: Optional[str] = None
    remark: Optional[str] = None


class DeliveryRecordResponse(DeliveryRecordBase):
    id: int
    purchase_request_no: Optional[str] = None
    material_name: Optional[str] = None
    expected_quantity: Optional[Decimal] = None
    quantity_diff: Optional[Decimal] = None
    created_at: datetime
    diffs: List[dict] = []

    class Config:
        from_attributes = True


class DeliveryDiffResponse(BaseModel):
    id: int
    delivery_id: int
    diff_type: str
    diff_value: Decimal
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DeliveryStats(BaseModel):
    total_deliveries: int
    on_time_count: int
    delayed_count: int
    total_quantity: Decimal
    total_expected: Decimal
    diff_percent: Decimal
