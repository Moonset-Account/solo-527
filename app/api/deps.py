from __future__ import annotations

import logging
from typing import AsyncGenerator, Optional

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_async_db():
        yield session


def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    mock_user = User(
        id=1,
        username="mock_user",
        email="mock@example.com",
        full_name="Mock User",
        role=UserRole.LEGAL_ASSISTANT,
        is_active=True,
    )
    return mock_user


def require_role(*roles: UserRole):
    def _check_role(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in roles and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {[r.value for r in roles]}",
            )
        return current_user
    return _check_role
