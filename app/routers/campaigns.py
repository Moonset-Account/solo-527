import json
import uuid
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, and_, func
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_active_user, require_roles
from app.models import (
    User, CrowdSegment, CrowdSegmentVersion, ReachTask, ReachTaskVersion,
    ReachTaskLog, MemberProfile, UserRole, Notification, MemberCoupon,
    CouponTemplate
)
from app.schemas import (
    CrowdSegmentCreate, CrowdSegmentUpdate, CrowdSegmentResponse,
    ReachTaskCreate, ReachTaskUpdate, ReachTaskResponse
)
from app.middleware import AuditMiddleware
from app.utils import serialize_model, get_field_changes

router = APIRouter(tags=["人群与触达"])


def _crowd_version_data(c: CrowdSegment) -> dict:
    return {
        "name": c.name,
        "segment_type": c.segment_type,
        "description": c.description,
        "filter_conditions": c.filter_conditions,
        "member_ids": c.member_ids,
    }


def _task_version_data(t: ReachTask) -> dict:
    return {
        "name": t.name,
        "task_type": t.task_type,
        "channels": t.channels,
        "content_template": t.content_template,
        "coupon_template_id": t.coupon_template_id,
        "benefit_id": t.benefit_id,
        "points_reward": t.points_reward,
        "estimated_budget": t.estimated_budget,
        "schedule_type": t.schedule_type,
    }


# ============ 人群管理 ============

@router.get("/api/crowds", response_model=List[CrowdSegmentResponse])
async def list_crowds(
    keyword: Optional[str] = None,
    segment_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    query = select(CrowdSegment)
    if current_user.role == UserRole.BRAND_OPERATOR and current_user.brand_id:
        query = query.where(
            or_(CrowdSegment.brand_id == current_user.brand_id, CrowdSegment.brand_id.is_(None))
        )
    if keyword:
        query = query.where(or_(
            CrowdSegment.name.contains(keyword),
            CrowdSegment.code.contains(keyword),
        ))
    if segment_type:
        query = query.where(CrowdSegment.segment_type == segment_type)

    query = query.order_by(desc(CrowdSegment.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/api/crowds", response_model=CrowdSegmentResponse)
async def create_crowd(
    data: CrowdSegmentCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    brand_id = data.brand_id
    if current_user.role == UserRole.BRAND_OPERATOR:
        brand_id = current_user.brand_id

    code = data.code or f"CROWD{datetime.now().strftime('%Y%m%d%H%M%S')}"
    member_ids = data.member_ids or []
    estimated_count = len(member_ids)

    crowd = CrowdSegment(
        **data.model_dump(exclude_unset=True, exclude={"code"}),
        code=code,
        brand_id=brand_id,
        estimated_count=estimated_count,
        actual_count=estimated_count,
        created_by=current_user.id,
    )
    db.add(crowd)
    await db.commit()
    await db.refresh(crowd)

    version = CrowdSegmentVersion(
        segment_id=crowd.id,
        version=1,
        name=crowd.name,
        data=_crowd_version_data(crowd),
        change_summary="初始创建",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()

    await AuditMiddleware.log_operation(
        user=current_user,
        action="create_crowd_segment",
        entity_type="crowd_segment",
        entity_id=crowd.id,
        entity_name=crowd.name,
        new_data=serialize_model(crowd),
        request=request,
    )

    return crowd


@router.get("/api/crowds/{crowd_id}", response_model=CrowdSegmentResponse)
async def get_crowd(
    crowd_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CrowdSegment).where(CrowdSegment.id == crowd_id)
    )
    crowd = result.scalar_one_or_none()
    if not crowd:
        raise HTTPException(status_code=404, detail="人群不存在")
    if current_user.role == UserRole.BRAND_OPERATOR and crowd.brand_id and crowd.brand_id != current_user.brand_id:
        raise HTTPException(status_code=403, detail="无权限查看")
    return crowd


@router.put("/api/crowds/{crowd_id}", response_model=CrowdSegmentResponse)
async def update_crowd(
    crowd_id: int,
    data: CrowdSegmentUpdate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CrowdSegment).where(CrowdSegment.id == crowd_id)
    )
    crowd = result.scalar_one_or_none()
    if not crowd:
        raise HTTPException(status_code=404, detail="人群不存在")
    if current_user.role == UserRole.BRAND_OPERATOR and crowd.brand_id != current_user.brand_id:
        raise HTTPException(status_code=403, detail="无权限修改")

    old_data = serialize_model(crowd)
    update_data = data.model_dump(exclude_unset=True, exclude={"change_summary"})
    for field, value in update_data.items():
        setattr(crowd, field, value)
    if "member_ids" in update_data:
        crowd.estimated_count = len(update_data["member_ids"])
        crowd.actual_count = len(update_data["member_ids"])

    crowd.version += 1
    version = CrowdSegmentVersion(
        segment_id=crowd.id,
        version=crowd.version,
        name=crowd.name,
        data=_crowd_version_data(crowd),
        change_summary=data.change_summary or "修改人群",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()
    await db.refresh(crowd)

    await AuditMiddleware.log_operation(
        user=current_user,
        action="update_crowd_segment",
        entity_type="crowd_segment",
        entity_id=crowd.id,
        entity_name=crowd.name,
        old_data=old_data,
        new_data=serialize_model(crowd),
        request=request,
    )

    return crowd


@router.get("/api/crowds/versions/{crowd_id}")
async def get_crowd_versions(
    crowd_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CrowdSegmentVersion)
        .where(CrowdSegmentVersion.segment_id == crowd_id)
        .order_by(desc(CrowdSegmentVersion.version))
    )
    versions = result.scalars().all()
    return [
        {
            "id": v.id,
            "version": v.version,
            "name": v.name,
            "data": v.data,
            "change_summary": v.change_summary,
            "changed_by": v.changed_by,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in versions
    ]


# ============ 触达任务 ============

@router.get("/api/reach-tasks", response_model=List[ReachTaskResponse])
async def list_reach_tasks(
    keyword: Optional[str] = None,
    task_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    query = select(ReachTask)
    if current_user.role == UserRole.BRAND_OPERATOR and current_user.brand_id:
        query = query.where(
            or_(ReachTask.brand_id == current_user.brand_id, ReachTask.brand_id.is_(None))
        )
    if keyword:
        query = query.where(or_(
            ReachTask.name.contains(keyword),
            ReachTask.code.contains(keyword),
        ))
    if task_type:
        query = query.where(ReachTask.task_type == task_type)
    if status:
        query = query.where(ReachTask.status == status)

    query = query.order_by(desc(ReachTask.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/api/reach-tasks", response_model=ReachTaskResponse)
async def create_reach_task(
    data: ReachTaskCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    crowd_result = await db.execute(
        select(CrowdSegment).where(CrowdSegment.id == data.crowd_id)
    )
    crowd = crowd_result.scalar_one_or_none()
    if not crowd:
        raise HTTPException(status_code=404, detail="人群不存在")

    brand_id = data.brand_id
    if current_user.role == UserRole.BRAND_OPERATOR:
        brand_id = current_user.brand_id

    code = data.code or f"TASK{datetime.now().strftime('%Y%m%d%H%M%S')}"

    existing_tasks = await db.execute(
        select(ReachTask).where(
            ReachTask.crowd_id == data.crowd_id,
            ReachTask.status.in_(["pending", "running", "approved"]),
        )
    )
    existing_count = len(existing_tasks.scalars().all())
    is_conflict = existing_count > 0

    task = ReachTask(
        **data.model_dump(exclude_unset=True, exclude={"code"}),
        code=code,
        brand_id=brand_id,
        target_count=crowd.actual_count,
        created_by=current_user.id,
        is_conflict_checked=not is_conflict,
        status="draft",
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    version = ReachTaskVersion(
        task_id=task.id,
        version=1,
        name=task.name,
        data=_task_version_data(task),
        change_summary="初始创建",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()

    conflict_detail = None
    if is_conflict:
        conflict_detail = {
            "message": f"该人群当前有{existing_count}个进行中的触达任务",
            "existing_task_count": existing_count,
        }

    await AuditMiddleware.log_operation(
        user=current_user,
        action="create_reach_task",
        entity_type="reach_task",
        entity_id=task.id,
        entity_name=task.name,
        new_data=serialize_model(task),
        request=request,
        is_conflict=True,
        conflict_detail=conflict_detail,
    )

    return task


@router.get("/api/reach-tasks/{task_id}", response_model=ReachTaskResponse)
async def get_reach_task(
    task_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReachTask).where(ReachTask.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="触达任务不存在")
    if current_user.role == UserRole.BRAND_OPERATOR and task.brand_id and task.brand_id != current_user.brand_id:
        raise HTTPException(status_code=403, detail="无权限查看")
    return task


@router.put("/api/reach-tasks/{task_id}", response_model=ReachTaskResponse)
async def update_reach_task(
    task_id: int,
    data: ReachTaskUpdate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReachTask).where(ReachTask.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="触达任务不存在")
    if current_user.role == UserRole.BRAND_OPERATOR and task.brand_id != current_user.brand_id:
        raise HTTPException(status_code=403, detail="无权限修改")

    old_data = serialize_model(task)
    old_status = task.status
    update_data = data.model_dump(exclude_unset=True, exclude={"change_summary"})

    if "status" in update_data:
        new_status = update_data["status"]
        now = datetime.utcnow()
        if new_status == "approved" and old_status == "draft":
            task.approved_by = current_user.id
            task.approved_at = now
            notification = Notification(
                notification_type="task_approved",
                title=f"触达任务审批通过",
                content=f"任务【{task.name}】已通过审批",
                target_user_id=task.created_by,
                entity_type="reach_task",
                entity_id=task.id,
                priority="high",
                created_by=current_user.id,
            )
            db.add(notification)
        elif new_status == "running":
            task.started_at = now
        elif new_status == "completed":
            task.completed_at = now

    for field, value in update_data.items():
        setattr(task, field, value)

    task.version += 1
    version = ReachTaskVersion(
        task_id=task.id,
        version=task.version,
        name=task.name,
        data=_task_version_data(task),
        change_summary=data.change_summary or "修改触达任务",
        changed_by=current_user.id,
    )
    db.add(version)

    is_conflict_action = "status" in update_data and update_data["status"] in ["approved", "running"]

    await db.commit()
    await db.refresh(task)

    await AuditMiddleware.log_operation(
        user=current_user,
        action="update_reach_task",
        entity_type="reach_task",
        entity_id=task.id,
        entity_name=task.name,
        old_data=old_data,
        new_data=serialize_model(task),
        request=request,
        is_conflict=is_conflict_action,
        conflict_detail={"status_change": f"{old_status} -> {update_data.get('status')}"} if is_conflict_action else None,
    )

    return task


@router.get("/api/reach-tasks/versions/{task_id}")
async def get_task_versions(
    task_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReachTaskVersion)
        .where(ReachTaskVersion.task_id == task_id)
        .order_by(desc(ReachTaskVersion.version))
    )
    versions = result.scalars().all()
    return [
        {
            "id": v.id,
            "version": v.version,
            "name": v.name,
            "data": v.data,
            "change_summary": v.change_summary,
            "changed_by": v.changed_by,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in versions
    ]
