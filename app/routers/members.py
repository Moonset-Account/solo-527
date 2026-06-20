from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_active_user, require_roles
from app.models import User, MemberProfile, Brand, UserRole
from app.schemas import (
    MemberProfileResponse, MemberProfileUpdate,
    UserResponse, UserUpdate,
)

router = APIRouter(prefix="/api/members", tags=["会员管理"])


@router.get("", response_model=List[MemberProfileResponse])
async def list_members(
    keyword: Optional[str] = None,
    level: Optional[str] = None,
    is_vip: Optional[bool] = None,
    min_points: Optional[int] = None,
    max_points: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    query = select(MemberProfile)
    if current_user.role == UserRole.BRAND_OPERATOR and current_user.brand_id:
        query = query.where(MemberProfile.brand_id == current_user.brand_id)
    if keyword:
        query = query.join(User).where(or_(
            MemberProfile.nickname.contains(keyword),
            MemberProfile.member_no.contains(keyword),
            User.phone.contains(keyword),
        ))
    if level:
        query = query.where(MemberProfile.level == level)
    if is_vip is not None:
        query = query.where(MemberProfile.is_vip == is_vip)
    if min_points is not None:
        query = query.where(MemberProfile.available_points >= min_points)
    if max_points is not None:
        query = query.where(MemberProfile.available_points <= max_points)

    query = query.offset(skip).limit(limit).order_by(MemberProfile.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{member_id}", response_model=MemberProfileResponse)
async def get_member(
    member_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MemberProfile).where(MemberProfile.id == member_id))
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="会员不存在")
    if current_user.role == UserRole.MEMBER and current_user.id != member.user_id:
        raise HTTPException(status_code=403, detail="无权限查看")
    if current_user.role == UserRole.BRAND_OPERATOR and current_user.brand_id != member.brand_id:
        raise HTTPException(status_code=403, detail="无权限查看")
    return member


@router.get("/me/profile", response_model=MemberProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MemberProfile).where(MemberProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="会员资料不存在")
    return profile


@router.put("/me/profile", response_model=MemberProfileResponse)
async def update_my_profile(
    data: MemberProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MemberProfile).where(MemberProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="会员资料不存在")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile
