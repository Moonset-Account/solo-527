import uuid
from datetime import date
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.refund import (
    RefundCreate,
    RefundListResponse,
    RefundResponse,
    RefundUpdate,
)


class RefundService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_refunds(
        self,
        ar_record_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        applicant: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> RefundListResponse:
        from app.models.refund import Refund

        query = select(Refund)
        count_query = select(func.count()).select_from(Refund)

        if ar_record_id:
            query = query.where(Refund.ar_record_id == ar_record_id)
            count_query = count_query.where(Refund.ar_record_id == ar_record_id)
        if status:
            query = query.where(Refund.status == status)
            count_query = count_query.where(Refund.status == status)
        if date_from:
            query = query.where(Refund.created_at >= date_from)
            count_query = count_query.where(Refund.created_at >= date_from)
        if date_to:
            query = query.where(Refund.created_at <= date_to)
            count_query = count_query.where(Refund.created_at <= date_to)
        if applicant:
            query = query.where(Refund.applicant.ilike(f"%{applicant}%"))
            count_query = count_query.where(Refund.applicant.ilike(f"%{applicant}%"))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(Refund.created_at.desc())

        result = await self.db.execute(query)
        refunds = result.scalars().all()

        items = [RefundResponse.model_validate(r) for r in refunds]
        return RefundListResponse(items=items, total=total, page=page, page_size=page_size)

    async def get_refund(self, refund_id: uuid.UUID) -> Optional[RefundResponse]:
        from app.models.refund import Refund

        result = await self.db.execute(select(Refund).where(Refund.id == refund_id))
        refund = result.scalar_one_or_none()
        if not refund:
            return None
        return RefundResponse.model_validate(refund)

    async def create_refund(self, data: RefundCreate) -> RefundResponse:
        from app.models.refund import Refund

        refund = Refund(**data.model_dump())
        self.db.add(refund)
        await self.db.commit()
        await self.db.refresh(refund)
        return RefundResponse.model_validate(refund)

    async def update_refund(self, refund_id: uuid.UUID, data: RefundUpdate) -> Optional[RefundResponse]:
        from app.models.refund import Refund

        result = await self.db.execute(select(Refund).where(Refund.id == refund_id))
        refund = result.scalar_one_or_none()
        if not refund:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(refund, key, value)

        await self.db.commit()
        await self.db.refresh(refund)
        return RefundResponse.model_validate(refund)

    async def review_refund(
        self,
        refund_id: uuid.UUID,
        reviewer: str,
        status: str,
        review_note: Optional[str] = None,
    ) -> Optional[RefundResponse]:
        from app.models.refund import Refund

        result = await self.db.execute(select(Refund).where(Refund.id == refund_id))
        refund = result.scalar_one_or_none()
        if not refund:
            return None

        refund.reviewer = reviewer
        refund.status = status
        if review_note:
            refund.review_note = review_note

        await self.db.commit()
        await self.db.refresh(refund)
        return RefundResponse.model_validate(refund)
