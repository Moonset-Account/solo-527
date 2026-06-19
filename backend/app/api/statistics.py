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
    event_count = crud_event.count(db)
    active_events = crud_event.count(db, is_active=True)
    inactive_events = event_count - active_events

    total_registrations = crud_registration.count(db)
    confirmed_count = crud_registration.count(db, status=RegistrationStatus.CONFIRMED)
    refunded_count = crud_registration.count(db, status=RegistrationStatus.REFUNDED)
    refund_exception_count = crud_registration.count(db, status=RegistrationStatus.REFUND_EXCEPTION)

    total_checkins = crud_checkin.count(db)
    success_checkins = crud_checkin.count(db, status=CheckInStatus.SUCCESS)

    pending_todos = crud_todo.count(db, status=TodoStatus.PENDING)
    processing_todos = crud_todo.count(db, status=TodoStatus.PROCESSING)
    total_todos = crud_todo.count(db)

    pending_refund_exceptions = crud_refund_exception.count(db, status=RefundExceptionStatus.PENDING)

    return {
        "events": {
            "total": event_count,
            "active": active_events,
            "inactive": inactive_events,
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
            "total": total_todos,
        },
        "refund_exceptions": {
            "pending": pending_refund_exceptions,
        },
    }
