import json
import traceback
from datetime import datetime
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import ApiErrorLog
from app.core.security import decode_access_token


class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            db = SessionLocal()
            try:
                method = request.method
                path = request.url.path

                if path.startswith("/api/"):
                    body = None
                    try:
                        body_bytes = await request.body()
                        if body_bytes:
                            body = body_bytes.decode("utf-8")[:2000]
                    except Exception:
                        pass

                    query_params = None
                    if request.query_params:
                        query_params = dict(request.query_params)

                    user_id = None
                    token = request.headers.get("authorization", "").replace("Bearer ", "")
                    if token:
                        payload = decode_access_token(token)
                        if payload:
                            user_id = payload.get("user_id")

                    ip = request.client.host if request.client else None

                    error_type = type(e).__name__
                    error_message = str(e)[:1000]

                    status_code = 500
                    if hasattr(e, "status_code"):
                        status_code = e.status_code

                    existing_log = db.query(ApiErrorLog).filter(
                        ApiErrorLog.path == path,
                        ApiErrorLog.method == method,
                        ApiErrorLog.error_type == error_type,
                        ApiErrorLog.resolved == False
                    ).first()

                    if existing_log:
                        existing_log.retry_count += 1
                        existing_log.last_result = f"第{existing_log.retry_count}次重现: {error_message[:200]}"
                        existing_log.updated_at = datetime.utcnow()
                    else:
                        error_log = ApiErrorLog(
                            method=method,
                            path=path,
                            status_code=status_code,
                            error_message=error_message,
                            error_type=error_type,
                            request_body=body,
                            query_params=query_params,
                            user_id=user_id,
                            ip_address=ip,
                            retry_count=1,
                            last_result=f"首次发生: {error_message[:200]}"
                        )
                        db.add(error_log)

                    db.commit()

                if hasattr(e, "status_code"):
                    return JSONResponse(
                        status_code=e.status_code,
                        content={"detail": str(e)}
                    )

                return JSONResponse(
                    status_code=500,
                    content={"detail": "服务器内部错误"}
                )
            finally:
                db.close()
