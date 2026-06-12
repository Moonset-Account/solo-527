from datetime import datetime
from fastapi import APIRouter, Request, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.work_order import WorkOrder, OrderStatusEnum, OrderTypeEnum, PriorityEnum
from app.models.user import User, RoleEnum
from app.routers.auth import require_admin
from app.config import get_settings
import io

router = APIRouter(prefix="/reports", tags=["报表"])
settings = get_settings()


@router.get("")
async def reports_page(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    from app.templates import templates
    return templates.TemplateResponse("reports/export.html", {
        "request": request,
        "current_user": user,
        "RoleEnum": RoleEnum,
    })


@router.get("/export")
async def export_work_orders(
    request: Request,
    status: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    if settings.is_test:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="测试环境不允许导出报表")

    query = select(WorkOrder).order_by(WorkOrder.created_at.desc())

    if status:
        query = query.where(WorkOrder.status == OrderStatusEnum(status))
    if date_from:
        query = query.where(WorkOrder.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.where(WorkOrder.created_at <= datetime.fromisoformat(date_to))

    result = await db.execute(query)
    orders = result.scalars().all()

    output = io.BytesIO()
    try:
        from openpyxl import Workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "工单报表"

        headers = ["ID", "标题", "类型", "状态", "优先级", "创建人ID", "处理人ID", "SLA(小时)", "创建时间", "分派时间", "解决时间", "关闭时间"]
        ws.append(headers)

        for order in orders:
            ws.append([
                order.id,
                order.title,
                order.order_type.value,
                order.status.value,
                order.priority.value,
                order.creator_id,
                order.assignee_id,
                order.sla_hours,
                order.created_at.strftime("%Y-%m-%d %H:%M:%S") if order.created_at else "",
                order.assigned_at.strftime("%Y-%m-%d %H:%M:%S") if order.assigned_at else "",
                order.resolved_at.strftime("%Y-%m-%d %H:%M:%S") if order.resolved_at else "",
                order.closed_at.strftime("%Y-%m-%d %H:%M:%S") if order.closed_at else "",
            ])

        wb.save(output)
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=work_orders_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"},
        )
    except Exception:
        raise
