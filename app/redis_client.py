import redis
from app.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


def get_redis():
    try:
        yield redis_client
    finally:
        pass
