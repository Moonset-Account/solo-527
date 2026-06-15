import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, update
from fastapi import HTTPException, status

from app.models import Order, OrderItem, Seat, Event, Payment, RefundRequest
from app.enums import (
    OrderStatus, SeatStatus, PaymentMethod, RefundStatus, EventStatus
)
from app.services.seat_lock import seat_lock_service
from app.schemas.common import OrderCreate, PaymentCreate
from app.utils import now


class OrderService:
    @staticmethod
    def _generate_order_no() -> str:
        return f"ORD{now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:8].upper()}"

    @staticmethod
    def _generate_payment_no() -> str:
        return f"PAY{now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:8].upper()}"

    @staticmethod
    def _generate_ticket_no() -> str:
        return f"TKT{now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

    @staticmethod
    async def create_order(db: AsyncSession, user_id: int, data: OrderCreate, lock_key: str) -> Order:
        if not data.seat_ids:
            raise HTTPException(status_code=400, detail="请选择座位")
        event_result = await db.execute(select(Event).where(Event.id == data.event_id))
        event = event_result.scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="场次不存在")
        if event.requires_registration:
            from app.models import Registration, RegistrationStatus
            reg_result = await db.execute(select(Registration).where(and_(
                Registration.event_id == data.event_id,
                Registration.user_id == user_id,
                Registration.status == RegistrationStatus.APPROVED,
            )))
            if not reg_result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="请先完成报名审核")
        seat_result = await db.execute(
            select(Seat).where(and_(
                Seat.id.in_(data.seat_ids),
                Seat.event_id == data.event_id,
                Seat.status == SeatStatus.LOCKED,
                Seat.lock_key == lock_key,
            )).with_for_update()
        )
        seats = list(seat_result.scalars().all())
        if len(seats) != len(data.seat_ids):
            raise HTTPException(status_code=400, detail="座位锁定状态无效，请重新选座")
        total_amount = sum(s.current_price for s in seats)
        order = Order(
            order_no=OrderService._generate_order_no(),
            user_id=user_id,
            event_id=data.event_id,
            status=OrderStatus.PENDING,
            total_amount=total_amount,
            discount_amount=0,
            pay_amount=total_amount,
            refund_amount=0,
            ticket_count=len(seats),
            contact_name=data.contact_name,
            contact_phone=data.contact_phone,
            contact_email=data.contact_email,
            remark=data.remark,
        )
        db.add(order)
        await db.flush()
        for seat in seats:
            order_item = OrderItem(
                order_id=order.id,
                seat_id=seat.id,
                ticket_type_config_id=seat.ticket_type_config_id,
                seat_code=seat.seat_code,
                area=seat.area,
                row=seat.row,
                col=seat.col,
                original_price=seat.base_price,
                sale_price=seat.current_price,
                discount_amount=0,
                refund_amount=0,
                is_refunded=False,
                checked_in=False,
            )
            db.add(order_item)
        await db.commit()
        await db.refresh(order)
        return order

    @staticmethod
    async def get_order(db: AsyncSession, order_id: int = None, order_no: str = None, user_id: int = None) -> Order:
        query = select(Order)
        if order_id:
            query = query.where(Order.id == order_id)
        elif order_no:
            query = query.where(Order.order_no == order_no)
        else:
            raise HTTPException(status_code=400, detail="请提供订单ID或编号")
        if user_id:
            query = query.where(Order.user_id == user_id)
        result = await db.execute(query)
        order = result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        return order

    @staticmethod
    async def process_payment(db: AsyncSession, data: PaymentCreate, user_id: int = None) -> Order:
        order = await OrderService.get_order(db, order_id=data.order_id)
        if user_id and order.user_id != user_id:
            raise HTTPException(status_code=403, detail="无权操作此订单")
        if order.status == OrderStatus.PAID:
            return order
        if order.status not in (OrderStatus.PENDING, OrderStatus.CONFIRMED):
            raise HTTPException(status_code=400, detail=f"订单状态为 {order.status}，无法支付")
        seat_ids = []
        order_items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
        items = list(order_items_result.scalars().all())
        for item in items:
            seat_ids.append(item.seat_id)
        lock_query = select(Seat).where(and_(
            Seat.id.in_(seat_ids),
            Seat.status == SeatStatus.LOCKED,
        ))
        locked_seats_result = await db.execute(lock_query)
        locked_seats = list(locked_seats_result.scalars().all())
        for seat in locked_seats:
            seat.status = SeatStatus.SOLD
            seat.order_id = order.id
            seat.lock_key = None
            seat.locked_at = None
            seat.lock_expires_at = None
        available_seats_result = await db.execute(select(Seat).where(and_(
            Seat.id.in_(seat_ids),
            Seat.status == SeatStatus.AVAILABLE,
        )).with_for_update())
        available = list(available_seats_result.scalars().all())
        for seat in available:
            seat.status = SeatStatus.SOLD
            seat.order_id = order.id
        payment = Payment(
            payment_no=OrderService._generate_payment_no(),
            order_id=order.id,
            amount=data.amount if data.amount else order.pay_amount,
            method=data.payment_method,
            trade_no=f"MOCK{uuid.uuid4().hex[:16].upper()}" if data.payment_method != PaymentMethod.FREE else None,
            status="success",
            paid_at=now(),
        )
        db.add(payment)
        for item in items:
            if not item.ticket_no:
                item.ticket_no = OrderService._generate_ticket_no()
        order.status = OrderStatus.PAID
        order.payment_method = data.payment_method
        order.payment_trade_no = payment.trade_no
        order.paid_at = now()
        await db.commit()
        await OrderService._update_event_stats(db, order.event_id)
        await seat_lock_service.invalidate_event_cache(order.event_id)
        await db.refresh(order)
        return order

    @staticmethod
    async def cancel_order(db: AsyncSession, order_id: int, reason: str = None,
                            user_id: int = None, admin: bool = False) -> Order:
        order = await OrderService.get_order(db, order_id=order_id)
        if not admin and user_id and order.user_id != user_id:
            raise HTTPException(status_code=403, detail="无权操作此订单")
        if order.status in (OrderStatus.CANCELLED, OrderStatus.REFUNDED):
            return order
        if order.status in (OrderStatus.COMPLETED,):
            raise HTTPException(status_code=400, detail="订单已完成，不能取消")
        if order.status == OrderStatus.PAID and not admin:
            raise HTTPException(status_code=400, detail="已支付订单请走退款流程")
        order_items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
        items = list(order_items_result.scalars().all())
        seat_ids = [item.seat_id for item in items]
        if seat_ids:
            seats_result = await db.execute(select(Seat).where(Seat.id.in_(seat_ids)).with_for_update())
            seats = list(seats_result.scalars().all())
            for seat in seats:
                if seat.status in (SeatStatus.SOLD, SeatStatus.LOCKED, SeatStatus.RESERVED):
                    seat.status = SeatStatus.AVAILABLE
                    seat.order_id = None
                    seat.lock_key = None
        order.status = OrderStatus.CANCELLED
        order.cancel_reason = reason
        order.cancelled_at = now()
        await db.commit()
        await OrderService._update_event_stats(db, order.event_id)
        await seat_lock_service.invalidate_event_cache(order.event_id)
        await db.refresh(order)
        return order

    @staticmethod
    async def _update_event_stats(db: AsyncSession, event_id: int):
        sold_result = await db.execute(select(func.count(Seat.id)).where(and_(
            Seat.event_id == event_id,
            Seat.status.in_([SeatStatus.SOLD, SeatStatus.REFUNDED]),
        )))
        sold = sold_result.scalar() or 0
        reserved_result = await db.execute(select(func.count(Seat.id)).where(and_(
            Seat.event_id == event_id,
            Seat.status == SeatStatus.RESERVED,
        )))
        reserved = reserved_result.scalar() or 0
        blocked_result = await db.execute(select(func.count(Seat.id)).where(and_(
            Seat.event_id == event_id,
            Seat.status == SeatStatus.BLOCKED,
        )))
        blocked = blocked_result.scalar() or 0
        total_result = await db.execute(select(func.count(Seat.id)).where(Seat.event_id == event_id))
        total = total_result.scalar() or 0
        event_status = None
        if sold + reserved + blocked >= total and total > 0:
            event_status = EventStatus.SOLD_OUT
        await db.execute(update(Event).where(Event.id == event_id).values(
            total_seats=total,
            sold_seats=sold,
            reserved_seats=reserved,
            blocked_seats=blocked,
            status=event_status if event_status else Event.status,
        ))
        await db.commit()

    @staticmethod
    async def list_orders(db: AsyncSession, user_id: int = None, event_id: int = None,
                          status: OrderStatus = None, start_date: datetime = None,
                          end_date: datetime = None, page: int = 1, page_size: int = 20,
                          keyword: str = None):
        from app.utils import calc_offset
        offset = calc_offset(page, page_size)
        query = select(Order)
        count_query = select(func.count(Order.id))
        conditions = []
        if user_id:
            conditions.append(Order.user_id == user_id)
        if event_id:
            conditions.append(Order.event_id == event_id)
        if status:
            conditions.append(Order.status == status)
        if start_date:
            conditions.append(Order.created_at >= start_date)
        if end_date:
            conditions.append(Order.created_at <= end_date)
        if keyword:
            conditions.append(or_(
                Order.order_no.ilike(f"%{keyword}%"),
                Order.contact_name.ilike(f"%{keyword}%"),
                Order.contact_phone.ilike(f"%{keyword}%"),
            ))
        if conditions:
            from sqlalchemy import or_ as _or
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        query = query.order_by(Order.created_at.desc()).offset(offset).limit(page_size)
        result = await db.execute(query)
        items = list(result.scalars().all())
        return items, total
