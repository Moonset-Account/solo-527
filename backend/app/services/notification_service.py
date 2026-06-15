from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_notifications(self, user_id: int):
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        )
        notifications = result.scalars().all()
        return [
            {
                "id": n.id,
                "event_id": n.event_id,
                "user_id": n.user_id,
                "type": n.type,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifications
        ]

    async def mark_read(self, notification_id: int, user_id: int):
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        notif = result.scalar_one_or_none()
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")
        if notif.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not your notification")
        notif.is_read = True
        await self.db.commit()
        return {"id": notif.id, "is_read": True}

    async def create_notification(
        self, event_id: int | None, user_id: int, type: str, message: str
    ):
        notif = Notification(
            event_id=event_id, user_id=user_id, type=type, message=message
        )
        self.db.add(notif)
        await self.db.commit()
        await self.db.refresh(notif)
        return notif
