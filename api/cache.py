import time
from threading import Lock

_cache: dict = {}
_lock = Lock()
DEFAULT_TTL = 300


def get_cache_key(prefix: str, **kwargs) -> str:
    parts = [prefix]
    for k, v in sorted(kwargs.items()):
        if v is not None:
            parts.append(f"{k}={v}")
    return "|".join(parts)


def get_cached(key: str) -> object | None:
    with _lock:
        entry = _cache.get(key)
        if entry is None:
            return None
        if time.time() > entry["expires"]:
            del _cache[key]
            return None
        return entry["value"]


def set_cached(key: str, value: object, ttl: int = DEFAULT_TTL) -> None:
    with _lock:
        _cache[key] = {
            "value": value,
            "expires": time.time() + ttl,
        }


def clear_cache() -> None:
    with _lock:
        _cache.clear()
