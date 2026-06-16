from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from ..models.purchase import PurchaseRequestStatus, PurchaseOrderStatus


class PurchaseOrderItemBase(BaseModel):
    material_id: int
    quantity: float
    unit_price: float
    quote_id: Optional[int] = None
    remarks: Optional[str] = None


class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass


class PurchaseOrderItemInDB(PurchaseOrderItemBase):
    id: int
    subtotal: float
    tax_rate: float
    tax_amount: float
    total: float
    delivered_qty: float
    created_at: datetime

    class Config:
        from_attributes = True


class PurchaseRequestBase(BaseModel):
    title: str
    department: Optional[str] = None
    project_name: Optional[str] = None
    project_owner_id: Optional[int] = None
    expected_date: Optional[date] = None
    urgency: Optional[str] = "normal"
    remarks: Optional[str] = None
    items: List[PurchaseOrderItemCreate]


class PurchaseRequestCreate(PurchaseRequestBase):
    pass


class PurchaseRequestUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    project_name: Optional[str] = None
    project_owner_id: Optional[int] = None
    expected_date: Optional[date] = None
    urgency: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[PurchaseRequestStatus] = None
    selected_quote_id: Optional[int] = None
    agreement_id: Optional[int] = None


class PurchaseRequestInDB(BaseModel):
    id: int
    pr_no: str
    title: str
    department: Optional[str] = None
    project_name: Optional[str] = None
    project_owner_id: Optional[int] = None
    expected_date: Optional[date] = None
    urgency: str
    total_estimated_amount: float
    status: PurchaseRequestStatus
    remarks: Optional[str] = None
    selected_quote_id: Optional[int] = None
    agreement_id: Optional[int] = None
    created_by: Optional[int] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    items: List[PurchaseOrderItemInDB] = []

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    pr_id: int
    supplier_id: int
    delivery_address: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    payment_terms: Optional[str] = None
    remarks: Optional[str] = None
    items: List[PurchaseOrderItemCreate]


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderUpdate(BaseModel):
    delivery_address: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    payment_terms: Optional[str] = None
    status: Optional[PurchaseOrderStatus] = None
    remarks: Optional[str] = None


class PurchaseOrderInDB(BaseModel):
    id: int
    po_no: str
    pr_id: int
    supplier_id: int
    total_amount: float
    tax_amount: float
    grand_total: float
    delivery_address: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    delivery_days_actual: Optional[int] = None
    payment_terms: Optional[str] = None
    status: PurchaseOrderStatus
    remarks: Optional[str] = None
    created_by: Optional[int] = None
    sent_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    items: List[PurchaseOrderItemInDB] = []

    class Config:
        from_attributes = True
