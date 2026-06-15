import json
import uuid
from datetime import timedelta
from typing import Optional, List, Tuple
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_
from fastapi import HTTPException, status

from app.config import settings
from app.redis_client import get_redis
from app.models import Seat, Event, RepeatSeatAlert
from app.enums import SeatStatus, EventStatus
from app.utils import now


SEAT_LOCK_PREFIX = "seat:lock:"
SEAT_REPEAT_PREFIX = "seat:repeat:"
EVENT_SEATS_CACHE = "event:seats:"
EVENT_STATS_CACHE = "event:stats:"
CONFIG_CACHE = "config:"


class SeatLockService:
    def __init__(self, redis: Redis = None, db: AsyncSession = None):
        self.redis = redis or get_redis()
        self.db = db
        self.timeout = settings.SEAT_LOCK_TIMEOUT
        self.repeat_window = settings.SEAT_REPEAT_WINDOW
        self.repeat_max = settings.SEAT_REPEAT_MAX_ATTEMPTS

    def _lock_key(self, seat_id: int) -> str:
        return f"{SEAT_LOCK_PREFIX}{seat_id}"

    def _repeat_key(self, event_id: int, user_id: str) -> str:
        return f"{SEAT_REPEAT_PREFIX}{event_id}:{user_id}"

    async def _check_event_active(self, event_id: int) -> Event:
        if not self.db:
            raise HTTPException(status_code=500, detail="数据库会话未初始化")
        result = await self.db.execute(select(Event).where(Event.id == event_id))
        event = result.scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="场次不存在")
        if event.status not in (EventStatus.ACTIVE, EventStatus.SOLD_OUT):
            raise HTTPException(status_code=400, detail=f"场次状态为 {event.status}，不可购票")
        current = now()
        if current < event.sales_start_time:
            raise HTTPException(status_code=400, detail="售票尚未开始")
        if current > event.sales_end_time:
            raise HTTPException(status_code=400, detail="售票已结束")
        return event

    async def check_repeat_attempt(self, event_id: int, seat_ids: List[int],
                                    user_identifier: str) -> Tuple[bool, Optional[RepeatSeatAlert]]:
        if not self.db:
            return False, None
        repeat_key = self._repeat_key(event_id, user_identifier)
        pipe = self.redis.pipeline()
        for seat_id in seat_ids:
            pipe.incr(f"{repeat_key}:{seat_id}")
            pipe.expire(f"{repeat_key}:{seat_id}", self.repeat_window)
        results = await pipe.execute()
        counts = [results[i] for i in range(0, len(results), 2)]
        triggered = any(c >= self.repeat_max for c in counts)
        alert = None
        if triggered:
            for seat_id, count in zip(seat_ids, counts):
                if count >= self.repeat_max:
                    alert_key = f"{event_id}:{seat_id}:{user_identifier}"
                    existing = await self.db.execute(
                        select(RepeatSeatAlert).where(RepeatSeatAlert.alert_key == alert_key)
                    )
                    obj = existing.scalar_one_or_none()
                    if obj:
                        obj.attempt_count = max(obj.attempt_count, count)
                        obj.last_attempt_at = now()
                    else:
                        obj = RepeatSeatAlert(
                            alert_key=alert_key,
                            event_id=event_id,
                            seat_id=seat_id,
                            user_identifier=user_identifier,
                            attempt_count=count,
                            first_attempt_at=now(),
                            last_attempt_at=now(),
                            window_seconds=self.repeat_window,
                        )
                        self.db.add(obj)
                    alert = obj
            await self.db.commit()
            if alert:
                await self.db.refresh(alert)
        return triggered, alert

    async def lock_seats(self, event_id: int, seat_ids: List[int],
                         user_identifier: str, session_id: Optional[str] = None) -> Tuple[str, List[Seat]]:
        if not self.db:
            raise HTTPException(status_code=500, detail="数据库会话未初始化")
        if not seat_ids:
            raise HTTPException(status_code=400, detail="请选择座位")
        event = await self._check_event_active(event_id)
        if len(seat_ids) > event.max_tickets_per_order:
            raise HTTPException(status_code=400, detail=f"单次最多购买 {event.max_tickets_per_order} 张票")
        triggered, _ = await self.check_repeat_attempt(event_id, seat_ids, user_identifier)
        seats_result = await self.db.execute(
            select(Seat).where(and_(
                Seat.id.in_(seat_ids),
                Seat.event_id == event_id,
            )).with_for_update()
        )
        seats = list(seats_result.scalars().all())
        if len(seats) != len(seat_ids):
            raise HTTPException(status_code=400, detail="部分座位不存在")
        unavailable = [s.seat_code for s in seats if s.status != SeatStatus.AVAILABLE]
        if unavailable:
            raise HTTPException(status_code=400, detail=f"座位已被占用: {', '.join(unavailable)}")
        lock_key = str(uuid.uuid4())
        if session_id:
            lock_key = f"{session_id}:{lock_key}"
        pipe = self.redis.pipeline()
        for seat in seats:
            seat.status = SeatStatus.LOCKED
            seat.lock_key = lock_key
            seat.locked_at = now()
            seat.lock_expires_at = now() + timedelta(seconds=self.timeout)
            pipe.setex(
                self._lock_key(seat.id),
                self.timeout,
                json.dumps({
                    "lock_key": lock_key,
                    "user": user_identifier,
                    "event_id": event_id,
                    "locked_at": seat.locked_at.isoformat(),
                    "expires_at": seat.lock_expires_at.isoformat(),
                })
            )
        await pipe.execute()
        await self.db.commit()
        for seat in seats:
            await self.db.refresh(seat)
        await self.invalidate_event_cache(event_id)
        return lock_key, seats

    async def verify_lock(self, seat_id: int, lock_key: str) -> bool:
        data = await self.redis.get(self._lock_key(seat_id))
        if not data:
            return False
        info = json.loads(data)
        return info.get("lock_key") == lock_key

    async def extend_lock(self, seat_id: int, lock_key: str) -> bool:
        if not await self.verify_lock(seat_id, lock_key):
            return False
        await self.redis.expire(self._lock_key(seat_id), self.timeout)
        if self.db:
            await self.db.execute(
                update(Seat).where(and_(Seat.id == seat_id, Seat.lock_key == lock_key)).values(
                    lock_expires_at=now() + timedelta(seconds=self.timeout)
                )
            )
            await self.db.commit()
        return True

    async def unlock_seats(self, seat_ids: List[int], lock_key: str = None) -> int:
        if not self.db:
            raise HTTPException(status_code=500, detail="数据库会话未初始化")
        query = select(Seat).where(Seat.id.in_(seat_ids)).with_for_update()
        if lock_key:
            query = query.where(Seat.lock_key == lock_key)
        result = await self.db.execute(query)
        seats = list(result.scalars().all())
        pipe = self.redis.pipeline()
        event_ids = set()
        for seat in seats:
            if seat.status == SeatStatus.LOCKED:
                seat.status = SeatStatus.AVAILABLE
                seat.lock_key = None
                seat.locked_at = None
                seat.lock_expires_at = None
                pipe.delete(self._lock_key(seat.id))
                event_ids.add(seat.event_id)
        await pipe.execute()
        await self.db.commit()
        for eid in event_ids:
            await self.invalidate_event_cache(eid)
        return len(seats)

    async def confirm_lock_to_sold(self, seat_ids: List[int], lock_key: str, order_id: int) -> int:
        if not self.db:
            raise HTTPException(status_code=500, detail="数据库会话未初始化")
        result = await self.db.execute(
            select(Seat).where(and_(
                Seat.id.in_(seat_ids),
                Seat.lock_key == lock_key,
                Seat.status == SeatStatus.LOCKED,
            )).with_for_update()
        )
        seats = list(result.scalars().all())
        if len(seats) != len(seat_ids):
            raise HTTPException(status_code=400, detail="座位锁已失效，请重新选择")
        pipe = self.redis.pipeline()
        event_ids = set()
        for seat in seats:
            seat.status = SeatStatus.SOLD
            seat.order_id = order_id
            seat.lock_key = None
            seat.locked_at = None
            seat.lock_expires_at = None
            pipe.delete(self._lock_key(seat.id))
            event_ids.add(seat.event_id)
        await pipe.execute()
        await self.db.commit()
        for eid in event_ids:
            await self._update_event_seat_stats(eid)
            await self.invalidate_event_cache(eid)
        return len(seats)

    async def release_expired_locks(self) -> int:
        if not self.db:
            return 0
        result = await self.db.execute(
            select(Seat).where(and_(
                Seat.status == SeatStatus.LOCKED,
                Seat.lock_expires_at <= now(),
            ))
        )
        expired = list(result.scalars().all())
        if not expired:
            return 0
        ids = [s.id for s in expired]
        return await self.unlock_seats(ids)

    async def _update_event_seat_stats(self, event_id: int):
        if not self.db:
            return
        result = await self.db.execute(
            select(Seat.status).where(Seat.event_id == event_id)
        )
        statuses = [r[0] for r in result.all()]
        sold = statuses.count(SeatStatus.SOLD) + statuses.count(SeatStatus.REFUNDED)
        reserved = statuses.count(SeatStatus.RESERVED)
        blocked = statuses.count(SeatStatus.BLOCKED)
        await self.db.execute(
            update(Event).where(Event.id == event_id).values(
                total_seats=len(statuses),
                sold_seats=sold,
                reserved_seats=reserved,
                blocked_seats=blocked,
            )
        )
        await self.db.commit()

    async def invalidate_event_cache(self, event_id: int):
        keys = [f"{EVENT_SEATS_CACHE}{event_id}", f"{EVENT_STATS_CACHE}{event_id}"]
        await self.redis.delete(*keys)

    async def get_event_seats_cache(self, event_id: int) -> Optional[dict]:
        return await self.redis.get(f"{EVENT_SEATS_CACHE}{event_id}")

    async def set_event_seats_cache(self, event_id: int, data: dict, ttl: int = 60):
        await self.redis.setex(f"{EVENT_SEATS_CACHE}{event_id}", ttl, json.dumps(data, ensure_ascii=False))

    async def get_config_cache(self, key: str) -> Optional[str]:
        return await self.redis.get(f"{CONFIG_CACHE}{key}")

    async def set_config_cache(self, key: str, value: str, ttl: int = 300):
        await self.redis.setex(f"{CONFIG_CACHE}{key}", ttl, value)

    async def del_config_cache(self, key: str):
        await self.redis.delete(f"{CONFIG_CACHE}{key}")


seat_lock_service = SeatLockService()
