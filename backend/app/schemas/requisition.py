from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from ..models.requisition import RequisitionStatus


class RequisitionItemBase(BaseModel):
    reagent_batch_id: int
    quantity: float
    purpose: Optional[str] = None
    remarks: Optional[str] = None


class RequisitionItemCreate(RequisitionItemBase):
    pass


class RequisitionItem(RequisitionItemBase):
    id: int
    returned_quantity: float = 0
    created_at: datetime

    class Config:
        from_attributes = True


class RequisitionBase(BaseModel):
    title: str = Field(..., max_length=200)
    purpose: Optional[str] = None
    priority: str = "normal"
    expected_return_date: Optional[date] = None
    remarks: Optional[str] = None


class RequisitionCreate(RequisitionBase):
    items: List[RequisitionItemCreate]


class RequisitionUpdate(BaseModel):
    title: Optional[str] = None
    purpose: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[RequisitionStatus] = None
    expected_return_date: Optional[date] = None
    remarks: Optional[str] = None
    rejection_reason: Optional[str] = None
    items: Optional[List[RequisitionItemCreate]] = None


class Requisition(RequisitionBase):
    id: int
    requisition_number: str
    applicant_id: int
    status: RequisitionStatus
    requires_double_confirm: bool = False
    first_confirmer_id: Optional[int] = None
    first_confirmed_at: Optional[datetime] = None
    second_confirmer_id: Optional[int] = None
    second_confirmed_at: Optional[datetime] = None
    approver_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    picked_up_by: Optional[int] = None
    picked_up_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[RequisitionItem] = []

    class Config:
        from_attributes = True


class RequisitionConfirm(BaseModel):
    confirm: bool
    remarks: Optional[str] = None


class RequisitionApprove(BaseModel):
    approve: bool
    rejection_reason: Optional[str] = None
