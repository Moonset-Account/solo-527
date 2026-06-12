from datetime import datetime
from fastapi import APIRouter, Request, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db, async_session
from app.models.audit_log import AuditLog
from app.models.user import User, RoleEnum
from app.routers.auth import require_login

router = APIRouter(prefix="/inspections", tags=["巡检遗漏"])


INSPECTION_CATEGORIES = [
    ("server_room", "机房巡检"),
    ("network", "网络设备巡检"),
    ("security", "安全策略巡检"),
    ("backup", "备份验证巡检"),
    ("permission", "权限审计巡检"),
    ("log", "日志审计巡检"),
    ("other", "其他巡检"),
]


@router.get("")
async def inspection_page(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_login),
):
    from app.templates import templates

    query = (
        select(AuditLog)
        .where(AuditLog.target_type == "inspection_miss")
        .order_by(AuditLog.created_at.desc())
    )
    result = await db.execute(query.limit(50))
    logs = result.scalars().all()

    return templates.TemplateResponse("inspections/index.html", {
        "request": request,
        "current_user": user,
        "categories": INSPECTION_CATEGORIES,
        "recent_misses": logs,
        "RoleEnum": RoleEnum,
    })


@router.post("/report")
async def report_inspection_miss(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_login),
):
    from app.templates import templates

    form = await request.form()
    category = form.get("category", "").strip()
    missed_date = form.get("missed_date", "").strip()
    description = form.get("description", "").strip()
    impact = form.get("impact", "low")

    errors = []
    if not category:
        errors.append("请选择巡检类型")
    if not missed_date:
        errors.append("请选择遗漏日期")
    if not description:
        errors.append("请填写遗漏说明")

    if errors:
        query = (
            select(AuditLog)
            .where(AuditLog.target_type == "inspection_miss")
            .order_by(AuditLog.created_at.desc())
        )
        result = await db.execute(query.limit(50))
        logs = result.scalars().all()

        return templates.TemplateResponse("inspections/index.html", {
            "request": request,
            "current_user": user,
            "categories": INSPECTION_CATEGORIES,
            "recent_misses": logs,
            "errors": errors,
            "form_data": {"category": category, "missed_date": missed_date, "description": description, "impact": impact},
            "RoleEnum": RoleEnum,
        })

    category_label = dict(INSPECTION_CATEGORIES).get(category, category)
    detail_parts = [
        f"巡检类型：{category_label}",
        f"遗漏日期：{missed_date}",
        f"影响等级：{impact}",
        f"遗漏说明：{description}",
    ]

    async with async_session() as session:
        log = AuditLog(
            user_id=user.id,
            action=f"上报巡检遗漏/{category}",
            target_type="inspection_miss",
            detail="\n".join(detail_parts),
            ip_address=request.client.host if request.client else None,
        )
        session.add(log)
        await session.commit()

    return RedirectResponse(url="/inspections", status_code=303)
