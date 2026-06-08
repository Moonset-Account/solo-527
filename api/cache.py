import time
import hashlib
import json
import functools

_cache_store = {}
_cache_ttl = {}


def _make_key(func_name, filters):
    dumped = json.dumps(filters, sort_keys=True, default=str)
    return f"{func_name}:{hashlib.md5(dumped.encode()).hexdigest()}"


def cached(ttl=300):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            filters = kwargs.get("filters", None) or (args[0] if args else None)
            key = _make_key(func.__name__, filters or {})

            if key in _cache_store:
                if key in _cache_ttl and time.time() < _cache_ttl[key]:
                    return _cache_store[key]

            result = func(*args, **kwargs)
            _cache_store[key] = result
            _cache_ttl[key] = time.time() + ttl
            return result
        return wrapper
    return decorator


def invalidate(pattern=None):
    if pattern is None:
        _cache_store.clear()
        _cache_ttl.clear()
    else:
        keys_to_remove = [k for k in _cache_store if pattern in k]
        for k in keys_to_remove:
            _cache_store.pop(k, None)
            _cache_ttl.pop(k, None)


def cache_stats():
    now = time.time()
    active = sum(1 for k, t in _cache_ttl.items() if now < t)
    return {"total_keys": len(_cache_store), "active_keys": active}
