from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.schemas import (
    AppointmentResponse,
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentAssign,
    FollowUpResponse,
    FollowUpCreate,
    UserResponse
)
from app.services.auth import get_current_user, RoleChecker
from app.services.appointment_service import (
    get_appointment,
    get_appointments,
    create_appointment,
    update_appointment,
    assign_consultant,
    cancel_appointment,
    complete_appointment,
    add_follow_up,
    get_follow_ups,
    get_available_consultants
)
from app.models import User

router = APIRouter(prefix="/appointments", tags=["看房预约"])


@router.get("/", response_model=List[AppointmentResponse])
def list_appointments(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    apartment_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    consultant_id = None
    tenant_id = None

    if current_user.role == "consultant":
        consultant_id = current_user.id
    elif current_user.role == "tenant":
        tenant_id = current_user.id

    appointments = get_appointments(
        db, skip=skip, limit=limit,
        status=status, apartment_id=apartment_id,
        consultant_id=consultant_id, tenant_id=tenant_id,
        date_from=date_from, date_to=date_to,
        keyword=keyword
    )
    return appointments


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_detail(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "tenant" and appointment.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return appointment


@router.post("/", response_model=AppointmentResponse)
def create_new_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tenant_id = current_user.id if current_user.role == "tenant" else None
    return create_appointment(db, appointment, tenant_id)


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_existing_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "tenant" and appointment.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return update_appointment(db, appointment_id, appointment_update, current_user.id)


@router.post("/{appointment_id}/assign", response_model=AppointmentResponse)
def assign_appointment_consultant(
    appointment_id: int,
    assign_data: AppointmentAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "consultant"]))
):
    appointment = assign_consultant(db, appointment_id, assign_data.consultant_id, current_user.id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("/{appointment_id}/cancel")
def cancel_appointment_by_id(
    appointment_id: int,
    cancel_reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appointment = get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == "tenant" and appointment.tenant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    result = cancel_appointment(db, appointment_id, cancel_reason, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment cancelled successfully"}


@router.post("/{appointment_id}/complete")
def complete_appointment_by_id(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "consultant"]))
):
    appointment = complete_appointment(db, appointment_id, current_user.id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment completed successfully"}


@router.get("/{appointment_id}/follow-ups", response_model=List[FollowUpResponse])
def list_follow_ups(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_follow_ups(db, appointment_id)


@router.post("/{appointment_id}/follow-ups", response_model=FollowUpResponse)
def create_follow_up(
    appointment_id: int,
    follow_up: FollowUpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "consultant", "customer_service"]))
):
    follow_up.appointment_id = appointment_id
    return add_follow_up(db, follow_up, current_user.id)


@router.get("/consultants/available", response_model=List[UserResponse])
def list_available_consultants(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "consultant"]))
):
    return get_available_consultants(db)
