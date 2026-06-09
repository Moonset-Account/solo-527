from __future__ import annotations

import time
import threading
from collections import defaultdict, deque
from typing import Deque, Dict, Optional, Callable
from datetime import datetime, timedelta

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.config import get_settings


class InMemoryRateLimiter:
    """基于内存的滑动窗口限流。（生产环境建议使用Redis）"""

    def __init__(self):
        self._lock = threading.Lock()
        self._requests: Dict[str, Deque[float]] = defaultdict(deque)

    def is_allowed(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            dq = self._requests[key]
            while dq and dq[0] < cutoff:
                dq.popleft()
            if len(dq) >= limit:
                return False
            dq.append(now)
            return True


class RateLimiter:
    def __init__(self):
        self.settings = get_settings()
        self._memory = InMemoryRateLimiter()

    def _get_key(self, request: Request, user_id: Optional[str] = None) -> str:
        if user_id:
            return f"user:{user_id}"
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = getattr(request.client, "host", "unknown") if request.client else "unknown"
        return f"ip:{ip}"

    async def check(self, request: Request, user_id: Optional[str] = None) -> Optional[JSONResponse]:
        key = self._get_key(request, user_id)
        checks = [
            (self.settings.RATE_LIMIT_PER_MINUTE, 60, "minute"),
            (self.settings.RATE_LIMIT_PER_HOUR, 3600, "hour"),
            (self.settings.RATE_LIMIT_PER_DAY, 86400, "day"),
        ]
        for limit, window, label in checks:
            if not self._memory.is_allowed(f"{key}:{label}", limit, window):
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": f"请求过于频繁，超过每{label} {limit} 次的限制。",
                        "retry_after_seconds": window,
                        "rate_limited": True,
                    },
                    headers={"Retry-After": str(window)},
                )
        return None

    async def check_qa_endpoint(self, request: Request,
                                user_id: Optional[str] = None) -> Optional[JSONResponse]:
        qa_limit = max(1, self.settings.RATE_LIMIT_PER_MINUTE // 2)
        qa_window = 60
        key = self._get_key(request, user_id) + ":qa"
        if not self._memory.is_allowed(key, qa_limit, qa_window):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"问答接口请求过于频繁，超过每{qa_window}秒 {qa_limit} 次的限制。",
                    "retry_after_seconds": qa_window,
                    "rate_limited": True,
                },
                headers={"Retry-After": str(qa_window)},
            )
        return await self.check(request, user_id)
