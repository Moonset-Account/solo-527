import uuid
from typing import List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from fastapi import HTTPException

from app.models import RefundRequest, Order, OrderItem, Seat, Event
from app.enums import RefundStatus, OrderStatus, SeatStatus, EventStatus
from app.schemas.common import RefundRequestCreate, RefundReview
from app.services.order_service import OrderService
from app.services.seat_lock import seat_lock_service
from app.utils import now


class RefundService:
    @staticmethod
    def _generate_refund_no() -> str:
        return f"RFD{now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:8].upper()}"

    @staticmethod
    async def create_request(db: AsyncSession, data: RefundRequestCreate, user_id: int) -> RefundRequest:
        order = await OrderService.get_order(db, order_id=data.order_id)
        if order.user_id != user_id:
            raise HTTPException(status_code=403, detail="无权操作此订单")
        if order.status not in (OrderStatus.PAID, OrderStatus.COMPLETED):
            raise HTTPException(status_code=400, detail="订单状态不支持退款")
        event_result = await db.execute(select(Event).where(Event.id == order.event_id))
        event = event_result.scalar_one_or_none()
        if event and event.refund_deadline and now() > event.refund_deadline:
            raise HTTPException(status_code=400, detail="已超过退款截止时间")
        items_result = await db.execute(select(OrderItem).where(and_(
            OrderItem.order_id == order.id,
            OrderItem.seat_id.in_(data.seat_ids),
            OrderItem.is_refunded == False,
        )))
        items = list(items_result.scalars().all())
        if len(items) != len(data.seat_ids):
            raise HTTPException(status_code=400, detail="部分座位不支持退款")
        total_refund = sum(item.sale_price for item in items)
        if data.refund_amount > total_refund or data.refund_amount <= 0:
            raise HTTPException(status_code=400, detail=f"退款金额不正确，最大可退 {total_refund}")
        existing_result = await db.execute(select(RefundRequest).where(and_(
            RefundRequest.order_id == order.id,
            RefundRequest.status.in_([RefundStatus.PENDING, RefundStatus.APPROVED]),
        )))
        if existing_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="该订单已有进行中的退款申请")
        request = RefundRequest(
            refund_no=RefundService._generate_refund_no(),
            order_id=order.id,
            user_id=user_id,
            status=RefundStatus.PENDING,
            refund_amount=data.refund_amount,
            fee_amount=0,
            actual_amount=data.refund_amount,
            reason=data.reason,
            seat_ids=data.seat_ids,
        )
        db.add(request)
        order.status = OrderStatus.REFUND_PENDING
        await db.commit()
        await db.refresh(request)
        return request

    @staticmethod
    async def review(db: AsyncSession, refund_id: int, data: RefundReview,
                     reviewer_id: int) -> RefundRequest:
        result = await db.execute(select(RefundRequest).where(RefundRequest.id == refund_id))
        request = result.scalar_one_or_none()
        if not request:
            raise HTTPException(status_code=404, detail="退款申请不存在")
        if request.status != RefundStatus.PENDING:
            raise HTTPException(status_code=400, detail="该申请已处理")
        if data.approved:
            fee = data.fee_amount or 0
            actual = max(0, request.refund_amount - fee)
            request.status = RefundStatus.APPROVED
            request.fee_amount = fee
            request.actual_amount = actual
            request.review_remark = data.review_remark
            request.reviewed_by = reviewer_id
            request.reviewed_at = now()
            request.status = RefundStatus.COMPLETED
            request.refund_method = request.order.payment_method if request.order else None
            request.refund_trade_no = f"RFND{uuid.uuid4().hex[:16].upper()}"
            request.refunded_at = now()
            request.completed_at = now()
            items_result = await db.execute(select(OrderItem).where(and_(
                OrderItem.order_id == request.order_id,
                OrderItem.seat_id.in_(request.seat_ids),
            )))
            items = list(items_result.scalars().all())
            for item in items:
                item.is_refunded = True
                item.refunded_at = now()
                item.refund_amount = actual / len(items) if items else 0
            seats_result = await db.execute(select(Seat).where(Seat.id.in_(request.seat_ids)).with_for_update())
            seats = list(seats_result.scalars().all())
            for seat in seats:
                seat.status = SeatStatus.REFUNDED
            order_result = await db.execute(select(Order).where(Order.id == request.order_id))
            order = order_result.scalar_one_or_none()
            if order:
                order.refund_amount += actual
                all_items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
                all_items = list(all_items_result.scalars().all())
                if all(item.is_refunded for item in all_items):
                    order.status = OrderStatus.REFUNDED
                else:
                    order.status = OrderStatus.PAID
            await OrderService._update_event_stats(db, request.order.event_id if request.order else 0)
            await seat_lock_service.invalidate_event_cache(request.order.event_id if request.order else 0)
        else:
            request.status = RefundStatus.REJECTED
            request.review_remark = data.review_remark
            request.reviewed_by = reviewer_id
            request.reviewed_at = now()
            order_result = await db.execute(select(Order).where(Order.id == request.order_id))
            order = order_result.scalar_one_or_none()
            if order and order.status == OrderStatus.REFUND_PENDING:
                order.status = OrderStatus.PAID
        await db.commit()
        await db.refresh(request)
        return request

    @staticmethod
    async def list_requests(db: AsyncSession, status: RefundStatus = None,
                            user_id: int = None, event_id: int = None,
                            page: int = 1, page_size: int = 20, keyword: str = None):
        from app.utils import calc_offset
        from sqlalchemy import or_
        offset = calc_offset(page, page_size)
        query = select(RefundRequest)
        count_query = select(func.count(RefundRequest.id))
        conditions = []
        if status:
            conditions.append(RefundRequest.status == status)
        if user_id:
            conditions.append(RefundRequest.user_id == user_id)
        if event_id:
            conditions.append(RefundRequest.order.has(Order.event_id == event_id))
        if keyword:
            conditions.append(or_(
                RefundRequest.refund_no.ilike(f"%{keyword}%"),
                RefundRequest.order.has(Order.order_no.ilike(f"%{keyword}%")),
            ))
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        query = query.order_by(RefundRequest.created_at.desc()).offset(offset).limit(page_size)
        result = await db.execute(query)
        items = list(result.scalars().all())
        return items, total

    @staticmethod
    async def get_detail(db: AsyncSession, refund_id: int) -> RefundRequest:
        result = await db.execute(select(RefundRequest).where(RefundRequest.id == refund_id))
        request = result.scalar_one_or_none()
        if not request:
            raise HTTPException(status_code=404, detail="退款申请不存在")
        return request
