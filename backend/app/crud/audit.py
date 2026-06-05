from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.audit import AuditLog, AuditAction
from .base import CRUDBase


class CRUDAuditLog(CRUDBase[AuditLog, dict, dict]):
    def create_log(
        self, db: Session, *, user_id: Optional[int], username: Optional[str],
        action: AuditAction, resource_type: str, resource_id: Optional[int] = None,
        details: Optional[str] = None, ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def get_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        return db.query(AuditLog).filter(
            AuditLog.user_id == user_id
        ).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_resource(self, db: Session, *, resource_type: str, resource_id: int, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        return db.query(AuditLog).filter(
            AuditLog.resource_type == resource_type,
            AuditLog.resource_id == resource_id
        ).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    def remove(self, db: Session, *, id: int) -> None:
        raise PermissionError("审计日志不允许删除")


audit_log = CRUDAuditLog(AuditLog)
