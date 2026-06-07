from flask_caching import Cache
from datetime import datetime, timedelta
import hashlib
import json
from typing import Any, Callable


class CacheManager:
    _instance = None
    _cache = None
    
    def __new__(cls, app=None):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, app=None):
        if self._initialized:
            return
        
        if app is not None:
            self.init_app(app)
        
        self._initialized = True
    
    def init_app(self, app):
        self._cache = Cache(app, config={
            'CACHE_TYPE': 'SimpleCache',
            'CACHE_DEFAULT_TIMEOUT': 300,
            'CACHE_THRESHOLD': 1000
        })
    
    @property
    def cache(self):
        return self._cache
    
    @staticmethod
    def _generate_key(prefix: str, *args, **kwargs) -> str:
        key_parts = [prefix]
        for arg in args:
            key_parts.append(str(arg))
        for k, v in sorted(kwargs.items()):
            key_parts.append(f"{k}={v}")
        
        key_str = '|'.join(key_parts)
        hash_key = hashlib.md5(key_str.encode()).hexdigest()
        return f"{prefix}_{hash_key}"
    
    def get_or_compute(self, key_prefix: str, compute_func: Callable,
                       *args, timeout: int = 300, **kwargs) -> Any:
        cache_key = self._generate_key(key_prefix, *args, **kwargs)
        
        if self._cache is not None:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached
        
        result = compute_func(*args, **kwargs)
        
        if self._cache is not None and result is not None:
            self._cache.set(cache_key, result, timeout=timeout)
        
        return result
    
    def invalidate_pattern(self, pattern: str):
        if self._cache is None:
            return
        
        if hasattr(self._cache, 'cache'):
            cache_obj = self._cache.cache
            if hasattr(cache_obj, '_cache'):
                keys = list(cache_obj._cache.keys())
                for key in keys:
                    if pattern in key:
                        self._cache.delete(key)
    
    def invalidate_window(self, window_id: int):
        self.invalidate_pattern(f"window_{window_id}")
    
    def invalidate_floor(self, floor: int):
        self.invalidate_pattern(f"floor_{floor}")
    
    def invalidate_all(self):
        if self._cache is not None:
            self._cache.clear()
    
    @staticmethod
    def get_cache_timeout_for_time_slot(time_slot: str) -> int:
        timeouts = {
            'breakfast': 1800,
            'lunch': 1800,
            'dinner': 1800,
            'night_snack': 3600,
            'other': 600
        }
        return timeouts.get(time_slot, 600)
