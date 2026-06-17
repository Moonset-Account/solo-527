from typing import Optional, Dict, Any
from app.core.config import settings


class MockRedis:
    def __init__(self):
        self._data: Dict[str, Any] = {}

    async def get(self, key: str) -> Optional[str]:
        return self._data.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None, **kwargs):
        self._data[key] = value

    async def delete(self, key: str):
        if key in self._data:
            del self._data[key]

    async def exists(self, key: str) -> bool:
        return key in self._data

    async def close(self):
        pass


_use_mock = False

try:
    import redis.asyncio as redis
except ImportError:
    _use_mock = True


class RedisClient:
    def __init__(self):
        self._client = None
        self._mock = None

    def connect(self):
        global _use_mock
        if _use_mock:
            self._mock = MockRedis()
            return
        try:
            import redis.asyncio as redis
            self._client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
            )
        except Exception:
            _use_mock = True
            self._mock = MockRedis()

    async def close(self):
        if self._mock:
            await self._mock.close()
            return
        if self._client:
            await self._client.close()

    @property
    def client(self):
        if self._mock:
            return self._mock
        if not self._client:
            self.connect()
        return self._client

    async def get(self, key: str) -> Optional[str]:
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
