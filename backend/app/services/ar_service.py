import uuid
from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.ar_record import (
    ARRecordCreate,
    ARRecordListResponse,
    ARRecordResponse,
    ARRecordSummary,
    ARRecordUpdate,
)


class ARService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_records(
        self,
        customer_name: Optional[str] = None,
        status: Optional[str] = None,
        responsible_person: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> ARRecordListResponse:
        from app.models.ar_record import ARRecord

        query = select(ARRecord)
        count_query = select(func.count()).select_from(ARRecord)

        if customer_name:
            query = query.where(ARRecord.customer_name.ilike(f"%{customer_name}%"))
            count_query = count_query.where(ARRecord.customer_name.ilike(f"%{customer_name}%"))
        if status:
            query = query.where(ARRecord.status == status)
            count_query = count_query.where(ARRecord.status == status)
        if responsible_person:
            query = query.where(ARRecord.responsible_person.ilike(f"%{responsible_person}%"))
            count_query = count_query.where(ARRecord.responsible_person.ilike(f"%{responsible_person}%"))
        if date_from:
            query = query.where(ARRecord.due_date >= date_from)
            count_query = count_query.where(ARRecord.due_date >= date_from)
        if date_to:
            query = query.where(ARRecord.due_date <= date_to)
            count_query = count_query.where(ARRecord.due_date <= date_to)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(ARRecord.created_at.desc())

        result = await self.db.execute(query)
        records = result.scalars().all()

        items = []
        for record in records:
            resp = ARRecordResponse.model_validate(record)
            resp.paid_amount = await self._compute_paid_amount(record.id)
            items.append(resp)

        return ARRecordListResponse(items=items, total=total, page=page, page_size=page_size)

    async def get_record(self, record_id: uuid.UUID) -> Optional[ARRecordResponse]:
        from app.models.ar_record import ARRecord

        result = await self.db.execute(select(ARRecord).where(ARRecord.id == record_id))
        record = result.scalar_one_or_none()
        if not record:
            return None
        resp = ARRecordResponse.model_validate(record)
        resp.paid_amount = await self._compute_paid_amount(record.id)
        return resp

    async def create_record(self, data: ARRecordCreate) -> ARRecordResponse:
        from app.models.ar_record import ARRecord

        record = ARRecord(**data.model_dump())
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)
        resp = ARRecordResponse.model_validate(record)
        resp.paid_amount = Decimal("0")
        return resp

    async def update_record(self, record_id: uuid.UUID, data: ARRecordUpdate) -> Optional[ARRecordResponse]:
        from app.models.ar_record import ARRecord

        result = await self.db.execute(select(ARRecord).where(ARRecord.id == record_id))
        record = result.scalar_one_or_none()
        if not record:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(record, key, value)

        await self.db.commit()
        await self.db.refresh(record)
        resp = ARRecordResponse.model_validate(record)
        resp.paid_amount = await self._compute_paid_amount(record.id)
        return resp

    async def get_summary(self) -> list[ARRecordSummary]:
        from app.models.ar_record import ARRecord

        query = select(ARRecord)
        result = await self.db.execute(query)
        records = result.scalars().all()

        summary_map: dict[str, ARRecordSummary] = {}
        for record in records:
            if record.customer_name not in summary_map:
                summary_map[record.customer_name] = ARRecordSummary(
                    customer_name=record.customer_name,
                    total_amount=Decimal("0"),
                    paid_amount=Decimal("0"),
                    outstanding_amount=Decimal("0"),
                    status=record.status.value if hasattr(record.status, "value") else str(record.status),
                )
            summary_map[record.customer_name].total_amount += record.amount

        for customer_name, summary in summary_map.items():
            paid = await self._compute_paid_amount_by_customer(customer_name)
            summary.paid_amount = paid
            summary.outstanding_amount = summary.total_amount - paid

        return list(summary_map.values())

    async def drilldown(self, customer_name: str) -> list[ARRecordResponse]:
        from app.models.ar_record import ARRecord

        query = select(ARRecord).where(ARRecord.customer_name == customer_name).order_by(ARRecord.created_at.desc())
        result = await self.db.execute(query)
        records = result.scalars().all()

        items = []
        for record in records:
            resp = ARRecordResponse.model_validate(record)
            resp.paid_amount = await self._compute_paid_amount(record.id)
            items.append(resp)
        return items

    async def _compute_paid_amount(self, ar_record_id: uuid.UUID) -> Decimal:
        from app.models.payment import Payment

        result = await self.db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.ar_record_id == ar_record_id,
                Payment.status == "confirmed",
            )
        )
        return Decimal(str(result.scalar() or 0))

    async def _compute_paid_amount_by_customer(self, customer_name: str) -> Decimal:
        from app.models.ar_record import ARRecord
        from app.models.payment import Payment

        subq = select(ARRecord.id).where(ARRecord.customer_name == customer_name)
        result = await self.db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.ar_record_id.in_(subq),
                Payment.status == "confirmed",
            )
        )
        return Decimal(str(result.scalar() or 0))
