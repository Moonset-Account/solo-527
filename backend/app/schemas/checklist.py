from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from ..models import ChecklistStatus, AnswerStatus


class ChecklistItemBase(BaseModel):
    item_order: int = 0
    section: Optional[str] = None
    question: str
    description: Optional[str] = None
    required_evidence: Optional[str] = None
    default_risk_level: Optional[str] = None
    is_required: bool = True


class ChecklistItemCreate(ChecklistItemBase):
    pass


class ChecklistItemResponse(ChecklistItemBase):
    id: int

    class Config:
        from_attributes = True


class ChecklistBase(BaseModel):
    name: str
    description: Optional[str] = None
    contract_version: Optional[str] = None
    category: Optional[str] = None
    is_active: bool = True


class ChecklistCreate(ChecklistBase):
    items: List[ChecklistItemCreate] = []


class ChecklistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contract_version: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    items: Optional[List[ChecklistItemCreate]] = None


class ChecklistResponse(ChecklistBase):
    id: int
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    items: List[ChecklistItemResponse] = []

    class Config:
        from_attributes = True


class ChecklistList(BaseModel):
    total: int
    items: List[ChecklistResponse]


class ChecklistAnswerBase(BaseModel):
    item_id: int
    status: AnswerStatus = AnswerStatus.PENDING
    answer_text: Optional[str] = None
    evidence_url: Optional[str] = None
    evidence_description: Optional[str] = None
    comment: Optional[str] = None


class ChecklistAnswerCreate(ChecklistAnswerBase):
    pass


class ChecklistAnswerUpdate(BaseModel):
    status: Optional[AnswerStatus] = None
    answer_text: Optional[str] = None
    evidence_url: Optional[str] = None
    evidence_description: Optional[str] = None
    comment: Optional[str] = None


class ChecklistAnswerResponse(ChecklistAnswerBase):
    id: int
    submission_id: int
    created_at: Optional[datetime] = None
    item: Optional[ChecklistItemResponse] = None

    class Config:
        from_attributes = True


class SubmissionBase(BaseModel):
    checklist_id: int
    contract_name: str
    contract_version: Optional[str] = None
    counterparty: Optional[str] = None
    contract_amount: Optional[float] = None
    deadline: Optional[date] = None
    risk_level: Optional[str] = None


class SubmissionCreate(SubmissionBase):
    answers: List[ChecklistAnswerCreate] = []


class SubmissionUpdate(BaseModel):
    contract_name: Optional[str] = None
    contract_version: Optional[str] = None
    counterparty: Optional[str] = None
    contract_amount: Optional[float] = None
    deadline: Optional[date] = None
    risk_level: Optional[str] = None
    status: Optional[ChecklistStatus] = None
    review_comment: Optional[str] = None
    overall_score: Optional[float] = None


class SubmissionResponse(SubmissionBase):
    id: int
    submitter_id: int
    status: ChecklistStatus
    overall_score: Optional[float] = None
    review_comment: Optional[str] = None
    submitted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    checklist: Optional[ChecklistResponse] = None
    answers: List[ChecklistAnswerResponse] = []

    class Config:
        from_attributes = True


class SubmissionList(BaseModel):
    total: int
    items: List[SubmissionResponse]


class SubmissionAnswerBatchUpdate(BaseModel):
    answers: List[ChecklistAnswerUpdate]
