from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import PriceRecord, PurchaseRequest, User, Notification, NotificationType, PurchaseStatus
from app.services.notification_service import NotificationService
from app.redis_client import get_redis_client
import json

scheduler = BackgroundScheduler()


def check_price_expiry():
    db = SessionLocal()
    try:
        today = date.today()
        redis_client = get_redis_client()
        
        expiring_prices = db.query(PriceRecord).filter(
            PriceRecord.expires_at <= today,
            PriceRecord.is_expired == False
        ).all()
        
        for price in expiring_prices:
            price.is_expired = True
            
            if price.purchase_id:
                purchase = db.query(PurchaseRequest).filter(
                    PurchaseRequest.id == price.purchase_id
                ).first()
                
                if purchase:
                    purchase.status = PurchaseStatus.EXPIRED
                    
                    managers = db.query(User).filter(
                        User.role == "manager",
                        User.is_active == True
                    ).all()
                    
                    for manager in managers:
                        NotificationService.create_notification(
                            db=db,
                            type=NotificationType.PRICE_EXPIRY,
                            title=f"报价已过期 - {purchase.material_name}",
                            content=f"采购需求 {purchase.request_no} 的供应商报价已过期，请及时处理。",
                            user_id=manager.id,
                            related_id=purchase.id,
                            related_type="purchase"
                        )
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"价格过期检查任务出错: {e}")
    finally:
        db.close()


def check_price_expiring_soon():
    db = SessionLocal()
    try:
        today = date.today()
        redis_client = get_redis_client()
        
        warning_days = [7, 3, 1]
        
        for days in warning_days:
            target_date = today + timedelta(days=days)
            
            expiring_prices = db.query(PriceRecord).filter(
                PriceRecord.expires_at == target_date,
                PriceRecord.is_expired == False
            ).all()
            
            for price in expiring_prices:
                redis_key = f"price_expiry_notified:{price.id}:{days}d"
                
                if redis_client and redis_client.exists(redis_key):
                    continue
                
                if price.purchase_id:
                    purchase = db.query(PurchaseRequest).filter(
                        PurchaseRequest.id == price.purchase_id
                    ).first()
                    
                    if purchase and purchase.status in [PurchaseStatus.QUOTED, PurchaseStatus.APPROVED]:
                        managers = db.query(User).filter(
                            User.role == "manager",
                            User.is_active == True
                        ).all()
                        
                        for manager in managers:
                            NotificationService.create_notification(
                                db=db,
                                type=NotificationType.PRICE_EXPIRY,
                                title=f"报价即将过期 - {purchase.material_name}",
                                content=f"采购需求 {purchase.request_no} 的供应商报价将在{days}天后过期（有效期至{price.expires_at}），请及时处理。",
                                user_id=manager.id,
                                related_id=purchase.id,
                                related_type="purchase"
                            )
                
                if redis_client:
                    redis_client.setex(redis_key, 86400 * 2, "1")
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"价格即将过期提醒任务出错: {e}")
    finally:
        db.close()


def check_pending_approvals():
    db = SessionLocal()
    try:
        today = date.today()
        redis_client = get_redis_client()
        
        pending_purchases = db.query(PurchaseRequest).filter(
            PurchaseRequest.status == PurchaseStatus.PENDING
        ).all()
        
        for purchase in pending_purchases:
            days_pending = (today - purchase.created_at.date()).days
            
            if days_pending >= 2:
                redis_key = f"approval_reminder:{purchase.id}:{days_pending}d"
                
                if redis_client and redis_client.exists(redis_key):
                    continue
                
                level = purchase.current_approval_level
                
                from app.models.approval import ApprovalLevel, ApprovalLevelUser
                level_obj = db.query(ApprovalLevel).filter(
                    ApprovalLevel.level == level,
                    ApprovalLevel.is_active == True
                ).first()
                
                if level_obj:
                    level_users = db.query(ApprovalLevelUser).filter(
                        ApprovalLevelUser.level_id == level_obj.id
                    ).all()
                    
                    for lu in level_users:
                        NotificationService.create_notification(
                            db=db,
                            type=NotificationType.APPROVAL,
                            title=f"审批待处理提醒 - {purchase.material_name}",
                            content=f"采购需求 {purchase.request_no} 已等待审批{days_pending}天，请尽快处理。",
                            user_id=lu.user_id,
                            related_id=purchase.id,
                            related_type="purchase"
                        )
                
                if redis_client:
                    redis_client.setex(redis_key, 86400, "1")
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"待审批检查任务出错: {e}")
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        check_price_expiry,
        trigger=CronTrigger(hour=8, minute=0),
        id="check_price_expiry",
        replace_existing=True
    )
    
    scheduler.add_job(
        check_price_expiring_soon,
        trigger=CronTrigger(hour=8, minute=30),
        id="check_price_expiring_soon",
        replace_existing=True
    )
    
    scheduler.add_job(
        check_pending_approvals,
        trigger=CronTrigger(hour=9, minute=0),
        id="check_pending_approvals",
        replace_existing=True
    )
    
    scheduler.start()
    print("定时任务调度器已启动")


def stop_scheduler():
    scheduler.shutdown()
    print("定时任务调度器已停止")
