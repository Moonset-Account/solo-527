from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles, is_test_user
from app.models.models import (
    Cage, Boarding, Store, Staff, User, UserRole,
    CageStatus, BoardingStatus, Pet
)
from app.schemas.schemas import (
    CageCreate, CageResponse,
    BoardingCreate, BoardingResponse,
    StaffCreate, StaffResponse,
    StoreCreate, StoreResponse
)

router = APIRouter(tags=["admin"])


@router.get("/stores", response_model=List[StoreResponse])
async def list_stores(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Store))
    return result.scalars().all()


@router.post("/stores", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    store_in: StoreCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    store = Store(**store_in.model_dump())
    db.add(store)
    await db.commit()
    await db.refresh(store)
    return store


@router.get("/cages", response_model=List[CageResponse])
async def list_cages(
    store_id: Optional[int] = None,
    status: Optional[CageStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    query = select(Cage).where(Cage.is_active == True)
    if store_id:
        query = query.where(Cage.store_id == store_id)
    if status:
        query = query.where(Cage.status == status)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/cages", response_model=CageResponse, status_code=status.HTTP_201_CREATED)
async def create_cage(
    cage_in: CageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    cage = Cage(**cage_in.model_dump())
    db.add(cage)
    await db.commit()
    await db.refresh(cage)
    return cage


@router.patch("/cages/{cage_id}/status", response_model=CageResponse)
async def update_cage_status(
    cage_id: int,
    new_status: CageStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    result = await db.execute(select(Cage).where(Cage.id == cage_id))
    cage = result.scalar_one_or_none()
    if not cage:
        raise HTTPException(status_code=404, detail="Cage not found")
    cage.status = new_status
    await db.commit()
    await db.refresh(cage)
    return cage


@router.get("/staff", response_model=List[StaffResponse])
async def list_staff(
    store_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    query = select(Staff).where(Staff.is_active == True)
    if store_id:
        query = query.where(Staff.store_id == store_id)
    result = await db.execute(query)
    staff_list = result.scalars().all()

    responses = []
    for s in staff_list:
        s_dict = {c.name: getattr(s, c.name) for c in s.__table__.columns}
        user_result = await db.execute(select(User).where(User.id == s.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            from app.schemas.schemas import UserResponse
            s_dict["user"] = UserResponse.model_validate(user)
        responses.append(StaffResponse(**s_dict))
    return responses


@router.post("/staff", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(
    staff_in: StaffCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    staff = Staff(**staff_in.model_dump())
    db.add(staff)
    await db.commit()
    await db.refresh(staff)

    s_dict = {c.name: getattr(staff, c.name) for c in staff.__table__.columns}
    user_result = await db.execute(select(User).where(User.id == staff.user_id))
    user = user_result.scalar_one_or_none()
    if user:
        from app.schemas.schemas import UserResponse
        s_dict["user"] = UserResponse.model_validate(user)
    return StaffResponse(**s_dict)


@router.get("/boardings", response_model=List[BoardingResponse])
async def list_boardings(
    store_id: Optional[int] = None,
    status: Optional[BoardingStatus] = None,
    exclude_test: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    query = select(Boarding)
    if store_id:
        query = query.where(Boarding.store_id == store_id)
    if status:
        query = query.where(Boarding.status == status)
    if exclude_test and not is_test_user(current_user):
        query = query.where(Boarding.is_test_data == False)

    result = await db.execute(query.order_by(Boarding.check_in_date.desc()))
    return result.scalars().all()


@router.post("/boardings", response_model=BoardingResponse, status_code=status.HTTP_201_CREATED)
async def create_boarding(
    boarding_in: BoardingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    cage_result = await db.execute(select(Cage).where(Cage.id == boarding_in.cage_id))
    cage = cage_result.scalar_one_or_none()
    if not cage:
        raise HTTPException(status_code=404, detail="Cage not found")
    if cage.status != CageStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Cage is not available")

    pet_result = await db.execute(select(Pet).where(Pet.id == boarding_in.pet_id))
    if not pet_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Pet not found")

    test_flag = is_test_user(current_user)

    boarding = Boarding(
        **boarding_in.model_dump(),
        is_test_data=test_flag,
    )
    cage.status = CageStatus.RESERVED
    db.add(boarding)
    await db.commit()
    await db.refresh(boarding)
    return boarding


@router.patch("/boardings/{boarding_id}/checkin", response_model=BoardingResponse)
async def check_in_boarding(
    boarding_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    result = await db.execute(select(Boarding).where(Boarding.id == boarding_id))
    boarding = result.scalar_one_or_none()
    if not boarding:
        raise HTTPException(status_code=404, detail="Boarding not found")

    cage_result = await db.execute(select(Cage).where(Cage.id == boarding.cage_id))
    cage = cage_result.scalar_one_or_none()

    boarding.status = BoardingStatus.CHECKED_IN
    boarding.actual_check_in = datetime.utcnow()
    if cage:
        cage.status = CageStatus.OCCUPIED

    await db.commit()
    await db.refresh(boarding)
    return boarding


@router.patch("/boardings/{boarding_id}/checkout", response_model=BoardingResponse)
async def check_out_boarding(
    boarding_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)),
):
    result = await db.execute(select(Boarding).where(Boarding.id == boarding_id))
    boarding = result.scalar_one_or_none()
    if not boarding:
        raise HTTPException(status_code=404, detail="Boarding not found")

    cage_result = await db.execute(select(Cage).where(Cage.id == boarding.cage_id))
    cage = cage_result.scalar_one_or_none()

    boarding.status = BoardingStatus.CHECKED_OUT
    boarding.actual_check_out = datetime.utcnow()
    if cage:
        cage.status = CageStatus.AVAILABLE

    await db.commit()
    await db.refresh(boarding)
    return boarding
