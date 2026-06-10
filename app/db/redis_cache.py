from __future__ import annotations

import json
from contextlib import asynccontextmanager
from datetime import timedelta
from typing import Any, AsyncGenerator, Optional

import redis.asyncio as redis_asyncio

from app.core.config import settings


class RedisCache:
    def __init__(self) -> None:
        self._client: Optional[redis_asyncio.Redis] = None

    @property
    def client(self) -> redis_asyncio.Redis:
        if self._client is None:
            raise RuntimeError("Redis 未初始化，请先调用 initialize()")
        return self._client

    async def initialize(self) -> None:
        if self._client is None:
            self._client = redis_asyncio.Redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                retry_on_timeout=True,
            )
            await self._client.ping()

    async def close(self) -> None:
        if self._client is not None:
            await self._client.close()
            self._client = None

    async def get_json(self, key: str) -> Optional[Any]:
        raw = await self.client.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (TypeError, json.JSONDecodeError):
            return raw

    async def set_json(self, key: str, value: Any, ttl: Optional[timedelta | int] = None) -> None:
        data = json.dumps(value, ensure_ascii=False, default=str) if not isinstance(value, (str, bytes)) else value
        ex: Optional[int] = None
        if isinstance(ttl, timedelta):
            ex = int(ttl.total_seconds())
        elif isinstance(ttl, int):
            ex = ttl
        await self.client.set(key, data, ex=ex)

    async def delete(self, *keys: str) -> int:
        return await self.client.delete(*keys)

    async def exists(self, key: str) -> bool:
        return bool(await self.client.exists(key))

    async def acquire_lock(self, key: str, timeout: int = 60) -> bool:
        return bool(await self.client.set(key, "1", nx=True, ex=timeout))

    async def release_lock(self, key: str) -> None:
        await self.client.delete(key)


_cache = RedisCache()


def get_cache() -> RedisCache:
    return _cache


@asynccontextmanager
async def managed_cache() -> AsyncGenerator[RedisCache, None]:
    cache = get_cache()
    try:
        await cache.initialize()
        yield cache
    finally:
        await cache.close()


__all__ = ["RedisCache", "get_cache", "managed_cache"]
