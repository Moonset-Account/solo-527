from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.notification import Notification, NotificationType
from ..schemas.notification import NotificationCreate
from .base import CRUDBase


class CRUDNotification(CRUDBase[Notification, NotificationCreate, dict]):
    def get_unread_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[Notification]:
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    def get_all_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[Notification]:
        return db.query(Notification).filter(
            Notification.user_id == user_id
        ).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    def mark_as_read(self, db: Session, *, notification_id: int, user_id: int) -> Optional[Notification]:
        notification = self.get(db, id=notification_id)
        if notification and notification.user_id == user_id:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.commit()
            db.refresh(notification)
        return notification

    def mark_all_as_read(self, db: Session, *, user_id: int) -> int:
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True, "read_at": datetime.utcnow()})
        db.commit()
        return count

    def count_unread(self, db: Session, *, user_id: int) -> int:
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

    def create_for_admins(
        self, db: Session, *, type: NotificationType, title: str, message: str, 
        related_type: Optional[str] = None, related_id: Optional[int] = None
    ) -> List[Notification]:
        from .user import user as user_crud
        admins = user_crud.get_admins(db)
        notifications = []
        for admin in admins:
            notification = Notification(
                user_id=admin.id,
                type=type,
                title=title,
                message=message,
                related_type=related_type,
                related_id=related_id,
            )
            db.add(notification)
            notifications.append(notification)
        db.commit()
        for n in notifications:
            db.refresh(n)
        return notifications


notification = CRUDNotification(Notification)
