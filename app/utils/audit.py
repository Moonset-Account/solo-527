from typing import Optional, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import AuditLog, User, DataEnvironment
from app.config import settings


class AuditLogger:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        user: Optional[User],
        action: str,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        is_demo: bool = False,
        environment: DataEnvironment = DataEnvironment.PRODUCTION,
    ):
        log_entry = AuditLog(
            user_id=user.id if user else None,
            action=action,
            target_type=target_type,
            target_id=target_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent,
            is_demo=is_demo or settings.DEMO_MODE,
            environment=environment,
        )
        self.db.add(log_entry)
        await self.db.flush()
        return log_entry


def get_audit_logger(db: AsyncSession) -> AuditLogger:
    return AuditLogger(db)
