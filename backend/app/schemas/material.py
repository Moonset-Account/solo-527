from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MaterialBase(BaseModel):
    name: str
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: str
    unit_price: float = 0.0
    stock_quantity: float = 0.0
    description: Optional[str] = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    stock_quantity: Optional[float] = None
    description: Optional[str] = None


class MaterialResponse(MaterialBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MaterialUsageBase(BaseModel):
    material_id: int
    quantity: float
    remarks: Optional[str] = None


class MaterialUsageCreate(MaterialUsageBase):
    cleaning_task_id: Optional[int] = None
    maintenance_order_id: Optional[int] = None


class MaterialUsageResponse(BaseModel):
    id: int
    material_id: int
    material_name: Optional[str] = None
    cleaning_task_id: Optional[int] = None
    maintenance_order_id: Optional[int] = None
    quantity: float
    unit_price: float
    total_cost: float
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AttachmentResponse(BaseModel):
    id: int
    cleaning_task_id: Optional[int] = None
    maintenance_order_id: Optional[int] = None
    uploaded_by: int
    object_name: str
    original_filename: str
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    attachment_type: Optional[str] = None
    purpose: Optional[str] = None
    file_url: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: Optional[str] = None
    notification_type: Optional[str] = None
    related_id: Optional[int] = None
    is_read: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
