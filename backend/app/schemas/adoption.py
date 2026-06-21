from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class AdoptionApplicationBase(BaseModel):
    applicant_name: str = Field(..., max_length=100)
    applicant_phone: str = Field(..., max_length=20)
    applicant_id_card: Optional[str] = Field(None, max_length=50)
    address: str = Field(..., max_length=255)
    housing_type: str = Field(..., max_length=50)
    pet_experience: str = Field(..., max_length=255)
    family_members: int
    has_other_pets: bool = False
    pet_id: int
    apply_reason: str
    status: str = Field(default="pending", max_length=20)
    review_remark: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None


class AdoptionApplicationCreate(BaseModel):
    applicant_name: str = Field(..., max_length=100)
    applicant_phone: str = Field(..., max_length=20)
    applicant_id_card: Optional[str] = Field(None, max_length=50)
    address: str = Field(..., max_length=255)
    housing_type: str = Field(..., max_length=50)
    pet_experience: str = Field(..., max_length=255)
    family_members: int
    has_other_pets: bool = False
    pet_id: int
    apply_reason: str


class AdoptionApplicationUpdate(BaseModel):
    applicant_name: Optional[str] = Field(None, max_length=100)
    applicant_phone: Optional[str] = Field(None, max_length=20)
    applicant_id_card: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    housing_type: Optional[str] = Field(None, max_length=50)
    pet_experience: Optional[str] = Field(None, max_length=255)
    family_members: Optional[int] = None
    has_other_pets: Optional[bool] = None
    pet_id: Optional[int] = None
    apply_reason: Optional[str] = None
    status: Optional[str] = Field(None, max_length=20)
    review_remark: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None


class AdoptionApplicationResponse(AdoptionApplicationBase):
    id: int
    pet_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdoptionApplicationListResponse(BaseModel):
    total: int
    items: List[AdoptionApplicationResponse]


class AdoptionReviewRequest(BaseModel):
    application_id: int
    action: str = Field(..., max_length=20)
    remark: str
