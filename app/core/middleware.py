from __future__ import annotations

import time
import uuid
import logging
from typing import Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

from app.data.database import SessionLocal
from app.services.audit_service import AuditService
from app.core.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.rate_limiter = RateLimiter()

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        request.state.request_id = request_id

        start = time.perf_counter()

        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = getattr(request.client, "host", None) if request.client else None
        user_agent = request.headers.get("User-Agent")
        user_id = request.headers.get("X-User-ID")

        path = request.url.path
        is_qa = path.startswith("/api/v1/qa") or path.startswith("/api/v1/search")

        if is_qa:
            limit_response = await self.rate_limiter.check_qa_endpoint(request, user_id=user_id)
        else:
            limit_response = await self.rate_limiter.check(request, user_id=user_id)

        rate_limited = False
        if limit_response is not None:
            response = limit_response
            rate_limited = True
        else:
            try:
                response = await call_next(request)
            except Exception as e:
                logger.exception(f"Unhandled exception in {request.method} {path}")
                response = Response(
                    content='{"detail":"Internal server error"}',
                    status_code=500,
                    media_type="application/json",
                )
                response.headers["X-Request-ID"] = request_id
                raise

        latency_ms = int((time.perf_counter() - start) * 1000)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-MS"] = str(latency_ms)

        status_code = response.status_code

        try:
            db = SessionLocal()
            try:
                audit_svc = AuditService(db)
                is_api = path.startswith("/api/")
                if is_api:
                    model_version = request.headers.get("X-Model-Version")
                    audit_svc.log_api_call(
                        endpoint=path,
                        method=request.method,
                        request_id=request_id,
                        user_id=user_id,
                        model_version=model_version,
                        latency_ms=latency_ms,
                        status_code=status_code,
                        rate_limited=rate_limited,
                        ip_address=ip,
                    )
                should_audit = (
                    path.startswith("/api/v1/")
                    and request.method in ("POST", "PUT", "DELETE", "PATCH")
                    and status_code < 500
                )
                if should_audit:
                    audit_svc.log_audit(
                        action=f"{request.method} {path}",
                        actor=user_id,
                        resource_type="api_endpoint",
                        resource_id=None,
                        description=f"API call to {path} with status {status_code}",
                        ip_address=ip,
                        user_agent=user_agent,
                        request_id=request_id,
                        response_status=status_code,
                    )
            finally:
                db.close()
        except Exception as e:
            logger.debug(f"Failed to log request: {e}")

        return response
