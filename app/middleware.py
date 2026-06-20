from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import logging
from datetime import datetime

from app.database import async_session
from app.models import OperationLog, User
from app.utils import get_field_changes, serialize_model

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        try:
            response = await call_next(request)
        except HTTPException as e:
            response = JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail},
            )
        except Exception as e:
            logger.exception(f"Unhandled error: {e}")
            response = JSONResponse(
                status_code=500,
                content={"detail": "服务器内部错误"},
            )

        process_time = (time.time() - start_time) * 1000
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        return response


class AuditMiddleware:
    CONFLICT_ACTIONS = [
        "create_reach_task", "approve_reach_task", "issue_coupon",
        "adjust_points", "modify_member_level", "update_reach_task"
    ]

    @staticmethod
    async def log_operation(
        user: User,
        action: str,
        entity_type: str = None,
        entity_id: int = None,
        entity_name: str = None,
        old_data: dict = None,
        new_data: dict = None,
        request: Request = None,
        is_conflict: bool = False,
        conflict_detail: dict = None,
    ):
        ip = None
        user_agent = None
        if request:
            ip = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

        changes = get_field_changes(old_data or {}, new_data or {})
        change_summary = None
        if changes:
            change_summary = "; ".join([
                f"{c['field']}: {c['old_value']} -> {c['new_value']}"
                for c in changes[:5]
            ])
            if len(changes) > 5:
                change_summary += f" 等{len(changes)}处变更"

        is_conflict_action = is_conflict or any(ca in action for ca in AuditMiddleware.CONFLICT_ACTIONS)

        async with async_session() as db:
            log = OperationLog(
                operator_id=user.id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_name=entity_name,
                ip_address=ip,
                user_agent=user_agent,
                old_data=old_data,
                new_data=new_data,
                change_summary=change_summary,
                is_conflict_action=is_conflict_action,
                conflict_detail=conflict_detail,
            )
            db.add(log)
            await db.commit()
