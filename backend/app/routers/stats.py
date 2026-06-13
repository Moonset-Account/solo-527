from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_

from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app.models import (
    User, RoleEnum, Ticket, TicketStatus, TicketPriority,
    CustomerFeedback, RiskSample, RiskLevel
)
from app.schemas import StatsOverview

router = APIRouter(prefix="/stats", tags=["统计分析"])


@router.get("/overview", response_model=StatsOverview)
async def get_overview_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR])),
    db: AsyncSession = Depends(get_db)
):
    conditions = []
    if start_date:
        conditions.append(Ticket.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        conditions.append(Ticket.created_at <= datetime.fromisoformat(end_date))

    query = select(Ticket)
    if conditions:
        query = query.where(and_(*conditions))

    subq = query.subquery()

    total = await db.scalar(select(func.count()).select_from(subq))
    pending = await db.scalar(
        select(func.count()).select_from(subq).where(subq.c.status == TicketStatus.PENDING)
    )
    processing = await db.scalar(
        select(func.count()).select_from(subq).where(subq.c.status == TicketStatus.PROCESSING)
    )
    resolved = await db.scalar(
        select(func.count()).select_from(subq).where(
            subq.c.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED])
        )
    )

    avg_response = await db.scalar(
        select(func.avg(subq.c.response_time_seconds)).where(
            subq.c.response_time_seconds.isnot(None)
        )
    )
    avg_resolution = await db.scalar(
        select(func.avg(subq.c.resolution_time_seconds)).where(
            subq.c.resolution_time_seconds.isnot(None)
        )
    )

    overdue_count = await db.scalar(
        select(func.count()).select_from(subq).where(subq.c.has_overdue_risk == True)
    )
    duplicate_count = await db.scalar(
        select(func.count()).select_from(subq).where(subq.c.is_duplicate == True)
    )

    avg_rating = await db.scalar(
        select(func.avg(CustomerFeedback.rating))
    )

    high_risk_count = await db.scalar(
        select(func.count()).where(
            RiskSample.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL])
        )
    )

    return StatsOverview(
        total_tickets=total or 0,
        pending_tickets=pending or 0,
        processing_tickets=processing or 0,
        resolved_tickets=resolved or 0,
        avg_response_time=float(avg_response) if avg_response else None,
        avg_resolution_time=float(avg_resolution) if avg_resolution else None,
        overdue_count=overdue_count or 0,
        duplicate_count=duplicate_count or 0,
        avg_feedback_rating=float(avg_rating) if avg_rating else None,
        high_risk_count=high_risk_count or 0,
    )


@router.get("/response-time-trend")
async def get_response_time_trend(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR])),
    db: AsyncSession = Depends(get_db)
):
    start_date = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            func.date_trunc('day', Ticket.created_at).label('date'),
            func.avg(Ticket.response_time_seconds).label('avg_response'),
            func.avg(Ticket.resolution_time_seconds).label('avg_resolution'),
            func.count(Ticket.id).label('count')
        ).where(
            Ticket.created_at >= start_date,
            Ticket.response_time_seconds.isnot(None)
        ).group_by(
            func.date_trunc('day', Ticket.created_at)
        ).order_by('date')
    )

    data = []
    for row in result.all():
        data.append({
            "date": row.date.strftime("%Y-%m-%d"),
            "avg_response_seconds": float(row.avg_response) if row.avg_response else None,
            "avg_resolution_seconds": float(row.avg_resolution) if row.avg_resolution else None,
            "ticket_count": row.count
        })

    return {"data": data, "days": days}


@router.get("/priority-distribution")
async def get_priority_distribution(
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(
            Ticket.priority,
            func.count(Ticket.id).label('count')
        ).group_by(Ticket.priority)
    )

    data = []
    for row in result.all():
        data.append({
            "priority": row.priority.value if hasattr(row.priority, 'value') else row.priority,
            "count": row.count
        })

    return {"data": data}


@router.get("/category-distribution")
async def get_category_distribution(
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(
            Ticket.category,
            func.count(Ticket.id).label('count')
        ).where(
            Ticket.category.isnot(None)
        ).group_by(Ticket.category).order_by(func.count(Ticket.id).desc())
    )

    data = []
    for row in result.all():
        data.append({
            "category": row.category,
            "count": row.count
        })

    return {"data": data}


@router.get("/agent-performance")
async def get_agent_performance(
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR])),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(
            User.id,
            User.username,
            User.full_name,
            func.count(Ticket.id).label('total_assigned'),
            func.avg(Ticket.response_time_seconds).label('avg_response'),
            func.avg(Ticket.resolution_time_seconds).label('avg_resolution'),
        ).outerjoin(
            Ticket, Ticket.assigned_to == User.id
        ).where(
            User.role.in_([RoleEnum.AGENT, RoleEnum.SUPERVISOR])
        ).group_by(User.id).order_by('total_assigned')
    )

    data = []
    for row in result.all():
        data.append({
            "user_id": row.id,
            "username": row.username,
            "full_name": row.full_name,
            "total_assigned": row.total_assigned or 0,
            "avg_response_seconds": float(row.avg_response) if row.avg_response else None,
            "avg_resolution_seconds": float(row.avg_resolution) if row.avg_resolution else None,
        })

    return {"data": data}


@router.get("/risk-distribution")
async def get_risk_distribution(
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(
            RiskSample.risk_level,
            func.count(RiskSample.id).label('count')
        ).group_by(RiskSample.risk_level)
    )

    data = []
    for row in result.all():
        data.append({
            "risk_level": row.risk_level.value if hasattr(row.risk_level, 'value') else row.risk_level,
            "count": row.count
        })

    return {"data": data}


@router.get("/duplicate-tickets")
async def get_duplicate_tickets_stats(
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR])),
    db: AsyncSession = Depends(get_db)
):
    total = await db.scalar(select(func.count()).select_from(Ticket))
    duplicates = await db.scalar(
        select(func.count()).where(Ticket.is_duplicate == True)
    )

    result = await db.execute(
        select(
            Ticket.duplicate_of_ticket_id,
            func.count(Ticket.id).label('duplicate_count')
        ).where(
            Ticket.is_duplicate == True,
            Ticket.duplicate_of_ticket_id.isnot(None)
        ).group_by(
            Ticket.duplicate_of_ticket_id
        ).order_by(func.count(Ticket.id).desc()).limit(10)
    )

    top_duplicates = []
    for row in result.all():
        original_result = await db.execute(
            select(Ticket.title).where(Ticket.id == row.duplicate_of_ticket_id)
        )
        title = original_result.scalar_one_or_none()
        top_duplicates.append({
            "original_ticket_id": row.duplicate_of_ticket_id,
            "original_title": title,
            "duplicate_count": row.duplicate_count
        })

    return {
        "total_tickets": total or 0,
        "duplicate_count": duplicates or 0,
        "duplicate_rate": round((duplicates or 0) / (total or 1) * 100, 2),
        "top_duplicate_originals": top_duplicates
    }
