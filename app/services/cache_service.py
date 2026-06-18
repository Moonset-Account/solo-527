import json
from typing import Awaitable, Callable

from app.redis_client import get_redis


def station_stats_key(station_id) -> str:
    return f"station:stats:{station_id}"


def revenue_summary_key(station_id, start, end) -> str:
    return f"revenue:summary:{station_id}:{start}:{end}"


def energy_curve_key(station_id, start, end) -> str:
    return f"energy:curve:{station_id}:{start}:{end}"


def alarm_stats_key(station_id) -> str:
    return f"alarm:stats:{station_id}"


async def get_cached(key: str) -> str | None:
    redis = await get_redis()
    return await redis.get(key)


async def set_cached(key: str, value: str, ttl: int = 300) -> None:
    redis = await get_redis()
    await redis.set(key, value, ex=ttl)


async def delete_cached(key: str) -> None:
    redis = await get_redis()
    await redis.delete(key)


async def get_or_set(
    key: str,
    factory_coro: Callable[[], Awaitable],
    ttl: int = 300,
) -> str:
    cached = await get_cached(key)
    if cached is not None:
        return cached
    result = await factory_coro()
    value = json.dumps(result, default=str)
    await set_cached(key, value, ttl)
    return value


async def invalidate_pattern(pattern: str) -> None:
    redis = await get_redis()
    keys = []
    async for key in redis.scan_iter(match=pattern):
        keys.append(key)
    if keys:
        await redis.delete(*keys)
