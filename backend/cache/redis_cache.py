import redis
import json
from datetime import timedelta
from typing import Optional, Any
from backend.db.database import settings

class RedisCache:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.default_ttl = 3600
    
    def get(self, key: str) -> Optional[Any]:
        try:
            data = self.redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"Redis get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        try:
            serialized = json.dumps(value, default=str)
            self.redis.setex(key, ttl or self.default_ttl, serialized)
            return True
        except Exception as e:
            print(f"Redis set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        try:
            self.redis.delete(key)
            return True
        except Exception as e:
            print(f"Redis delete error: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> bool:
        try:
            for key in self.redis.scan_iter(match=pattern):
                self.redis.delete(key)
            return True
        except Exception as e:
            print(f"Redis delete pattern error: {e}")
            return False
    
    def generate_key(self, prefix: str, **kwargs) -> str:
        sorted_items = sorted(kwargs.items())
        key_parts = [str(v) for k, v in sorted_items]
        return f"{prefix}:{':'.join(key_parts)}"

cache = RedisCache()
