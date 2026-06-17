import redis
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, Any, Dict
from .config import settings


class RedisClient:
    def __init__(self):
        self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.session_prefix = "session:"
        self.cache_prefix = "cache:"
        self.queue_prefix = "queue:"

    def get_session(self, session_id: str) -> Optional[Dict]:
        key = f"{self.session_prefix}{session_id}"
        data = self.client.get(key)
        if data:
            return json.loads(data)
        return None

    def set_session(self, user_id: int, user_data: Dict, ttl: int = None) -> str:
        if ttl is None:
            ttl = settings.SESSION_EXPIRE_SECONDS
        session_id = str(uuid.uuid4())
        key = f"{self.session_prefix}{session_id}"
        session_data = {
            "user_id": user_id,
            "user_data": user_data,
            "created_at": datetime.utcnow().isoformat()
        }
        self.client.setex(key, ttl, json.dumps(session_data))
        return session_id

    def delete_session(self, session_id: str) -> None:
        key = f"{self.session_prefix}{session_id}"
        self.client.delete(key)

    def refresh_session(self, session_id: str, ttl: int = None) -> bool:
        if ttl is None:
            ttl = settings.SESSION_EXPIRE_SECONDS
        key = f"{self.session_prefix}{session_id}"
        return self.client.expire(key, ttl)

    def set_cache(self, cache_key: str, value: Any, ttl: int = 3600) -> None:
        key = f"{self.cache_prefix}{cache_key}"
        self.client.setex(key, ttl, json.dumps(value))

    def get_cache(self, cache_key: str) -> Optional[Any]:
        key = f"{self.cache_prefix}{cache_key}"
        data = self.client.get(key)
        if data:
            return json.loads(data)
        return None

    def delete_cache(self, cache_key: str) -> None:
        key = f"{self.cache_prefix}{cache_key}"
        self.client.delete(key)

    def push_queue(self, queue_name: str, item: Any) -> None:
        key = f"{self.queue_prefix}{queue_name}"
        self.client.rpush(key, json.dumps(item))

    def pop_queue(self, queue_name: str) -> Optional[Any]:
        key = f"{self.queue_prefix}{queue_name}"
        data = self.client.lpop(key)
        if data:
            return json.loads(data)
        return None

    def acquire_lock(self, lock_name: str, timeout: int = 10) -> bool:
        key = f"lock:{lock_name}"
        return self.client.set(key, "1", ex=timeout, nx=True)

    def release_lock(self, lock_name: str) -> None:
        key = f"lock:{lock_name}"
        self.client.delete(key)


redis_client = RedisClient()


def get_redis():
    return redis_client
