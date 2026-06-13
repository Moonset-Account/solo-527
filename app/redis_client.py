import redis
from app.config import settings
import logging

logger = logging.getLogger(__name__)

redis_client = None
redis_available = False


def get_redis():
    global redis_client, redis_available
    if redis_client is None:
        try:
            redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
            redis_client.ping()
            redis_available = True
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            redis_available = False
            redis_client = None
    return redis_client


def get_redis_client():
    return get_redis()


def is_redis_available():
    return redis_available
