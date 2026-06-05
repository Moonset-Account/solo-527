from celery import Celery
from app.config import settings
from app.database import SessionLocal
from app.models import CheckinRecord, Deposit, Vendor, CheckinStatus, DepositStatus
from app.services.notification_service import NotificationService
import asyncio

celery_app = Celery(
    "marketplace_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
)


def run_async(coro):
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@celery_app.task(bind=True, max_retries=3)
def trigger_deposit_review_for_no_shows(self, event_date_str: str):
    from datetime import datetime
    event_date = datetime.fromisoformat(event_date_str)
    db = SessionLocal()
    try:
        no_show_records = db.query(CheckinRecord).filter(
            CheckinRecord.event_date == event_date,
            CheckinRecord.status == CheckinStatus.NO_SHOW,
            CheckinRecord.deposit_review_triggered == 0
        ).all()

        for record in no_show_records:
            deposit = db.query(Deposit).filter(
                Deposit.vendor_id == record.vendor_id,
                Deposit.status == DepositStatus.PAID
            ).first()

            if deposit:
                deposit.status = DepositStatus.UNDER_REVIEW
                deposit.review_notes = f"活动日未签到，自动触发保证金复核"
                deposit.reviewed_at = datetime.utcnow()

            record.deposit_review_triggered = 1

            vendor = db.query(Vendor).filter(Vendor.id == record.vendor_id).first()
            if vendor:
                run_async(
                    NotificationService.send_deposit_review_notification(
                        vendor.name, "活动日未签到"
                    )
                )

        db.commit()
        return f"已处理 {len(no_show_records)} 条未签到记录"
    except Exception as e:
        db.rollback()
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=5)
def send_lottery_notifications(self, assignment_ids: list):
    db = SessionLocal()
    try:
        from app.models import BoothAssignment, Booth, Vendor
        results = []
        for assignment_id in assignment_ids:
            assignment = db.query(BoothAssignment).filter(
                BoothAssignment.id == assignment_id
            ).first()
            if assignment:
                booth = db.query(Booth).filter(Booth.id == assignment.booth_id).first()
                vendor = db.query(Vendor).filter(Vendor.id == assignment.vendor_id).first()
                if booth and vendor:
                    result = run_async(
                        NotificationService.send_lottery_result_notification(
                            vendor.name, booth.booth_number
                        )
                    )
                    results.append(result)
        return f"已发送 {len(results)} 条抽签结果通知"
    except Exception as e:
        raise self.retry(exc=e, countdown=30)
    finally:
        db.close()
