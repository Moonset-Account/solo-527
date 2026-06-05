from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from ..models.reagent import HazardLevel, ReagentCategory


class ReagentBase(BaseModel):
    name: str = Field(..., max_length=200)
    english_name: Optional[str] = None
    cas_number: Optional[str] = None
    molecular_formula: Optional[str] = None
    category: ReagentCategory = ReagentCategory.OTHER
    hazard_level: HazardLevel = HazardLevel.NONE
    specification: Optional[str] = None
    manufacturer: Optional[str] = None
    supplier: Optional[str] = None
    unit: str = Field(..., max_length=20)
    min_stock: float = 0
    description: Optional[str] = None
    safety_notes: Optional[str] = None
    storage_conditions: Optional[str] = None
    requires_double_confirm: bool = False


class ReagentCreate(ReagentBase):
    pass


class ReagentUpdate(BaseModel):
    name: Optional[str] = None
    english_name: Optional[str] = None
    cas_number: Optional[str] = None
    molecular_formula: Optional[str] = None
    category: Optional[ReagentCategory] = None
    hazard_level: Optional[HazardLevel] = None
    specification: Optional[str] = None
    manufacturer: Optional[str] = None
    supplier: Optional[str] = None
    unit: Optional[str] = None
    min_stock: Optional[float] = None
    description: Optional[str] = None
    safety_notes: Optional[str] = None
    storage_conditions: Optional[str] = None
    requires_double_confirm: Optional[bool] = None
    is_active: Optional[bool] = None


class Reagent(ReagentBase):
    id: int
    barcode: Optional[str] = None
    qr_code: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


class ReagentBatchBase(BaseModel):
    reagent_id: int
    batch_number: str = Field(..., max_length=100)
    quantity: float
    unit_price: Optional[float] = None
    production_date: Optional[date] = None
    expiry_date: Optional[date] = None
    storage_cabinet_id: Optional[int] = None
    shelf_position: Optional[str] = None
    remarks: Optional[str] = None


class ReagentBatchCreate(ReagentBatchBase):
    pass


class ReagentBatchUpdate(BaseModel):
    quantity: Optional[float] = None
    remaining_quantity: Optional[float] = None
    unit_price: Optional[float] = None
    production_date: Optional[date] = None
    expiry_date: Optional[date] = None
    storage_cabinet_id: Optional[int] = None
    shelf_position: Optional[str] = None
    remarks: Optional[str] = None
    is_active: Optional[bool] = None


class ReagentBatch(ReagentBatchBase):
    id: int
    remaining_quantity: float
    received_date: Optional[date] = None
    received_by: Optional[int] = None
    barcode: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    reagent: Optional[Reagent] = None

    class Config:
        from_attributes = True


class ReagentWithBatches(Reagent):
    batches: List[ReagentBatch] = []

    class Config:
        from_attributes = True
