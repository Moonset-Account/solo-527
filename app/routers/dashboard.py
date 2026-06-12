from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.database import get_db
from app.models.work_order import WorkOrder, OrderStatusEnum, OrderTypeEnum, PriorityEnum
from app.models.user import User, RoleEnum
from app.models.asset import Asset, AssetStatusEnum
from app.models.change_window import ChangeWindow, WindowStatusEnum
from app.routers.auth import require_login
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["看板"])


@router.get("")
async def dashboard(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_login),
):
    from app.templates import templates

    total_result = await db.execute(select(func.count(WorkOrder.id)))
    total = total_result.scalar() or 0

    pending_result = await db.execute(
        select(func.count(WorkOrder.id)).where(WorkOrder.status == OrderStatusEnum.pending)
    )
    pending = pending_result.scalar() or 0

    in_progress_result = await db.execute(
        select(func.count(WorkOrder.id)).where(WorkOrder.status == OrderStatusEnum.in_progress)
    )
    in_progress = in_progress_result.scalar() or 0

    overdue_result = await db.execute(
        select(func.count(WorkOrder.id)).where(
            WorkOrder.status.in_([OrderStatusEnum.pending, OrderStatusEnum.assigned, OrderStatusEnum.in_progress]),
            WorkOrder.sla_hours > 0,
        )
    )
    overdue_count = overdue_result.scalar() or 0

    now = datetime.utcnow()
    overdue_actual = 0
    if overdue_count > 0:
        all_active_result = await db.execute(
            select(WorkOrder).where(
                WorkOrder.status.in_([OrderStatusEnum.pending, OrderStatusEnum.assigned, OrderStatusEnum.in_progress])
            )
        )
        active_orders = all_active_result.scalars().all()
        for o in active_orders:
            if now > o.created_at + timedelta(hours=o.sla_hours):
                overdue_actual += 1

    resolved_result = await db.execute(
        select(func.count(WorkOrder.id)).where(WorkOrder.status == OrderStatusEnum.resolved)
    )
    resolved = resolved_result.scalar() or 0

    fault_result = await db.execute(
        select(func.count(WorkOrder.id)).where(WorkOrder.order_type == OrderTypeEnum.fault)
    )
    fault_count = fault_result.scalar() or 0

    account_result = await db.execute(
        select(func.count(WorkOrder.id)).where(WorkOrder.order_type == OrderTypeEnum.account_request)
    )
    account_count = account_result.scalar() or 0

    recent_result = await db.execute(
        select(WorkOrder).order_by(WorkOrder.created_at.desc()).limit(10)
    )
    recent_orders = recent_result.scalars().all()

    upcoming_windows_result = await db.execute(
        select(ChangeWindow)
        .where(ChangeWindow.start_time >= now, ChangeWindow.status == WindowStatusEnum.planned)
        .order_by(ChangeWindow.start_time)
        .limit(5)
    )
    upcoming_windows = upcoming_windows_result.scalars().all()

    return templates.TemplateResponse("dashboard/index.html", {
        "request": request,
        "current_user": user,
        "stats": {
            "total": total,
            "pending": pending,
            "in_progress": in_progress,
            "overdue": overdue_actual,
            "resolved": resolved,
            "fault_count": fault_count,
            "account_count": account_count,
        },
        "recent_orders": recent_orders,
        "upcoming_windows": upcoming_windows,
        "OrderStatusEnum": OrderStatusEnum,
        "PriorityEnum": PriorityEnum,
        "RoleEnum": RoleEnum,
    })
