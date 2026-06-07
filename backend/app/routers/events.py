from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models import (
    SafetyEvent, User, Checkpoint, EventStatus,
    EventLevel, NotificationStatus, UserRole
)
from app.schemas import (
    Event as EventSchema, EventCreate, EventUpdate,
    EventListResponse
)
from app.auth import require_authenticated, require_teacher, require_project_manager

router = APIRouter(prefix="/api/events", tags=["events"])


def event_to_schema(event: SafetyEvent) -> EventSchema:
    handle_duration = None
    if event.closed_at and event.actual_occurred_at:
        delta = event.closed_at - event.actual_occurred_at
        minutes = int(delta.total_seconds() / 60)
        handle_duration = max(minutes, 0)
    
    return EventSchema(
        id=event.id,
        title=event.title,
        description=event.description,
        level=event.level,
        status=event.status,
        checkpoint_id=event.checkpoint_id,
        checkpoint_name=event.checkpoint.name if event.checkpoint else None,
        teacher_id=event.teacher_id,
        teacher_name=event.teacher.name if event.teacher else None,
        reviewer_id=event.reviewer_id,
        reviewer_name=event.reviewer.name if event.reviewer else None,
        actual_occurred_at=event.actual_occurred_at,
        recorded_at=event.recorded_at,
        confirmed_at=event.confirmed_at,
        closed_at=event.closed_at,
        notification_status=event.notification_status,
        notification_attempts=event.notification_attempts,
        location_lat=float(event.location_lat) if event.location_lat else None,
        location_lng=float(event.location_lng) if event.location_lng else None,
        original_record_url=event.original_record_url,
        handle_duration_minutes=handle_duration,
        created_at=event.created_at,
        updated_at=event.updated_at
    )


@router.get("", response_model=EventListResponse)
def get_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[EventStatus] = None,
    level: Optional[EventLevel] = None,
    teacher_id: Optional[UUID] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    query = db.query(SafetyEvent)
    
    if current_user.role == UserRole.TEACHER:
        query = query.filter(SafetyEvent.teacher_id == current_user.id)
    
    if status:
        query = query.filter(SafetyEvent.status == status)
    if level:
        query = query.filter(SafetyEvent.level == level)
    if teacher_id:
        query = query.filter(SafetyEvent.teacher_id == teacher_id)
    if start_date:
        query = query.filter(SafetyEvent.actual_occurred_at >= start_date)
    if end_date:
        query = query.filter(SafetyEvent.actual_occurred_at <= end_date)
    
    total = query.count()
    events = query.order_by(desc(SafetyEvent.actual_occurred_at))\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return EventListResponse(
        items=[event_to_schema(e) for e in events],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/pending-notifications", response_model=List[EventSchema])
def get_pending_notifications(
    current_user: User = Depends(require_project_manager),
    db: Session = Depends(get_db)
):
    events = db.query(SafetyEvent)\
        .filter(SafetyEvent.notification_status == NotificationStatus.FAILED)\
        .order_by(desc(SafetyEvent.actual_occurred_at))\
        .all()
    return [event_to_schema(e) for e in events]


@router.get("/{event_id}", response_model=EventSchema)
def get_event(
    event_id: UUID,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    event = db.query(SafetyEvent).filter(SafetyEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user.role == UserRole.TEACHER and event.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return event_to_schema(event)


@router.post("", response_model=EventSchema, status_code=status.HTTP_201_CREATED)
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    checkpoint = db.query(Checkpoint).filter(Checkpoint.id == event_data.checkpoint_id).first()
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
    
    event = SafetyEvent(
        title=event_data.title,
        description=event_data.description,
        level=event_data.level,
        checkpoint_id=event_data.checkpoint_id,
        teacher_id=current_user.id,
        actual_occurred_at=event_data.actual_occurred_at,
        location_lat=event_data.location_lat if event_data.location_lat else checkpoint.lat,
        location_lng=event_data.location_lng if event_data.location_lng else checkpoint.lng,
        original_record_url=event_data.original_record_url,
        recorded_at=datetime.utcnow()
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return event_to_schema(event)


@router.put("/{event_id}", response_model=EventSchema)
def update_event(
    event_id: UUID,
    event_data: EventUpdate,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    event = db.query(SafetyEvent).filter(SafetyEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user.role == UserRole.TEACHER and event.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if event_data.reviewer_id and current_user.role != UserRole.PROJECT_MANAGER:
        raise HTTPException(status_code=403, detail="Only project manager can assign reviewer")
    
    update_data = event_data.model_dump(exclude_unset=True)
    
    if event_data.status == EventStatus.PROCESSING and not event.confirmed_at:
        update_data["confirmed_at"] = datetime.utcnow()
    
    if event_data.status == EventStatus.CLOSED and not event.closed_at:
        update_data["closed_at"] = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(event, key, value)
    
    db.commit()
    db.refresh(event)
    
    return event_to_schema(event)


@router.post("/{event_id}/confirm", response_model=EventSchema)
def confirm_event(
    event_id: UUID,
    current_user: User = Depends(require_project_manager),
    db: Session = Depends(get_db)
):
    event = db.query(SafetyEvent).filter(SafetyEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.status = EventStatus.PROCESSING
    event.confirmed_at = datetime.utcnow()
    event.reviewer_id = current_user.id
    
    db.commit()
    db.refresh(event)
    
    return event_to_schema(event)


@router.post("/{event_id}/close", response_model=EventSchema)
def close_event(
    event_id: UUID,
    current_user: User = Depends(require_project_manager),
    db: Session = Depends(get_db)
):
    event = db.query(SafetyEvent).filter(SafetyEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.status = EventStatus.CLOSED
    event.closed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(event)
    
    return event_to_schema(event)
