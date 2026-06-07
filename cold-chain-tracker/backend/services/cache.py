import json
import logging
import hashlib

logger = logging.getLogger(__name__)


class RedisCacheService:
    def __init__(self, config):
        self.config = config
        self.ttl = config.CACHE_TTL
        self._redis_client = None
        self._memory_cache = {}
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis_client = redis.Redis(
                host=self.config.REDIS_HOST,
                port=self.config.REDIS_PORT,
                db=self.config.REDIS_DB,
                password=self.config.REDIS_PASSWORD or None,
                decode_responses=True,
                socket_connect_timeout=2,
            )
            self._redis_client.ping()
            logger.info("Redis 连接成功")
        except Exception as e:
            logger.warning(f"Redis 不可用，使用内存缓存: {e}")
            self._redis_client = None

    def get(self, key):
        if self._redis_client:
            try:
                value = self._redis_client.get(key)
                if value:
                    return json.loads(value)
                return None
            except Exception as e:
                logger.warning(f"Redis 读取失败: {e}")
        entry = self._memory_cache.get(key)
        if entry is not None:
            import time
            if entry["expires_at"] > time.time():
                return entry["value"]
            del self._memory_cache[key]
        return None

    def set(self, key, value, ttl=None):
        ttl = ttl or self.ttl
        if self._redis_client:
            try:
                self._redis_client.setex(key, ttl, json.dumps(value, ensure_ascii=False))
                return
            except Exception as e:
                logger.warning(f"Redis 写入失败: {e}")
        import time
        self._memory_cache[key] = {
            "value": value,
            "expires_at": time.time() + ttl,
        }

    def delete(self, key):
        if self._redis_client:
            try:
                self._redis_client.delete(key)
                return
            except Exception as e:
                logger.warning(f"Redis 删除失败: {e}")
        self._memory_cache.pop(key, None)

    def clear_pattern(self, pattern):
        if self._redis_client:
            try:
                keys = self._redis_client.keys(pattern)
                if keys:
                    self._redis_client.delete(*keys)
                return
            except Exception as e:
                logger.warning(f"Redis 清除模式失败: {e}")
        import fnmatch
        to_delete = [k for k in self._memory_cache if fnmatch.fnmatch(k, pattern)]
        for k in to_delete:
            del self._memory_cache[k]

    def generate_cache_key(self, prefix, params=None):
        if not params:
            return f"cold_chain:{prefix}"
        sorted_params = sorted(params.items()) if isinstance(params, dict) else sorted(params)
        param_str = json.dumps(sorted_params, sort_keys=True)
        hash_val = hashlib.md5(param_str.encode()).hexdigest()[:12]
        return f"cold_chain:{prefix}:{hash_val}"
