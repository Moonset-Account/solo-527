import json
import redis
from typing import Optional, Any
from datetime import timedelta

from app.config import get_settings

settings = get_settings()

_redis_client = None


def get_redis_client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def get_cache(key: str) -> Optional[Any]:
    try:
        r = get_redis_client()
        value = r.get(key)
        if value:
            return json.loads(value)
    except Exception:
        pass
    return None


def set_cache(key: str, value: Any, expire_seconds: int = 300):
    try:
        r = get_redis_client()
        r.setex(key, expire_seconds, json.dumps(value, default=str))
    except Exception:
        pass


def delete_cache(key: str):
    try:
        r = get_redis_client()
        r.delete(key)
    except Exception:
        pass


def add_reminder(reminder_type: str, user_id: int, content: str, key: str = None):
    try:
        r = get_redis_client()
        if not key:
            key = f"reminder:{reminder_type}:{user_id}"
        r.lpush(key, json.dumps({
            "type": reminder_type,
            "user_id": user_id,
            "content": content
        }))
        r.expire(key, timedelta(days=7))
    except Exception:
        pass


def get_reminders(reminder_type: str, user_id: int, limit: int = 10) -> list:
    try:
        r = get_redis_client()
        key = f"reminder:{reminder_type}:{user_id}"
        items = r.lrange(key, 0, limit - 1)
        return [json.loads(item) for item in items]
    except Exception:
        return []
