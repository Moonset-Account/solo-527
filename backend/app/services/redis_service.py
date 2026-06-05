import redis
import json
from typing import Optional, Any
from datetime import timedelta
from ..config import settings


class RedisService:
    def __init__(self):
        self.client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            decode_responses=True
        )

    def get(self, key: str) -> Optional[str]:
        try:
            return self.client.get(key)
        except Exception:
            return None

    def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value, ensure_ascii=False)
            if expire:
                self.client.setex(key, expire, value)
            else:
                self.client.set(key, value)
            return True
        except Exception:
            return False

    def delete(self, key: str) -> bool:
        try:
            self.client.delete(key)
            return True
        except Exception:
            return False

    def get_json(self, key: str) -> Optional[Any]:
        value = self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None

    def set_cache(self, prefix: str, key: str, value: Any, expire: int = 3600) -> bool:
        return self.set(f"{prefix}:{key}", value, expire)

    def get_cache(self, prefix: str, key: str) -> Optional[Any]:
        return self.get_json(f"{prefix}:{key}")

    def publish(self, channel: str, message: Any) -> bool:
        try:
            if isinstance(message, (dict, list)):
                message = json.dumps(message, ensure_ascii=False)
            self.client.publish(channel, message)
            return True
        except Exception:
            return False

    def push_queue(self, queue_name: str, item: Any) -> bool:
        try:
            if isinstance(item, (dict, list)):
                item = json.dumps(item, ensure_ascii=False)
            self.client.lpush(queue_name, item)
            return True
        except Exception:
            return False

    def pop_queue(self, queue_name: str) -> Optional[str]:
        try:
            result = self.client.rpop(queue_name)
            return result
        except Exception:
            return None

    def ping(self) -> bool:
        try:
            return self.client.ping()
        except Exception:
            return False


redis_service = RedisService()
