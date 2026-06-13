from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi.responses import JSONResponse

from app.database import get_db
from app.config import settings
from app.security import (
    verify_password, hash_password, create_access_token,
    get_current_user, store_session, revoke_session
)
from app.models import User, UserStatus, DataEnvironment
from app.schemas import LoginRequest, TokenResponse, UserResponse, UserCreate, PasswordChange
from app.utils.audit import get_audit_logger, AuditLogger


router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    result = await db.execute(
        select(User).where((User.email == req.email) | (User.phone == req.email))
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        await audit.log(
            user=None, action="login_failed",
            target_type="auth",
            ip_address=request.client.host if request.client else None,
            is_demo=settings.DEMO_MODE,
            environment=DataEnvironment.PRODUCTION if not settings.DEMO_MODE else DataEnvironment.DEMO,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱/手机号或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"账号状态异常：{user.status.value}",
        )

    user.last_login_at = func.now()

    expires_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    if req.remember_me:
        expires_minutes = expires_minutes * 7

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value, "email": user.email},
        expires_delta=timedelta(minutes=expires_minutes),
    )

    await store_session(access_token, user.id, ttl=expires_minutes * 60)

    await audit.log(
        user=user, action="login_success",
        target_type="auth",
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )

    user_data = {
        "id": user.id, "email": user.email, "phone": user.phone,
        "username": user.username, "role": user.role, "status": user.status,
        "campus_id": user.campus_id, "avatar": user.avatar,
        "real_name": user.real_name, "gender": user.gender,
        "birthday": user.birthday, "created_at": user.created_at,
    }

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=expires_minutes * 60,
        samesite="lax",
    )
    response.set_cookie(
        key="user_info",
        value=str(user.id),
        httponly=False,
        max_age=expires_minutes * 60,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_minutes * 60,
        user=user_data,
    )


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    from fastapi.security import OAuth2PasswordBearer
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)
    token = request.cookies.get("access_token")
    if token and token.startswith("Bearer "):
        token = token.split(" ", 1)[1]
        await revoke_session(token)

    response.delete_cookie("access_token")
    response.delete_cookie("user_info")

    await audit.log(user=user, action="logout", target_type="auth",
                    is_demo=settings.DEMO_MODE or user.is_demo,
                    environment=user.environment)
    return {"message": "已退出登录"}


@router.post("/register", response_model=UserResponse)
async def register(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.phone == data.phone))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱或手机号已注册",
        )

    new_user = User(
        email=data.email,
        phone=data.phone,
        username=data.username,
        hashed_password=hash_password(data.password),
        role=data.role,
        campus_id=data.campus_id,
        real_name=data.real_name,
        gender=data.gender,
        status=UserStatus.ACTIVE,
    )
    db.add(new_user)
    await db.flush()
    return new_user


@router.post("/change-password")
async def change_password(
    data: PasswordChange,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    if not verify_password(data.old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="原密码错误",
        )
    user.hashed_password = hash_password(data.new_password)
    await audit.log(user=user, action="change_password", target_type="user",
                    target_id=user.id,
                    is_demo=settings.DEMO_MODE or user.is_demo,
                    environment=user.environment)
    return {"message": "密码修改成功"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user
