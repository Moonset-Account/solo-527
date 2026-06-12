from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session
from app.models.audit_log import AuditLog
from app.services.auth_service import decode_access_token
import json

SENSITIVE_ACTIONS = {
    "DELETE", "PATCH",
}

INSPECTION_KEYWORDS = ["inspection", "巡检"]


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        if request.method.upper() in SENSITIVE_ACTIONS or self._is_inspection_action(request):
            await self._log_action(request)

        return response

    def _is_inspection_action(self, request: Request) -> bool:
        path = request.url.path.lower()
        return any(kw in path for kw in INSPECTION_KEYWORDS)

    async def _log_action(self, request: Request):
        user_id = None
        token = request.cookies.get("access_token")
        if token:
            token_data = decode_access_token(token)
            if token_data:
                user_id = token_data.user_id

        body = None
        try:
            body_bytes = await request.body()
            if body_bytes:
                body = body_bytes.decode("utf-8")[:2000]
        except Exception:
            pass

        async with async_session() as session:
            log = AuditLog(
                user_id=user_id,
                action=f"{request.method} {request.url.path}",
                target_type=self._extract_target_type(request.url.path),
                target_id=self._extract_target_id(request.url.path),
                detail=body,
                ip_address=request.client.host if request.client else None,
            )
            session.add(log)
            await session.commit()

    def _extract_target_type(self, path: str) -> str | None:
        parts = [p for p in path.split("/") if p]
        if len(parts) >= 2:
            return parts[1]
        return None

    def _extract_target_id(self, path: str) -> int | None:
        parts = [p for p in path.split("/") if p]
        for part in reversed(parts):
            try:
                return int(part)
            except ValueError:
                continue
        return None
