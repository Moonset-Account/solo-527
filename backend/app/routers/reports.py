from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date, timedelta
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import BusinessException
from app.models import Notification, User, UserRole
from app.schemas.material import NotificationResponse
from app.schemas.common import ApiResponse, PaginatedResponse, DashboardStats, CleanerPerformanceItem, ReportQuery
from app.services.maintenance_service import ReportService
from app.services.task_service import TaskService
from app.core.logging import logger

router = APIRouter(tags=["通知与报表"])


@router.get("/api/notifications", response_model=PaginatedResponse[NotificationResponse])
def get_notifications(
    is_read: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    total = query.count()
    notifications = query.order_by(Notification.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        data=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/api/notifications/{notification_id}/read", response_model=ApiResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise BusinessException("通知不存在")

    notification.is_read = 1
    db.commit()
    return ApiResponse(message="已标记为已读")


@router.post("/api/notifications/read-all", response_model=ApiResponse)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == 0
    ).update({"is_read": 1})
    db.commit()
    return ApiResponse(message="全部标记为已读")


@router.get("/api/dashboard/stats", response_model=ApiResponse[DashboardStats])
def get_dashboard_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).date()
    if not end_date:
        end_date = datetime.utcnow().date()

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    TaskService.check_and_update_overdue(db)

    stats = ReportService.get_dashboard_stats(db, start_dt, end_dt)
    return ApiResponse(data=DashboardStats(**stats))


@router.get("/api/reports/cleaner-performance", response_model=ApiResponse[list[CleanerPerformanceItem]])
def get_cleaner_performance(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限访问", code=403)

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    performance = ReportService.get_cleaner_performance(db, start_dt, end_dt)
    return ApiResponse(data=[CleanerPerformanceItem(**p) for p in performance])


@router.get("/api/reports/export/cost")
def export_cost_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限访问", code=403)

    from fastapi.responses import StreamingResponse
    import io
    import pandas as pd
    from app.models import MaterialUsage, MaintenanceOrder

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    material_usages = db.query(MaterialUsage).filter(
        MaterialUsage.created_at.between(start_dt, end_dt)
    ).all()

    maintenance_costs = db.query(MaintenanceOrder).filter(
        MaintenanceOrder.completed_at.between(start_dt, end_dt)
    ).all()

    data = []
    for mu in material_usages:
        data.append({
            "日期": mu.created_at.strftime("%Y-%m-%d") if mu.created_at else "",
            "类型": "物料消耗",
            "关联ID": mu.cleaning_task_id or mu.maintenance_order_id,
            "物料名称": mu.material.name if mu.material else "",
            "数量": mu.quantity,
            "单价": mu.unit_price,
            "总成本": mu.total_cost,
            "备注": mu.remarks or ""
        })

    for mo in maintenance_costs:
        if mo.actual_cost > 0:
            data.append({
                "日期": mo.completed_at.strftime("%Y-%m-%d") if mo.completed_at else "",
                "类型": "维修费用",
                "关联ID": mo.id,
                "物料名称": mo.title,
                "数量": 1,
                "单价": mo.actual_cost,
                "总成本": mo.actual_cost,
                "备注": mo.description or ""
            })

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='成本报表')
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=cost_report_{start_date}_{end_date}.xlsx"}
    )


@router.post("/api/tasks/check-overdue", response_model=ApiResponse)
def check_overdue_tasks(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限操作", code=403)

    result = TaskService.check_and_update_overdue(db)
    return ApiResponse(data=result, message="超时检查完成")
