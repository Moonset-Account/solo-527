from datetime import datetime, timedelta, timezone

from celery import shared_task
from sqlalchemy import select

from app.config import settings
from app.database import async_session
from app.models.event import Event, EventFlow
from app.models.notification import Notification
from app.models.rule import Rule
from app.models.user import User
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.timeout_check.check_timeout")
def check_timeout():
    import asyncio

    asyncio.run(_check_timeout())


async def _check_timeout():
    async with async_session() as db:
        result = await db.execute(
            select(Rule).where(Rule.rule_type == "timeout_alert", Rule.is_active == True)
        )
        rule = result.scalar_one_or_none()
        if not rule:
            return

        timeout_hours = rule.config.get("hours", 48)
        threshold = datetime.now(timezone.utc) - timedelta(hours=timeout_hours)

        result = await db.execute(
            select(Event).where(
                Event.status == "rectifying",
                Event.updated_at < threshold,
            )
        )
        overdue_events = result.scalars().all()

        for event in overdue_events:
            if event.assignee_id:
                notif = Notification(
                    event_id=event.id,
                    user_id=event.assignee_id,
                    type="timeout",
                    message=f"事件【{event.title}】已超过{timeout_hours}小时未完成整改，请尽快处理",
                )
                db.add(notif)

        if overdue_events:
            await db.commit()
