import json
import os
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, and_
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_active_user, require_roles
from app.models import (
    User, DictItem, DictItemVersion, Notification, NotificationVersion,
    OperationLog, Attachment, Note, ChangeHistory, CostReport,
    MemberProfile, PointRecord, CouponTemplate, MemberCoupon,
    RedemptionOrder, ReachTask, UserRole, PointProduct, PointBenefit
)
from app.schemas import (
    DictItemCreate, DictItemUpdate, DictItemResponse,
    NotificationResponse, OperationLogResponse,
    ChangeHistoryResponse, AttachmentResponse, NoteResponse, NoteCreate,
    CostReportResponse
)
from app.middleware import AuditMiddleware
from app.utils import serialize_model
from app.config import settings

router = APIRouter(tags=["系统管理"])


def _dict_version_data(d: DictItem) -> dict:
    return {
        "dict_type": d.dict_type,
        "dict_code": d.dict_code,
        "dict_label": d.dict_label,
        "dict_value": d.dict_value,
        "sort_order": d.sort_order,
        "description": d.description,
    }


def _notification_version_data(n: Notification) -> dict:
    return {
        "notification_type": n.notification_type,
        "title": n.title,
        "content": n.content,
        "priority": n.priority,
        "data": n.data,
    }


# ============ 字典管理 ============

@router.get("/api/dicts", response_model=List[DictItemResponse])
async def list_dicts(
    dict_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(DictItem)
    if dict_type:
        query = query.where(DictItem.dict_type == dict_type)
    if is_active is not None:
        query = query.where(DictItem.is_active == is_active)
    query = query.order_by(DictItem.dict_type, DictItem.sort_order)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/api/dicts/types")
async def list_dict_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DictItem.dict_type).distinct().order_by(DictItem.dict_type)
    )
    return [r[0] for r in result.all()]


@router.post("/api/dicts", response_model=DictItemResponse)
async def create_dict(
    data: DictItemCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(DictItem).where(
            DictItem.dict_type == data.dict_type,
            DictItem.dict_code == data.dict_code,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="字典编码已存在")

    item = DictItem(
        **data.model_dump(exclude_unset=True),
        created_by=current_user.id,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    version = DictItemVersion(
        dict_item_id=item.id,
        version=1,
        dict_label=item.dict_label,
        data=_dict_version_data(item),
        change_summary="初始创建",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()

    await AuditMiddleware.log_operation(
        user=current_user,
        action="create_dict_item",
        entity_type="dict_item",
        entity_id=item.id,
        entity_name=f"{item.dict_type}/{item.dict_code}",
        new_data=serialize_model(item),
        request=request,
    )

    return item


@router.put("/api/dicts/{dict_id}", response_model=DictItemResponse)
async def update_dict(
    dict_id: int,
    data: DictItemUpdate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DictItem).where(DictItem.id == dict_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="字典不存在")

    old_data = serialize_model(item)
    update_data = data.model_dump(exclude_unset=True, exclude={"change_summary"})
    for field, value in update_data.items():
        setattr(item, field, value)

    item.version += 1
    version = DictItemVersion(
        dict_item_id=item.id,
        version=item.version,
        dict_label=item.dict_label,
        data=_dict_version_data(item),
        change_summary=data.change_summary or "修改字典",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()
    await db.refresh(item)

    await AuditMiddleware.log_operation(
        user=current_user,
        action="update_dict_item",
        entity_type="dict_item",
        entity_id=item.id,
        entity_name=f"{item.dict_type}/{item.dict_code}",
        old_data=old_data,
        new_data=serialize_model(item),
        request=request,
    )

    return item


@router.get("/api/dicts/versions/{dict_id}")
async def get_dict_versions(
    dict_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DictItemVersion)
        .where(DictItemVersion.dict_item_id == dict_id)
        .order_by(desc(DictItemVersion.version))
    )
    versions = result.scalars().all()
    return [
        {
            "id": v.id,
            "version": v.version,
            "dict_label": v.dict_label,
            "data": v.data,
            "change_summary": v.change_summary,
            "changed_by": v.changed_by,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in versions
    ]


# ============ 通知管理 ============

@router.get("/api/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    is_read: Optional[bool] = None,
    notification_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Notification).where(
        (Notification.target_user_id == current_user.id) |
        (Notification.target_role == current_user.role) |
        (Notification.target_role.is_(None))
    )
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
    if notification_type:
        query = query.where(Notification.notification_type == notification_type)

    query = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/api/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="通知不存在")

    notification.is_read = True
    notification.read_at = datetime.utcnow()
    await db.commit()
    await db.refresh(notification)
    return notification


@router.post("/api/notifications/create", response_model=NotificationResponse)
async def create_notification(
    title: str = Form(...),
    content: str = Form(...),
    notification_type: str = Form(...),
    target_role: Optional[str] = Form(None),
    request: Request = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    notification = Notification(
        notification_type=notification_type,
        title=title,
        content=content,
        target_role=target_role,
        priority="normal",
        created_by=current_user.id,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)

    version = NotificationVersion(
        notification_id=notification.id,
        version=1,
        title=notification.title,
        data=_notification_version_data(notification),
        change_summary="初始创建",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()

    if request:
        await AuditMiddleware.log_operation(
            user=current_user,
            action="create_notification",
            entity_type="notification",
            entity_id=notification.id,
            entity_name=notification.title,
            new_data=serialize_model(notification),
            request=request,
        )

    return notification


# ============ 操作日志 ============

@router.get("/api/operation-logs", response_model=List[OperationLogResponse])
async def list_operation_logs(
    operator_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    is_conflict: Optional[bool] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    query = select(OperationLog)
    if current_user.role == UserRole.BRAND_OPERATOR:
        pass
    if operator_id:
        query = query.where(OperationLog.operator_id == operator_id)
    if action:
        query = query.where(OperationLog.action.contains(action))
    if entity_type:
        query = query.where(OperationLog.entity_type == entity_type)
    if is_conflict is not None:
        query = query.where(OperationLog.is_conflict_action == is_conflict)
    if start_date:
        query = query.where(OperationLog.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(OperationLog.created_at <= datetime.combine(end_date, datetime.max.time()))

    query = query.order_by(desc(OperationLog.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


# ============ 附件与备注 ============

@router.post("/api/attachments/upload", response_model=AttachmentResponse)
async def upload_attachment(
    entity_type: str = Form(...),
    entity_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename or "")[1]
    new_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{hash(file.filename)}_{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, new_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    attachment = Attachment(
        entity_type=entity_type,
        entity_id=entity_id,
        file_name=file.filename or new_filename,
        file_path=file_path,
        file_size=len(content),
        file_type=file.content_type,
        uploaded_by=current_user.id,
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return attachment


@router.get("/api/attachments")
async def list_attachments(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Attachment).where(
            Attachment.entity_type == entity_type,
            Attachment.entity_id == entity_id,
        ).order_by(desc(Attachment.created_at))
    )
    attachments = result.scalars().all()
    return [
        {
            "id": a.id,
            "file_name": a.file_name,
            "file_size": a.file_size,
            "file_type": a.file_type,
            "download_url": f"/api/attachments/{a.id}/download",
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in attachments
    ]


@router.get("/api/attachments/{attachment_id}/download")
async def download_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Attachment).where(Attachment.id == attachment_id)
    )
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")
    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(
        attachment.file_path,
        filename=attachment.file_name,
        media_type=attachment.file_type or "application/octet-stream",
    )


@router.get("/api/notes", response_model=List[NoteResponse])
async def list_notes(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Note).where(
        Note.entity_type == entity_type,
        Note.entity_id == entity_id,
    )
    if current_user.role == UserRole.MEMBER:
        query = query.where(Note.is_internal == False)
    query = query.order_by(desc(Note.created_at))
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/api/notes", response_model=NoteResponse)
async def create_note(
    data: NoteCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    note = Note(
        entity_type=data.entity_type,
        entity_id=data.entity_id,
        content=data.content,
        is_internal=data.is_internal if current_user.role != UserRole.MEMBER else False,
        created_by=current_user.id,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.get("/api/change-histories", response_model=List[ChangeHistoryResponse])
async def list_change_histories(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChangeHistory).where(
            ChangeHistory.entity_type == entity_type,
            ChangeHistory.entity_id == entity_id,
        ).order_by(desc(ChangeHistory.created_at))
    )
    return result.scalars().all()


# ============ 成本报表 ============

@router.get("/api/cost-reports", response_model=List[CostReportResponse])
async def list_cost_reports(
    report_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    query = select(CostReport)
    if current_user.role == UserRole.BRAND_OPERATOR and current_user.brand_id:
        query = query.where(
            (CostReport.brand_id == current_user.brand_id) | CostReport.brand_id.is_(None)
        )
    if report_type:
        query = query.where(CostReport.report_type == report_type)
    if start_date:
        query = query.where(CostReport.report_date >= start_date)
    if end_date:
        query = query.where(CostReport.report_date <= end_date)

    query = query.order_by(desc(CostReport.report_date), desc(CostReport.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/api/cost-reports/generate", response_model=CostReportResponse)
async def generate_cost_report(
    report_type: str = Form(...),
    report_date: str = Form(...),
    request: Request = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    brand_id = None
    if current_user.role == UserRole.BRAND_OPERATOR:
        brand_id = current_user.brand_id

    report_dt = datetime.strptime(report_date, "%Y-%m-%d").date() if "-" in report_date else date.today()
    start_dt = datetime.combine(report_dt, datetime.min.time())
    end_dt = datetime.combine(report_dt, datetime.max.time())

    point_records_result = await db.execute(
        select(func.coalesce(func.sum(PointRecord.cost_amount), 0),
               func.coalesce(func.sum(PointRecord.points), 0))
        .where(PointRecord.created_at.between(start_dt, end_dt))
    )
    pr = point_records_result.first()
    total_points_cost = float(pr[0] or 0)
    points_issued = max(0, int(pr[1] or 0))

    redemptions_result = await db.execute(
        select(func.count(), func.coalesce(func.sum(RedemptionOrder.points_consumed), 0))
        .where(RedemptionOrder.created_at.between(start_dt, end_dt))
    )
    rr = redemptions_result.first()
    redemptions_count = int(rr[0] or 0)
    points_redeemed = int(rr[1] or 0)

    coupons_result = await db.execute(
        select(
            func.count(MemberCoupon.id),
            func.coalesce(func.sum(CouponTemplate.cost_per_unit), 0),
        )
        .select_from(MemberCoupon)
        .join(CouponTemplate, MemberCoupon.template_id == CouponTemplate.id)
        .where(MemberCoupon.received_at.between(start_dt, end_dt))
    )
    cr = coupons_result.first()
    coupons_issued = int(cr[0] or 0)
    total_coupon_cost = float(cr[1] or 0)

    used_coupons_result = await db.execute(
        select(func.count())
        .where(MemberCoupon.status == "used", MemberCoupon.used_at.between(start_dt, end_dt))
    )
    coupons_used = int(used_coupons_result.scalar() or 0)

    tasks_result = await db.execute(
        select(func.count(), func.coalesce(func.sum(ReachTask.actual_cost), 0))
        .where(ReachTask.created_at.between(start_dt, end_dt))
    )
    tr = tasks_result.first()
    reach_tasks_count = int(tr[0] or 0)
    total_reach_cost = float(tr[1] or 0)

    total_cost = total_points_cost + total_coupon_cost + total_reach_cost

    report = CostReport(
        report_type=report_type,
        report_date=report_date,
        brand_id=brand_id,
        total_points_cost=total_points_cost,
        total_coupon_cost=total_coupon_cost,
        total_benefit_cost=0.0,
        total_reach_cost=total_reach_cost,
        total_cost=total_cost,
        points_issued=points_issued,
        points_redeemed=points_redeemed,
        coupons_issued=coupons_issued,
        coupons_used=coupons_used,
        redemptions_count=redemptions_count,
        reach_tasks_count=reach_tasks_count,
        members_reached=0,
        data={
            "generated_at": datetime.utcnow().isoformat(),
            "period": {"start": start_dt.isoformat(), "end": end_dt.isoformat()},
        },
        generated_by=current_user.id,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    notification = Notification(
        notification_type="cost_report",
        title=f"{report_date} 积分成本报表已生成",
        content=f"总成本：¥{total_cost:.2f}，已生成{report_type}报表",
        target_role=UserRole.BRAND_OPERATOR if current_user.role == UserRole.ADMIN else "admin",
        entity_type="cost_report",
        entity_id=report.id,
        priority="normal",
        data={"report_id": report.id, "total_cost": total_cost},
        created_by=current_user.id,
    )
    db.add(notification)
    await db.commit()

    if request:
        await AuditMiddleware.log_operation(
            user=current_user,
            action="generate_cost_report",
            entity_type="cost_report",
            entity_id=report.id,
            entity_name=f"{report_date}/{report_type}",
            new_data=serialize_model(report),
            request=request,
        )

    return report


@router.get("/api/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())

    member_count = await db.execute(select(func.count()).select_from(MemberProfile))
    today_points = await db.execute(
        select(func.coalesce(func.sum(PointRecord.cost_amount), 0))
        .where(PointRecord.created_at >= start_of_day)
    )
    today_redemptions = await db.execute(
        select(func.count()).where(RedemptionOrder.created_at >= start_of_day)
    )
    pending_tasks = await db.execute(
        select(func.count()).where(ReachTask.status.in_(["draft", "pending"]))
    )
    running_tasks = await db.execute(
        select(func.count()).where(ReachTask.status == "running")
    )
    unread_notifications = await db.execute(
        select(func.count()).where(
            Notification.is_read == False,
            ((Notification.target_user_id == current_user.id) |
             (Notification.target_role == current_user.role))
        )
    )
    total_coupon_cost = await db.execute(
        select(func.coalesce(func.sum(CouponTemplate.cost_per_unit * MemberCoupon.id), 0))
        .select_from(MemberCoupon)
        .join(CouponTemplate)
    )

    return {
        "member_count": int(member_count.scalar() or 0),
        "today_points_cost": float(today_points.scalar() or 0),
        "today_redemptions": int(today_redemptions.scalar() or 0),
        "pending_tasks": int(pending_tasks.scalar() or 0),
        "running_tasks": int(running_tasks.scalar() or 0),
        "unread_notifications": int(unread_notifications.scalar() or 0),
        "total_coupon_cost": float(total_coupon_cost.scalar() or 0),
    }
