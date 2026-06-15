from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from fastapi import HTTPException, status
from passlib.context import CryptContext
from jose import JWTError, jwt
from app.config import settings

CST = timezone(timedelta(hours=8))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def now() -> datetime:
    return datetime.now(CST)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = utc_now() + expires_delta
    else:
        expire = utc_now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )


def paginate(page: int = 1, page_size: int = None) -> tuple[int, int]:
    if page < 1:
        page = 1
    if page_size is None:
        page_size = settings.DEFAULT_PAGE_SIZE
    page_size = min(page_size, settings.MAX_PAGE_SIZE)
    if page_size < 1:
        page_size = settings.DEFAULT_PAGE_SIZE
    return page, page_size


def calc_offset(page: int, page_size: int) -> int:
    return (page - 1) * page_size


def format_currency(amount: float) -> str:
    return f"¥{amount:,.2f}"


def calc_occupancy_rate(sold: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round((sold / total) * 100, 2)
