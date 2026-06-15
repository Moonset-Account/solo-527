from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_, case, cast, Date
from fastapi import HTTPException

from app.models import Event, Seat, Order, OrderItem, RefundRequest, RepeatSeatAlert
from app.enums import (
    SeatStatus, OrderStatus, RefundStatus, EventStatus, SeatArea
)
from app.utils import now, calc_occupancy_rate


class ReportService:
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> dict:
        today_start = now().replace(hour=0, minute=0, second=0, microsecond=0)
        total_events = (await db.execute(select(func.count(Event.id)))).scalar() or 0
        active_events = (await db.execute(select(func.count(Event.id)).where(
            Event.status.in_([EventStatus.ACTIVE, EventStatus.SOLD_OUT])
        ))).scalar() or 0
        orders_today = (await db.execute(select(func.count(Order.id)).where(
            and_(Order.created_at >= today_start, Order.status == OrderStatus.PAID)
        ))).scalar() or 0
        revenue_today = (await db.execute(select(func.coalesce(func.sum(Order.pay_amount), 0)).where(
            and_(Order.created_at >= today_start, Order.status == OrderStatus.PAID)
        ))).scalar() or 0
        total_revenue = (await db.execute(select(func.coalesce(func.sum(Order.pay_amount), 0)).where(
            Order.status == OrderStatus.PAID
        ))).scalar() or 0
        total_refund = (await db.execute(select(func.coalesce(func.sum(Order.refund_amount), 0)).where(
            Order.status == OrderStatus.PAID
        ))).scalar() or 0
        pending_refunds = (await db.execute(select(func.count(RefundRequest.id)).where(
            RefundRequest.status == RefundStatus.PENDING
        ))).scalar() or 0
        from app.models import Registration, RegistrationStatus
        pending_registrations = (await db.execute(select(func.count(Registration.id)).where(
            Registration.status == RegistrationStatus.PENDING
        ))).scalar() or 0
        unresolved_alerts = (await db.execute(select(func.count(RepeatSeatAlert.id)).where(
            RepeatSeatAlert.is_resolved == False
        ))).scalar() or 0
        return {
            "total_events": total_events,
            "active_events": active_events,
            "total_orders_today": orders_today,
            "revenue_today": float(revenue_today),
            "total_revenue": float(total_revenue),
            "total_refund": float(total_refund),
            "net_revenue": float(total_revenue - total_refund),
            "pending_refunds": pending_refunds,
            "pending_registrations": pending_registrations,
            "unresolved_alerts": unresolved_alerts,
        }

    @staticmethod
    async def get_revenue_report(db: AsyncSession, start_date: datetime = None,
                                  end_date: datetime = None, event_id: int = None,
                                  group_by: str = "day") -> List[dict]:
        if not start_date:
            start_date = now() - timedelta(days=30)
        if not end_date:
            end_date = now() + timedelta(days=1)
        date_expr = func.date_trunc(group_by, Order.paid_at).label("period")
        query = select(
            date_expr,
            func.count(Order.id.distinct()).label("order_count"),
            func.count(OrderItem.id).label("ticket_count"),
            func.coalesce(func.sum(Order.pay_amount), 0).label("revenue"),
            func.coalesce(func.sum(
                case((RefundRequest.status.in_([RefundStatus.APPROVED, RefundStatus.COMPLETED]),
                      RefundRequest.actual_amount), else_=0)
            ), 0).label("refund_amount"),
            func.count(RefundRequest.id.distinct()).label("refund_count"),
        ).select_from(Order).outerjoin(
            OrderItem, OrderItem.order_id == Order.id
        ).outerjoin(
            RefundRequest, RefundRequest.order_id == Order.id
        ).where(and_(
            Order.paid_at.isnot(None),
            Order.paid_at >= start_date,
            Order.paid_at < end_date,
        ))
        if event_id:
            query = query.where(Order.event_id == event_id)
        query = query.group_by("period").order_by("period")
        result = await db.execute(query)
        rows = result.all()
        data = []
        for row in rows:
            period, order_count, ticket_count, revenue, refund_amount, refund_count = row
            data.append({
                "date": period.strftime("%Y-%m-%d") if period else "",
                "period": period.strftime("%Y-%m-%d %H:%M") if period else "",
                "order_count": order_count or 0,
                "ticket_count": ticket_count or 0,
                "revenue": float(revenue or 0),
                "refund_amount": float(refund_amount or 0),
                "refund_count": refund_count or 0,
                "net_revenue": float((revenue or 0) - (refund_amount or 0)),
            })
        return data

    @staticmethod
    async def get_event_report(db: AsyncSession, status: EventStatus = None,
                                start_date: datetime = None, end_date: datetime = None,
                                page: int = 1, page_size: int = 20) -> tuple:
        from app.utils import calc_offset
        offset = calc_offset(page, page_size)
        conditions = []
        if status:
            conditions.append(Event.status == status)
        if start_date:
            conditions.append(Event.start_time >= start_date)
        if end_date:
            conditions.append(Event.start_time <= end_date)
        count_q = select(func.count(Event.id))
        if conditions:
            count_q = count_q.where(and_(*conditions))
        total = (await db.execute(count_q)).scalar() or 0
        query = select(Event)
        if conditions:
            query = query.where(and_(*conditions))
        query = query.order_by(Event.start_time.desc()).offset(offset).limit(page_size)
        events_result = await db.execute(query)
        events = list(events_result.scalars().all())
        event_ids = [e.id for e in events]
        revenue_map = {}
        if event_ids:
            rev_result = await db.execute(select(
                Order.event_id,
                func.coalesce(func.sum(Order.pay_amount), 0),
                func.coalesce(func.sum(Order.refund_amount), 0),
                func.count(Order.id),
            ).where(and_(
                Order.event_id.in_(event_ids),
                Order.status == OrderStatus.PAID,
            )).group_by(Order.event_id))
            for eid, rev, ref, cnt in rev_result.all():
                revenue_map[eid] = {"revenue": float(rev), "refund": float(ref), "count": cnt}
        report_items = []
        for event in events:
            sold = event.sold_seats
            total = event.total_seats
            rev_data = revenue_map.get(event.id, {"revenue": 0, "refund": 0, "count": 0})
            report_items.append({
                "event_id": event.id,
                "event_code": event.code,
                "event_name": event.name,
                "artist": event.artist,
                "venue": event.venue,
                "event_date": event.start_time,
                "event_status": event.status.value,
                "total_seats": total,
                "sold_seats": sold,
                "reserved_seats": event.reserved_seats,
                "blocked_seats": event.blocked_seats,
                "occupancy_rate": calc_occupancy_rate(sold, total),
                "revenue": rev_data["revenue"],
                "refund_amount": rev_data["refund"],
                "net_amount": rev_data["revenue"] - rev_data["refund"],
                "order_count": rev_data["count"],
            })
        return report_items, total

    @staticmethod
    async def get_seat_occupancy(db: AsyncSession, event_id: int) -> List[dict]:
        result = await db.execute(select(
            Seat.area,
            func.count(Seat.id).label("total"),
            func.sum(case((Seat.status == SeatStatus.SOLD, 1), else_=0)).label("sold"),
            func.sum(case((Seat.status == SeatStatus.REFUNDED, 1), else_=0)).label("refunded"),
            func.sum(case((Seat.status == SeatStatus.RESERVED, 1), else_=0)).label("reserved"),
            func.sum(case((Seat.status == SeatStatus.BLOCKED, 1), else_=0)).label("blocked"),
            func.sum(case((Seat.status == SeatStatus.AVAILABLE, 1), else_=0)).label("available"),
            func.sum(case((Seat.status == SeatStatus.LOCKED, 1), else_=0)).label("locked"),
            func.coalesce(func.sum(case((Seat.status == SeatStatus.SOLD, Seat.current_price), else_=0)), 0).label("revenue"),
        ).where(Seat.event_id == event_id).group_by(Seat.area))
        rows = result.all()
        area_display = {
            SeatArea.VIP.value: "VIP区",
            SeatArea.FRONT.value: "前区",
            SeatArea.MIDDLE.value: "中区",
            SeatArea.BACK.value: "后区",
            SeatArea.STANDING.value: "站区",
        }
        data = []
        total_all = 0
        sold_all = 0
        revenue_all = 0.0
        for row in rows:
            area, total, sold, refunded, reserved, blocked, available, locked, revenue = row
            sold_count = sold
            total_all += total
            sold_all += sold_count
            revenue_all += float(revenue or 0)
            data.append({
                "area": area,
                "area_name": area_display.get(area, area),
                "total": total,
                "sold": sold_count,
                "refunded": refunded,
                "reserved": reserved,
                "blocked": blocked,
                "available": available,
                "locked": locked,
                "rate": calc_occupancy_rate(sold_count, total),
                "revenue": float(revenue or 0),
            })
        data.append({
            "area": "total",
            "area_name": "合计",
            "total": total_all,
            "sold": sold_all,
            "refunded": sum(d["refunded"] for d in data),
            "reserved": sum(d["reserved"] for d in data),
            "blocked": sum(d["blocked"] for d in data),
            "available": sum(d["available"] for d in data),
            "locked": sum(d["locked"] for d in data),
            "rate": calc_occupancy_rate(sold_all, total_all),
            "revenue": revenue_all,
        })
        return data

    @staticmethod
    async def get_order_drilldown(db: AsyncSession, start_date: datetime = None,
                                   end_date: datetime = None, event_id: int = None,
                                   status: OrderStatus = None, min_amount: float = None,
                                   max_amount: float = None, page: int = 1, page_size: int = 50):
        from app.services.order_service import OrderService
        return await OrderService.list_orders(
            db=db, event_id=event_id, status=status,
            start_date=start_date, end_date=end_date,
            page=page, page_size=page_size,
        )

    @staticmethod
    async def get_repeat_alert_report(db: AsyncSession, is_resolved: bool = None,
                                       event_id: int = None, page: int = 1, page_size: int = 20):
        from app.utils import calc_offset
        offset = calc_offset(page, page_size)
        conditions = []
        if is_resolved is not None:
            conditions.append(RepeatSeatAlert.is_resolved == is_resolved)
        if event_id:
            conditions.append(RepeatSeatAlert.event_id == event_id)
        count_q = select(func.count(RepeatSeatAlert.id))
        if conditions:
            count_q = count_q.where(and_(*conditions))
        total = (await db.execute(count_q)).scalar() or 0
        query = select(RepeatSeatAlert)
        if conditions:
            query = query.where(and_(*conditions))
        query = query.order_by(RepeatSeatAlert.last_attempt_at.desc()).offset(offset).limit(page_size)
        result = await db.execute(query)
        items = list(result.scalars().all())
        return items, total

    @staticmethod
    async def resolve_alert(db: AsyncSession, alert_id: int, resolution_note: str = None,
                             resolver_id: int = None):
        result = await db.execute(select(RepeatSeatAlert).where(RepeatSeatAlert.id == alert_id))
        alert = result.scalar_one_or_none()
        if not alert:
            raise HTTPException(status_code=404, detail="预警记录不存在")
        alert.is_resolved = True
        alert.resolved_at = now()
        alert.resolved_by = resolver_id
        alert.resolution_note = resolution_note
        await db.commit()
        await db.refresh(alert)
        return alert

    @staticmethod
    async def get_ticket_type_sales(db: AsyncSession, event_id: int) -> List[dict]:
        from app.models import TicketTypeConfig, TicketType
        result = await db.execute(select(
            TicketTypeConfig.id,
            TicketType.name,
            TicketType.type,
            TicketType.color,
            TicketTypeConfig.price,
            TicketTypeConfig.total_inventory,
            TicketTypeConfig.sold_count,
            TicketTypeConfig.reserved_count,
        ).select_from(TicketTypeConfig).join(
            TicketType, TicketType.id == TicketTypeConfig.ticket_type_id
        ).where(TicketTypeConfig.event_id == event_id))
        rows = result.all()
        data = []
        for ttid, name, ttype, color, price, total, sold, reserved in rows:
            available = max(0, total - sold - reserved)
            data.append({
                "ticket_type_config_id": ttid,
                "name": name,
                "type": ttype.value if hasattr(ttype, "value") else ttype,
                "color": color,
                "price": float(price),
                "total_inventory": total,
                "sold_count": sold,
                "reserved_count": reserved,
                "available_count": available,
                "sales_rate": calc_occupancy_rate(sold, total),
                "revenue": float(price * sold),
            })
        return data
