from sqlalchemy.orm import Session
from typing import Optional

from app.models.audit import AuditLog, AuditAction
from app.models.user import User


class AuditService:
    @staticmethod
    def log(
        db: Session,
        user: Optional[User],
        action: AuditAction,
        entity_type: str = None,
        entity_id: int = None,
        old_value: str = None,
        new_value: str = None,
        description: str = None,
        ip_address: str = None,
        user_agent: str = None,
    ) -> AuditLog:
        audit_log = AuditLog(
            user_id=user.id if user else None,
            username=user.username if user else None,
            role=user.role if user else None,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent,
            description=description,
        )
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log

    @staticmethod
    def list_logs(
        db: Session,
        user_id: int = None,
        action: AuditAction = None,
        entity_type: str = None,
        skip: int = 0,
        limit: int = 100,
    ):
        query = db.query(AuditLog)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
