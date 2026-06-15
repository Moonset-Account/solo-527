from typing import Optional
from fastapi import Depends, HTTPException, status, Request, WebSocket
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User
from app.enums import UserRole
from app.utils import decode_access_token, enum_in, enum_eq, enum_value

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    if token is None and request is not None:
        session_token = request.cookies.get("access_token")
        if session_token and session_token.startswith("Bearer "):
            token = session_token[7:]
        elif session_token:
            token = session_token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登录或令牌已过期",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(token)
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="无效的令牌")
    except HTTPException:
        raise
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="用户不存在")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被停用")
    return user


def require_roles(*roles: UserRole):
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if not enum_in(user.role, roles) and not enum_eq(user.role, UserRole.ADMIN):
            allowed = ", ".join([enum_value(r) for r in roles])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"需要以下角色之一: {allowed}",
            )
        return user
    return role_checker


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    try:
        return await get_current_user(token=token, request=request, db=db)
    except HTTPException:
        return None
