from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from datetime import datetime, timedelta, date

from app.database import get_db
from app.auth import get_current_active_user, require_roles
from app.models import User, MemberProfile, PointRecord, UserRole, MemberCoupon, CouponTemplate
from app.schemas import PointRecordCreate, PointRecordResponse, MemberCouponResponse
from app.middleware import AuditMiddleware
from app.utils import serialize_model

router = APIRouter(prefix="/api/points", tags=["积分管理"])


@router.get("/records", response_model=List[PointRecordResponse])
async def list_point_records(
    member_id: Optional[int] = None,
    change_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(PointRecord)

    if current_user.role == UserRole.MEMBER:
        result = await db.execute(
            select(MemberProfile.id).where(MemberProfile.user_id == current_user.id)
        )
        mem_id = result.scalar_one_or_none()
        if mem_id:
            query = query.where(PointRecord.member_id == mem_id)
    elif member_id:
        query = query.where(PointRecord.member_id == member_id)
        if current_user.role == UserRole.BRAND_OPERATOR:
            mem_result = await db.execute(
                select(MemberProfile).where(MemberProfile.id == member_id)
            )
            member = mem_result.scalar_one_or_none()
            if member and member.brand_id != current_user.brand_id:
                raise HTTPException(status_code=403, detail="无权限查看")

    if change_type:
        query = query.where(PointRecord.change_type == change_type)
    if start_date:
        query = query.where(PointRecord.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(PointRecord.created_at <= datetime.combine(end_date, datetime.max.time()))

    query = query.order_by(desc(PointRecord.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/adjust", response_model=PointRecordResponse)
async def adjust_points(
    data: PointRecordCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MemberProfile).where(MemberProfile.id == data.member_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="会员不存在")

    if current_user.role == UserRole.BRAND_OPERATOR and member.brand_id != current_user.brand_id:
        raise HTTPException(status_code=403, detail="无权限操作")

    old_data = serialize_model(member)
    member.available_points += data.points
    if member.available_points < 0:
        raise HTTPException(status_code=400, detail="积分不足")
    member.total_points = max(0, member.total_points + data.points)

    record = PointRecord(
        member_id=data.member_id,
        change_type=data.change_type,
        points=data.points,
        balance_after=member.available_points,
        source_type=data.source_type,
        source_id=data.source_id,
        cost_amount=data.cost_amount or 0.0,
        description=data.description,
        operator_id=current_user.id,
    )

    db.add(record)
    db.add(member)
    await db.commit()
    await db.refresh(record)

    await AuditMiddleware.log_operation(
        user=current_user,
        action="adjust_points",
        entity_type="member",
        entity_id=member.id,
        entity_name=member.nickname or member.member_no,
        old_data=old_data,
        new_data=serialize_model(member),
        request=request,
        is_conflict=True,
        conflict_detail={"points_change": data.points, "change_type": data.change_type},
    )

    return record


@router.get("/my-coupons", response_model=List[MemberCouponResponse])
async def get_my_coupons(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MemberProfile.id).where(MemberProfile.user_id == current_user.id)
    )
    member_id = result.scalar_one_or_none()
    if not member_id:
        return []

    query = select(MemberCoupon).where(MemberCoupon.member_id == member_id)
    if status:
        query = query.where(MemberCoupon.status == status)
    query = query.order_by(desc(MemberCoupon.received_at))

    result = await db.execute(query)
    coupons = result.scalars().all()

    for coupon in coupons:
        await db.refresh(coupon, ["template"])

    return coupons
