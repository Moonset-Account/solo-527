from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel

from app.database import get_db
from app.auth import verify_password, create_access_token, get_current_user, hash_password, allow_all
from app.models import User, UserRole
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["认证"])


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    full_name: str


class UserRegister(BaseModel):
    username: str
    password: str
    full_name: str
    role: UserRole = UserRole.FRONTLINE
    phone: str = None
    email: str = None


@router.post("/login", response_model=Token)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
        "username": user.username,
        "full_name": user.full_name
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "退出成功"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "phone": current_user.phone,
        "email": current_user.email
    }


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    users = db.query(User).filter(User.is_active == True).order_by(User.full_name).all()
    return {
        "items": [
            {
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "role": u.role.value,
                "phone": u.phone
            }
            for u in users
        ]
    }


def init_default_users(db: Session):
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            full_name="系统管理员",
            hashed_password=hash_password("admin123"),
            role=UserRole.ADMIN,
            phone="13800000000",
            email="admin@example.com"
        )
        db.add(admin)

    manager = db.query(User).filter(User.username == "manager").first()
    if not manager:
        manager = User(
            username="manager",
            full_name="店长",
            hashed_password=hash_password("manager123"),
            role=UserRole.MANAGER,
            phone="13900000000",
            email="manager@example.com"
        )
        db.add(manager)

    frontline = db.query(User).filter(User.username == "frontline").first()
    if not frontline:
        frontline = User(
            username="frontline",
            full_name="前台小王",
            hashed_password=hash_password("front123"),
            role=UserRole.FRONTLINE,
            phone="13700000000",
            email="frontline@example.com"
        )
        db.add(frontline)

    db.commit()
