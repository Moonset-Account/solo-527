import redis
from app.config import settings


def get_redis_url():
    if settings.run_mode in ("test", "demo"):
        return settings.redis_url_test
    return settings.redis_url


redis_client = redis.Redis.from_url(
    get_redis_url(),
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
)


class RedisCache:
    @staticmethod
    def get(key: str):
        return redis_client.get(key)

    @staticmethod
    def set(key: str, value: str, ex: int = 3600):
        redis_client.set(key, value, ex=ex)

    @staticmethod
    def delete(key: str):
        redis_client.delete(key)

    @staticmethod
    def exists(key: str) -> bool:
        return redis_client.exists(key) > 0


class RedisQueue:
    ALERT_CHANNEL = "orchard:alerts"
    NOTIFICATION_CHANNEL = "orchard:notifications"
    YIELD_PREDICT_KEY = "orchard:yield_prediction"

    @classmethod
    def publish_alert(cls, message: str):
        redis_client.publish(cls.ALERT_CHANNEL, message)

    @classmethod
    def publish_notification(cls, user_id: int, message: str):
        redis_client.publish(cls.NOTIFICATION_CHANNEL, f"user:{user_id}:{message}")

    @classmethod
    def push_task(cls, queue: str, payload: str):
        redis_client.lpush(queue, payload)

    @classmethod
    def pop_task(cls, queue: str, timeout: int = 0):
        return redis_client.brpop(queue, timeout=timeout)
