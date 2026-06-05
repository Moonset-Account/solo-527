from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..models.inventory import InventoryCheckStatus


class InventoryCheckItemBase(BaseModel):
    reagent_batch_id: int
    actual_quantity: Optional[float] = None
    remarks: Optional[str] = None
    photo_url: Optional[str] = None


class InventoryCheckItem(InventoryCheckItemBase):
    id: int
    expected_quantity: float
    difference: Optional[float] = None
    is_matched: bool = True
    checked_by: Optional[int] = None
    checked_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryCheckBase(BaseModel):
    title: str = Field(..., max_length=200)
    type: str = "full"
    remarks: Optional[str] = None


class InventoryCheckCreate(InventoryCheckBase):
    batch_ids: Optional[List[int]] = None


class InventoryCheckUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    status: Optional[InventoryCheckStatus] = None
    remarks: Optional[str] = None


class InventoryCheckItemUpdate(BaseModel):
    actual_quantity: float
    remarks: Optional[str] = None
    photo_url: Optional[str] = None


class InventoryCheck(InventoryCheckBase):
    id: int
    check_number: str
    status: InventoryCheckStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by: int
    checked_by: Optional[int] = None
    discrepancies_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[InventoryCheckItem] = []

    class Config:
        from_attributes = True
