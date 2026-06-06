from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_current_user, get_password_hash
from app.core.config import settings
from app.core.exceptions import BusinessException
from app.models import User
from app.schemas.user import (
    UserResponse, TokenResponse, LoginRequest, ChangePasswordRequest
)
from app.schemas.common import ApiResponse
from app.core.logging import logger

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/login", response_model=ApiResponse[TokenResponse])
def login(form_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise BusinessException("用户名或密码错误", code=401)
    if not user.is_active:
        raise BusinessException("账号已被禁用", code=401)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    logger.info(f"User {user.username} logged in")
    return ApiResponse(
        data=TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
    )


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return ApiResponse(data=UserResponse.model_validate(current_user))


@router.post("/change-password", response_model=ApiResponse)
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(request.old_password, current_user.hashed_password):
        raise BusinessException("原密码错误")

    current_user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    logger.info(f"User {current_user.username} changed password")
    return ApiResponse(message="密码修改成功")
