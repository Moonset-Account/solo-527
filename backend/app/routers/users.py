from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import BusinessException
from app.models import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.common import ApiResponse, PaginatedResponse
from app.core.security import get_password_hash
from app.core.logging import logger

router = APIRouter(prefix="/api/users", tags=["用户管理"])


@router.get("", response_model=PaginatedResponse[UserResponse])
def get_users(
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限访问", code=403)

    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    users = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        data=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/cleaners", response_model=ApiResponse[List[UserResponse]])
def get_cleaners(
    include_busy: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    from app.services.task_service import TaskService
    if include_busy:
        cleaners = db.query(User).filter(
            User.role == UserRole.CLEANER,
            User.is_active == True
        ).all()
    else:
        cleaners = TaskService.get_available_cleaners(db)

    return ApiResponse(data=[UserResponse.model_validate(c) for c in cleaners])


@router.get("/technicians", response_model=ApiResponse[List[UserResponse]])
def get_technicians(
    include_busy: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    from app.services.task_service import TaskService
    if include_busy:
        technicians = db.query(User).filter(
            User.role == UserRole.MAINTENANCE,
            User.is_active == True
        ).all()
    else:
        technicians = TaskService.get_available_technicians(db)

    return ApiResponse(data=[UserResponse.model_validate(t) for t in technicians])


@router.get("/{user_id}", response_model=ApiResponse[UserResponse])
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER] and current_user.id != user_id:
        raise BusinessException("无权限访问", code=403)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise BusinessException("用户不存在")
    return ApiResponse(data=UserResponse.model_validate(user))


@router.post("", response_model=ApiResponse[UserResponse])
def create_user(
    user_in: UserCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise BusinessException("无权限创建用户", code=403)

    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise BusinessException("用户名已存在")

    if user_in.email:
        existing_email = db.query(User).filter(User.email == user_in.email).first()
        if existing_email:
            raise BusinessException("邮箱已存在")

    user = User(
        username=user_in.username,
        email=user_in.email,
        phone=user_in.phone,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=get_password_hash(user_in.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"User {user.username} created by {current_user.username}")
    return ApiResponse(data=UserResponse.model_validate(user))


@router.put("/{user_id}", response_model=ApiResponse[UserResponse])
def update_user(
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise BusinessException("无权限修改", code=403)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise BusinessException("用户不存在")

    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    else:
        update_data.pop("password", None)

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    logger.info(f"User {user.username} updated by {current_user.username}")
    return ApiResponse(data=UserResponse.model_validate(user))


@router.delete("/{user_id}", response_model=ApiResponse)
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise BusinessException("无权限删除", code=403)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise BusinessException("用户不存在")

    user.is_active = False
    db.commit()
    logger.info(f"User {user.username} deactivated by {current_user.username}")
    return ApiResponse(message="用户已禁用")
