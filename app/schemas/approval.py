from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ApprovalLevelBase(BaseModel):
    level: int = Field(..., ge=1)
    name: str = Field(..., max_length=100)
    condition: Optional[str] = None
    is_active: bool = True


class ApprovalLevelCreate(ApprovalLevelBase):
    approver_ids: List[int] = []


class ApprovalLevelUpdate(BaseModel):
    name: Optional[str] = None
    condition: Optional[str] = None
    is_active: Optional[bool] = None
    approver_ids: Optional[List[int]] = None


class ApprovalLevelResponse(ApprovalLevelBase):
    id: int
    approvers: List[dict] = []

    class Config:
        from_attributes = True


class ApprovalRecordCreate(BaseModel):
    purchase_id: int
    action: str
    opinion: Optional[str] = None


class ApprovalRecordResponse(BaseModel):
    id: int
    purchase_id: int
    level_id: int
    level_name: Optional[str] = None
    approver_id: int
    approver_name: Optional[str] = None
    action: str
    opinion: Optional[str] = None
    approved_at: datetime

    class Config:
        from_attributes = True
