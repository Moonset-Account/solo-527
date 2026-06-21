from celery import shared_task
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.crud import crud_inventory, crud_labor, crud_setting, crud_loss
from app.models import ModuleType, UserRole
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_low_stock():
    db = SessionLocal()
    try:
        inventory_enabled = crud_setting.is_module_enabled(db, ModuleType.INVENTORY)
        if not inventory_enabled:
            logger.info("Inventory module disabled, skipping low stock check")
            return {"status": "skipped", "reason": "module disabled"}

        auto_check = crud_setting.get_by_key(db, module=ModuleType.INVENTORY, key="auto_check_alerts")
        if auto_check and auto_check.value.lower() != "true":
            logger.info("Auto check alerts disabled, skipping")
            return {"status": "skipped", "reason": "auto check disabled"}

        alerts = crud_inventory.check_and_create_alerts(db)
        logger.info(f"Created {len(alerts)} low stock alerts")
        return {"status": "success", "alerts_created": len(alerts)}
    finally:
        db.close()


@shared_task
def daily_labor_cost_summary():
    db = SessionLocal()
    try:
        labor_enabled = crud_setting.is_module_enabled(db, ModuleType.LABOR_COST)
        if not labor_enabled:
            return {"status": "skipped", "reason": "module disabled"}

        yesterday = date.today() - timedelta(days=1)
        stats = crud_labor.get_stats(db, start_date=yesterday, end_date=yesterday)
        logger.info(f"Daily labor cost summary for {yesterday}: {stats}")
        return {"status": "success", "date": str(yesterday), "stats": stats}
    finally:
        db.close()


@shared_task
def generate_loss_report(start_date: str = None, end_date: str = None, store_id: int = None):
    db = SessionLocal()
    try:
        loss_enabled = crud_setting.is_module_enabled(db, ModuleType.LOSS)
        if not loss_enabled:
            return {"status": "skipped", "reason": "module disabled"}

        if not start_date:
            start_date = (date.today() - timedelta(days=30)).isoformat()
        if not end_date:
            end_date = date.today().isoformat()

        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        stats = crud_loss.get_loss_stats(db, store_id=store_id, start_date=start, end_date=end)
        logger.info(f"Loss report generated: {stats}")
        return {"status": "success", "start_date": start_date, "end_date": end_date, "stats": stats}
    finally:
        db.close()


@shared_task
def send_notification(user_id: int, title: str, message: str):
    logger.info(f"Sending notification to user {user_id}: {title} - {message}")
    return {"status": "success", "user_id": user_id, "title": title}
