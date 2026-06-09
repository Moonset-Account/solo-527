from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema
from app.models.contract import (
    ContractType,
    ContractStatus,
    ClauseCategory,
    RiskLevel,
    RiskType,
)


class ContractBase(BaseSchema):
    title: str = Field(..., max_length=512, description="合同标题")
    contract_no: Optional[str] = Field(None, max_length=128, description="合同编号")
    contract_type: Optional[ContractType] = Field(None, description="合同类型")


class ContractCreate(ContractBase):
    file_name: str = Field(..., max_length=512)
    file_path: str = Field(..., max_length=1024)
    file_size: Optional[int] = Field(0)
    mime_type: Optional[str] = Field(None, max_length=64)


class ContractUpdate(BaseSchema):
    title: Optional[str] = Field(None, max_length=512)
    contract_no: Optional[str] = Field(None, max_length=128)
    contract_type: Optional[ContractType] = None
    status: Optional[ContractStatus] = None
    party_a: Optional[str] = None
    party_b: Optional[str] = None
    sign_date: Optional[datetime] = None
    effective_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None


class ContractInfo(BaseSchema):
    id: int
    title: str
    contract_no: Optional[str] = None
    contract_type: Optional[ContractType] = None
    status: ContractStatus

    file_name: Optional[str] = None
    file_size: int = 0
    mime_type: Optional[str] = None

    party_a: Optional[str] = None
    party_b: Optional[str] = None
    sign_date: Optional[datetime] = None
    effective_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    total_amount: Optional[float] = None
    currency: str = "CNY"

    page_count: int = 0
    word_count: int = 0
    clause_count: int = 0

    model_version: Optional[str] = None
    uploader_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    analyzed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class ContractDetail(ContractInfo):
    raw_metadata: Optional[Dict[str, Any]] = None


class ContractListFilter(BaseSchema):
    contract_type: Optional[ContractType] = None
    status: Optional[ContractStatus] = None
    keyword: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class UploadResponse(BaseSchema):
    task_id: int
    contract_id: int


class ClauseInfo(BaseSchema):
    id: int
    document_id: int
    clause_index: int
    clause_title: Optional[str] = None
    clause_number: Optional[str] = None
    category: ClauseCategory

    original_text: str
    cleaned_text: Optional[str] = None
    translated_text: Optional[str] = None

    page_start: int = 1
    page_end: int = 1
    position_hint: Optional[str] = None

    is_complete: bool = True
    quality_score: float = 1.0
    ai_category_confidence: Optional[float] = None

    created_at: datetime


class ClauseListFilter(BaseSchema):
    category: Optional[ClauseCategory] = None
    keyword: Optional[str] = None


class SummaryInfo(BaseSchema):
    id: int
    document_id: int
    summary_type: str = "full"
    summary_text: str
    key_points: Optional[List[str]] = None
    key_parties: Optional[Dict[str, Any]] = None
    key_dates: Optional[Dict[str, Any]] = None
    key_amounts: Optional[Dict[str, Any]] = None
    key_obligations: Optional[List[str]] = None

    model_version: Optional[str] = None
    quality_score: Optional[float] = None

    human_revised: bool = False
    revised_text: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    created_at: datetime


class SummaryGenerateRequest(BaseSchema):
    summary_type: str = "full"
    force: bool = False


class RiskInfo(BaseSchema):
    id: int
    document_id: int
    clause_id: Optional[int] = None

    risk_type: RiskType
    risk_level: RiskLevel
    risk_score: float

    title: str
    description: str
    suggestion: Optional[str] = None

    source_paragraph: str
    source_clause_ref: Optional[str] = None
    source_page: Optional[int] = None

    detection_method: str = "rule_llm_hybrid"
    confidence: float = 1.0

    status: str = "pending"
    false_positive: bool = False

    created_at: datetime


class RiskListFilter(BaseSchema):
    risk_level: Optional[RiskLevel] = None
    risk_type: Optional[RiskType] = None


class RiskDetectRequest(BaseSchema):
    force: bool = False
    detection_methods: Optional[List[str]] = None


class CompareRequest(BaseSchema):
    other_contract_id: int = Field(..., description="对比的另一合同ID")
    aspects: Optional[List[str]] = Field(None, description="对比维度: parties,dates,amounts,clauses,risks")


class DiffItem(BaseSchema):
    field: str
    left_value: Optional[Any] = None
    right_value: Optional[Any] = None
    diff_type: str = Field("changed", description="added/removed/changed/unchanged")
    similarity: Optional[float] = None


class DiffResult(BaseSchema):
    contract_a_id: int
    contract_b_id: int
    summary_changes: List[DiffItem] = Field(default_factory=list)
    clause_diffs: List[DiffItem] = Field(default_factory=list)
    risk_diffs: List[DiffItem] = Field(default_factory=list)
    overall_similarity: float = 0.0


class ReanalyzeRequest(BaseSchema):
    steps: Optional[List[str]] = Field(None, description="parse,summary,risks,默认全部")
    force: bool = True
