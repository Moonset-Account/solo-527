from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from fastapi import HTTPException

from app.models import Registration, Event, User
from app.enums import RegistrationStatus, EventStatus
from app.schemas.common import RegistrationCreate, RegistrationReview
from app.utils import now


class RegistrationService:
    @staticmethod
    async def create(db: AsyncSession, data: RegistrationCreate, user_id: int) -> Registration:
        event_result = await db.execute(select(Event).where(Event.id == data.event_id))
        event = event_result.scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="场次不存在")
        if not event.requires_registration:
            raise HTTPException(status_code=400, detail="该场次无需报名")
        if event.status not in (EventStatus.ACTIVE, EventStatus.DRAFT):
            raise HTTPException(status_code=400, detail="场次状态不支持报名")
        current = now()
        if event.registration_start and current < event.registration_start:
            raise HTTPException(status_code=400, detail="报名尚未开始")
        if event.registration_end and current > event.registration_end:
            raise HTTPException(status_code=400, detail="报名已结束")
        existing = await db.execute(select(Registration).where(and_(
            Registration.event_id == data.event_id,
            Registration.user_id == user_id,
        )))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="您已报名过此场次")
        registration = Registration(
            event_id=data.event_id,
            user_id=user_id,
            status=RegistrationStatus.PENDING,
            form_data=data.form_data,
        )
        db.add(registration)
        await db.commit()
        await db.refresh(registration)
        return registration

    @staticmethod
    async def review(db: AsyncSession, reg_id: int, data: RegistrationReview,
                     reviewer_id: int) -> Registration:
        result = await db.execute(select(Registration).where(Registration.id == reg_id))
        registration = result.scalar_one_or_none()
        if not registration:
            raise HTTPException(status_code=404, detail="报名记录不存在")
        if registration.status != RegistrationStatus.PENDING:
            raise HTTPException(status_code=400, detail="该报名已审核")
        registration.status = RegistrationStatus.APPROVED if data.approved else RegistrationStatus.REJECTED
        registration.review_remark = data.review_remark
        registration.reviewed_by = reviewer_id
        registration.reviewed_at = now()
        await db.commit()
        await db.refresh(registration)
        return registration

    @staticmethod
    async def batch_review(db: AsyncSession, reg_ids: List[int], data: RegistrationReview,
                           reviewer_id: int) -> int:
        result = await db.execute(select(Registration).where(and_(
            Registration.id.in_(reg_ids),
            Registration.status == RegistrationStatus.PENDING,
        )))
        items = list(result.scalars().all())
        for item in items:
            item.status = RegistrationStatus.APPROVED if data.approved else RegistrationStatus.REJECTED
            item.review_remark = data.review_remark
            item.reviewed_by = reviewer_id
            item.reviewed_at = now()
        await db.commit()
        return len(items)

    @staticmethod
    async def list(db: AsyncSession, status: RegistrationStatus = None,
                   event_id: int = None, user_id: int = None,
                   page: int = 1, page_size: int = 20, keyword: str = None):
        from app.utils import calc_offset
        offset = calc_offset(page, page_size)
        query = select(Registration)
        count_query = select(func.count(Registration.id))
        conditions = []
        if status:
            conditions.append(Registration.status == status)
        if event_id:
            conditions.append(Registration.event_id == event_id)
        if user_id:
            conditions.append(Registration.user_id == user_id)
        if keyword:
            conditions.append(or_(
                Registration.user.has(User.username.ilike(f"%{keyword}%")),
                Registration.user.has(User.real_name.ilike(f"%{keyword}%")),
                Registration.user.has(User.phone.ilike(f"%{keyword}%")),
            ))
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        query = query.order_by(Registration.created_at.desc()).offset(offset).limit(page_size)
        result = await db.execute(query)
        items = list(result.scalars().all())
        return items, total

    @staticmethod
    async def get_user_registration_status(db: AsyncSession, event_id: int, user_id: int) -> dict:
        result = await db.execute(select(Registration).where(and_(
            Registration.event_id == event_id,
            Registration.user_id == user_id,
        )))
        reg = result.scalar_one_or_none()
        if not reg:
            return {"registered": False, "status": None, "form_data": None}
        return {
            "registered": True,
            "status": reg.status.value,
            "form_data": reg.form_data,
            "review_remark": reg.review_remark,
        }
