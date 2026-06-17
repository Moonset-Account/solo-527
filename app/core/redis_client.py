import redis.asyncio as redis
from app.core.config import settings


class RedisClient:
    def __init__(self):
        self._client = None

    def connect(self):
        self._client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
        )

    async def close(self):
        if self._client:
            await self._client.close()

    @property
    def client(self):
        if not self._client:
            self.connect()
        return self._client

    async def get(self, key: str) -> str | None:
        return await self.client.get(key)

    async def set(self, key: str, value: str, expire: int = 3600):
        await self.client.set(key, value, ex=expire)

    async def delete(self, key: str):
        await self.client.delete(key)

    async def exists(self, key: str) -> bool:
        return await self.client.exists(key) > 0


redis_client = RedisClient()


def get_redis() -> RedisClient:
    return redis_client
