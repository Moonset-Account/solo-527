from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.contract import (
    ContractClause,
    ContractDocument,
    ContractStatus,
    RiskAlert,
    RiskLevel,
    RiskType,
)
from app.models.dataset import DatasetSample, SampleStatus
from app.models.ml import ModelVersion, ModelStatus, ABRun, ABStatus
from app.models.task import (
    AlertEvent,
    AlertSeverity,
    Task,
    TaskResult,
    TaskStatus,
)
from app.models.user import User
from app.schemas.base import BaseResponse
from app.schemas.dashboard import (
    CostBreakdownResponse,
    DashboardSummary,
    ErrorTrendResponse,
    FunnelResponse,
    FunnelStep,
    ModelComparisonResponse,
    ReviewerLeaderboardResponse,
    RiskDistributionResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=BaseResponse[DashboardSummary])
async def dashboard_summary(
    days: int = Query(7, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start = datetime.utcnow() - timedelta(days=days)
    end = datetime.utcnow()

    async def _scalar(q):
        r = (await db.execute(q)).scalar_one()
        return r or 0

    total_contracts = await _scalar(select(func.count()).select_from(ContractDocument))
    new_contracts = await _scalar(
        select(func.count()).select_from(ContractDocument).where(
            ContractDocument.created_at >= start
        )
    )
    processing = await _scalar(
        select(func.count()).select_from(ContractDocument).where(
            ContractDocument.status.in_([ContractStatus.PARSING, ContractStatus.ANALYZING])
        )
    )
    error = await _scalar(
        select(func.count()).select_from(ContractDocument).where(
            ContractDocument.status == ContractStatus.ERROR
        )
    )
    total_clauses = await _scalar(select(func.count()).select_from(ContractClause))
    total_risks = await _scalar(select(func.count()).select_from(RiskAlert))

    async def _risk_count(level: RiskLevel) -> int:
        return await _scalar(
            select(func.count()).select_from(RiskAlert).where(RiskAlert.risk_level == level)
        )

    high_risks = await _risk_count(RiskLevel.HIGH)
    medium_risks = await _risk_count(RiskLevel.MEDIUM)
    low_risks = await _risk_count(RiskLevel.LOW)

    total_tasks = await _scalar(select(func.count()).select_from(Task))
    completed_tasks = await _scalar(
        select(func.count()).select_from(Task).where(Task.status == TaskStatus.COMPLETED)
    )
    failed_tasks = await _scalar(
        select(func.count()).select_from(Task).where(Task.status == TaskStatus.FAILED)
    )

    avg_latency_q = select(func.avg(Task.total_time_ms)).select_from(Task).where(
        and_(Task.completed_at >= start, Task.total_time_ms.isnot(None))
    )
    avg_latency = (await db.execute(avg_latency_q)).scalar_one_or_none()

    total_reviews = await _scalar(
        select(func.count()).select_from(DatasetSample).where(
            DatasetSample.reviewed_at >= start
        )
    )
    pending_reviews = await _scalar(
        select(func.count()).select_from(DatasetSample).where(
            DatasetSample.status.in_([SampleStatus.PENDING_REVIEW, SampleStatus.REVIEWING])
        )
    )
    approved_reviews = await _scalar(
        select(func.count()).select_from(DatasetSample).where(
            and_(
                DatasetSample.status == SampleStatus.APPROVED,
                DatasetSample.reviewed_at >= start,
            )
        )
    )
    approval_rate = approved_reviews / total_reviews if total_reviews > 0 else None

    total_models = await _scalar(select(func.count()).select_from(ModelVersion))
    production_models = await _scalar(
        select(func.count()).select_from(ModelVersion).where(
            ModelVersion.status == ModelStatus.PRODUCTION
        )
    )
    active_ab_tests = await _scalar(
        select(func.count()).select_from(ABRun).where(ABRun.status == ABStatus.RUNNING)
    )

    active_alerts = await _scalar(
        select(func.count()).select_from(AlertEvent).where(AlertEvent.status == "active")
    )
    critical_alerts = await _scalar(
        select(func.count()).select_from(AlertEvent).where(
            AlertEvent.severity == AlertSeverity.CRITICAL
        )
    )

    total_cost_q = select(func.coalesce(func.sum(TaskResult.cost_usd), 0.0)).select_from(
        TaskResult
    )
    total_cost = await _scalar(total_cost_q)
    total_tokens_q = select(func.coalesce(func.sum(TaskResult.tokens_used), 0)).select_from(
        TaskResult
    )
    total_tokens = await _scalar(total_tokens_q)

    return BaseResponse(
        data=DashboardSummary(
            days=days,
            total_contracts=total_contracts,
            new_contracts=new_contracts,
            contracts_processing=processing,
            contracts_error=error,
            total_clauses=total_clauses,
            total_risks=total_risks,
            high_risks=high_risks,
            medium_risks=medium_risks,
            low_risks=low_risks,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            failed_tasks=failed_tasks,
            avg_task_latency_ms=avg_latency,
            total_reviews=total_reviews,
            pending_reviews=pending_reviews,
            approval_rate=approval_rate,
            total_models=total_models,
            production_models=production_models,
            active_ab_tests=active_ab_tests,
            active_alerts=active_alerts,
            critical_alerts=critical_alerts,
            total_cost_usd=total_cost,
            total_tokens=total_tokens,
            start_date=start,
            end_date=end,
        )
    )


@router.get("/funnel", response_model=BaseResponse[FunnelResponse])
async def contract_funnel(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end = to_date or datetime.utcnow()
    start = from_date or (end - timedelta(days=30))

    async def _cnt(status_list):
        q = select(func.count()).select_from(ContractDocument).where(
            and_(
                ContractDocument.created_at >= start,
                ContractDocument.created_at <= end,
                ContractDocument.status.in_(status_list),
            )
        )
        return (await db.execute(q)).scalar_one() or 0

    all_statuses = [
        ContractStatus.DRAFT,
        ContractStatus.PARSING,
        ContractStatus.PARSED,
        ContractStatus.ANALYZING,
        ContractStatus.ANALYZED,
        ContractStatus.REVIEWING,
        ContractStatus.APPROVED,
        ContractStatus.ARCHIVED,
    ]
    uploaded = await _cnt(all_statuses)
    parsed = await _cnt([
        ContractStatus.PARSED,
        ContractStatus.ANALYZING,
        ContractStatus.ANALYZED,
        ContractStatus.REVIEWING,
        ContractStatus.APPROVED,
        ContractStatus.ARCHIVED,
    ])
    analyzed = await _cnt([
        ContractStatus.ANALYZED,
        ContractStatus.REVIEWING,
        ContractStatus.APPROVED,
        ContractStatus.ARCHIVED,
    ])
    reviewed = await _cnt([ContractStatus.REVIEWING, ContractStatus.APPROVED, ContractStatus.ARCHIVED])
    approved = await _cnt([ContractStatus.APPROVED, ContractStatus.ARCHIVED])

    raw_steps = [
        ("uploaded", uploaded),
        ("parsed", parsed),
        ("analyzed", analyzed),
        ("reviewed", reviewed),
        ("approved", approved),
    ]

    steps: List[FunnelStep] = []
    prev_count = None
    for name, count in raw_steps:
        conv = (count / uploaded * 100) if uploaded > 0 else None
        drop = None
        if prev_count is not None and prev_count > 0:
            drop = (1 - count / prev_count) * 100
        steps.append(FunnelStep(step=name, count=count, conversion_rate=conv, drop_off_rate=drop))
        prev_count = count

    return BaseResponse(
        data=FunnelResponse(steps=steps, from_date=start, to_date=end),
        message="漏斗数据生成完成",
    )


@router.get("/risks/distribution", response_model=BaseResponse[RiskDistributionResponse])
async def risk_distribution(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start = datetime.utcnow() - timedelta(days=days)
    total_q = select(func.count()).select_from(RiskAlert).where(RiskAlert.created_at >= start)
    total = (await db.execute(total_q)).scalar_one() or 0

    by_level = []
    for lvl in [RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW, RiskLevel.INFO]:
        q = select(func.count()).select_from(RiskAlert).where(
            and_(RiskAlert.risk_level == lvl, RiskAlert.created_at >= start)
        )
        c = (await db.execute(q)).scalar_one() or 0
        by_level.append({
            "risk_type": "",
            "risk_level": lvl.value,
            "count": c,
            "percentage": (c / total * 100) if total > 0 else 0.0,
        })

    by_type = []
    for rtype in list(RiskType):
        q = select(func.count()).select_from(RiskAlert).where(
            and_(RiskAlert.risk_type == rtype, RiskAlert.created_at >= start)
        )
        c = (await db.execute(q)).scalar_one() or 0
        if c > 0:
            by_type.append({
                "risk_type": rtype.value,
                "risk_level": "",
                "count": c,
                "percentage": (c / total * 100) if total > 0 else 0.0,
            })

    return BaseResponse(
        data=RiskDistributionResponse(
            days=days,
            total=total,
            by_level=by_level,
            by_type=by_type,
            trend=[],
        ),
        message="风险分布数据生成完成",
    )


@router.get("/models/comparison", response_model=BaseResponse[ModelComparisonResponse])
async def model_comparison(
    model_ids: Optional[str] = Query(None, description="模型ID逗号分隔"),
    metric: str = Query("f1"),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ids_list: List[int] = []
    if model_ids:
        ids_list = [int(x) for x in model_ids.split(",") if x.strip().isdigit()]

    comparisons = []
    if ids_list:
        q = select(ModelVersion).where(ModelVersion.id.in_(ids_list))
    else:
        q = select(ModelVersion).order_by(ModelVersion.id.desc()).limit(5)
    models = (await db.execute(q)).scalars().all()

    for m in models:
        val = 0.0
        if m.eval_metrics and isinstance(m.eval_metrics, dict):
            val = float(m.eval_metrics.get(metric, 0.0))
        comparisons.append({
            "model_id": m.id,
            "model_name": m.model_name,
            "version": m.version,
            "metric": metric,
            "value": val,
            "sample_size": None,
            "ci_lower": None,
            "ci_upper": None,
        })

    return BaseResponse(
        data=ModelComparisonResponse(
            model_ids=ids_list or [m.id for m in models],
            metric=metric,
            days=days,
            comparisons=comparisons,
        )
    )


@router.get("/reviewers/leaderboard", response_model=BaseResponse[ReviewerLeaderboardResponse])
async def reviewer_leaderboard(
    days: int = Query(7, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start = datetime.utcnow() - timedelta(days=days)

    q = select(
        DatasetSample.reviewer_id,
        func.count(DatasetSample.id),
    ).select_from(DatasetSample).where(
        and_(DatasetSample.reviewer_id.isnot(None), DatasetSample.reviewed_at >= start)
    ).group_by(DatasetSample.reviewer_id).order_by(func.count(DatasetSample.id).desc()).limit(20)

    rows = (await db.execute(q)).all()
    items = []
    for rid, cnt in rows:
        items.append({
            "reviewer_id": rid,
            "reviewer_name": None,
            "completed_count": cnt,
            "approved_count": 0,
            "rejected_count": 0,
            "approval_rate": 0.0,
            "avg_review_seconds": 0.0,
            "score": float(cnt),
        })

    return BaseResponse(
        data=ReviewerLeaderboardResponse(days=days, items=items),
    )


@router.get("/errors/trend", response_model=BaseResponse[ErrorTrendResponse])
async def error_trend(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start = datetime.utcnow() - timedelta(days=days)

    from app.models.dataset import ErrorSample, ErrorType

    total_q = select(func.count()).select_from(ErrorSample).where(ErrorSample.created_at >= start)
    total = (await db.execute(total_q)).scalar_one() or 0

    by_type = {}
    for etype in list(ErrorType):
        q = select(func.count()).select_from(ErrorSample).where(
            and_(ErrorSample.error_type == etype, ErrorSample.created_at >= start)
        )
        c = (await db.execute(q)).scalar_one() or 0
        if c > 0:
            by_type[etype.value] = c

    return BaseResponse(
        data=ErrorTrendResponse(
            days=days,
            total=total,
            by_type=by_type,
            trend=[],
        )
    )


@router.get("/cost/breakdown", response_model=BaseResponse[CostBreakdownResponse])
async def cost_breakdown(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start = datetime.utcnow() - timedelta(days=days)

    total_q = select(func.coalesce(func.sum(TaskResult.cost_usd), 0.0)).select_from(
        TaskResult
    ).join(Task, TaskResult.task_id == Task.id).where(Task.created_at >= start)
    total_cost = (await db.execute(total_q)).scalar_one() or 0.0

    tokens_q = select(func.coalesce(func.sum(TaskResult.tokens_used), 0)).select_from(
        TaskResult
    ).join(Task, TaskResult.task_id == Task.id).where(Task.created_at >= start)
    total_tokens = (await db.execute(tokens_q)).scalar_one() or 0

    return BaseResponse(
        data=CostBreakdownResponse(
            days=days,
            total_cost_usd=total_cost,
            total_tokens=total_tokens,
            by_model=[],
            by_task_type=[],
            trend=[],
        )
    )


@router.get("/distribution", response_model=BaseResponse[RiskDistributionResponse])
async def dashboard_distribution_alias(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await risk_distribution(days=days, db=db, current_user=current_user)


@router.get("/trend", response_model=BaseResponse[ErrorTrendResponse])
async def dashboard_trend(
    metric_type: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.ml import MetricType, ModelMetric

    metric_values = {m.value for m in MetricType}
    if metric_type and metric_type in metric_values:
        start = datetime.utcnow() - timedelta(days=days)

        q = select(
            func.date(ModelMetric.window_start).label("m_date"),
            func.avg(ModelMetric.metric_value).label("m_value"),
        ).select_from(ModelMetric).where(
            and_(
                ModelMetric.metric_type == metric_type,
                ModelMetric.window_start >= start,
                ModelMetric.window_start.isnot(None),
            )
        ).group_by(func.date(ModelMetric.window_start)).order_by("m_date")

        rows = (await db.execute(q)).all()
        trend_list = []
        total_val = 0.0
        for m_date, m_value in rows:
            date_str = m_date.strftime("%Y-%m-%d") if hasattr(m_date, "strftime") else str(m_date)
            trend_list.append({
                "date": date_str,
                "error_type": metric_type,
                "count": int(round(m_value * 100)) if m_value is not None else 0,
            })
            if m_value is not None:
                total_val += m_value

        return BaseResponse(
            data=ErrorTrendResponse(
                days=days,
                total=len(trend_list),
                by_type={metric_type: int(round(total_val * 100))},
                trend=trend_list,
            )
        )

    return await error_trend(days=days, db=db, current_user=current_user)


@router.get("/leaderboard", response_model=BaseResponse[ReviewerLeaderboardResponse])
async def dashboard_leaderboard_alias(
    days: int = Query(7, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await reviewer_leaderboard(days=days, db=db, current_user=current_user)


@router.get("/cost", response_model=BaseResponse[CostBreakdownResponse])
async def dashboard_cost_alias(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await cost_breakdown(days=days, db=db, current_user=current_user)
