from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from ..models.reagent import HazardLevel, ReagentCategory


class ReagentBase(BaseModel):
    name: str
    english_name: Optional[str] = None
    cas_number: Optional[str] = None
    molecular_formula: Optional[str] = None
    category: Optional[ReagentCategory] = None
    hazard_level: HazardLevel = HazardLevel.NONE
    specification: Optional[str] = None
    manufacturer: Optional[str] = None
    supplier: Optional[str] = None
    unit: str = "瓶"
    min_stock: int = 1
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
    min_stock: Optional[int] = None
    description: Optional[str] = None
    safety_notes: Optional[str] = None
    storage_conditions: Optional[str] = None
    requires_double_confirm: Optional[bool] = None


class Reagent(ReagentBase):
    id: int
    barcode: Optional[str] = None
    total_quantity: float = 0
    created_by: Optional[int] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class ReagentBatchBase(BaseModel):
    batch_number: str
    quantity: float
    remaining_quantity: Optional[float] = None
    unit_price: Optional[float] = None
    production_date: Optional[date] = None
    expiry_date: Optional[date] = None
    storage_cabinet_id: Optional[int] = None
    shelf_position: Optional[str] = None
    remarks: Optional[str] = None


class ReagentBatchCreate(ReagentBatchBase):
    reagent_id: int
    barcode: Optional[str] = None
    attachment_ids: Optional[List[int]] = None


class ReagentBatchUpdate(BaseModel):
    batch_number: Optional[str] = None
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
    reagent_id: int
    barcode: Optional[str] = None
    is_active: bool = True
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


class ReagentWithBatches(Reagent):
    batches: List[ReagentBatch] = []

    class Config:
        from_attributes = True
