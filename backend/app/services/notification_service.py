from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Notification
from app.schemas.schemas import PaginatedResponse
from app.services.base import model_to_dict


async def get_notifications(
    db: AsyncSession,
    user_id: int,
    page: int = 1,
    page_size: int = 10,
    is_read: Optional[bool] = None,
) -> PaginatedResponse:
    query = select(Notification).where(Notification.user_id == user_id)
    count_query = select(func.count()).select_from(Notification).where(
        Notification.user_id == user_id
    )
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
        count_query = count_query.where(Notification.is_read == is_read)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    query = query.order_by(Notification.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    notifications = result.scalars().all()
    return PaginatedResponse(
        items=[model_to_dict(n) for n in notifications], total=total, page=page, page_size=page_size
    )


async def mark_notification_as_read(
    db: AsyncSession, notification_id: int, user_id: int
) -> Optional[Notification]:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )
    notification = result.scalar_one_or_none()
    if notification:
        notification.is_read = True
        await db.flush()
    return notification
