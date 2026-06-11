from datetime import timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.config import settings
from app.models import User
from app.schemas import UserCreate, UserLogin, TokenResponse
from app.repositories import UserRepository
from app.utils.security import verify_password, create_access_token, hash_password

user_repo = UserRepository()


class AuthService:
    @staticmethod
    def authenticate(db: Session, username: str, password: str) -> User:
        user = user_repo.get_by_username(db, username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误"
            )
        if not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误"
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="账户已被禁用"
            )
        return user

    @staticmethod
    def login(db: Session, login_data: UserLogin) -> TokenResponse:
        user = AuthService.authenticate(db, login_data.username, login_data.password)
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role},
            expires_delta=access_token_expires
        )
        
        return TokenResponse(
            access_token=access_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    @staticmethod
    def create_user(db: Session, user_in: UserCreate) -> User:
        existing_user = user_repo.get_by_username(db, user_in.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )
        
        existing_email = user_repo.get_by_email(db, user_in.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
        
        user_data = user_in.model_dump()
        user_data["password_hash"] = hash_password(user_data.pop("password"))
        
        db_user = User(**user_data)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        user = user_repo.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        return user
