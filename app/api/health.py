from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, case, String, Integer, Date
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, is_test_user
from app.models.models import (
    HealthRecord, Vaccine, PetVaccine, PetVaccineAllergy,
    User, UserRole, HealthStatus, Pet, Store, Appointment
)
from app.schemas.schemas import (
    HealthRecordCreate, HealthRecordResponse,
    VaccineCreate, VaccineResponse,
    PetVaccineCreate, PetVaccineResponse,
    PetVaccineAllergyCreate, PetVaccineAllergyResponse,
    HealthStatsResponse
)

router = APIRouter(tags=["health"])


@router.get("/health-records", response_model=List[HealthRecordResponse])
async def list_health_records(
    pet_id: Optional[int] = None,
    store_id: Optional[int] = None,
    staff_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    exclude_test: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(HealthRecord)

    if current_user.role == UserRole.CUSTOMER:
        pet_ids = await db.execute(select(Pet.id).where(Pet.owner_id == current_user.id))
        query = query.where(HealthRecord.pet_id.in_([r[0] for r in pet_ids.all()]))
    else:
        if pet_id:
            query = query.where(HealthRecord.pet_id == pet_id)
        if store_id:
            query = query.where(HealthRecord.store_id == store_id)
        if staff_id:
            query = query.where(HealthRecord.staff_id == staff_id)

    if date_from:
        query = query.where(HealthRecord.record_date >= datetime.strptime(date_from, "%Y-%m-%d").date())
    if date_to:
        query = query.where(HealthRecord.record_date <= datetime.strptime(date_to, "%Y-%m-%d").date())
    if exclude_test and not is_test_user(current_user):
        query = query.where(HealthRecord.is_test_data == False)

    result = await db.execute(query.order_by(HealthRecord.record_date.desc()).offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/health-records", response_model=HealthRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_health_record(
    record_in: HealthRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    pet_result = await db.execute(select(Pet).where(Pet.id == record_in.pet_id))
    if not pet_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Pet not found")

    test_flag = is_test_user(current_user)

    record = HealthRecord(
        **record_in.model_dump(),
        staff_id=record_in.staff_id or current_user.id,
        is_test_data=test_flag,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/health-stats", response_model=List[HealthStatsResponse])
async def get_health_stats(
    group_by: str = "date",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    store_id: Optional[int] = None,
    exclude_test: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    has_store = "store" in group_by
    has_date = "date" in group_by
    has_reason = "reason" in group_by

    if not (has_store or has_date or has_reason):
        has_date = True

    select_cols = []
    group_cols = []

    if has_store:
        select_cols.append(HealthRecord.store_id)
        select_cols.append(Store.name.label("store_name"))
        select_cols.append(User.full_name.label("manager_name"))
        group_cols.append(HealthRecord.store_id)
        group_cols.append(Store.name)
        group_cols.append(User.full_name)
    else:
        select_cols.append(func.cast(None, Integer).label("store_id"))
        select_cols.append(func.cast(None, String).label("store_name"))
        select_cols.append(func.cast(None, String).label("manager_name"))

    if has_date:
        select_cols.append(HealthRecord.record_date.label("date"))
        group_cols.append(HealthRecord.record_date)
    else:
        select_cols.append(func.cast(None, Date).label("date"))

    if has_reason:
        select_cols.append(HealthRecord.abnormal_reason)
        group_cols.append(HealthRecord.abnormal_reason)
    else:
        select_cols.append(func.cast(None, String).label("abnormal_reason"))

    select_cols += [
        func.count(HealthRecord.id).label("total_count"),
        func.sum(case((HealthRecord.health_status == HealthStatus.ABNORMAL, 1), else_=0)).label("abnormal_count"),
        func.sum(case((HealthRecord.health_status == HealthStatus.CRITICAL, 1), else_=0)).label("critical_count"),
    ]

    query = select(*select_cols)
    if has_store:
        query = query.outerjoin(Store, HealthRecord.store_id == Store.id)
        query = query.outerjoin(User, Store.manager_id == User.id)

    if exclude_test and not is_test_user(current_user):
        query = query.where(HealthRecord.is_test_data == False)
    if store_id:
        query = query.where(HealthRecord.store_id == store_id)
    if date_from:
        query = query.where(HealthRecord.record_date >= datetime.strptime(date_from, "%Y-%m-%d").date())
    if date_to:
        query = query.where(HealthRecord.record_date <= datetime.strptime(date_to, "%Y-%m-%d").date())

    query = query.group_by(*group_cols)
    query = query.order_by(
        (func.sum(case((HealthRecord.health_status == HealthStatus.ABNORMAL, 1), else_=0)) +
         func.sum(case((HealthRecord.health_status == HealthStatus.CRITICAL, 1), else_=0))).desc()
    )

    result = await db.execute(query)
    rows = result.all()

    stats = []
    for row in rows:
        row_dict = dict(row._mapping)
        stats.append(HealthStatsResponse(**row_dict))
    return stats


@router.get("/vaccines", response_model=List[VaccineResponse])
async def list_vaccines(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Vaccine).where(Vaccine.is_active == True))
    return result.scalars().all()


@router.post("/vaccines", response_model=VaccineResponse, status_code=status.HTTP_201_CREATED)
async def create_vaccine(
    vaccine_in: VaccineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    vaccine = Vaccine(**vaccine_in.model_dump())
    db.add(vaccine)
    await db.commit()
    await db.refresh(vaccine)
    return vaccine


@router.get("/pet-vaccines", response_model=List[PetVaccineResponse])
async def list_pet_vaccines(
    pet_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(PetVaccine)
    if pet_id:
        query = query.where(PetVaccine.pet_id == pet_id)
    result = await db.execute(query)
    rows = result.all()

    responses = []
    for pv in [r[0] for r in rows]:
        pv_dict = {c.name: getattr(pv, c.name) for c in pv.__table__.columns}
        v_result = await db.execute(select(Vaccine.name).where(Vaccine.id == pv.vaccine_id))
        pv_dict["vaccine_name"] = v_result.scalar_one_or_none()
        responses.append(PetVaccineResponse(**pv_dict))
    return responses


@router.post("/pet-vaccines", response_model=PetVaccineResponse, status_code=status.HTTP_201_CREATED)
async def create_pet_vaccine(
    pv_in: PetVaccineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    pv = PetVaccine(**pv_in.model_dump())
    db.add(pv)
    await db.commit()
    await db.refresh(pv)

    pv_dict = {c.name: getattr(pv, c.name) for c in pv.__table__.columns}
    v_result = await db.execute(select(Vaccine.name).where(Vaccine.id == pv.vaccine_id))
    pv_dict["vaccine_name"] = v_result.scalar_one_or_none()
    return PetVaccineResponse(**pv_dict)


@router.get("/pet-allergies", response_model=List[PetVaccineAllergyResponse])
async def list_pet_allergies(
    pet_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(PetVaccineAllergy)
    if pet_id:
        query = query.where(PetVaccineAllergy.pet_id == pet_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/pet-allergies", response_model=PetVaccineAllergyResponse, status_code=status.HTTP_201_CREATED)
async def create_pet_allergy(
    allergy_in: PetVaccineAllergyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    allergy = PetVaccineAllergy(**allergy_in.model_dump())
    db.add(allergy)
    await db.commit()
    await db.refresh(allergy)
    return allergy
