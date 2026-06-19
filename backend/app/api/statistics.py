from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_operator
from app.crud import crud_registration, crud_checkin, crud_event, crud_device, crud_todo
from app.models.user import User
from app.models.registration import RegistrationStatus
from app.models.checkin import CheckInStatus
from app.models.todo import TodoStatus

router = APIRouter(prefix="/statistics", tags=["统计"])


@router.get("/event/{event_id}")
def get_event_statistics(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    event = crud_event.get(db, id=event_id)
    if not event:
        return {"error": "活动不存在"}
    
    total_registrations = crud_registration.count_by_event(db, event_id=event_id)
    confirmed_registrations = crud_registration.count_by_event(
        db, event_id=event_id, status=RegistrationStatus.CONFIRMED
    )
    cancelled_registrations = crud_registration.count_by_event(
        db, event_id=event_id, status=RegistrationStatus.CANCELLED
    )
    refunded_registrations = crud_registration.count_by_event(
        db, event_id=event_id, status=RegistrationStatus.REFUNDED
    )
    
    total_checkins = crud_checkin.count_by_event(db, event_id=event_id)
    success_checkins = crud_checkin.count_by_event(
        db, event_id=event_id, status=CheckInStatus.SUCCESS
    )
    
    devices, device_count = crud_device.get_multi_by_event(db, event_id=event_id, limit=100)
    
    return {
        "event": {
            "id": event.id,
            "name": event.name,
        },
        "registrations": {
            "total": total_registrations,
            "confirmed": confirmed_registrations,
            "cancelled": cancelled_registrations,
            "refunded": refunded_registrations,
            "attendance_rate": round(success_checkins / confirmed_registrations * 100, 2) if confirmed_registrations > 0 else 0,
        },
        "checkins": {
            "total": total_checkins,
            "success": success_checkins,
        },
        "devices": {
            "total": device_count,
        },
    }


@router.get("/overview")
def get_overview_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    events, event_count = crud_event.get_multi(db, limit=100)
    
    total_registrations = db.query(crud_registration.model).count()
    total_checkins = db.query(crud_checkin.model).count()
    
    pending_todos = db.query(crud_todo.model).filter(
        crud_todo.model.status == TodoStatus.PENDING
    ).count()
    
    active_events = db.query(crud_event.model).filter(
        crud_event.model.is_active == True
    ).count()
    
    return {
        "events": {
            "total": event_count,
            "active": active_events,
        },
        "registrations": {
            "total": total_registrations,
        },
        "checkins": {
            "total": total_checkins,
        },
        "todos": {
            "pending": pending_todos,
        },
    }
