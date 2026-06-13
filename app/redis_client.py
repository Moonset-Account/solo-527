import redis.asyncio as redis
from app.config import settings


class RedisClient:
    _instance: redis.Redis = None
    _session_instance: redis.Redis = None

    @classmethod
    async def get_client(cls) -> redis.Redis:
        if cls._instance is None:
            cls._instance = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                encoding="utf-8",
            )
        return cls._instance

    @classmethod
    async def get_session_client(cls) -> redis.Redis:
        if cls._session_instance is None:
            base_url = settings.REDIS_URL.rsplit("/", 1)[0]
            session_url = f"{base_url}/{settings.REDIS_SESSION_DB}"
            cls._session_instance = redis.from_url(
                session_url,
                decode_responses=True,
                encoding="utf-8",
            )
        return cls._session_instance

    @classmethod
    async def close(cls):
        if cls._instance:
            await cls._instance.close()
            cls._instance = None
        if cls._session_instance:
            await cls._session_instance.close()
            cls._session_instance = None


async def get_redis() -> redis.Redis:
    return await RedisClient.get_client()


async def get_session_redis() -> redis.Redis:
    return await RedisClient.get_session_client()
