from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


class PetBase(BaseModel):
    name: str = Field(..., max_length=100)
    species: str = Field(..., max_length=20)
    breed: str = Field(..., max_length=100)
    gender: str = Field(..., max_length=10)
    birthday: Optional[date] = None
    weight: Optional[float] = None
    avatar: Optional[str] = Field(None, max_length=255)
    health_status: Optional[str] = Field(None, max_length=255)
    allergy_info: Optional[str] = None
    customer_id: int


class PetCreate(PetBase):
    pass


class PetUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    species: Optional[str] = Field(None, max_length=20)
    breed: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = Field(None, max_length=10)
    birthday: Optional[date] = None
    weight: Optional[float] = None
    avatar: Optional[str] = Field(None, max_length=255)
    health_status: Optional[str] = Field(None, max_length=255)
    allergy_info: Optional[str] = None
    customer_id: Optional[int] = None


class PetSummary(BaseModel):
    id: int
    name: str
    species: str
    breed: str
    avatar: Optional[str] = None

    class Config:
        from_attributes = True


class PetResponse(PetBase):
    id: int
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True


class PetListResponse(BaseModel):
    total: int
    items: List[PetResponse]


class PetPhotoBase(BaseModel):
    pet_id: int
    order_id: Optional[int] = None
    url: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=255)
    taken_at: Optional[datetime] = None
    uploaded_by: int


class PetPhotoCreate(PetPhotoBase):
    pass


class PetPhotoUpdate(BaseModel):
    description: Optional[str] = Field(None, max_length=255)


class PetPhotoResponse(PetPhotoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HealthRecordBase(BaseModel):
    pet_id: int
    record_type: str = Field(..., max_length=20)
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    record_date: date


class HealthRecordCreate(HealthRecordBase):
    pass


class HealthRecordUpdate(BaseModel):
    record_type: Optional[str] = Field(None, max_length=20)
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    record_date: Optional[date] = None


class HealthRecordResponse(HealthRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
