from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal

class TransferOrderBase(BaseModel):
    order_no: str
    batch_no: Optional[str] = None
    transfer_date: Optional[date] = None
    from_warehouse: Optional[str] = None
    to_warehouse: Optional[str] = None
    amount: Optional[Decimal] = None
    carrier: Optional[str] = None

class TransferOrderCreate(TransferOrderBase):
    pass

class TransferOrder(TransferOrderBase):
    id: str
    status: str
    created_by: str
    created_at: datetime
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_comment: Optional[str] = None
    
    class Config:
        from_attributes = True

class AttachmentBase(BaseModel):
    transfer_order_id: str
    type: str
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    is_supplement: bool = False

class AttachmentCreate(AttachmentBase):
    uploaded_by: str

class Attachment(AttachmentBase):
    id: str
    uploaded_by: str
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class AuditLogBase(BaseModel):
    transfer_order_id: Optional[str] = None
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    operator: str
    remark: Optional[str] = None
    filter_snapshot: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLog(AuditLogBase):
    id: str
    operated_at: datetime
    
    class Config:
        from_attributes = True

class User(BaseModel):
    id: str
    username: str
    role: str
    full_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class TransferOrderWithDetail(TransferOrder):
    attachments: List[Attachment] = []
    supplement_records: List[dict] = []

class ReviewAction(BaseModel):
    comment: Optional[str] = None

class FilterParams(BaseModel):
    status: Optional[str] = None
    batch_no: Optional[str] = None
    from_warehouse: Optional[str] = None
    to_warehouse: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    keyword: Optional[str] = None
