from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_role
from app.config import get_settings
from app.models.task import AlertEvent, AlertSeverity, AlertType
from app.models.user import User, UserRole
from app.schemas.alert import (
    AlertEventInfo,
    AlertListFilter,
    AcknowledgeRequest,
    ResolveRequest,
    AlertStatsResponse,
    AlertStatItem,
    SyntheticCheckResponse,
    SyntheticCheckResult,
)
from app.schemas.base import BaseResponse, PageResponse, PaginationParams
from app.services.alerting import AlertManager, DEFAULT_POLICIES

router = APIRouter(prefix="/alerts", tags=["Alerts"])
settings = get_settings()


def _get_sync_alert_manager() -> AlertManager:
    from app.core.database import get_sync_engine
    from sqlalchemy.orm import Session

    engine = get_sync_engine()
    session = Session(bind=engine)
    return AlertManager(
        db=session,
        webhook_url=settings.ALERT_WEBHOOK_URL,
        email_config=settings.get_alert_email_config(),
    )


@router.get("", response_model=BaseResponse[PageResponse[AlertEventInfo]])
async def list_alerts(
    status: Optional[str] = Query(None, description="告警状态 active/resolved"),
    severity: Optional[AlertSeverity] = Query(None, description="严重级别过滤"),
    alert_type: Optional[AlertType] = Query(None, description="告警类型过滤"),
    acknowledged: Optional[bool] = Query(None, description="是否已确认"),
    date_from: Optional[datetime] = Query(None, description="起始时间"),
    date_to: Optional[datetime] = Query(None, description="结束时间"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaseResponse[PageResponse[AlertEventInfo]]:
    query = select(AlertEvent)
    conditions = []

    if status:
        conditions.append(AlertEvent.status == status)
    if severity:
        conditions.append(AlertEvent.severity == severity)
    if alert_type:
        conditions.append(AlertEvent.alert_type == alert_type)
    if acknowledged is not None:
        conditions.append(AlertEvent.acknowledged == acknowledged)
    if date_from:
        conditions.append(AlertEvent.created_at >= date_from)
    if date_to:
        conditions.append(AlertEvent.created_at <= date_to)

    if conditions:
        query = query.where(and_(*conditions))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    query = query.order_by(AlertEvent.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = [AlertEventInfo.model_validate(ev) for ev in result.scalars().all()]

    page_resp = PageResponse[AlertEventInfo](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if page_size else 0,
    )
    return BaseResponse(data=page_resp, request_id=str(uuid.uuid4()))


@router.post("/{alert_id}/acknowledge", response_model=BaseResponse[AlertEventInfo])
async def acknowledge_alert(
    alert_id: int,
    body: AcknowledgeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaseResponse[AlertEventInfo]:
    result = await db.execute(select(AlertEvent).where(AlertEvent.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="告警不存在")

    if alert.acknowledged:
        raise HTTPException(status_code=400, detail="该告警已被确认")

    alert.acknowledged = True
    alert.acknowledged_by_id = current_user.id
    alert.acknowledged_at = datetime.utcnow()
    if body.ack_note:
        alert.ack_note = body.ack_note

    await db.commit()
    await db.refresh(alert)

    return BaseResponse(data=AlertEventInfo.model_validate(alert), request_id=str(uuid.uuid4()))


@router.post("/{alert_id}/resolve", response_model=BaseResponse[AlertEventInfo])
async def resolve_alert(
    alert_id: int,
    body: ResolveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaseResponse[AlertEventInfo]:
    result = await db.execute(select(AlertEvent).where(AlertEvent.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="告警不存在")

    if alert.status == "resolved":
        raise HTTPException(status_code=400, detail="该告警已解决")

    alert.status = "resolved"
    alert.resolved_by_id = current_user.id
    alert.resolved_at = datetime.utcnow()
    if body.resolution_note:
        alert.resolution_note = body.resolution_note

    if not alert.acknowledged:
        alert.acknowledged = True
        alert.acknowledged_by_id = current_user.id
        alert.acknowledged_at = datetime.utcnow()

    await db.commit()
    await db.refresh(alert)

    return BaseResponse(data=AlertEventInfo.model_validate(alert), request_id=str(uuid.uuid4()))


@router.get("/stats", response_model=BaseResponse[AlertStatsResponse])
async def alert_stats(
    days: int = Query(7, ge=1, le=90, description="统计天数"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaseResponse[AlertStatsResponse]:
    period_start = datetime.utcnow() - timedelta(days=days)
    period_end = datetime.utcnow()

    active_q = select(func.count()).select_from(
        select(AlertEvent).where(
            and_(AlertEvent.status == "active", AlertEvent.created_at >= period_start)
        ).subquery()
    )
    ack_q = select(func.count()).select_from(
        select(AlertEvent).where(
            and_(AlertEvent.acknowledged.is_(True), AlertEvent.created_at >= period_start)
        ).subquery()
    )
    resolved_q = select(func.count()).select_from(
        select(AlertEvent).where(
            and_(AlertEvent.status == "resolved", AlertEvent.created_at >= period_start)
        ).subquery()
    )

    active_r = await db.execute(active_q)
    ack_r = await db.execute(ack_q)
    resolved_r = await db.execute(resolved_q)

    active_count = active_r.scalar_one() or 0
    acknowledged_count = ack_r.scalar_one() or 0
    resolved_count = resolved_r.scalar_one() or 0

    sev_q = (
        select(AlertEvent.severity, func.count(AlertEvent.id))
        .where(AlertEvent.created_at >= period_start)
        .group_by(AlertEvent.severity)
    )
    sev_r = await db.execute(sev_q)
    by_severity = [AlertStatItem(severity=sev, count=cnt) for sev, cnt in sev_r.all()]

    resp_time_q = select(
        func.avg(func.extract("epoch", AlertEvent.acknowledged_at - AlertEvent.created_at))
    ).where(
        and_(
            AlertEvent.acknowledged.is_(True),
            AlertEvent.acknowledged_at.isnot(None),
            AlertEvent.created_at >= period_start,
        )
    )
    resp_time_r = await db.execute(resp_time_q)
    avg_response_time_seconds = resp_time_r.scalar_one_or_none()

    resolve_time_q = select(
        func.avg(func.extract("epoch", AlertEvent.resolved_at - AlertEvent.created_at))
    ).where(
        and_(
            AlertEvent.status == "resolved",
            AlertEvent.resolved_at.isnot(None),
            AlertEvent.created_at >= period_start,
        )
    )
    resolve_time_r = await db.execute(resolve_time_q)
    avg_resolve_time_seconds = resolve_time_r.scalar_one_or_none()

    stats = AlertStatsResponse(
        active_count=active_count,
        acknowledged_count=acknowledged_count,
        resolved_count=resolved_count,
        by_severity=by_severity,
        avg_response_time_seconds=avg_response_time_seconds,
        avg_resolve_time_seconds=avg_resolve_time_seconds,
        period_start=period_start,
        period_end=period_end,
    )
    return BaseResponse(data=stats, request_id=str(uuid.uuid4()))


@router.post("/synthetic-checks/run", response_model=BaseResponse[SyntheticCheckResponse])
@require_role(UserRole.ADMIN, UserRole.LEGAL_ASSISTANT)
async def run_synthetic_checks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaseResponse[SyntheticCheckResponse]:
    started_at = datetime.utcnow()
    am = _get_sync_alert_manager()

    results: list[SyntheticCheckResult] = []
    triggered_count = 0

    try:
        r1 = am.synthetic_check_tasks_health()
        if r1:
            triggered_count += 1
            results.append(
                SyntheticCheckResult(
                    policy_name="task_failed_rate_gt_10pct",
                    triggered=True,
                    alert_id=r1.id if hasattr(r1, "id") else None,
                    message=getattr(r1, "message", "任务失败率超过阈值"),
                )
            )
        else:
            results.append(SyntheticCheckResult(policy_name="task_failed_rate_gt_10pct", triggered=False))

        r2 = am.synthetic_check_latency()
        if r2:
            triggered_count += 1
            results.append(
                SyntheticCheckResult(
                    policy_name="latency_p95_gt_30s",
                    triggered=True,
                    alert_id=r2.id if hasattr(r2, "id") else None,
                    message=getattr(r2, "message", "P95延迟超过阈值"),
                )
            )
        else:
            results.append(SyntheticCheckResult(policy_name="latency_p95_gt_30s", triggered=False))

        r3 = am.synthetic_check_error_samples()
        if r3:
            triggered_count += 1
            results.append(
                SyntheticCheckResult(
                    policy_name="critical_errors_gt_5",
                    triggered=True,
                    alert_id=r3.id if hasattr(r3, "id") else None,
                    message=getattr(r3, "message", "严重错误样本超过阈值"),
                )
            )
        else:
            results.append(SyntheticCheckResult(policy_name="critical_errors_gt_5", triggered=False))

    finally:
        try:
            am.db.close()
        except Exception:
            pass

    finished_at = datetime.utcnow()
    resp = SyntheticCheckResponse(
        check_count=len(results),
        triggered_count=triggered_count,
        results=results,
        started_at=started_at,
        finished_at=finished_at,
    )
    return BaseResponse(data=resp, request_id=str(uuid.uuid4()))
