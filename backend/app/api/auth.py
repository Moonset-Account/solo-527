from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user, create_audit_log
from app.core.config import settings
from app.models import User, LogAction, UserRole
from app.schemas.user import UserLogin, Token, UserResponse, UserCreate, UserChangePassword

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/login", response_model=Token)
def login(
    request: Request,
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id, "role": user.role.value},
        expires_delta=access_token_expires
    )

    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    create_audit_log(
        db=db,
        user=user,
        action=LogAction.LOGIN,
        description=f"用户 {user.username} 登录系统",
        ip_address=client_ip,
        user_agent=user_agent
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
def change_password(
    request: Request,
    data: UserChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="原密码错误"
        )

    from app.core.security import hash_password
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_USER,
        description=f"用户 {current_user.username} 修改密码",
        ip_address=client_ip
    )

    return {"message": "密码修改成功"}


@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
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
        role=UserRole.USER
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user
