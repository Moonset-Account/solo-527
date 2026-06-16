from datetime import date, timedelta

from app.database import async_session_maker
from app.models.cash_gap import CashGapForecast
from app.models.reminder import Reminder


async def check_overdue_reminders():
    from sqlalchemy import select

    async with async_session_maker() as db:
        result = await db.execute(
            select(Reminder).where(
                Reminder.status == "pending",
            )
        )
        all_pending = result.scalars().all()

        from datetime import datetime

        now = datetime.utcnow()
        overdue = [r for r in all_pending if r.due_at < now]

        if not overdue:
            return {"escalated_count": 0}

        for reminder in overdue:
            reminder.status = "escalated"
            reminder.escalated_at = now
            reminder.escalated_to = "system_auto"

        await db.commit()
        return {"escalated_count": len(overdue)}


async def generate_daily_forecast():
    from decimal import Decimal

    from sqlalchemy import func, select

    from app.models.ar_record import ARRecord
    from app.models.payment import Payment

    async with async_session_maker() as db:
        today = date.today()
        period_start = today + timedelta(days=1)
        period_end = today + timedelta(days=7)

        expected_inflow_result = await db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.payment_date.between(period_start, period_end),
                Payment.status == "confirmed",
            )
        )
        expected_inflow = Decimal(str(expected_inflow_result.scalar() or 0))

        expected_outflow_result = await db.execute(
            select(func.coalesce(func.sum(ARRecord.amount), 0)).where(
                ARRecord.due_date.between(period_start, period_end),
                ARRecord.status.in_(["pending", "overdue"]),
            )
        )
        expected_outflow = Decimal(str(expected_outflow_result.scalar() or 0))

        gap_amount = expected_inflow - expected_outflow
        if gap_amount > 0:
            gap_status = "safe"
        elif gap_amount == 0:
            gap_status = "warning"
        else:
            gap_status = "critical"

        forecast = CashGapForecast(
            forecast_date=today,
            period_start=period_start,
            period_end=period_end,
            expected_inflow=expected_inflow,
            expected_outflow=expected_outflow,
            gap_amount=gap_amount,
            gap_status=gap_status,
            responsible_person="system",
            notes="Auto-generated daily forecast",
        )
        db.add(forecast)
        await db.commit()

        return {
            "forecast_date": str(today),
            "gap_status": gap_status,
            "gap_amount": float(gap_amount),
        }


try:
    from celery import Celery
    from app.config import settings

    celery_app = Celery(
        "ar_reconciliation",
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL,
    )

    @celery_app.task(name="check_overdue_reminders")
    def check_overdue_reminders_task():
        import asyncio

        return asyncio.get_event_loop().run_until_complete(check_overdue_reminders())

    @celery_app.task(name="generate_daily_forecast")
    def generate_daily_forecast_task():
        import asyncio

        return asyncio.get_event_loop().run_until_complete(generate_daily_forecast())

    celery_app.conf.beat_schedule = {
        "check-overdue-reminders-every-hour": {
            "task": "check_overdue_reminders",
            "schedule": 3600,
        },
        "generate-daily-forecast": {
            "task": "generate_daily_forecast",
            "schedule": 86400,
        },
    }
except ImportError:
    pass
