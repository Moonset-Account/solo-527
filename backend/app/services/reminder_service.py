import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.reminder import (
    ReminderCreate,
    ReminderListResponse,
    ReminderResponse,
    ReminderUpdate,
)


class ReminderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_reminders(
        self,
        assigned_to: Optional[str] = None,
        status: Optional[str] = None,
        type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> ReminderListResponse:
        from app.models.reminder import Reminder

        query = select(Reminder)
        count_query = select(func.count()).select_from(Reminder)

        if assigned_to:
            query = query.where(Reminder.assigned_to.ilike(f"%{assigned_to}%"))
            count_query = count_query.where(Reminder.assigned_to.ilike(f"%{assigned_to}%"))
        if status:
            query = query.where(Reminder.status == status)
            count_query = count_query.where(Reminder.status == status)
        if type:
            query = query.where(Reminder.type == type)
            count_query = count_query.where(Reminder.type == type)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(Reminder.created_at.desc())

        result = await self.db.execute(query)
        reminders = result.scalars().all()

        items = [ReminderResponse.model_validate(r) for r in reminders]
        return ReminderListResponse(items=items, total=total, page=page, page_size=page_size)

    async def get_reminder(self, reminder_id: uuid.UUID) -> Optional[ReminderResponse]:
        from app.models.reminder import Reminder

        result = await self.db.execute(select(Reminder).where(Reminder.id == reminder_id))
        reminder = result.scalar_one_or_none()
        if not reminder:
            return None
        return ReminderResponse.model_validate(reminder)

    async def create_reminder(self, data: ReminderCreate) -> ReminderResponse:
        from app.models.reminder import Reminder

        reminder = Reminder(**data.model_dump())
        self.db.add(reminder)
        await self.db.commit()
        await self.db.refresh(reminder)
        return ReminderResponse.model_validate(reminder)

    async def update_reminder(self, reminder_id: uuid.UUID, data: ReminderUpdate) -> Optional[ReminderResponse]:
        from app.models.reminder import Reminder

        result = await self.db.execute(select(Reminder).where(Reminder.id == reminder_id))
        reminder = result.scalar_one_or_none()
        if not reminder:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(reminder, key, value)

        await self.db.commit()
        await self.db.refresh(reminder)
        return ReminderResponse.model_validate(reminder)

    async def escalate_reminder(self, reminder_id: uuid.UUID, escalated_to: str) -> Optional[ReminderResponse]:
        from app.models.reminder import Reminder

        result = await self.db.execute(select(Reminder).where(Reminder.id == reminder_id))
        reminder = result.scalar_one_or_none()
        if not reminder:
            return None

        reminder.status = "escalated"
        reminder.escalated_at = datetime.utcnow()
        reminder.escalated_to = escalated_to

        await self.db.commit()
        await self.db.refresh(reminder)
        return ReminderResponse.model_validate(reminder)
