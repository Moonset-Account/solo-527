import asyncio
import math
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import async_session
from app.models.event import Event, EventFlow, FacilityStatus
from app.models.notification import Notification
from app.models.rule import Rule
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.duplicate_detect.detect_duplicate")
def detect_duplicate(event_id: int):
    asyncio.run(_detect_duplicate(event_id))


async def _detect_duplicate(event_id: int):
    async with async_session() as db:
        result = await db.execute(select(Event).where(Event.id == event_id))
        event = result.scalar_one_or_none()
        if not event or event.lng is None or event.lat is None:
            return

        result = await db.execute(
            select(Rule).where(Rule.rule_type == "duplicate_detect", Rule.is_active == True)
        )
        rule = result.scalar_one_or_none()
        if not rule:
            return

        config = rule.config if isinstance(rule.config, dict) else {}
        radius_meters = config.get("radius_meters", 50)
        time_window_hours = config.get("time_window_hours", 24)
        event_type_match = config.get("event_type_match", True)

        threshold = datetime.now(timezone.utc) - timedelta(hours=time_window_hours)
        query = select(Event).where(
            Event.id != event_id,
            Event.created_at >= threshold,
            Event.lng.isnot(None),
            Event.lat.isnot(None),
        )
        if event_type_match:
            query = query.where(Event.event_type == event.event_type)

        result = await db.execute(query)
        candidates = result.scalars().all()

        duplicates = []
        for candidate in candidates:
            distance = _haversine_meters(
                event.lat, event.lng, candidate.lat, candidate.lng
            )
            if distance <= radius_meters:
                duplicates.append(candidate)

        if duplicates:
            event.is_duplicate = True
            flow = EventFlow(
                event_id=event.id,
                action="duplicate_detected",
                operator_id=None,
                comment=f"检测到 {len(duplicates)} 条重复上报，已标记并回写设施完好数据",
            )
            db.add(flow)

            notif = Notification(
                event_id=event.id,
                user_id=event.reporter_id,
                type="duplicate",
                message=f"事件【{event.title}】与已有事件重复，设施已标记为完好",
            )
            db.add(notif)

            facility_code = f"{event.event_type}_{event.lng:.3f}_{event.lat:.3f}"
            facility_name = f"{event.address or event.title} 附近设施"
            existing = await db.execute(
                select(FacilityStatus).where(FacilityStatus.facility_code == facility_code)
            )
            facility = existing.scalar_one_or_none()
            if facility:
                facility.is_intact = True
                facility.checked_at = datetime.now(timezone.utc)
            else:
                facility = FacilityStatus(
                    facility_code=facility_code,
                    facility_name=facility_name,
                    is_intact=True,
                    checked_at=datetime.now(timezone.utc),
                )
                db.add(facility)

            await db.commit()


def _haversine_meters(lat1, lon1, lat2, lon2):
    R = 6371000.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
