import json
import uuid
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_active_user, require_roles
from app.models import (
    User, CouponTemplate, CouponTemplateVersion,
    MemberCoupon, MemberProfile, UserRole, Notification
)
from app.schemas import (
    CouponTemplateCreate, CouponTemplateUpdate, CouponTemplateResponse,
    MemberCouponIssue, MemberCouponResponse
)
from app.middleware import AuditMiddleware
from app.utils import serialize_model, get_field_changes

router = APIRouter(prefix="/api/coupons", tags=["优惠券管理"])


def _version_data(template: CouponTemplate) -> dict:
    return {
        "name": template.name,
        "coupon_type": template.coupon_type,
        "discount_value": template.discount_value,
        "min_order_amount": template.min_order_amount,
        "max_discount_amount": template.max_discount_amount,
        "description": template.description,
        "valid_days": template.valid_days,
        "valid_from": template.valid_from.isoformat() if template.valid_from else None,
        "valid_to": template.valid_to.isoformat() if template.valid_to else None,
        "total_quantity": template.total_quantity,
        "per_user_limit": template.per_user_limit,
        "is_repurchase": template.is_repurchase,
        "cost_per_unit": template.cost_per_unit,
    }


@router.get("", response_model=List[CouponTemplateResponse])
async def list_coupon_templates(
    keyword: Optional[str] = None,
    coupon_type: Optional[str] = None,
    is_repurchase: Optional[bool] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(CouponTemplate)
    if current_user.role == UserRole.BRAND_OPERATOR and current_user.brand_id:
        query = query.where(
            or_(CouponTemplate.brand_id == current_user.brand_id, CouponTemplate.brand_id.is_(None))
        )
    if keyword:
        query = query.where(or_(
            CouponTemplate.name.contains(keyword),
            CouponTemplate.code.contains(keyword),
        ))
    if coupon_type:
        query = query.where(CouponTemplate.coupon_type == coupon_type)
    if is_repurchase is not None:
        query = query.where(CouponTemplate.is_repurchase == is_repurchase)
    if is_active is not None:
        query = query.where(CouponTemplate.is_active == is_active)

    query = query.order_by(desc(CouponTemplate.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=CouponTemplateResponse)
async def create_coupon_template(
    data: CouponTemplateCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CouponTemplate).where(CouponTemplate.code == data.code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="券编码已存在")

    brand_id = data.brand_id
    if current_user.role == UserRole.BRAND_OPERATOR:
        brand_id = current_user.brand_id

    template = CouponTemplate(
        **data.model_dump(exclude_unset=True),
        brand_id=brand_id,
        created_by=current_user.id,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)

    version = CouponTemplateVersion(
        template_id=template.id,
        version=1,
        name=template.name,
        data=_version_data(template),
        change_summary="初始创建",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()

    await AuditMiddleware.log_operation(
        user=current_user,
        action="create_coupon_template",
        entity_type="coupon_template",
        entity_id=template.id,
        entity_name=template.name,
        new_data=serialize_model(template),
        request=request,
    )

    return template


@router.get("/{template_id}", response_model=CouponTemplateResponse)
async def get_coupon_template(
    template_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CouponTemplate).where(CouponTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="券模板不存在")
    if current_user.role == UserRole.BRAND_OPERATOR and template.brand_id and template.brand_id != current_user.brand_id:
        raise HTTPException(status_code=403, detail="无权限查看")
    return template


@router.put("/{template_id}", response_model=CouponTemplateResponse)
async def update_coupon_template(
    template_id: int,
    data: CouponTemplateUpdate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CouponTemplate).where(CouponTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="券模板不存在")
    if current_user.role == UserRole.BRAND_OPERATOR and template.brand_id != current_user.brand_id:
        raise HTTPException(status_code=403, detail="无权限修改")

    old_data = serialize_model(template)
    update_data = data.model_dump(exclude_unset=True, exclude={"change_summary"})
    for field, value in update_data.items():
        setattr(template, field, value)

    template.version += 1
    version = CouponTemplateVersion(
        template_id=template.id,
        version=template.version,
        name=template.name,
        data=_version_data(template),
        change_summary=data.change_summary or "修改券模板",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()
    await db.refresh(template)

    await AuditMiddleware.log_operation(
        user=current_user,
        action="update_coupon_template",
        entity_type="coupon_template",
        entity_id=template.id,
        entity_name=template.name,
        old_data=old_data,
        new_data=serialize_model(template),
        request=request,
    )

    return template


@router.post("/issue", response_model=dict)
async def issue_coupons(
    data: MemberCouponIssue,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CouponTemplate).where(CouponTemplate.id == data.template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="券模板不存在")
    if not template.is_active:
        raise HTTPException(status_code=400, detail="券模板已停用")
    if template.total_quantity > 0 and template.issued_quantity + len(data.member_ids) > template.total_quantity:
        raise HTTPException(status_code=400, detail="券库存不足")

    today = date.today()
    valid_from = template.valid_from or today
    valid_to = template.valid_to or (today + timedelta(days=template.valid_days or 30))

    success_count = 0
    conflict_members = []

    for member_id in data.member_ids:
        existing = await db.execute(
            select(MemberCoupon).where(
                MemberCoupon.member_id == member_id,
                MemberCoupon.template_id == data.template_id,
                MemberCoupon.status == "unused",
            )
        )
        if existing.scalar_one_or_none():
            conflict_members.append(member_id)
            continue

        member_result = await db.execute(
            select(MemberProfile).where(MemberProfile.id == member_id)
        )
        member = member_result.scalar_one_or_none()
        if not member:
            continue

        coupon = MemberCoupon(
            member_id=member_id,
            template_id=data.template_id,
            coupon_code=f"CP{uuid.uuid4().hex[:12].upper()}",
            valid_from=valid_from,
            valid_to=valid_to,
            source=data.source or "manual_issue",
        )
        db.add(coupon)
        success_count += 1

    template.issued_quantity += success_count
    await db.commit()

    if success_count > 0:
        notification = Notification(
            notification_type="coupon_issued",
            title=f"复购券发放通知",
            content=f"您获得了{template.name}，请及时使用",
            target_role="member",
            entity_type="coupon_template",
            entity_id=template.id,
            priority="normal",
            created_by=current_user.id,
        )
        db.add(notification)
        await db.commit()

    await AuditMiddleware.log_operation(
        user=current_user,
        action="issue_coupon",
        entity_type="coupon_template",
        entity_id=template.id,
        entity_name=template.name,
        new_data={"issued_count": success_count, "target_members": data.member_ids},
        request=request,
        is_conflict=True,
        conflict_detail={"conflict_members": conflict_members, "duplicate_count": len(conflict_members)},
    )

    return {
        "success": success_count,
        "conflict_count": len(conflict_members),
        "conflict_members": conflict_members,
    }


@router.get("/versions/{template_id}")
async def get_coupon_versions(
    template_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CouponTemplateVersion)
        .where(CouponTemplateVersion.template_id == template_id)
        .order_by(desc(CouponTemplateVersion.version))
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
