from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, create_audit_log
from app.models import User, UserRole, LogAction
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.get("", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[UserRole] = None,
    keyword: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if keyword:
        query = query.filter(
            (User.username.ilike(f"%{keyword}%")) |
            (User.full_name.ilike(f"%{keyword}%")) |
            (User.email.ilike(f"%{keyword}%"))
        )
    users = query.offset(skip).limit(limit).all()
    return users


@router.post("", response_model=UserResponse)
def create_user(
    request: Request,
    user_data: UserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名或邮箱已存在"
        )

    from app.core.security import hash_password
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        department=user_data.department,
        hashed_password=hash_password(user_data.password),
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.CREATE_USER,
        resource_type="user",
        resource_id=new_user.id,
        description=f"创建用户: {new_user.username}, 角色: {new_user.role.value}",
        ip_address=client_ip
    )

    return new_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    request: Request,
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    old_role = user.role
    update_data = user_data.model_dump(exclude_unset=True)

    if "role" in update_data and update_data["role"] != old_role:
        if current_user.role != UserRole.SECURITY_OFFICER and update_data["role"] == UserRole.SECURITY_OFFICER:
            create_audit_log(
                db=db,
                user=current_user,
                action=LogAction.PERMISSION_DENIED,
                resource_type="user",
                resource_id=user_id,
                description=f"尝试提升角色为安全负责人被拒绝",
                ip_address=request.client.host if request.client else None
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="只有安全负责人可以分配安全负责人角色"
            )

        client_ip = request.client.host if request.client else None
        create_audit_log(
            db=db,
            user=current_user,
            action=LogAction.PRIVILEGE_ESCALATION,
            resource_type="user",
            resource_id=user_id,
            description=f"用户角色变更: {old_role.value} -> {update_data['role'].value}",
            details={"old_role": old_role.value, "new_role": update_data["role"].value},
            ip_address=client_ip
        )

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}")
def delete_user(
    request: Request,
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己"
        )

    if user.role == UserRole.SECURITY_OFFICER and current_user.role != UserRole.SECURITY_OFFICER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有安全负责人可以删除安全负责人账号"
        )

    db.delete(user)
    db.commit()

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.DELETE_USER,
        resource_type="user",
        resource_id=user_id,
        description=f"删除用户: {user.username}",
        ip_address=client_ip
    )

    return {"message": "删除成功"}
