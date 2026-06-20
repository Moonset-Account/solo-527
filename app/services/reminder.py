from __future__ import annotations
import uuid
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Reminder, ReminderVersion


class ReminderService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.version_service = ReminderVersionService(session)

    async def list(self, reminder_type: str | None = None, offset: int = 0, limit: int = 20) -> list[Reminder]:
        stmt = select(Reminder)
        if reminder_type:
            stmt = stmt.where(Reminder.reminder_type == reminder_type)
        stmt = stmt.order_by(Reminder.created_at.desc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Reminder:
        kwargs["id"] = kwargs.get("id", uuid.uuid4().hex)
        kwargs["created_at"] = datetime.utcnow()
        kwargs["updated_at"] = datetime.utcnow()
        reminder = Reminder(**kwargs)
        self.session.add(reminder)
        await self.session.flush()
        await self.version_service.create_version_snapshot(reminder)
        return reminder

    async def update(self, reminder_id: str, **kwargs) -> Reminder | None:
        stmt = select(Reminder).where(Reminder.id == reminder_id)
        result = await self.session.execute(stmt)
        reminder = result.scalar_one_or_none()
        if not reminder:
            return None
        kwargs["updated_at"] = datetime.utcnow()
        for key, value in kwargs.items():
            setattr(reminder, key, value)
        await self.session.flush()
        await self.version_service.create_version_snapshot(reminder)
        return reminder

    async def toggle_active(self, reminder_id: str) -> Reminder | None:
        stmt = select(Reminder).where(Reminder.id == reminder_id)
        result = await self.session.execute(stmt)
        reminder = result.scalar_one_or_none()
        if not reminder:
            return None
        reminder.is_active = not reminder.is_active
        reminder.updated_at = datetime.utcnow()
        await self.session.flush()
        await self.version_service.create_version_snapshot(reminder)
        return reminder

    async def rollback(self, reminder_id: str, version_id: str) -> Reminder | None:
        stmt = select(Reminder).where(Reminder.id == reminder_id)
        result = await self.session.execute(stmt)
        reminder = result.scalar_one_or_none()
        if not reminder:
            return None
        version_stmt = select(ReminderVersion).where(ReminderVersion.id == version_id, ReminderVersion.reminder_id == reminder_id)
        version_result = await self.session.execute(version_stmt)
        version = version_result.scalar_one_or_none()
        if not version:
            return None
        reminder.reminder_type = version.reminder_type
        reminder.title = version.title
        reminder.content = version.content
        reminder.trigger_at = version.trigger_at
        reminder.is_active = version.is_active
        reminder.notes = version.notes
        reminder.updated_at = datetime.utcnow()
        await self.session.flush()
        await self.version_service.create_version_snapshot(reminder)
        return reminder

    async def get_pending(self) -> list[Reminder]:
        now = datetime.utcnow()
        stmt = (
            select(Reminder)
            .where(Reminder.is_active == True, Reminder.is_sent == False, Reminder.trigger_at <= now)
            .order_by(Reminder.trigger_at)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())


class ReminderVersionService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_by_reminder(self, reminder_id: str) -> list[ReminderVersion]:
        stmt = select(ReminderVersion).where(ReminderVersion.reminder_id == reminder_id).order_by(ReminderVersion.version.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def _get_next_version(self, reminder_id: str) -> int:
        stmt = select(func.max(ReminderVersion.version)).where(ReminderVersion.reminder_id == reminder_id)
        result = await self.session.execute(stmt)
        max_version = result.scalar()
        return (max_version or 0) + 1

    async def create_version_snapshot(self, reminder: Reminder, operated_by: str | None = None) -> ReminderVersion:
        version_num = await self._get_next_version(reminder.id)
        version = ReminderVersion(
            id=uuid.uuid4().hex,
            reminder_id=reminder.id,
            tenant_id=reminder.tenant_id,
            reminder_type=reminder.reminder_type,
            title=reminder.title,
            content=reminder.content,
            trigger_at=reminder.trigger_at,
            is_active=reminder.is_active,
            notes=reminder.notes,
            version=version_num,
            operated_by=operated_by,
            created_at=datetime.utcnow(),
        )
        self.session.add(version)
        await self.session.flush()
        return version
