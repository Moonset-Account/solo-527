from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models import Appointment, FollowUp, User
from app.schemas import AppointmentCreate, AppointmentUpdate, AppointmentAssign, FollowUpCreate


def get_appointment(db: Session, appointment_id: int) -> Optional[Appointment]:
    return db.query(Appointment).filter(Appointment.id == appointment_id).first()


def get_appointments(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    apartment_id: Optional[int] = None,
    tenant_id: Optional[int] = None,
    consultant_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    keyword: Optional[str] = None,
) -> List[Appointment]:
    query = db.query(Appointment)

    if status:
        query = query.filter(Appointment.status == status)
    if apartment_id:
        query = query.filter(Appointment.apartment_id == apartment_id)
    if tenant_id:
        query = query.filter(Appointment.tenant_id == tenant_id)
    if consultant_id:
        query = query.filter(Appointment.consultant_id == consultant_id)
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)
    if keyword:
        query = query.filter(
            (Appointment.tenant_name.contains(keyword)) |
            (Appointment.tenant_phone.contains(keyword))
        )

    return query.order_by(Appointment.created_at.desc()).offset(skip).limit(limit).all()


def count_appointments(
    db: Session,
    status: Optional[str] = None,
    consultant_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> int:
    query = db.query(func.count(Appointment.id))

    if status:
        query = query.filter(Appointment.status == status)
    if consultant_id:
        query = query.filter(Appointment.consultant_id == consultant_id)
    if date_from:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to:
        query = query.filter(Appointment.appointment_date <= date_to)

    return query.scalar()


def create_appointment(db: Session, appointment: AppointmentCreate, tenant_id: int = None) -> Appointment:
    appointment_data = appointment.model_dump()
    if tenant_id:
        appointment_data["tenant_id"] = tenant_id
    db_appointment = Appointment(**appointment_data)
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def update_appointment(
    db: Session,
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    operator_id: int = None
) -> Optional[Appointment]:
    db_appointment = get_appointment(db, appointment_id)
    if not db_appointment:
        return None

    update_data = appointment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_appointment, field, value)

    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def assign_consultant(
    db: Session,
    appointment_id: int,
    consultant_id: int,
    operator_id: int = None
) -> Optional[Appointment]:
    db_appointment = get_appointment(db, appointment_id)
    if not db_appointment:
        return None

    db_appointment.consultant_id = consultant_id
    if db_appointment.status == "pending":
        db_appointment.status = "confirmed"
    db.commit()
    db.refresh(db_appointment)

    add_follow_up(db, FollowUpCreate(
        appointment_id=appointment_id,
        follow_type="assign",
        content=f"分配顾问，顾问ID: {consultant_id}"
    ), operator_id)

    return db_appointment


def cancel_appointment(
    db: Session,
    appointment_id: int,
    cancel_reason: str,
    operator_id: int = None
) -> Optional[Appointment]:
    db_appointment = get_appointment(db, appointment_id)
    if not db_appointment:
        return None

    db_appointment.status = "cancelled"
    db_appointment.cancel_reason = cancel_reason
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def complete_appointment(
    db: Session,
    appointment_id: int,
    operator_id: int = None
) -> Optional[Appointment]:
    db_appointment = get_appointment(db, appointment_id)
    if not db_appointment:
        return None

    db_appointment.status = "completed"
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def add_follow_up(
    db: Session,
    follow_up: FollowUpCreate,
    operator_id: int
) -> FollowUp:
    db_follow = FollowUp(
        **follow_up.model_dump(),
        operator_id=operator_id
    )
    db.add(db_follow)
    db.commit()
    db.refresh(db_follow)
    return db_follow


def get_follow_ups(db: Session, appointment_id: int, limit: int = 50) -> List[FollowUp]:
    return (
        db.query(FollowUp)
        .filter(FollowUp.appointment_id == appointment_id)
        .order_by(FollowUp.created_at.desc())
        .limit(limit)
        .all()
    )


def get_available_consultants(db: Session) -> List[User]:
    return (
        db.query(User)
        .filter(User.role == "consultant", User.is_active == True)
        .order_by(User.full_name.asc())
        .all()
    )


def get_today_appointments(db: Session, consultant_id: int = None) -> int:
    today = date.today()
    query = db.query(func.count(Appointment.id)).filter(Appointment.appointment_date == today)
    if consultant_id:
        query = query.filter(Appointment.consultant_id == consultant_id)
    return query.scalar()
