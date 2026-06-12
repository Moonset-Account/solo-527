import redis
from typing import Optional, Any
from app.config import settings


def get_redis_url():
    if settings.run_mode in ("test", "demo"):
        return settings.redis_url_test
    return settings.redis_url


try:
    redis_client = redis.Redis.from_url(
        get_redis_url(),
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )
    redis_client.ping()
    _redis_available = True
except Exception:
    _redis_available = False
    redis_client = None


class InMemoryStore:
    _data = {}
    _queue = {}

    @staticmethod
    def get(key: str):
        return InMemoryStore._data.get(key)

    @staticmethod
    def set(key: str, value: str, ex: int = 3600):
        InMemoryStore._data[key] = value

    @staticmethod
    def delete(key: str):
        InMemoryStore._data.pop(key, None)

    @staticmethod
    def exists(key: str) -> bool:
        return key in InMemoryStore._data

    @staticmethod
    def lpush(queue: str, payload: str):
        if queue not in InMemoryStore._queue:
            InMemoryStore._queue[queue] = []
        InMemoryStore._queue[queue].insert(0, payload)

    @staticmethod
    def brpop(queue: str, timeout: int = 0):
        if queue in InMemoryStore._queue and InMemoryStore._queue[queue]:
            return (queue, InMemoryStore._queue[queue].pop())
        return None

    @staticmethod
    def publish(channel: str, message: str):
        pass

    @staticmethod
    def close():
        pass


class RedisCache:
    @staticmethod
    def get(key: str):
        if _redis_available and redis_client:
            try:
                return redis_client.get(key)
            except Exception:
                pass
        return InMemoryStore.get(key)

    @staticmethod
    def set(key: str, value: str, ex: int = 3600):
        if _redis_available and redis_client:
            try:
                return redis_client.set(key, value, ex=ex)
            except Exception:
                pass
        return InMemoryStore.set(key, value, ex=ex)

    @staticmethod
    def delete(key: str):
        if _redis_available and redis_client:
            try:
                return redis_client.delete(key)
            except Exception:
                pass
        return InMemoryStore.delete(key)

    @staticmethod
    def exists(key: str) -> bool:
        if _redis_available and redis_client:
            try:
                return redis_client.exists(key) > 0
            except Exception:
                pass
        return InMemoryStore.exists(key)


class RedisQueue:
    ALERT_CHANNEL = "orchard:alerts"
    NOTIFICATION_CHANNEL = "orchard:notifications"
    YIELD_PREDICT_KEY = "orchard:yield_prediction"

    @classmethod
    def publish_alert(cls, message: str):
        if _redis_available and redis_client:
            try:
                redis_client.publish(cls.ALERT_CHANNEL, message)
            except Exception:
                pass
        else:
            InMemoryStore.publish(cls.ALERT_CHANNEL, message)

    @classmethod
    def publish_notification(cls, user_id: int, message: str):
        if _redis_available and redis_client:
            try:
                redis_client.publish(cls.NOTIFICATION_CHANNEL, f"user:{user_id}:{message}")
            except Exception:
                pass
        else:
            InMemoryStore.publish(cls.NOTIFICATION_CHANNEL, f"user:{user_id}:{message}")

    @classmethod
    def push_task(cls, queue: str, payload: str):
        if _redis_available and redis_client:
            try:
                return redis_client.lpush(queue, payload)
            except Exception:
                pass
        return InMemoryStore.lpush(queue, payload)

    @classmethod
    def pop_task(cls, queue: str, timeout: int = 0):
        if _redis_available and redis_client:
            try:
                return redis_client.brpop(queue, timeout=timeout)
            except Exception:
                pass
        return InMemoryStore.brpop(queue, timeout=timeout)


def close():
    if _redis_available and redis_client:
        try:
            redis_client.close()
        except Exception:
            pass
    InMemoryStore.close()
