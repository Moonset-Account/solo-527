from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MaterialCategoryBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class MaterialCategoryCreate(MaterialCategoryBase):
    pass


class MaterialCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class MaterialCategoryInDB(MaterialCategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MaterialBase(BaseModel):
    name: str
    code: str
    specification: str
    unit: str
    category_id: Optional[int] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    description: Optional[str] = None
    min_stock: Optional[float] = 0


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    specification: Optional[str] = None
    unit: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    description: Optional[str] = None
    min_stock: Optional[float] = None
    is_active: Optional[bool] = None


class MaterialInDB(MaterialBase):
    id: int
    is_active: bool
    created_by: Optional[int] = None
    category: Optional[MaterialCategoryInDB] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MonthlyUsageBase(BaseModel):
    material_id: int
    year: int
    month: int
    quantity: float
    department: Optional[str] = None
    remarks: Optional[str] = None


class MonthlyUsageCreate(MonthlyUsageBase):
    pass


class MonthlyUsageUpdate(BaseModel):
    quantity: Optional[float] = None
    remarks: Optional[str] = None


class MonthlyUsageInDB(MonthlyUsageBase):
    id: int
    recorded_by: Optional[int] = None
    material: Optional[MaterialInDB] = None
    created_at: datetime

    class Config:
        from_attributes = True
