from app.tasks.celery_app import celery_app
from app.core.database import SessionLocal
from app.services import BillService
from app.schemas.bill import BillGenerateRequest
from datetime import date


@celery_app.task(name="generate_monthly_bills")
def generate_monthly_bills_task(bill_period: str, bill_date: str, due_date: str):
    db = SessionLocal()
    try:
        req = BillGenerateRequest(
            bill_type="rent",
            bill_period=bill_period,
            bill_date=date.fromisoformat(bill_date),
            due_date=date.fromisoformat(due_date),
        )
        count = BillService.batch_generate(db, req)
        return {"status": "success", "count": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@celery_app.task(name="generate_deposit_bills")
def generate_deposit_bills_task(lease_ids: list, bill_date: str, due_date: str):
    db = SessionLocal()
    try:
        req = BillGenerateRequest(
            lease_ids=lease_ids,
            bill_type="deposit",
            bill_period="押金",
            bill_date=date.fromisoformat(bill_date),
            due_date=date.fromisoformat(due_date),
        )
        count = BillService.batch_generate(db, req)
        return {"status": "success", "count": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
