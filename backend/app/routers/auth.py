from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import User, Customer
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.schemas import UserResponse, PaginatedResponse, CustomerResponse, CustomerCreate
from app.services.auth_service import (
    verify_password,
    create_access_token,
    get_current_user,
)
from app.services.base import model_to_dict

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )
    token = create_access_token(
        data={"sub": user.username, "user_id": user.id, "role": user.role}
    )
    return LoginResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        role=user.role,
        display_name=user.display_name,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=PaginatedResponse)
async def list_users(
    page: int = 1,
    page_size: int = 100,
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(User)
    count_query = select(func.count()).select_from(User)
    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()
    return PaginatedResponse(
        items=[model_to_dict(u) for u in users], total=total, page=page, page_size=page_size
    )


@router.get("/customers", response_model=PaginatedResponse)
async def list_customers(
    page: int = 1,
    page_size: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Customer)
    count_query = select(func.count()).select_from(Customer)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    customers = result.scalars().all()
    return PaginatedResponse(
        items=[model_to_dict(c) for c in customers], total=total, page=page, page_size=page_size
    )


@router.post("/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = Customer(**data.model_dump())
    db.add(customer)
    await db.flush()
    return customer


@router.get("/inspectors", response_model=list[UserResponse])
async def list_inspectors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.role == "inspector"))
    return result.scalars().all()


@router.get("/material-staff", response_model=list[UserResponse])
async def list_material_staff(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.role == "material_staff"))
    return result.scalars().all()
