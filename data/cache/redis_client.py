import json
import hashlib
import pickle
from typing import Any, Optional
from datetime import timedelta
from functools import wraps

from config.settings import settings


class CacheClient:
    def __init__(self):
        self._use_redis = False
        self._local_cache: dict = {}
        self._try_connect_redis()
    
    def _try_connect_redis(self):
        try:
            import redis
            self._redis_client = redis.from_url(settings.redis_url)
            self._redis_client.ping()
            self._use_redis = True
        except Exception:
            self._use_redis = False
            self._redis_client = None
    
    def _make_key(self, prefix: str, params: Any) -> str:
        if isinstance(params, dict):
            param_str = json.dumps(params, sort_keys=True, default=str)
        else:
            param_str = str(params)
        hash_str = hashlib.md5(param_str.encode()).hexdigest()
        return f"{prefix}:{hash_str}"
    
    def get(self, key: str) -> Optional[Any]:
        if self._use_redis:
            try:
                data = self._redis_client.get(key)
                if data:
                    return pickle.loads(data)
            except Exception:
                pass
        else:
            if key in self._local_cache:
                value, expiry = self._local_cache[key]
                import time
                if time.time() < expiry:
                    return value
                else:
                    del self._local_cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        if self._use_redis:
            try:
                self._redis_client.setex(key, ttl_seconds, pickle.dumps(value))
            except Exception:
                pass
        else:
            import time
            expiry = time.time() + ttl_seconds
            self._local_cache[key] = (value, expiry)
    
    def delete(self, pattern: str):
        if self._use_redis:
            try:
                keys = self._redis_client.keys(pattern)
                if keys:
                    self._redis_client.delete(*keys)
            except Exception:
                pass
        else:
            import fnmatch
            keys_to_delete = [k for k in self._local_cache if fnmatch.fnmatch(k, pattern)]
            for k in keys_to_delete:
                del self._local_cache[k]
    
    def clear_all(self):
        if self._use_redis:
            try:
                self._redis_client.flushdb()
            except Exception:
                pass
        else:
            self._local_cache.clear()


cache_client = CacheClient()


def cached(prefix: str, ttl: int = 300):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_params = {
                "args": [str(a) for a in args],
                "kwargs": {k: str(v) for k, v in kwargs.items()}
            }
            key = cache_client._make_key(prefix, cache_params)
            cached_result = cache_client.get(key)
            if cached_result is not None:
                return cached_result
            result = func(*args, **kwargs)
            cache_client.set(key, result, ttl)
            return result
        return wrapper
    return decorator
