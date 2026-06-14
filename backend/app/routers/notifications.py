from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import User
from app.schemas.schemas import PaginatedResponse
from app.services.auth_service import get_current_user
from app.services.notification_service import (
    get_notifications,
    mark_notification_as_read,
)

router = APIRouter(prefix="/api/notifications", tags=["通知管理"])


@router.get("", response_model=PaginatedResponse)
async def list_notifications(
    page: int = 1,
    page_size: int = 10,
    is_read: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_notifications(
        db, user_id=current_user.id, page=page, page_size=page_size, is_read=is_read
    )


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = await mark_notification_as_read(
        db, notification_id, current_user.id
    )
    if not notification:
        return {"ok": False, "message": "通知不存在或无权操作"}
    return {"ok": True, "message": "已标记为已读"}
