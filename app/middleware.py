import time
import re
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import SessionLocal
from app.models import ApiStatus

STATIC_PATHS = {'/static', '/uploads', '/favicon.ico'}
SKIP_PATHS = {'/login', '/logout', '/showcase'}


def _normalize_path(path: str) -> str:
    path = re.sub(r'/\d+', '/{id}', path)
    return path


class ApiStatusMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method

        skip = False
        for sp in STATIC_PATHS:
            if path.startswith(sp):
                skip = True
                break
        if path in SKIP_PATHS:
            skip = True
        if not path.startswith('/api/'):
            skip = True

        response: Response = await call_next(request)

        if not skip and path.startswith('/api/'):
            process_time = getattr(request.state, 'process_time', None)
            self._record_api_call(
                endpoint=path,
                method=method,
                status_code=response.status_code,
                response_time=process_time
            )

        return response

    @staticmethod
    def _record_api_call(endpoint: str, method: str, status_code: int, response_time: float | None):
        try:
            db: Session = SessionLocal()
            normalized_endpoint = _normalize_path(endpoint)
            existing = db.query(ApiStatus).filter(
                ApiStatus.endpoint == normalized_endpoint,
                ApiStatus.method == method
            ).first()

            is_error = status_code >= 400

            if existing:
                existing.call_count += 1
                existing.last_called = datetime.now()
                if response_time is not None:
                    existing.avg_response_time = (
                        (existing.avg_response_time * (existing.call_count - 1) + response_time)
                        / existing.call_count
                    )
                if is_error:
                    existing.error_count += 1
                    if status_code >= 500:
                        existing.status = 'error'
                        existing.last_error = f"HTTP {status_code}"
                    elif existing.status == 'healthy' and existing.error_count > 0:
                        if existing.error_count / existing.call_count > 0.1:
                            existing.status = 'degraded'
                else:
                    if existing.error_count / existing.call_count <= 0.05 and existing.call_count > 10:
                        existing.status = 'healthy'
            else:
                new_status = ApiStatus(
                    endpoint=normalized_endpoint,
                    method=method,
                    last_called=datetime.now(),
                    call_count=1,
                    error_count=1 if is_error else 0,
                    avg_response_time=response_time or 0,
                    status='error' if status_code >= 500 else ('degraded' if status_code >= 400 else 'healthy'),
                    last_error=f"HTTP {status_code}" if is_error else None
                )
                db.add(new_status)

            db.commit()
        except Exception:
            pass
        finally:
            db.close()


class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        request.state.process_time = process_time
        return response
