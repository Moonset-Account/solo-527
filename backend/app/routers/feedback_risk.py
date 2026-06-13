from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app.models import User, RoleEnum, Ticket, CustomerFeedback, RiskSample, RiskLevel
from app.schemas import (
    CustomerFeedbackCreate, CustomerFeedbackResponse,
    RiskSampleCreate, RiskSampleResponse
)

router = APIRouter
router = APIRouter(prefix="", tags=["反馈与风险"])


feedback_router = APIRouter(prefix="/feedback", tags=["客户反馈"])
risk_router = APIRouter(prefix="/risk-samples", tags=["风险样本"])


@feedback_router.post("", response_model=CustomerFeedbackResponse)
async def create_feedback(
    feedback_in: CustomerFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Ticket).where(Ticket.id == feedback_in.ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == RoleEnum.CUSTOMER and ticket.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    existing = await db.execute(
        select(CustomerFeedback).where(CustomerFeedback.ticket_id == feedback_in.ticket_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Feedback already exists for this ticket")

    feedback = CustomerFeedback(**feedback_in.model_dump())
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


@feedback_router.get("/{ticket_id}", response_model=CustomerFeedbackResponse)
async def get_feedback(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CustomerFeedback).where(CustomerFeedback.ticket_id == ticket_id)
    )
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if current_user.role == RoleEnum.CUSTOMER:
        ticket_result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
        ticket = ticket_result.scalar_one_or_none()
        if not ticket or ticket.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

    return feedback


@feedback_router.get("", response_model=list[CustomerFeedbackResponse])
async def list_feedbacks(
    ticket_id: Optional[int] = None,
    min_rating: Optional[int] = None,
    reviewed: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR])),
    db: AsyncSession = Depends(get_db)
):
    query = select(CustomerFeedback)
    conditions = []

    if ticket_id:
        conditions.append(CustomerFeedback.ticket_id == ticket_id)
    if min_rating:
        conditions.append(CustomerFeedback.rating >= min_rating)
    if reviewed is not None:
        if reviewed:
            conditions.append(CustomerFeedback.reviewed_by.isnot(None))
        else:
            conditions.append(CustomerFeedback.reviewed_by.is_(None))

    if conditions:
        query = query.where(*conditions)

    query = query.order_by(CustomerFeedback.submitted_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    return result.scalars().all()


@feedback_router.post("/{feedback_id}/review")
async def review_feedback(
    feedback_id: int,
    review_note: str,
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CustomerFeedback).where(CustomerFeedback.id == feedback_id)
    )
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    feedback.reviewed_by = current_user.id
    feedback.review_note = review_note
    feedback.reviewed_at = datetime.utcnow()

    await db.commit()
    return {"message": "Feedback reviewed"}


@risk_router.post("", response_model=RiskSampleResponse)
async def create_risk_sample(
    risk_in: RiskSampleCreate,
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR, RoleEnum.AGENT])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Ticket).where(Ticket.id == risk_in.ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    existing = await db.execute(
        select(RiskSample).where(RiskSample.ticket_id == risk_in.ticket_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Risk sample already exists for this ticket")

    risk = RiskSample(
        **risk_in.model_dump(),
        detected_by=current_user.id
    )
    db.add(risk)

    ticket.risk_level = risk.risk_level
    ticket.has_overdue_risk = True

    await db.commit()
    await db.refresh(risk)
    return risk


@risk_router.get("/{ticket_id}", response_model=RiskSampleResponse)
async def get_risk_sample(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RiskSample).where(RiskSample.ticket_id == ticket_id)
    )
    risk = result.scalar_one_or_none()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk sample not found")
    return risk


@risk_router.get("", response_model=list[RiskSampleResponse])
async def list_risk_samples(
    risk_level: Optional[RiskLevel] = None,
    is_verified: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(RiskSample)
    conditions = []

    if risk_level:
        conditions.append(RiskSample.risk_level == risk_level)
    if is_verified is not None:
        conditions.append(RiskSample.is_verified == is_verified)

    if conditions:
        query = query.where(*conditions)

    query = query.order_by(RiskSample.detected_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    return result.scalars().all()


@risk_router.post("/{risk_id}/verify")
async def verify_risk(
    risk_id: int,
    verified: bool = True,
    mitigation_note: Optional[str] = None,
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RiskSample).where(RiskSample.id == risk_id)
    )
    risk = result.scalar_one_or_none()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk sample not found")

    risk.is_verified = verified
    risk.verified_by = current_user.id
    risk.verified_at = datetime.utcnow()
    if mitigation_note:
        risk.mitigation_note = mitigation_note

    await db.commit()
    return {"message": "Risk sample verified"}
