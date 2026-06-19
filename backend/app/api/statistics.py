from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_operator
from app.crud import crud_registration, crud_checkin, crud_event, crud_device, crud_todo, crud_refund_exception
from app.models.user import User
from app.models.registration import RegistrationStatus
from app.models.checkin import CheckInStatus
from app.models.todo import TodoStatus
from app.models.refund_exception import RefundExceptionStatus

router = APIRouter(prefix="/statistics", tags=["统计"])


@router.get("/event/{event_id}")
def get_event_statistics(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    event = crud_event.get(db, id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )
    
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
    refund_exception_count = crud_registration.count_by_event(
        db, event_id=event_id, status=RegistrationStatus.REFUND_EXCEPTION
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
            "location": event.location,
            "start_date": str(event.start_date) if event.start_date else None,
            "is_active": event.is_active,
        },
        "registrations": {
            "total": total_registrations,
            "confirmed": confirmed_registrations,
            "cancelled": cancelled_registrations,
            "refunded": refunded_registrations,
            "refund_exception": refund_exception_count,
            "attendance_rate": round(success_checkins / confirmed_registrations * 100, 2) if confirmed_registrations > 0 else 0,
        },
        "checkins": {
            "total": total_checkins,
            "success": success_checkins,
            "duplicate": total_checkins - success_checkins,
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
    _, event_count = crud_event.get_multi(db, limit=1)
    
    total_registrations = db.query(crud_registration.model).count()
    confirmed_count = db.query(crud_registration.model).filter(
        crud_registration.model.status == RegistrationStatus.CONFIRMED
    ).count()
    refunded_count = db.query(crud_registration.model).filter(
        crud_registration.model.status == RegistrationStatus.REFUNDED
    ).count()
    refund_exception_count = db.query(crud_registration.model).filter(
        crud_registration.model.status == RegistrationStatus.REFUND_EXCEPTION
    ).count()
    
    total_checkins = db.query(crud_checkin.model).count()
    success_checkins = db.query(crud_checkin.model).filter(
        crud_checkin.model.status == CheckInStatus.SUCCESS
    ).count()
    
    pending_todos = db.query(crud_todo.model).filter(
        crud_todo.model.status == TodoStatus.PENDING
    ).count()
    processing_todos = db.query(crud_todo.model).filter(
        crud_todo.model.status == TodoStatus.PROCESSING
    ).count()
    
    pending_refund_exceptions = db.query(crud_refund_exception.model).filter(
        crud_refund_exception.model.status == RefundExceptionStatus.PENDING
    ).count()
    
    active_events = db.query(crud_event.model).filter(
        crud_event.model.is_active == True
    ).count()
    
    return {
        "events": {
            "total": event_count,
            "active": active_events,
            "inactive": event_count - active_events,
        },
        "registrations": {
            "total": total_registrations,
            "confirmed": confirmed_count,
            "refunded": refunded_count,
            "refund_exception": refund_exception_count,
        },
        "checkins": {
            "total": total_checkins,
            "success": success_checkins,
        },
        "todos": {
            "pending": pending_todos,
            "processing": processing_todos,
            "total": pending_todos + processing_todos,
        },
        "refund_exceptions": {
            "pending": pending_refund_exceptions,
        },
    }
