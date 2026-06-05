from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...database import get_db
from ...security import get_current_user
from ... import crud, schemas, models

router = APIRouter()


@router.get("", response_model=List[schemas.Notification])
def read_notifications(
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if unread_only:
        return crud.notification.get_unread_by_user(
            db, user_id=current_user.id, skip=skip, limit=limit
        )
    return crud.notification.get_all_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    count = crud.notification.count_unread(db, user_id=current_user.id)
    return {"count": count}


@router.put("/{notification_id}/read", response_model=schemas.Notification)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notification = crud.notification.mark_as_read(
        db, notification_id=notification_id, user_id=current_user.id
    )
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")
    return notification


@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    count = crud.notification.mark_all_as_read(db, user_id=current_user.id)
    return {"message": f"已标记 {count} 条通知为已读"}
