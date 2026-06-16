import uuid
from datetime import date
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.writeoff import (
    WriteoffCreate,
    WriteoffListResponse,
    WriteoffResponse,
    WriteoffUpdate,
)


class WriteoffService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_writeoffs(
        self,
        status: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        operator: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> WriteoffListResponse:
        from app.models.writeoff import Writeoff

        query = select(Writeoff)
        count_query = select(func.count()).select_from(Writeoff)

        if status:
            query = query.where(Writeoff.status == status)
            count_query = count_query.where(Writeoff.status == status)
        if date_from:
            query = query.where(Writeoff.created_at >= date_from)
            count_query = count_query.where(Writeoff.created_at >= date_from)
        if date_to:
            query = query.where(Writeoff.created_at <= date_to)
            count_query = count_query.where(Writeoff.created_at <= date_to)
        if operator:
            query = query.where(Writeoff.operator.ilike(f"%{operator}%"))
            count_query = count_query.where(Writeoff.operator.ilike(f"%{operator}%"))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(Writeoff.created_at.desc())

        result = await self.db.execute(query)
        writeoffs = result.scalars().all()

        items = [WriteoffResponse.model_validate(w) for w in writeoffs]
        return WriteoffListResponse(items=items, total=total, page=page, page_size=page_size)

    async def get_writeoff(self, writeoff_id: uuid.UUID) -> Optional[WriteoffResponse]:
        from app.models.writeoff import Writeoff

        result = await self.db.execute(select(Writeoff).where(Writeoff.id == writeoff_id))
        writeoff = result.scalar_one_or_none()
        if not writeoff:
            return None
        return WriteoffResponse.model_validate(writeoff)

    async def create_writeoff(self, data: WriteoffCreate) -> WriteoffResponse:
        from app.models.writeoff import Writeoff

        writeoff = Writeoff(**data.model_dump())
        self.db.add(writeoff)
        await self.db.commit()
        await self.db.refresh(writeoff)
        return WriteoffResponse.model_validate(writeoff)

    async def update_writeoff(self, writeoff_id: uuid.UUID, data: WriteoffUpdate) -> Optional[WriteoffResponse]:
        from app.models.writeoff import Writeoff

        result = await self.db.execute(select(Writeoff).where(Writeoff.id == writeoff_id))
        writeoff = result.scalar_one_or_none()
        if not writeoff:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(writeoff, key, value)

        await self.db.commit()
        await self.db.refresh(writeoff)
        return WriteoffResponse.model_validate(writeoff)

    async def approve_writeoff(self, writeoff_id: uuid.UUID, approver: str) -> Optional[WriteoffResponse]:
        from app.models.writeoff import Writeoff

        result = await self.db.execute(select(Writeoff).where(Writeoff.id == writeoff_id))
        writeoff = result.scalar_one_or_none()
        if not writeoff:
            return None

        writeoff.approver = approver
        writeoff.status = "approved"

        await self.db.commit()
        await self.db.refresh(writeoff)
        return WriteoffResponse.model_validate(writeoff)
