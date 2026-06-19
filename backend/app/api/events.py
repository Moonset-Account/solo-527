from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_operator
from app.schemas.event import EventCreate, EventUpdate, EventResponse, EventListResponse
from app.crud import crud_event
from app.models.user import User

router = APIRouter(prefix="/events", tags=["活动管理"])


@router.get("", response_model=EventListResponse)
def list_events(
    page: int = 1,
    page_size: int = 20,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    skip = (page - 1) * page_size
    items, total = crud_event.get_multi(db, skip=skip, limit=page_size, is_active=is_active)
    return {"total": total, "items": items}


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = crud_event.get(db, id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )
    return event


@router.post("", response_model=EventResponse)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    event = crud_event.create(db, obj_in=event_in)
    return event


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    event = crud_event.get(db, id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )
    event = crud_event.update(db, db_obj=event, obj_in=event_in)
    return event
