from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select as sel

from app.database import get_db
from app.enums import UserRole, EventStatus, OrderStatus
from app.schemas.common import ResponseModel, DashboardStats, OrderOut, PageResult
from app.dependencies import require_roles
from app.utils import paginate
from app.services.report_service import ReportService
from app.models import Event, Seat
from app.api.public import build_order_out
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["报表"])

finance_required = require_roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.OPERATOR)


@router.get("/dashboard", response_model=ResponseModel[DashboardStats])
async def get_dashboard(
    user=Depends(finance_required),
    db: AsyncSession = Depends(get_db),
):
    data = await ReportService.get_dashboard_stats(db)
    return ResponseModel(data=DashboardStats(**data))


@router.get("/revenue")
async def get_revenue_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_id: Optional[int] = None,
    group_by: str = Query("day", pattern="^(hour|day|week|month)$"),
    user=Depends(finance_required),
    db: AsyncSession = Depends(get_db),
):
    sd = datetime.fromisoformat(start_date) if start_date else None
    ed = datetime.fromisoformat(end_date) if end_date else None
    data = await ReportService.get_revenue_report(db, sd, ed, event_id, group_by)
    return ResponseModel(data=data)


@router.get("/events")
async def get_event_report(
    status: Optional[EventStatus] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    user=Depends(finance_required),
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    sd = datetime.fromisoformat(start_date) if start_date else None
    ed = datetime.fromisoformat(end_date) if end_date else None
    items, total = await ReportService.get_event_report(db, status, sd, ed, page, page_size)
    return ResponseModel(data=PageResult(
        items=items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.get("/events/{event_id}/seat-occupancy")
async def get_seat_occupancy(
    event_id: int,
    user=Depends(finance_required),
    db: AsyncSession = Depends(get_db),
):
    data = await ReportService.get_seat_occupancy(db, event_id)
    return ResponseModel(data=data)


@router.get("/events/{event_id}/ticket-type-sales")
async def get_ticket_type_sales(
    event_id: int,
    user=Depends(finance_required),
    db: AsyncSession = Depends(get_db),
):
    data = await ReportService.get_ticket_type_sales(db, event_id)
    return ResponseModel(data=data)


@router.get("/orders/drilldown", response_model=ResponseModel[PageResult[OrderOut]])
async def get_order_drilldown(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_id: Optional[int] = None,
    status: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    page: int = 1,
    page_size: int = 50,
    user=Depends(finance_required),
    db: AsyncSession = Depends(get_db),
):
    from app.services.order_service import OrderService
    page, page_size = paginate(page, page_size)
    sd = datetime.fromisoformat(start_date) if start_date else None
    ed = datetime.fromisoformat(end_date) if end_date else None
    st_enum = None
    if status:
        try:
            st_enum = OrderStatus(status)
        except ValueError:
            pass
    items, total = await OrderService.list_orders(
        db, event_id=event_id, status=st_enum,
        start_date=sd, end_date=ed, page=page, page_size=page_size,
    )
    filtered = []
    for item in items:
        amt = item.pay_amount
        if min_amount is not None and amt < min_amount:
            continue
        if max_amount is not None and amt > max_amount:
            continue
        filtered.append(item)
    out_items = [await build_order_out(o, db) for o in filtered]
    return ResponseModel(data=PageResult(
        items=out_items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.get("/alerts/repeat-seat")
async def get_repeat_seat_alerts_report(
    is_resolved: Optional[bool] = None,
    event_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
    user=Depends(finance_required),
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    items, total = await ReportService.get_repeat_alert_report(db, is_resolved, event_id, page, page_size)
    out_items = []
    for alert in items:
        ev = (await db.execute(sel(Event).where(Event.id == alert.event_id))).scalar_one_or_none()
        seat_obj = (await db.execute(sel(Seat).where(Seat.id == alert.seat_id))).scalar_one_or_none()
        d = {
            "id": alert.id,
            "alert_key": alert.alert_key,
            "event_id": alert.event_id,
            "event_name": ev.name if ev else None,
            "seat_id": alert.seat_id,
            "seat_code": seat_obj.seat_code if seat_obj else None,
            "user_identifier": alert.user_identifier,
            "attempt_count": alert.attempt_count,
            "first_attempt_at": alert.first_attempt_at,
            "last_attempt_at": alert.last_attempt_at,
            "is_resolved": alert.is_resolved,
            "resolved_at": alert.resolved_at,
            "resolution_note": alert.resolution_note,
            "window_seconds": alert.window_seconds,
        }
        out_items.append(d)
    return ResponseModel(data=PageResult(
        items=out_items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.get("/summary")
async def get_summary_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_id: Optional[int] = None,
    user=Depends(finance_required),
    db: AsyncSession = Depends(get_db),
):
    sd = datetime.fromisoformat(start_date) if start_date else None
    ed = datetime.fromisoformat(end_date) if end_date else None
    revenue_data = await ReportService.get_revenue_report(db, sd, ed, event_id, "day")
    total_revenue = sum(d["revenue"] for d in revenue_data)
    total_refund = sum(d["refund_amount"] for d in revenue_data)
    total_orders = sum(d["order_count"] for d in revenue_data)
    total_tickets = sum(d["ticket_count"] for d in revenue_data)
    total_refund_count = sum(d["refund_count"] for d in revenue_data)
    from sqlalchemy import select, func, and_
    from app.models import Order, OrderStatus as OS
    q = select(func.count(Order.id)).where(Order.status.in_([OS.PAID]))
    if sd:
        q = q.where(Order.paid_at >= sd)
    if ed:
        q = q.where(Order.paid_at < ed)
    if event_id:
        q = q.where(Order.event_id == event_id)
    avg_order_value = 0
    if total_orders > 0:
        avg_order_value = round(total_revenue / total_orders, 2)
    return ResponseModel(data={
        "total_revenue": round(total_revenue, 2),
        "total_refund": round(total_refund, 2),
        "net_revenue": round(total_revenue - total_refund, 2),
        "total_orders": total_orders,
        "total_tickets": total_tickets,
        "total_refund_count": total_refund_count,
        "avg_order_value": avg_order_value,
        "avg_ticket_price": round(total_revenue / total_tickets, 2) if total_tickets > 0 else 0,
        "refund_rate": round((total_refund_count / total_orders) * 100, 2) if total_orders > 0 else 0,
        "daily_data": revenue_data,
    })
