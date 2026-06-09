from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.dataset import DatasetSample, SampleStatus
from app.models.user import User
from app.schemas.base import BaseResponse, PageResponse
from app.schemas.review import (
    AssignRequest,
    EscalateRequest,
    ReviewStatsResponse,
    ReviewTaskFilter,
    ReviewerStat,
    StartReviewResponse,
    SubmitReviewRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/review", tags=["Review"])


@router.get("/tasks", response_model=BaseResponse[PageResponse[dict]])
async def list_review_tasks(
    assignee_id: Optional[int] = Query(None),
    status: Optional[SampleStatus] = Query(None),
    dataset_id: Optional[int] = Query(None),
    sample_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assignee = assignee_id or current_user.id
    conditions = [DatasetSample.assignee_id == _assignee]
    if status:
        conditions.append(DatasetSample.status == status)
    if dataset_id:
        conditions.append(DatasetSample.dataset_id == dataset_id)
    if sample_type:
        conditions.append(DatasetSample.sample_type == sample_type)
    where_clause = and_(*conditions)

    total_result = await db.execute(
        select(func.count()).select_from(DatasetSample).where(where_clause)
    )
    total = total_result.scalar_one() or 0

    result = await db.execute(
        select(DatasetSample)
        .where(where_clause)
        .order_by(
            case(
                (DatasetSample.status == SampleStatus.REVIEWING, 0),
                (DatasetSample.status == SampleStatus.PENDING_REVIEW, 1),
                else_=2,
            ),
            DatasetSample.difficulty_level.desc(),
            DatasetSample.created_at.asc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = []
    for s in result.scalars().all():
        items.append(
            {
                "sample_id": s.id,
                "dataset_id": s.dataset_id,
                "sample_type": s.sample_type.value if hasattr(s.sample_type, "value") else str(s.sample_type),
                "status": s.status.value if hasattr(s.status, "value") else str(s.status),
                "difficulty_level": s.difficulty_level,
                "input_preview": s.input_text[:100],
                "assignee_id": s.assignee_id,
                "reviewer_id": s.reviewer_id,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
            }
        )

    return BaseResponse(data=PageResponse.build(items, total, page, page_size))


@router.post("/tasks/assign", response_model=BaseResponse[dict])
async def assign_review_tasks(
    req: AssignRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    samples_result = await db.execute(
        select(DatasetSample).where(DatasetSample.id.in_(req.sample_ids))
    )
    samples = list(samples_result.scalars().all())
    if len(samples) != len(req.sample_ids):
        missing = set(req.sample_ids) - {s.id for s in samples}
        raise HTTPException(status_code=404, detail=f"样本不存在: {missing}")

    assigned_count: Dict[int, int] = {rid: 0 for rid in req.reviewer_ids}
    assigned_samples = 0

    for idx, sample in enumerate(samples):
        if req.strategy == "load_balance":
            rid = min(assigned_count, key=assigned_count.get)
        else:
            rid = req.reviewer_ids[idx % len(req.reviewer_ids)]

        sample.assignee_id = rid
        sample.status = SampleStatus.PENDING_REVIEW
        assigned_count[rid] += 1
        assigned_samples += 1

    await db.commit()
    return BaseResponse(
        data={
            "assigned_samples": assigned_samples,
            "reviewer_ids": req.reviewer_ids,
            "distribution": assigned_count,
        },
        message=f"已分配{assigned_samples}个审核任务",
    )


@router.post("/samples/{sample_id}/start", response_model=BaseResponse[StartReviewResponse])
async def start_review(
    sample_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DatasetSample).where(DatasetSample.id == sample_id)
    )
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(status_code=404, detail="样本不存在")

    if sample.reviewer_id and sample.reviewer_id != current_user.id and sample.status == SampleStatus.REVIEWING:
        raise HTTPException(status_code=409, detail="样本已被其他审核员锁定")

    sample.status = SampleStatus.REVIEWING
    sample.reviewer_id = current_user.id
    sample.reviewed_at = datetime.utcnow()

    await db.commit()
    return BaseResponse(
        data=StartReviewResponse(
            sample_id=sample.id,
            reviewer_id=current_user.id,
            locked=True,
            lock_expires_at=datetime.utcnow() + timedelta(minutes=30),
        ),
        message="已锁定审核权",
    )


@router.post("/samples/{sample_id}/submit", response_model=BaseResponse[dict])
async def submit_review(
    sample_id: int,
    req: SubmitReviewRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DatasetSample).where(DatasetSample.id == sample_id)
    )
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(status_code=404, detail="样本不存在")

    sample.status = req.status
    sample.reviewer_id = current_user.id
    sample.review_comment = req.review_comment
    sample.reviewed_at = datetime.utcnow()

    if req.corrected_input_text:
        sample.input_text = req.corrected_input_text
    if req.corrected_reference_output is not None:
        sample.reference_output = req.corrected_reference_output
    if req.corrected_metadata:
        sample.input_metadata = {**(sample.input_metadata or {}), **req.corrected_metadata}

    if req.status == SampleStatus.APPROVED:
        sample.approved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(sample)
    return BaseResponse(
        data={
            "sample_id": sample.id,
            "status": req.status.value if hasattr(req.status, "value") else str(req.status),
            "reviewer_id": current_user.id,
        },
        message="审核已提交",
    )


@router.post("/samples/{sample_id}/escalate", response_model=BaseResponse[dict])
async def escalate_review(
    sample_id: int,
    req: EscalateRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DatasetSample).where(DatasetSample.id == sample_id)
    )
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(status_code=404, detail="样本不存在")

    sample.status = SampleStatus.PENDING_REVIEW
    if req.escalate_to_id:
        sample.assignee_id = req.escalate_to_id
    sample.review_comment = f"[ESCALATED by {current_user.id}] {req.reason}\npriority={req.priority}"

    await db.commit()
    return BaseResponse(
        data={
            "sample_id": sample.id,
            "escalated_to": req.escalate_to_id,
            "priority": req.priority,
        },
        message="审核已升级",
    )


@router.get("/stats", response_model=BaseResponse[ReviewStatsResponse])
async def get_review_stats(
    days: int = Query(7, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start = datetime.utcnow() - timedelta(days=days)

    total_q = select(func.count()).select_from(DatasetSample).where(
        and_(DatasetSample.assignee_id.isnot(None), DatasetSample.created_at >= start)
    )
    total_r = await db.execute(total_q)
    total = total_r.scalar_one() or 0

    completed_q = select(func.count()).select_from(DatasetSample).where(
        and_(
            DatasetSample.assignee_id.isnot(None),
            DatasetSample.status.in_([SampleStatus.APPROVED, SampleStatus.REJECTED]),
            DatasetSample.reviewed_at >= start,
        )
    )
    completed_r = await db.execute(completed_q)
    completed = completed_r.scalar_one() or 0

    pending_q = select(func.count()).select_from(DatasetSample).where(
        and_(
            DatasetSample.assignee_id.isnot(None),
            DatasetSample.status.in_([SampleStatus.PENDING_REVIEW, SampleStatus.REVIEWING]),
        )
    )
    pending_r = await db.execute(pending_q)
    pending = pending_r.scalar_one() or 0

    approved_q = select(func.count()).select_from(DatasetSample).where(
        and_(
            DatasetSample.status == SampleStatus.APPROVED,
            DatasetSample.reviewed_at >= start,
        )
    )
    approved_r = await db.execute(approved_q)
    approved = approved_r.scalar_one() or 0

    approval_rate = approved / completed if completed > 0 else 0.0

    reviewer_stats: List[ReviewerStat] = []
    return BaseResponse(
        data=ReviewStatsResponse(
            total_tasks=total,
            completed_tasks=completed,
            pending_tasks=pending,
            overall_approval_rate=approval_rate,
            reviewer_stats=reviewer_stats,
        ),
        message="统计完成",
    )
