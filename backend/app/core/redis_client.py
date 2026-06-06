import redis
from app.core.config import settings
from app.core.logging import logger


class RedisClient:
    def __init__(self):
        self.redis = None
        self._connect()

    def _connect(self):
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            self.redis.ping()
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.error(f"Redis connection error: {e}")

    def get_client(self):
        if not self.redis:
            self._connect()
        return self.redis

    def set(self, key: str, value: str, ex: int = None):
        try:
            return self.get_client().set(key, value, ex=ex)
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return None

    def get(self, key: str):
        try:
            return self.get_client().get(key)
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None

    def delete(self, key: str):
        try:
            return self.get_client().delete(key)
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return None


redis_client = RedisClient()
