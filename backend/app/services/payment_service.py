import uuid
from datetime import date
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.payment import (
    PaymentCreate,
    PaymentListResponse,
    PaymentResponse,
    PaymentUpdate,
)


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_payments(
        self,
        ar_record_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        operator: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaymentListResponse:
        from app.models.payment import Payment

        query = select(Payment)
        count_query = select(func.count()).select_from(Payment)

        if ar_record_id:
            query = query.where(Payment.ar_record_id == ar_record_id)
            count_query = count_query.where(Payment.ar_record_id == ar_record_id)
        if status:
            query = query.where(Payment.status == status)
            count_query = count_query.where(Payment.status == status)
        if date_from:
            query = query.where(Payment.payment_date >= date_from)
            count_query = count_query.where(Payment.payment_date >= date_from)
        if date_to:
            query = query.where(Payment.payment_date <= date_to)
            count_query = count_query.where(Payment.payment_date <= date_to)
        if operator:
            query = query.where(Payment.operator.ilike(f"%{operator}%"))
            count_query = count_query.where(Payment.operator.ilike(f"%{operator}%"))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(Payment.created_at.desc())

        result = await self.db.execute(query)
        payments = result.scalars().all()

        items = [PaymentResponse.model_validate(p) for p in payments]
        return PaymentListResponse(items=items, total=total, page=page, page_size=page_size)

    async def get_payment(self, payment_id: uuid.UUID) -> Optional[PaymentResponse]:
        from app.models.payment import Payment

        result = await self.db.execute(select(Payment).where(Payment.id == payment_id))
        payment = result.scalar_one_or_none()
        if not payment:
            return None
        return PaymentResponse.model_validate(payment)

    async def create_payment(self, data: PaymentCreate) -> PaymentResponse:
        from app.models.payment import Payment

        payment = Payment(**data.model_dump())
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        return PaymentResponse.model_validate(payment)

    async def update_payment(self, payment_id: uuid.UUID, data: PaymentUpdate) -> Optional[PaymentResponse]:
        from app.models.payment import Payment

        result = await self.db.execute(select(Payment).where(Payment.id == payment_id))
        payment = result.scalar_one_or_none()
        if not payment:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(payment, key, value)

        await self.db.commit()
        await self.db.refresh(payment)
        return PaymentResponse.model_validate(payment)
