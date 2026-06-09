from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.dataset import DatasetSample, ErrorSample, SampleStatus
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


@router.get("/statistics", response_model=BaseResponse[dict])
async def review_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pending_q = select(func.count()).select_from(DatasetSample).where(
        DatasetSample.status.in_([SampleStatus.PENDING_REVIEW, SampleStatus.REVIEWING])
    )
    pending_r = await db.execute(pending_q)
    total_pending = pending_r.scalar_one() or 0

    approved_q = select(func.count()).select_from(DatasetSample).where(
        DatasetSample.status == SampleStatus.APPROVED
    )
    approved_r = await db.execute(approved_q)
    total_approved = approved_r.scalar_one() or 0

    rejected_q = select(func.count()).select_from(DatasetSample).where(
        DatasetSample.status == SampleStatus.REJECTED
    )
    rejected_r = await db.execute(rejected_q)
    total_rejected = rejected_r.scalar_one() or 0

    avg_q = select(func.avg(DatasetSample.quality_score)).select_from(DatasetSample)
    avg_r = await db.execute(avg_q)
    avg_quality_score = avg_r.scalar_one() or 0.0

    total_err_q = select(func.count()).select_from(ErrorSample)
    total_err_r = await db.execute(total_err_q)
    total_error_samples = total_err_r.scalar_one() or 0

    open_err_q = select(func.count()).select_from(ErrorSample).where(
        ErrorSample.status == "open"
    )
    open_err_r = await db.execute(open_err_q)
    open_error_samples = open_err_r.scalar_one() or 0

    reviewer_ids_q = select(DatasetSample.reviewer_id).where(
        DatasetSample.reviewer_id.isnot(None)
    ).distinct()
    reviewer_ids_r = await db.execute(reviewer_ids_q)
    reviewer_ids = [rid for rid in reviewer_ids_r.scalars().all() if rid]

    reviewers = []
    for rid in reviewer_ids:
        rev_pending_q = select(func.count()).select_from(DatasetSample).where(
            and_(
                DatasetSample.reviewer_id == rid,
                DatasetSample.status.in_([SampleStatus.PENDING_REVIEW, SampleStatus.REVIEWING]),
            )
        )
        rev_pending_r = await db.execute(rev_pending_q)
        pending_count = rev_pending_r.scalar_one() or 0

        rev_completed_q = select(func.count()).select_from(DatasetSample).where(
            and_(
                DatasetSample.reviewer_id == rid,
                DatasetSample.status.in_([SampleStatus.APPROVED, SampleStatus.REJECTED]),
            )
        )
        rev_completed_r = await db.execute(rev_completed_q)
        completed_count = rev_completed_r.scalar_one() or 0

        rev_avg_q = select(func.avg(DatasetSample.quality_score)).select_from(DatasetSample).where(
            and_(
                DatasetSample.reviewer_id == rid,
                DatasetSample.status.in_([SampleStatus.APPROVED, SampleStatus.REJECTED]),
            )
        )
        rev_avg_r = await db.execute(rev_avg_q)
        avg_quality = rev_avg_r.scalar_one() or 0.0

        user_q = select(User.username, User.nickname, User.full_name).where(User.id == rid)
        user_r = await db.execute(user_q)
        user_row = user_r.first()
        reviewer_name = None
        if user_row:
            reviewer_name = user_row[2] or user_row[1] or user_row[0]

        reviewers.append({
            "reviewer_id": rid,
            "reviewer_name": reviewer_name,
            "pending_count": pending_count,
            "completed_count": completed_count,
            "avg_quality": float(avg_quality) if avg_quality else 0.0,
        })

    return BaseResponse(
        data={
            "total_pending": total_pending,
            "total_approved": total_approved,
            "total_rejected": total_rejected,
            "avg_quality_score": float(avg_quality_score) if avg_quality_score else 0.0,
            "total_error_samples": total_error_samples,
            "open_error_samples": open_error_samples,
            "reviewers": reviewers,
        },
        message="审核统计获取成功",
    )


@router.post("/tasks/{sample_id}/start", response_model=BaseResponse[dict])
async def start_review_task(
    sample_id: int,
    body: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(DatasetSample).where(DatasetSample.id == sample_id)
    )
    sample = result.scalar_one_or_none()
    if not sample:
        raise HTTPException(status_code=404, detail="样本不存在")

    if sample.status not in [SampleStatus.PENDING_REVIEW, SampleStatus.REVIEWING]:
        raise HTTPException(
            status_code=400,
            detail=f"样本状态不允许开始审核，当前状态: {sample.status.value if hasattr(sample.status, 'value') else str(sample.status)}",
        )

    reviewer_id = body.get("reviewer_id")
    sample.status = SampleStatus.REVIEWING
    if reviewer_id is not None:
        sample.reviewer_id = reviewer_id
    sample.reviewed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(sample)

    return BaseResponse(
        data={
            "sample_id": sample.id,
            "status": sample.status.value if hasattr(sample.status, "value") else str(sample.status),
            "reviewer_id": sample.reviewer_id,
            "locked_at": sample.reviewed_at,
            "locked": True,
        },
        message="审核任务已启动",
    )
