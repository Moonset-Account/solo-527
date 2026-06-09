from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, require_role
from app.core.config import settings
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserLogin, Token
)
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["认证授权"])


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = UserService.authenticate(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    UserService.update_last_login(db, user)
    return Token(access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if UserService.get_user_by_username(db, user_in.username):
        raise HTTPException(status_code=400, detail="用户名已存在")
    if user_in.email and UserService.get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    return UserService.create_user(db, user_in)


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.get("/users", response_model=list[UserResponse])
def list_users(
    skip: int = 0, limit: int = 100, role: str = None,
    _=Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    return UserService.list_users(db, skip=skip, limit=limit, role=role)


@router.post("/users", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    _=Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    if UserService.get_user_by_username(db, user_in.username):
        raise HTTPException(status_code=400, detail="用户名已存在")
    return UserService.create_user(db, user_in)


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int, user_in: UserUpdate,
    _=Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    user = UserService.update_user(db, user_id, user_in)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return UserResponse.model_validate(user)
