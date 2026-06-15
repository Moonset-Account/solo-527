import math
from datetime import datetime, timezone

from sqlalchemy import and_, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.event import Event, EventFlow, EventPhoto


class EventService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_events(
        self,
        status: str | None = None,
        event_type: str | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ):
        query = select(Event).options(selectinload(Event.photos))
        count_query = select(func.count(Event.id))

        if status:
            query = query.where(Event.status == status)
            count_query = count_query.where(Event.status == status)
        if event_type:
            query = query.where(Event.event_type == event_type)
            count_query = count_query.where(Event.event_type == event_type)
        if search:
            pattern = f"%{search}%"
            query = query.where(Event.title.ilike(pattern))
            count_query = count_query.where(Event.title.ilike(pattern))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(Event.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        events = result.unique().scalars().all()

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": [
                {
                    "id": e.id,
                    "title": e.title,
                    "description": e.description,
                    "event_type": e.event_type,
                    "status": e.status,
                    "lng": e.lng,
                    "lat": e.lat,
                    "address": e.address,
                    "reporter_id": e.reporter_id,
                    "assignee_id": e.assignee_id,
                    "is_duplicate": e.is_duplicate,
                    "created_at": e.created_at.isoformat() if e.created_at else None,
                    "updated_at": e.updated_at.isoformat() if e.updated_at else None,
                    "closed_at": e.closed_at.isoformat() if e.closed_at else None,
                    "photos": [
                        {"id": p.id, "url": p.url, "tag": p.tag} for p in e.photos
                    ],
                }
                for e in events
            ],
        }

    async def create_event(self, data, reporter_id: int):
        event = Event(
            title=data.title,
            description=data.description,
            event_type=data.event_type,
            lng=data.lng,
            lat=data.lat,
            address=data.address,
            reporter_id=reporter_id,
            status="pending",
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)

        flow = EventFlow(
            event_id=event.id, action="created", operator_id=reporter_id
        )
        self.db.add(flow)
        await self.db.commit()

        return event.id

    async def get_stats(self):
        statuses = ["pending", "assigned", "rectifying", "reviewing", "closed", "rejected"]
        result = {}
        for s in statuses:
            count_q = select(func.count(Event.id)).where(Event.status == s)
            r = await self.db.execute(count_q)
            result[s] = r.scalar() or 0
        return result

    async def get_event_detail(self, event_id: int):
        query = (
            select(Event)
            .options(selectinload(Event.photos), selectinload(Event.flows))
            .where(Event.id == event_id)
        )
        result = await self.db.execute(query)
        event = result.unique().scalar_one_or_none()
        if not event:
            return None
        return {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type,
            "status": event.status,
            "lng": event.lng,
            "lat": event.lat,
            "address": event.address,
            "reporter_id": event.reporter_id,
            "assignee_id": event.assignee_id,
            "is_duplicate": event.is_duplicate,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "updated_at": event.updated_at.isoformat() if event.updated_at else None,
            "closed_at": event.closed_at.isoformat() if event.closed_at else None,
            "photos": [
                {"id": p.id, "url": p.url, "tag": p.tag} for p in event.photos
            ],
            "flows": [
                {
                    "id": f.id,
                    "action": f.action,
                    "operator_id": f.operator_id,
                    "comment": f.comment,
                    "created_at": f.created_at.isoformat() if f.created_at else None,
                }
                for f in event.flows
            ],
        }

    async def assign_event(
        self, event_id: int, assignee_id: int, operator_id: int, deadline: str | None = None
    ):
        result = await self.db.execute(select(Event).where(Event.id == event_id))
        event = result.scalar_one_or_none()
        if not event:
            raise ValueError("Event not found")
        event.assignee_id = assignee_id
        event.status = "assigned"
        flow = EventFlow(
            event_id=event_id,
            action="assigned",
            operator_id=operator_id,
            comment=f"Assigned to user {assignee_id}" + (f", deadline: {deadline}" if deadline else ""),
        )
        self.db.add(flow)
        await self.db.commit()
        await self.db.refresh(event)
        return {"id": event.id, "status": event.status}

    async def rectify_event(self, event_id: int, operator_id: int, comment: str | None = None):
        result = await self.db.execute(select(Event).where(Event.id == event_id))
        event = result.scalar_one_or_none()
        if not event:
            raise ValueError("Event not found")
        event.status = "rectifying"
        flow = EventFlow(
            event_id=event_id,
            action="rectifying",
            operator_id=operator_id,
            comment=comment,
        )
        self.db.add(flow)
        await self.db.commit()
        await self.db.refresh(event)
        return {"id": event.id, "status": event.status}

    async def review_event(
        self, event_id: int, operator_id: int, action: str, comment: str | None = None
    ):
        result = await self.db.execute(select(Event).where(Event.id == event_id))
        event = result.scalar_one_or_none()
        if not event:
            raise ValueError("Event not found")

        if action == "pass":
            event.status = "closed"
            event.closed_at = datetime.now(timezone.utc)
            flow_action = "closed"
        elif action == "reject":
            event.status = "rectifying"
            flow_action = "rejected"
        else:
            raise ValueError(f"Invalid review action: {action}")

        flow = EventFlow(
            event_id=event_id,
            action=flow_action,
            operator_id=operator_id,
            comment=comment,
        )
        self.db.add(flow)
        await self.db.commit()
        await self.db.refresh(event)
        return {"id": event.id, "status": event.status}

    @staticmethod
    def haversine_km(lat1, lon1, lat2, lon2):
        R = 6371.0
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
