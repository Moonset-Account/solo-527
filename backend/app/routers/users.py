from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles, hash_password

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.get("", response_model=dict)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "manager"))
):
    query = db.query(models.User)
    if keyword:
        query = query.filter(
            or_(
                models.User.username.like(f"%{keyword}%"),
                models.User.full_name.like(f"%{keyword}%"),
                models.User.email.like(f"%{keyword}%")
            )
        )
    if role:
        query = query.filter(models.User.role == role)
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)
    total = query.count()
    items = query.order_by(models.User.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.UserResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/{user_id}", response_model=schemas.UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "manager"))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


@router.put("/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: int,
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin"))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    for k, v in update_data.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@router.get("/options/purchasers", response_model=list)
async def get_purchasers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    users = db.query(models.User).filter(
        models.User.role.in_([models.UserRole.PURCHASER, models.UserRole.MANAGER, models.UserRole.ADMIN]),
        models.User.is_active == True
    ).order_by(models.User.full_name).all()
    return [{"id": u.id, "label": u.full_name, "role": u.role.value} for u in users]
