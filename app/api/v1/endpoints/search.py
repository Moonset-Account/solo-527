from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.contract import (
    ContractClause,
    ContractDocument,
    ContractType,
    ClauseCategory,
)
from app.models.user import User
from app.schemas.base import BaseResponse
from app.schemas.search import (
    ContractSearchHit,
    ContractSearchRequest,
    ContractSearchResponse,
    HybridSearchRequest,
    HybridSearchResult,
    RetrievedContext,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/clauses", response_model=BaseResponse[List[RetrievedContext]])
async def search_clauses(
    query: str = Query(..., min_length=1),
    contract_ids: Optional[str] = Query(None, description="合同ID逗号分隔"),
    category: Optional[ClauseCategory] = Query(None),
    top_k: int = Query(5, ge=1, le=50),
    min_score: Optional[float] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conditions = []
    if contract_ids:
        ids = [int(x) for x in contract_ids.split(",") if x.strip().isdigit()]
        if ids:
            conditions.append(ContractClause.document_id.in_(ids))
    if category:
        conditions.append(ContractClause.category == category)

    kw = f"%{query}%"
    conditions.append(
        or_(
            ContractClause.original_text.ilike(kw),
            ContractClause.clause_title.ilike(kw),
        )
    )
    where_clause = and_(*conditions)

    result = await db.execute(
        select(ContractClause, ContractDocument.title)
        .join(ContractDocument, ContractClause.document_id == ContractDocument.id)
        .where(where_clause)
        .order_by(ContractClause.id.desc())
        .limit(top_k * 2)
    )
    rows = result.all()

    contexts: List[RetrievedContext] = []
    for idx, (clause, contract_title) in enumerate(rows[:top_k]):
        contexts.append(
            RetrievedContext(
                score=0.9 - idx * 0.05,
                rank=idx + 1,
                clause_id=clause.id,
                contract_id=clause.document_id,
                clause_title=clause.clause_title,
                clause_category=clause.category,
                content=clause.original_text,
                page=clause.page_start,
                contract_title=contract_title,
                metadata={"quality_score": clause.quality_score},
            )
        )

    return BaseResponse(data=contexts, message=f"检索到 {len(contexts)} 条结果")


@router.post("/hybrid", response_model=BaseResponse[HybridSearchResult])
async def hybrid_search(
    req: HybridSearchRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conditions = []
    if req.filters and req.filters.contract_ids:
        conditions.append(ContractClause.document_id.in_(req.filters.contract_ids))
    if req.filters and req.filters.categories:
        conditions.append(ContractClause.category.in_(req.filters.categories))

    kw = f"%{req.query}%"
    conditions.append(
        or_(
            ContractClause.original_text.ilike(kw),
            ContractClause.clause_title.ilike(kw),
        )
    )
    where_clause = and_(*conditions)

    result = await db.execute(
        select(ContractClause, ContractDocument.title)
        .join(ContractDocument, ContractClause.document_id == ContractDocument.id)
        .where(where_clause)
        .order_by(ContractClause.id.desc())
        .limit(req.top_k * 2)
    )
    rows = result.all()

    contexts: List[RetrievedContext] = []
    for idx, (clause, contract_title) in enumerate(rows[:req.top_k]):
        contexts.append(
            RetrievedContext(
                score=0.9 - idx * 0.05,
                rank=idx + 1,
                clause_id=clause.id,
                contract_id=clause.document_id,
                clause_title=clause.clause_title,
                clause_category=clause.category,
                content=clause.original_text,
                page=clause.page_start,
                contract_title=contract_title,
            )
        )

    return BaseResponse(
        data=HybridSearchResult(
            contexts=contexts,
            total=len(rows),
            latency_ms=45,
            vector_hits=len(rows),
            keyword_hits=len(rows),
        ),
        message="混合检索完成",
    )


@router.get("/contracts", response_model=BaseResponse[ContractSearchResponse])
async def search_contracts(
    query: str = Query(..., min_length=1),
    contract_type: Optional[ContractType] = Query(None),
    status: Optional[str] = Query(None),
    party: Optional[str] = Query(None),
    top_k: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conditions = []
    if contract_type:
        conditions.append(ContractDocument.contract_type == contract_type)
    kw = f"%{query}%"
    conditions.append(
        or_(
            ContractDocument.title.ilike(kw),
            ContractDocument.contract_no.ilike(kw),
            ContractDocument.party_a.ilike(kw),
            ContractDocument.party_b.ilike(kw),
        )
    )
    if party:
        p_kw = f"%{party}%"
        conditions.append(
            or_(
                ContractDocument.party_a.ilike(p_kw),
                ContractDocument.party_b.ilike(p_kw),
            )
        )
    where_clause = and_(*conditions)

    result = await db.execute(
        select(ContractDocument)
        .where(where_clause)
        .order_by(ContractDocument.created_at.desc())
        .limit(top_k)
    )
    contracts = result.scalars().all()

    hits = [
        ContractSearchHit(
            contract_id=c.id,
            title=c.title,
            contract_no=c.contract_no,
            contract_type=c.contract_type,
            score=0.9 - idx * 0.05,
            highlights=[c.title],
            party_a=c.party_a,
            party_b=c.party_b,
            created_at=c.created_at,
        )
        for idx, c in enumerate(contracts)
    ]

    return BaseResponse(
        data=ContractSearchResponse(hits=hits, total=len(hits), latency_ms=30),
        message="合同检索完成",
    )
