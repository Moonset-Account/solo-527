from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user_from_request
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(request: Request, db: AsyncSession = Depends(get_db)):
    user = await get_current_user_from_request(request, db)
    svc = NotificationService(db)
    return await svc.list_notifications(user.id)


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: int, request: Request, db: AsyncSession = Depends(get_db)
):
    user = await get_current_user_from_request(request, db)
    svc = NotificationService(db)
    return await svc.mark_read(notification_id, user.id)


@router.post("/read-all")
async def mark_all_read(request: Request, db: AsyncSession = Depends(get_db)):
    user = await get_current_user_from_request(request, db)
    svc = NotificationService(db)
    result = await db.execute(
        select(Notification).where(Notification.user_id == user.id, Notification.is_read == False)
    )
    notifications = result.scalars().all()
    for n in notifications:
        n.is_read = True
    await db.commit()
    return {"ok": True, "count": len(notifications)}
