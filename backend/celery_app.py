from datetime import datetime, timedelta

from celery import Celery
from sqlalchemy import select, and_

from app.config import settings
from app.database import async_session_maker
from app.models.ar_record import ARRecord, ARStatus
from app.models.reminder import Reminder, ReminderType, ReminderStatus
from app.models.refund import Refund, RefundStatus
from app.models.writeoff import Writeoff, WriteoffStatus
from app.models.cash_gap import CashGapForecast, GapStatus

celery = Celery(
    "ar_reconciliation",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
)


@celery.task(name="check_overdue_reminders")
def check_overdue_reminders():
    import asyncio
    asyncio.run(_check_overdue_reminders())


async def _check_overdue_reminders():
    escalation_threshold = datetime.utcnow() - timedelta(hours=settings.ESCALATION_HOURS)
    async with async_session_maker() as session:
        result = await session.execute(
            select(Reminder).where(
                and_(
                    Reminder.status == ReminderStatus.pending,
                    Reminder.due_at < escalation_threshold,
                )
            )
        )
        overdue_reminders = result.scalars().all()

        for reminder in overdue_reminders:
            reminder.status = ReminderStatus.escalated
            reminder.escalated_at = datetime.utcnow()
            reminder.escalated_to = "supervisor"

            new_reminder = Reminder(
                type=ReminderType.escalation,
                title=f"升级提醒: {reminder.title}",
                message=f"以下提醒已超过 {settings.ESCALATION_HOURS} 小时未处理，已自动升级：{reminder.message}",
                assigned_to="supervisor",
                status=ReminderStatus.pending,
                due_at=datetime.utcnow() + timedelta(hours=settings.ESCALATION_HOURS),
                ar_record_id=reminder.ar_record_id,
            )
            session.add(new_reminder)

        await session.commit()


@celery.task(name="generate_daily_cash_gap_forecast")
def generate_daily_cash_gap_forecast():
    import asyncio
    asyncio.run(_generate_daily_cash_gap_forecast())


async def _generate_daily_cash_gap_forecast():
    from datetime import date
    from decimal import Decimal

    today = date.today()
    period_end = today + timedelta(days=30)

    async with async_session_maker() as session:
        pending_ar = await session.execute(
            select(ARRecord).where(
                and_(
                    ARRecord.status.in_([ARStatus.pending, ARStatus.partial]),
                    ARRecord.due_date <= period_end,
                )
            )
        )
        ar_records = pending_ar.scalars().all()

        expected_inflow = sum(r.amount for r in ar_records)

        pending_refunds = await session.execute(
            select(Refund).where(Refund.status == RefundStatus.pending)
        )
        refund_records = pending_refunds.scalars().all()
        expected_refund_outflow = sum(r.amount for r in refund_records)

        pending_writeoffs = await session.execute(
            select(Writeoff).where(Writeoff.status == WriteoffStatus.pending)
        )
        writeoff_records = pending_writeoffs.scalars().all()
        expected_writeoff_outflow = sum(w.amount for w in writeoff_records)

        expected_outflow = expected_refund_outflow + expected_writeoff_outflow
        gap_amount = expected_inflow - expected_outflow

        if gap_amount > Decimal("0"):
            gap_status = GapStatus.safe
        elif gap_amount > Decimal("-100000"):
            gap_status = GapStatus.warning
        else:
            gap_status = GapStatus.critical

        forecast = CashGapForecast(
            forecast_date=today,
            period_start=today,
            period_end=period_end,
            expected_inflow=expected_inflow,
            expected_outflow=expected_outflow,
            gap_amount=gap_amount,
            gap_status=gap_status,
            responsible_person="system",
        )
        session.add(forecast)
        await session.commit()


celery.conf.beat_schedule = {
    "check-overdue-reminders-every-hour": {
        "task": "check_overdue_reminders",
        "schedule": 3600,
    },
    "generate-daily-cash-gap-forecast": {
        "task": "generate_daily_cash_gap_forecast",
        "schedule": 86400,
    },
}
