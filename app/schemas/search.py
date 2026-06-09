from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field

from app.schemas.base import BaseSchema
from app.models.contract import ClauseCategory, ContractType


class RetrievedContext(BaseSchema):
    score: float
    rank: int
    clause_id: Optional[int] = None
    contract_id: Optional[int] = None
    clause_title: Optional[str] = None
    clause_category: Optional[ClauseCategory] = None
    content: str
    page: Optional[int] = None
    contract_title: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ClauseSearchRequest(BaseSchema):
    query: str = Field(..., min_length=1, description="检索查询")
    contract_ids: Optional[List[int]] = Field(None, description="限定合同ID范围")
    category: Optional[ClauseCategory] = Field(None, description="条款类别过滤")
    top_k: int = Field(5, ge=1, le=50, description="返回top_k结果")
    min_score: Optional[float] = Field(None, description="最小相似度阈值")


class HybridSearchFilter(BaseSchema):
    contract_ids: Optional[List[int]] = None
    categories: Optional[List[ClauseCategory]] = None
    contract_types: Optional[List[ContractType]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    risk_levels: Optional[List[str]] = None
    metadata_filter: Optional[Dict[str, Any]] = None


class HybridSearchRequest(BaseSchema):
    query: str = Field(..., min_length=1, description="查询")
    filters: Optional[HybridSearchFilter] = None
    top_k: int = Field(10, ge=1, le=100)
    vector_weight: float = Field(0.7, ge=0.0, le=1.0, description="向量检索权重")
    keyword_weight: float = Field(0.3, ge=0.0, le=1.0, description="关键词权重")
    enable_rerank: bool = Field(True, description="是否启用重排")
    rerank_top_k: int = Field(5, ge=1, le=50)


class HybridSearchResult(BaseSchema):
    contexts: List[RetrievedContext] = Field(default_factory=list)
    total: int = 0
    query_expanded: Optional[str] = None
    latency_ms: int = 0
    vector_hits: int = 0
    keyword_hits: int = 0


class ContractSearchRequest(BaseSchema):
    query: str = Field(..., min_length=1, description="查询")
    contract_type: Optional[ContractType] = None
    status: Optional[str] = None
    party: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    top_k: int = Field(20, ge=1, le=100)


class ContractSearchHit(BaseSchema):
    contract_id: int
    title: str
    contract_no: Optional[str] = None
    contract_type: Optional[ContractType] = None
    score: float
    highlights: List[str] = Field(default_factory=list)
    party_a: Optional[str] = None
    party_b: Optional[str] = None
    created_at: Optional[datetime] = None


class ContractSearchResponse(BaseSchema):
    hits: List[ContractSearchHit] = Field(default_factory=list)
    total: int = 0
    latency_ms: int = 0
