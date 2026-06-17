from datetime import datetime, timedelta, time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, is_test_user
from app.models.models import (
    Appointment, AppointmentService, AppointmentPackage, AppointmentStaff,
    Service, Package, User, UserRole, AppointmentStatus, Staff, Pet
)
from app.schemas.schemas import (
    AppointmentCreate, AppointmentResponse,
    AppointmentServiceResponse, StaffAssign
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _calculate_end_time(start_time: time, total_minutes: int) -> time:
    start_dt = datetime.combine(datetime.today(), start_time)
    end_dt = start_dt + timedelta(minutes=total_minutes)
    return end_dt.time()


@router.get("", response_model=List[AppointmentResponse])
async def list_appointments(
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    store_id: Optional[int] = None,
    status: Optional[AppointmentStatus] = None,
    exclude_test: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Appointment)

    if current_user.role == UserRole.CUSTOMER:
        query = query.where(Appointment.customer_id == current_user.id)
    elif store_id:
        query = query.where(Appointment.store_id == store_id)

    if date_from:
        query = query.where(Appointment.appointment_date >= datetime.strptime(date_from, "%Y-%m-%d").date())
    if date_to:
        query = query.where(Appointment.appointment_date <= datetime.strptime(date_to, "%Y-%m-%d").date())
    if status:
        query = query.where(Appointment.status == status)
    if exclude_test and not is_test_user(current_user):
        query = query.where(Appointment.is_test_data == False)

    result = await db.execute(query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc()).offset(skip).limit(limit))
    appointments = result.scalars().all()
    return await _enrich_appointments(appointments, db)


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appt_in: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer_id = current_user.id

    pet_result = await db.execute(select(Pet).where(Pet.id == appt_in.pet_id))
    pet = pet_result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    if current_user.role == UserRole.CUSTOMER and pet.owner_id != customer_id:
        raise HTTPException(status_code=403, detail="Not authorized to book for this pet")

    total_minutes = 0
    total_price = 0.0
    appointment_services = []

    for svc_in in appt_in.services:
        svc_result = await db.execute(select(Service).where(Service.id == svc_in.service_id))
        service = svc_result.scalar_one_or_none()
        if not service or not service.is_active:
            raise HTTPException(status_code=404, detail=f"Service {svc_in.service_id} not found")
        total_minutes += service.duration_minutes
        total_price += service.price
        appointment_services.append((service, service.price))

    for pkg_in in appt_in.packages:
        pkg_result = await db.execute(select(Package).where(Package.id == pkg_in.package_id))
        package = pkg_result.scalar_one_or_none()
        if not package or not package.is_active:
            raise HTTPException(status_code=404, detail=f"Package {pkg_in.package_id} not found")

    if total_minutes == 0:
        total_minutes = 60

    end_time = _calculate_end_time(appt_in.start_time, total_minutes)

    test_flag = is_test_user(current_user)

    appointment = Appointment(
        customer_id=customer_id,
        pet_id=appt_in.pet_id,
        store_id=appt_in.store_id,
        appointment_date=appt_in.appointment_date,
        start_time=appt_in.start_time,
        end_time=end_time,
        notes=appt_in.notes,
        total_price=total_price,
        is_test_data=test_flag,
    )
    db.add(appointment)
    await db.flush()

    for service, price in appointment_services:
        db.add(AppointmentService(
            appointment_id=appointment.id,
            service_id=service.id,
            price_at_time=price,
        ))

    for pkg_in in appt_in.packages:
        db.add(AppointmentPackage(
            appointment_id=appointment.id,
            package_id=pkg_in.package_id,
            user_package_id=pkg_in.user_package_id,
            price_at_time=0,
        ))

    await db.commit()
    await db.refresh(appointment)

    enriched = await _enrich_appointments([appointment], db)
    return enriched[0]


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == UserRole.CUSTOMER and appointment.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    enriched = await _enrich_appointments([appointment], db)
    return enriched[0]


@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: int,
    new_status: AppointmentStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = new_status
    await db.commit()
    await db.refresh(appointment)

    enriched = await _enrich_appointments([appointment], db)
    return enriched[0]


@router.post("/{appointment_id}/assign-staff")
async def assign_staff(
    appointment_id: int,
    staff_assign: StaffAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    staff_result = await db.execute(select(Staff).where(Staff.id == staff_assign.staff_id))
    staff = staff_result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    existing = await db.execute(select(AppointmentStaff).where(
        and_(
            AppointmentStaff.appointment_id == appointment_id,
            AppointmentStaff.staff_id == staff_assign.staff_id,
        )
    ))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Staff already assigned")

    db.add(AppointmentStaff(
        appointment_id=appointment_id,
        staff_id=staff_assign.staff_id,
        role=staff_assign.role,
    ))
    await db.commit()
    return {"message": "Staff assigned successfully"}


async def _enrich_appointments(appointments: List[Appointment], db: AsyncSession) -> List[AppointmentResponse]:
    responses = []
    for appt in appointments:
        appt_dict = {c.name: getattr(appt, c.name) for c in appt.__table__.columns}

        svc_result = await db.execute(
            select(AppointmentService, Service.name).join(
                Service, AppointmentService.service_id == Service.id
            ).where(AppointmentService.appointment_id == appt.id)
        )
        services_data = svc_result.all()
        appt_dict["services"] = [
            AppointmentServiceResponse(
                id=aps.id,
                service_id=aps.service_id,
                service_name=name,
                price_at_time=aps.price_at_time,
            )
            for aps, name in services_data
        ]

        if appt.pet_id:
            pet_result = await db.execute(select(Pet.name).where(Pet.id == appt.pet_id))
            pet_name = pet_result.scalar_one_or_none()
            appt_dict["pet_name"] = pet_name

        responses.append(AppointmentResponse(**appt_dict))
    return responses
