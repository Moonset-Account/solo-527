from datetime import datetime, timedelta
from typing import Optional, Any
import hashlib
import hmac
import base64
import json
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def _hash_sha256(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()


def hash_password(password: str) -> str:
    import secrets
    salt = secrets.token_hex(16)
    hashed = _hash_sha256(password, salt)
    return f"pbkdf2_sha256$100000${salt}${hashed}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4:
            return False
        algo, iterations, salt, stored_hash = parts
        if algo != "pbkdf2_sha256":
            return False
        computed_hash = _hash_sha256(plain_password, salt)
        return hmac.compare_digest(computed_hash, stored_hash)
    except Exception:
        return False


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


def _b64_decode(data: str) -> bytes:
    padding = '=' * (4 - len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire.timestamp()})

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _b64_encode(json.dumps(header, separators=(',', ':')).encode())
    payload_b64 = _b64_encode(json.dumps(to_encode, separators=(',', ':')).encode())

    signing_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        signing_input.encode(),
        hashlib.sha256
    ).digest()
    signature_b64 = _b64_encode(signature)

    return f"{signing_input}.{signature_b64}"


def decode_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        header_b64, payload_b64, signature_b64 = parts

        signing_input = f"{header_b64}.{payload_b64}"
        expected_signature = hmac.new(
            settings.SECRET_KEY.encode(),
            signing_input.encode(),
            hashlib.sha256
        ).digest()
        actual_signature = _b64_decode(signature_b64)

        if not hmac.compare_digest(expected_signature, actual_signature):
            return {}

        payload = json.loads(_b64_decode(payload_b64))
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            return {}

        return payload
    except Exception:
        return {}


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
    else:
        token = request.cookies.get("access_token")

    if not token:
        return None

    try:
        payload = decode_token(token)
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            return None
    except Exception:
        return None

    result = await db.execute(select(User).where(User.id == int(user_id), User.is_active == True))
    user = result.scalar_one_or_none()
    return user


async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user),
) -> User:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登录或登录已过期",
        )
    return current_user


def require_roles(*roles):
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足",
            )
        return current_user
    return role_checker
