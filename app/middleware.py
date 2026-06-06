import traceback
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.database import SessionLocal
from app import models


class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            db = SessionLocal()
            try:
                user_id = None
                try:
                    from app.auth import get_current_user
                    from fastapi import Depends
                    token = request.headers.get("Authorization", "").replace("Bearer ", "")
                    if token:
                        from jose import jwt
                        from app.config import settings
                        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                        username = payload.get("sub")
                        user = db.query(models.User).filter(models.User.username == username).first()
                        if user:
                            user_id = user.id
                except Exception:
                    pass
                
                request_body = None
                try:
                    body = await request.body()
                    if body:
                        request_body = json.loads(body.decode("utf-8"))
                except Exception:
                    pass
                
                error_log = models.ErrorLog(
                    error_type=type(e).__name__,
                    error_message=str(e),
                    stack_trace=traceback.format_exc(),
                    endpoint=f"{request.method} {request.url.path}",
                    user_id=user_id,
                    request_data=request_body
                )
                db.add(error_log)
                db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()
            
            return JSONResponse(
                status_code=500,
                content={"detail": "服务器内部错误"}
            )
