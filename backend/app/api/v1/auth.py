from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.security import create_access_token
from app.core.config import get_settings
from app.schemas.user import UserResponse, UserInfoResponse
from app.schemas.common import LoginRequest, LoginResponse, ResponseModel
from app.api.deps import get_current_user
from app.services import UserService

router = APIRouter(prefix="/auth", tags=["认证"])
settings = get_settings()


@router.post("/login", response_model=ResponseModel[LoginResponse])
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = UserService.authenticate(db, data.username, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user.id, expires_delta=access_token_expires)

    return ResponseModel(
        data=LoginResponse(access_token=access_token, token_type="bearer")
    )


@router.get("/me", response_model=ResponseModel[UserInfoResponse])
def get_me(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    permissions = UserService.get_user_permissions(db, current_user.id)
    user_data = UserResponse.model_validate(current_user)
    return ResponseModel(
        data=UserInfoResponse(
            **user_data.model_dump(),
            permissions=permissions,
        )
    )


@router.post("/logout")
def logout():
    return ResponseModel(message="退出成功")
