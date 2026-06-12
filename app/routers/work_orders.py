from datetime import datetime
from fastapi import APIRouter, Request, Depends, Query
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.database import get_db
from app.models.work_order import WorkOrder, OrderStatusEnum, OrderTypeEnum, PriorityEnum, ProcessingRecord
from app.models.user import User, RoleEnum
from app.schemas.work_order import WorkOrderCreate, WorkOrderAssign, WorkOrderStatusUpdate, ProcessingRecordCreate
from app.routers.auth import require_login, require_admin

router = APIRouter(prefix="/work-orders", tags=["工单"])


@router.get("")
async def list_work_orders(
    request: Request,
    status: str | None = Query(None),
    order_type: str | None = Query(None),
    priority: str | None = Query(None),
    assignee_id: int | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_login),
):
    from app.templates import templates

    query = select(WorkOrder).order_by(WorkOrder.created_at.desc())

    if status:
        query = query.where(WorkOrder.status == OrderStatusEnum(status))
    if order_type:
        query = query.where(WorkOrder.order_type == OrderTypeEnum(order_type))
    if priority:
        query = query.where(WorkOrder.priority == PriorityEnum(priority))
    if assignee_id:
        query = query.where(WorkOrder.assignee_id == assignee_id)
    if date_from:
        query = query.where(WorkOrder.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.where(WorkOrder.created_at <= datetime.fromisoformat(date_to))

    result = await db.execute(query)
    orders = result.scalars().all()

    users_result = await db.execute(select(User).where(User.is_active == True))
    users = users_result.scalars().all()

    return templates.TemplateResponse("work_orders/list.html", {
        "request": request,
        "orders": orders,
        "users": users,
        "current_user": user,
        "filters": {
            "status": status,
            "order_type": order_type,
            "priority": priority,
            "assignee_id": assignee_id,
            "date_from": date_from,
            "date_to": date_to,
        },
        "OrderStatusEnum": OrderStatusEnum,
        "OrderTypeEnum": OrderTypeEnum,
        "PriorityEnum": PriorityEnum,
        "RoleEnum": RoleEnum,
    })


@router.get("/create")
async def create_page(request: Request, user: User = Depends(require_login), db: AsyncSession = Depends(get_db)):
    from app.templates import templates
    return templates.TemplateResponse("work_orders/create.html", {
        "request": request,
        "current_user": user,
        "OrderTypeEnum": OrderTypeEnum,
        "PriorityEnum": PriorityEnum,
    })


@router.post("/create")
async def create_work_order(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_login),
):
    form = await request.form()
    title = form.get("title", "").strip()
    order_type = form.get("order_type", "fault")
    description = form.get("description", "").strip()
    priority = form.get("priority", "medium")
    sla_hours = float(form.get("sla_hours", "24"))

    if not title or len(title) < 2:
        from app.templates import templates
        return templates.TemplateResponse("work_orders/create.html", {
            "request": request,
            "current_user": user,
            "error": "工单标题至少2个字符",
            "OrderTypeEnum": OrderTypeEnum,
            "PriorityEnum": PriorityEnum,
        })

    if not description:
        from app.templates import templates
        return templates.TemplateResponse("work_orders/create.html", {
            "request": request,
            "current_user": user,
            "error": "工单描述不能为空",
            "OrderTypeEnum": OrderTypeEnum,
            "PriorityEnum": PriorityEnum,
        })

    order = WorkOrder(
        title=title,
        order_type=OrderTypeEnum(order_type),
        description=description,
        priority=PriorityEnum(priority),
        sla_hours=sla_hours,
        creator_id=user.id,
    )
    db.add(order)
    await db.flush()

    record = ProcessingRecord(
        work_order_id=order.id,
        handler_id=user.id,
        action="创建工单",
        comment=f"创建{order_type}工单：{title}",
    )
    db.add(record)

    return RedirectResponse(url="/work-orders", status_code=303)


@router.get("/{order_id}")
async def work_order_detail(
    request: Request,
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_login),
):
    from app.templates import templates

    result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        return templates.TemplateResponse("work_orders/list.html", {
            "request": request, "orders": [], "users": [],
            "current_user": user, "error": "工单不存在",
            "filters": {}, "OrderStatusEnum": OrderStatusEnum,
            "OrderTypeEnum": OrderTypeEnum, "PriorityEnum": PriorityEnum,
            "RoleEnum": RoleEnum,
        })

    records_result = await db.execute(
        select(ProcessingRecord)
        .where(ProcessingRecord.work_order_id == order_id)
        .order_by(ProcessingRecord.created_at.desc())
    )
    records = records_result.scalars().all()

    users_result = await db.execute(select(User).where(User.is_active == True))
    users = users_result.scalars().all()

    return templates.TemplateResponse("work_orders/detail.html", {
        "request": request,
        "order": order,
        "records": records,
        "users": users,
        "current_user": user,
        "OrderStatusEnum": OrderStatusEnum,
        "PriorityEnum": PriorityEnum,
        "RoleEnum": RoleEnum,
    })


@router.post("/{order_id}/assign")
async def assign_work_order(
    request: Request,
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    form = await request.form()
    assignee_id = int(form.get("assignee_id", 0))
    priority = form.get("priority", "medium")

    result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        return Response(status_code=404)

    order.assignee_id = assignee_id
    order.priority = PriorityEnum(priority)
    order.status = OrderStatusEnum.assigned
    order.assigned_at = datetime.utcnow()

    assignee_result = await db.execute(select(User).where(User.id == assignee_id))
    assignee = assignee_result.scalar_one_or_none()

    record = ProcessingRecord(
        work_order_id=order.id,
        handler_id=user.id,
        action="分派工单",
        comment=f"分派给 {assignee.display_name if assignee else '未知'}，优先级：{priority}",
    )
    db.add(record)

    return RedirectResponse(url=f"/work-orders/{order_id}", status_code=303)


@router.post("/{order_id}/status")
async def update_status(
    request: Request,
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_login),
):
    form = await request.form()
    status = form.get("status")
    comment = form.get("comment", "").strip()

    result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        return Response(status_code=404)

    new_status = OrderStatusEnum(status)

    if new_status == OrderStatusEnum.in_progress and order.assignee_id != user.id:
        if user.role not in (RoleEnum.admin, RoleEnum.security_officer):
            return Response(status_code=403)

    order.status = new_status
    if new_status == OrderStatusEnum.resolved:
        order.resolved_at = datetime.utcnow()
    elif new_status == OrderStatusEnum.closed:
        order.closed_at = datetime.utcnow()

    record = ProcessingRecord(
        work_order_id=order.id,
        handler_id=user.id,
        action=f"状态变更：{status}",
        comment=comment or None,
    )
    db.add(record)

    return RedirectResponse(url=f"/work-orders/{order_id}", status_code=303)


@router.post("/{order_id}/comment")
async def add_comment(
    request: Request,
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_login),
):
    form = await request.form()
    comment = form.get("comment", "").strip()
    if comment:
        record = ProcessingRecord(
            work_order_id=order_id,
            handler_id=user.id,
            action="添加备注",
            comment=comment,
        )
        db.add(record)

    return RedirectResponse(url=f"/work-orders/{order_id}", status_code=303)
