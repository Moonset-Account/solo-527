from fastapi import APIRouter, Request, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User, RoleEnum
from app.routers.auth import require_security_officer

router = APIRouter(prefix="/audit", tags=["审计"])


@router.get("")
async def list_audit_logs(
    request: Request,
    user_id: int | None = Query(None),
    action: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_security_officer),
):
    from app.templates import templates
    from datetime import datetime

    query = select(AuditLog).order_by(AuditLog.created_at.desc())

    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if action:
        query = query.where(AuditLog.action.ilike(f"%{action}%"))
    if date_from:
        query = query.where(AuditLog.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.where(AuditLog.created_at <= datetime.fromisoformat(date_to))

    result = await db.execute(query.limit(200))
    logs = result.scalars().all()

    users_result = await db.execute(select(User))
    users = users_result.scalars().all()

    return templates.TemplateResponse("partials/audit_logs.html", {
        "request": request,
        "logs": logs,
        "users": users,
        "current_user": user,
        "filters": {
            "user_id": user_id,
            "action": action,
            "date_from": date_from,
            "date_to": date_to,
        },
    })
