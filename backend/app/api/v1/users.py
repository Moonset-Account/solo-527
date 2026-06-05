from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ...database import get_db
from ...security import get_current_user, RoleChecker
from ... import crud, schemas, models
from ...services import logger

router = APIRouter()

allow_admin = RoleChecker([models.UserRole.ADMIN])
allow_all_roles = RoleChecker([models.UserRole.ADMIN, models.UserRole.MEMBER, models.UserRole.EXTERNAL])


@router.get("", response_model=List[schemas.User], dependencies=[Depends(allow_admin)])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    users = crud.user.get_multi(db, skip=skip, limit=limit)
    return users


@router.post("", response_model=schemas.User, dependencies=[Depends(allow_admin)])
def create_user(
    request: Request,
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = crud.user.get_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已存在"
        )
    user = crud.user.create(db, obj_in=user_in)
    logger.info(f"创建用户: {user.username} by {current_user.username}")
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.CREATE,
        resource_type="user",
        resource_id=user.id,
        details=f"创建用户 {user.username}",
        ip_address=request.client.host if request.client else None
    )
    return user


@router.get("/{user_id}", response_model=schemas.User, dependencies=[Depends(allow_all_roles)])
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user


@router.put("/{user_id}", response_model=schemas.User, dependencies=[Depends(allow_admin)])
def update_user(
    request: Request,
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user = crud.user.update(db, db_obj=user, obj_in=user_in)
    logger.info(f"更新用户: {user.username} by {current_user.username}")
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.UPDATE,
        resource_type="user",
        resource_id=user.id,
        details=f"更新用户 {user.username}",
        ip_address=request.client.host if request.client else None
    )
    return user


@router.delete("/{user_id}", dependencies=[Depends(allow_admin)])
def delete_user(
    request: Request,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己"
        )
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    user.is_active = False
    db.commit()
    
    logger.info(f"禁用用户: {user.username} by {current_user.username}")
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.DELETE,
        resource_type="user",
        resource_id=user.id,
        details=f"禁用用户 {user.username}",
        ip_address=request.client.host if request.client else None
    )
    return {"message": "用户已禁用"}
