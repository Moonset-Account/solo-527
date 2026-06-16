from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from . import models
from datetime import datetime


def create_audit_log(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: int,
    entity_name: Optional[str] = None,
    user: Optional[models.User] = None,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    description: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> models.AuditLog:
    audit_log = models.AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        user_id=user.id if user else None,
        user_name=user.full_name if user else None,
        role=user.role.value if user else None,
        old_value=old_value,
        new_value=new_value,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def create_notification(
    db: Session,
    user_id: int,
    alert_type: models.AlertType,
    title: str,
    content: Optional[str] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None,
) -> models.Notification:
    notification = models.Notification(
        user_id=user_id,
        alert_type=alert_type,
        title=title,
        content=content,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
