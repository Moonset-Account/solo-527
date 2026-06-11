from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException
from typing import List, Optional
from app.models import Notification, NotificationType, PurchaseRequest, User, PurchaseStatus, ApprovalLevel, ApprovalLevelUser


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session, type: NotificationType, title: str, content: str,
        user_id: int, related_id: Optional[int] = None, related_type: Optional[str] = None
    ) -> Notification:
        notification = Notification(
            type=type,
            title=title,
            content=content,
            user_id=user_id,
            related_id=related_id,
            related_type=related_type
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def create_approval_notification(db: Session, purchase: PurchaseRequest):
        level = db.query(ApprovalLevel).filter(
            ApprovalLevel.level == purchase.current_approval_level,
            ApprovalLevel.is_active == True
        ).first()
        
        if not level:
            return
        
        approvers = db.query(ApprovalLevelUser).filter(
            ApprovalLevelUser.level_id == level.id
        ).all()
        
        for lu in approvers:
            NotificationService.create_notification(
                db=db,
                type=NotificationType.APPROVAL,
                title=f"待审批 - {purchase.material_name}",
                content=f"采购需求 {purchase.request_no} 需要您审批，预算金额：¥{purchase.budget:,.2f}",
                user_id=lu.user_id,
                related_id=purchase.id,
                related_type="purchase"
            )

    @staticmethod
    def get_user_notifications(
        db: Session, user_id: int, is_read: Optional[bool] = None,
        page: int = 1, page_size: int = 20
    ) -> tuple[List[Notification], int]:
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)
        
        total = query.count()
        items = query.order_by(desc(Notification.created_at)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        return items, total

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> Notification:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="通知不存在")
        
        notification.is_read = True
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        result = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True})
        db.commit()
        return result

    @staticmethod
    def mark_multiple_as_read(db: Session, notification_ids: List[int], user_id: int) -> int:
        result = db.query(Notification).filter(
            Notification.id.in_(notification_ids),
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True})
        db.commit()
        return result

    @staticmethod
    def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="通知不存在")
        
        db.delete(notification)
        db.commit()
        return True

    @staticmethod
    def create_price_expiry_notification(db: Session, purchase: PurchaseRequest):
        managers = db.query(User).filter(
            User.role == "manager",
            User.is_active == True
        ).all()
        
        for manager in managers:
            NotificationService.create_notification(
                db=db,
                type=NotificationType.PRICE_EXPIRY,
                title=f"报价即将过期 - {purchase.material_name}",
                content=f"采购需求 {purchase.request_no} 的报价将在7天内过期，请及时处理。",
                user_id=manager.id,
                related_id=purchase.id,
                related_type="purchase"
            )

    @staticmethod
    def create_delivery_notification(db: Session, delivery_record):
        from app.models import DeliveryRecord
        
        purchase = delivery_record.purchase
        if not purchase:
            return
        
        NotificationService.create_notification(
            db=db,
            type=NotificationType.DELIVERY,
            title=f"已交付 - {purchase.material_name}",
            content=f"采购需求 {purchase.request_no} 已交付 {delivery_record.delivered_quantity} {purchase.unit}",
            user_id=purchase.created_by,
            related_id=purchase.id,
            related_type="purchase"
        )
        
        managers = db.query(User).filter(
            User.role == "manager",
            User.is_active == True
        ).all()
        
        for manager in managers:
            NotificationService.create_notification(
                db=db,
                type=NotificationType.DELIVERY,
                title=f"已交付 - {purchase.material_name}",
                content=f"采购需求 {purchase.request_no} 已交付",
                user_id=manager.id,
                related_id=purchase.id,
                related_type="purchase"
            )
