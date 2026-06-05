from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.notification import NotificationType
from .. import crud
from .redis_service import redis_service
from .logging_service import logger


class NotificationService:
    def __init__(self):
        pass

    def create_notification(
        self,
        db: Session,
        user_id: int,
        type: NotificationType,
        title: str,
        message: str,
        related_type: Optional[str] = None,
        related_id: Optional[int] = None
    ):
        try:
            notification = crud.notification.create(db, obj_in={
                "user_id": user_id,
                "type": type,
                "title": title,
                "message": message,
                "related_type": related_type,
                "related_id": related_id,
            })
            redis_service.publish(f"notifications:{user_id}", {
                "id": notification.id,
                "title": title,
                "message": message,
                "type": type.value,
                "created_at": notification.created_at.isoformat() if notification.created_at else None
            })
            return notification
        except Exception as e:
            logger.error(f"创建通知失败: {e}")
            return None

    def notify_admins(
        self,
        db: Session,
        type: NotificationType,
        title: str,
        message: str,
        related_type: Optional[str] = None,
        related_id: Optional[int] = None
    ) -> List:
        try:
            return crud.notification.create_for_admins(
                db, type=type, title=title, message=message,
                related_type=related_type, related_id=related_id
            )
        except Exception as e:
            logger.error(f"创建管理员通知失败: {e}")
            return []

    def check_low_stock(self, db: Session) -> int:
        try:
            low_stock_reagents = crud.reagent.get_low_stock(db)
            count = 0
            for reagent in low_stock_reagents:
                cache_key = f"low_stock_notified:{reagent.id}"
                if not redis_service.get(cache_key):
                    self.notify_admins(
                        db,
                        type=NotificationType.LOW_STOCK,
                        title=f"库存预警: {reagent.name}",
                        message=f"试剂 {reagent.name} 库存已低于最低库存 {reagent.min_stock} {reagent.unit}，请及时补充。",
                        related_type="reagent",
                        related_id=reagent.id
                    )
                    redis_service.set(cache_key, "1", expire=86400)
                    count += 1
            return count
        except Exception as e:
            logger.error(f"检查低库存失败: {e}")
            return 0

    def check_expiry(self, db: Session) -> int:
        try:
            expiring_batches = crud.reagent_batch.get_expiring_soon(db)
            count = 0
            for batch in expiring_batches:
                cache_key = f"expiry_notified:{batch.id}"
                if not redis_service.get(cache_key):
                    reagent_name = batch.reagent.name if batch.reagent else "未知试剂"
                    self.notify_admins(
                        db,
                        type=NotificationType.EXPIRY_WARNING,
                        title=f"有效期预警: {reagent_name}",
                        message=f"试剂 {reagent_name} (批号: {batch.batch_number}) 将于 {batch.expiry_date} 到期，请及时处理。",
                        related_type="reagent_batch",
                        related_id=batch.id
                    )
                    redis_service.set(cache_key, "1", expire=86400)
                    count += 1
            return count
        except Exception as e:
            logger.error(f"检查有效期失败: {e}")
            return 0


notification_service = NotificationService()
