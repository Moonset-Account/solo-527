from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .config import settings
from . import models, schemas
from .database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, user: models.User = Depends(get_current_active_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for your role"
            )
        return user


allow_admin = RoleChecker([models.UserRole.ADMIN])
allow_coach = RoleChecker([models.UserRole.ADMIN, models.UserRole.COACH])
allow_runner = RoleChecker([models.UserRole.ADMIN, models.UserRole.COACH, models.UserRole.RUNNER])
allow_all_authenticated = RoleChecker([
    models.UserRole.ADMIN,
    models.UserRole.COACH,
    models.UserRole.RUNNER
])


ROLE_PERMISSIONS = {
    models.UserRole.ADMIN: {
        "users": ["create", "read", "update", "delete"],
        "training_plans": ["create", "read", "update", "delete", "publish"],
        "checkins": ["create", "read", "update", "delete", "review"],
        "activities": ["create", "read", "update", "delete", "publish"],
        "activity_signups": ["read", "update", "delete"],
        "injury_notes": ["create", "read", "update", "delete"],
        "tasks": ["create", "read", "update", "delete"],
        "pace_analysis": ["read", "create"],
    },
    models.UserRole.COACH: {
        "users": ["read"],
        "training_plans": ["create", "read", "update", "publish"],
        "checkins": ["create", "read", "update", "review"],
        "activities": ["create", "read", "update", "publish"],
        "activity_signups": ["read", "update"],
        "injury_notes": ["create", "read", "update"],
        "tasks": ["create", "read", "update"],
        "pace_analysis": ["read", "create"],
    },
    models.UserRole.RUNNER: {
        "users": ["read", "update_self"],
        "training_plans": ["read"],
        "checkins": ["create", "read_self", "update_self"],
        "activities": ["read"],
        "activity_signups": ["create", "read_self", "update_self"],
        "injury_notes": [],
        "tasks": ["read_self", "update_self"],
        "pace_analysis": ["read_self"],
    }
}
