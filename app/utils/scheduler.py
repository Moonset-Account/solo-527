from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import PriceRecord, PurchaseRequest, User, Notification, NotificationType, PurchaseStatus
from app.services.notification_service import NotificationService

scheduler = BackgroundScheduler()


def check_price_expiry():
    db = SessionLocal()
    try:
        today = date.today()
        
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


def check_pending_approvals():
    db = SessionLocal()
    try:
        pending_purchases = db.query(PurchaseRequest).filter(
            PurchaseRequest.status == PurchaseStatus.PENDING
        ).all()
        
        for purchase in pending_purchases:
            pass
            
    except Exception as e:
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
