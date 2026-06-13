from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from datetime import datetime, date, time, timedelta

from app.database import get_db
from app.security import (
    get_current_user, hash_password, allow_admin, allow_management, allow_staff
)
from app.models import (
    User, UserRole, UserStatus, Campus, Classroom, DataEnvironment,
    TeacherHourRate
)
from app.schemas import (
    UserCreate, UserUpdate, UserResponse, CampusResponse, CampusCreate,
    CampusUpdate, ClassroomResponse, ClassroomCreate, TeacherHourRateCreate
)
from app.utils.audit import get_audit_logger, AuditLogger
from app.config import settings


router = APIRouter(prefix="/api/admin", tags=["管理后台"])


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    campus_id: Optional[int] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if status:
        query = query.where(User.status == status)
    if campus_id and user.role != UserRole.SUPER_ADMIN:
        if user.campus_id:
            query = query.where(User.campus_id == user.campus_id)
    elif user.campus_id and user.role != UserRole.SUPER_ADMIN:
        query = query.where(User.campus_id == user.campus_id)
    if keyword:
        kw = f"%{keyword}%"
        query = query.where(or_(
            User.username.ilike(kw), User.email.ilike(kw),
            User.phone.ilike(kw), User.real_name.ilike(kw)
        ))
    query = query.where(User.is_demo == settings.DEMO_MODE)
    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/users", response_model=UserResponse)
async def create_user(
    data: UserCreate,
    request: Request,
    user: User = Depends(allow_admin),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.phone == data.phone))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="邮箱或手机号已存在")

    new_user = User(
        email=data.email,
        phone=data.phone,
        username=data.username,
        hashed_password=hash_password(data.password),
        role=data.role,
        campus_id=data.campus_id or user.campus_id,
        real_name=data.real_name,
        gender=data.gender,
        status=UserStatus.ACTIVE,
        is_demo=settings.DEMO_MODE,
        environment=user.environment,
    )
    db.add(new_user)
    await db.flush()

    new_val = {"email": new_user.email, "role": new_user.role.value, "campus_id": new_user.campus_id}
    await audit.log(
        user=user, action="create_user", target_type="user",
        target_id=new_user.id, new_value=new_val,
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return new_user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    request: Request,
    user: User = Depends(allow_admin),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    target = await db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")

    old_val = {"role": target.role.value, "status": target.status.value, "campus_id": target.campus_id}

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(target, field, value)

    await db.flush()

    new_val = {"role": target.role.value, "status": target.status.value, "campus_id": target.campus_id}
    await audit.log(
        user=user, action="update_user", target_type="user",
        target_id=user_id, old_value=old_val, new_value=new_val,
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return target


@router.post("/campuses", response_model=CampusResponse)
async def create_campus(
    data: CampusCreate,
    request: Request,
    user: User = Depends(allow_admin),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    existing = await db.execute(select(Campus).where(Campus.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="校区名称已存在")

    campus = Campus(
        **data.model_dump(),
        is_demo=settings.DEMO_MODE,
        environment=user.environment,
    )
    db.add(campus)
    await db.flush()

    await audit.log(
        user=user, action="create_campus", target_type="campus",
        target_id=campus.id, new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return campus


@router.get("/campuses", response_model=List[CampusResponse])
async def list_campuses(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Campus).where(Campus.is_demo == settings.DEMO_MODE)
    if user.campus_id and user.role != UserRole.SUPER_ADMIN:
        query = query.where(Campus.id == user.campus_id)
    query = query.order_by(Campus.id)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/campuses/{campus_id}", response_model=CampusResponse)
async def update_campus(
    campus_id: int,
    data: CampusUpdate,
    request: Request,
    user: User = Depends(allow_admin),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    campus = await db.get(Campus, campus_id)
    if not campus:
        raise HTTPException(status_code=404, detail="校区不存在")

    old_val = {"name": campus.name, "is_active": campus.is_active}
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(campus, field, value)

    await db.flush()

    await audit.log(
        user=user, action="update_campus", target_type="campus",
        target_id=campus_id, old_value=old_val,
        new_value={"name": campus.name, "is_active": campus.is_active},
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return campus


@router.post("/classrooms", response_model=ClassroomResponse)
async def create_classroom(
    data: ClassroomCreate,
    request: Request,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    classroom = Classroom(
        **data.model_dump(),
        is_demo=settings.DEMO_MODE,
    )
    db.add(classroom)
    await db.flush()

    await audit.log(
        user=user, action="create_classroom", target_type="classroom",
        target_id=classroom.id, new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return classroom


@router.get("/classrooms", response_model=List[ClassroomResponse])
async def list_classrooms(
    campus_id: Optional[int] = None,
    user: User = Depends(allow_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(Classroom).where(Classroom.is_demo == settings.DEMO_MODE)
    if campus_id:
        query = query.where(Classroom.campus_id == campus_id)
    elif user.campus_id and user.role != UserRole.SUPER_ADMIN:
        query = query.where(Classroom.campus_id == user.campus_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/teacher-hour-rates")
async def create_teacher_rate(
    data: TeacherHourRateCreate,
    request: Request,
    user: User = Depends(allow_admin),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    rate = TeacherHourRate(
        **data.model_dump(),
        is_demo=settings.DEMO_MODE,
    )
    db.add(rate)
    await db.flush()

    await audit.log(
        user=user, action="create_teacher_rate",
        target_type="teacher_hour_rate", target_id=rate.id,
        new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return rate


@router.get("/teacher-hour-rates/{teacher_id}")
async def list_teacher_rates(
    teacher_id: int,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(TeacherHourRate)
        .where(TeacherHourRate.teacher_id == teacher_id)
        .where(TeacherHourRate.is_demo == settings.DEMO_MODE)
        .order_by(TeacherHourRate.effective_from.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()
