from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import Optional, List
from pydantic import BaseModel
from datetime import date

from app.database import get_db
from app.auth import get_current_user, allow_all, allow_admin
from app.models import Treatment, TreatmentCard, Customer, TreatmentStatus, TreatmentCardStatus, User

router = APIRouter(prefix="/api", tags=["疗程"])


class TreatmentCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    duration_minutes: int = 60
    total_sessions: int = 1
    category: str = ""
    status: TreatmentStatus = TreatmentStatus.ACTIVE
    sort_order: int = 0


class TreatmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None
    total_sessions: Optional[int] = None
    category: Optional[str] = None
    status: Optional[TreatmentStatus] = None
    sort_order: Optional[int] = None


@router.get("/treatments")
def list_treatments(
    status: Optional[TreatmentStatus] = None,
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    query = db.query(Treatment)
    if status:
        query = query.filter(Treatment.status == status)
    if category:
        query = query.filter(Treatment.category == category)
    if keyword:
        query = query.filter(
            or_(
                Treatment.name.contains(keyword),
                Treatment.description.contains(keyword)
            )
        )
    total = query.count()
    treatments = query.order_by(Treatment.sort_order.asc(), Treatment.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": treatments}


@router.get("/treatments/public")
def list_public_treatments(
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Treatment).filter(Treatment.status == TreatmentStatus.ACTIVE)
    if category:
        query = query.filter(Treatment.category == category)
    if keyword:
        query = query.filter(
            or_(
                Treatment.name.contains(keyword),
                Treatment.description.contains(keyword)
            )
        )
    total = query.count()
    treatments = query.order_by(Treatment.sort_order.asc(), Treatment.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": treatments}


@router.get("/treatments/{treatment_id}")
def get_treatment(
    treatment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
    if not treatment:
        raise HTTPException(status_code=404, detail="疗程不存在")
    return treatment


@router.post("/treatments")
def create_treatment(
    data: TreatmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    treatment = Treatment(**data.model_dump())
    db.add(treatment)
    db.commit()
    db.refresh(treatment)
    return treatment


@router.put("/treatments/{treatment_id}")
def update_treatment(
    treatment_id: int,
    data: TreatmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
    if not treatment:
        raise HTTPException(status_code=404, detail="疗程不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(treatment, key, value)
    db.commit()
    db.refresh(treatment)
    return treatment


@router.delete("/treatments/{treatment_id}")
def delete_treatment(
    treatment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
    if not treatment:
        raise HTTPException(status_code=404, detail="疗程不存在")
    db.delete(treatment)
    db.commit()
    return {"message": "删除成功"}


class TreatmentCardCreate(BaseModel):
    card_no: str
    customer_id: int
    treatment_id: int
    total_sessions: int
    purchase_date: date
    expiry_date: Optional[date] = None
    price_paid: Optional[float] = None
    note: str = ""


class TreatmentCardUpdate(BaseModel):
    status: Optional[TreatmentCardStatus] = None
    remaining_sessions: Optional[int] = None
    note: Optional[str] = None


@router.get("/treatment-cards")
def list_treatment_cards(
    status: Optional[TreatmentCardStatus] = None,
    keyword: Optional[str] = None,
    creator_id: Optional[int] = None,
    customer_keyword: Optional[str] = None,
    card_no: Optional[str] = None,
    treatment_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    query = db.query(TreatmentCard).join(Customer).join(Treatment)
    if status:
        query = query.filter(TreatmentCard.status == status)
    if keyword:
        query = query.filter(
            or_(
                TreatmentCard.card_no.contains(keyword),
                Customer.name.contains(keyword),
                Customer.phone.contains(keyword)
            )
        )
    if creator_id:
        query = query.filter(TreatmentCard.creator_id == creator_id)
    if customer_keyword:
        query = query.filter(
            or_(
                Customer.name.contains(customer_keyword),
                Customer.phone.contains(customer_keyword)
            )
        )
    if card_no:
        query = query.filter(TreatmentCard.card_no.contains(card_no))
    if treatment_id:
        query = query.filter(TreatmentCard.treatment_id == treatment_id)
    if start_date:
        query = query.filter(TreatmentCard.purchase_date >= start_date)
    if end_date:
        query = query.filter(TreatmentCard.purchase_date <= end_date)

    total = query.count()
    cards = query.order_by(desc(TreatmentCard.created_at)).offset(skip).limit(limit).all()
    items = []
    for card in cards:
        items.append({
            "id": card.id,
            "card_no": card.card_no,
            "customer_id": card.customer_id,
            "customer_name": card.customer.name,
            "customer_phone": card.customer.phone,
            "treatment_id": card.treatment_id,
            "treatment_name": card.treatment.name,
            "total_sessions": card.total_sessions,
            "remaining_sessions": card.remaining_sessions,
            "purchase_date": card.purchase_date,
            "expiry_date": card.expiry_date,
            "status": card.status.value,
            "price_paid": card.price_paid,
            "note": card.note,
            "creator_id": card.creator_id,
            "creator_name": card.creator.full_name if card.creator else None,
            "created_at": card.created_at
        })
    return {"total": total, "items": items}


@router.get("/treatment-cards/{card_id}")
def get_treatment_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    card = db.query(TreatmentCard).filter(TreatmentCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="疗程卡不存在")
    return {
        "id": card.id,
        "card_no": card.card_no,
        "customer_id": card.customer_id,
        "customer_name": card.customer.name,
        "customer_phone": card.customer.phone,
        "treatment_id": card.treatment_id,
        "treatment_name": card.treatment.name,
        "total_sessions": card.total_sessions,
        "remaining_sessions": card.remaining_sessions,
        "purchase_date": card.purchase_date,
        "expiry_date": card.expiry_date,
        "status": card.status.value,
        "price_paid": card.price_paid,
        "note": card.note,
        "created_at": card.created_at
    }


@router.post("/treatment-cards")
def create_treatment_card(
    data: TreatmentCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    existing = db.query(TreatmentCard).filter(TreatmentCard.card_no == data.card_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="卡号已存在")

    card = TreatmentCard(
        **data.model_dump(),
        remaining_sessions=data.total_sessions,
        status=TreatmentCardStatus.ACTIVE,
        creator_id=current_user.id
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.put("/treatment-cards/{card_id}")
def update_treatment_card(
    card_id: int,
    data: TreatmentCardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    card = db.query(TreatmentCard).filter(TreatmentCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="疗程卡不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(card, key, value)
    db.commit()
    db.refresh(card)
    return card


@router.get("/customer/{customer_id}/treatment-cards")
def get_customer_treatment_cards(
    customer_id: int,
    status: Optional[TreatmentCardStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    query = db.query(TreatmentCard).filter(TreatmentCard.customer_id == customer_id)
    if status:
        query = query.filter(TreatmentCard.status == status)
    cards = query.order_by(desc(TreatmentCard.created_at)).all()
    items = []
    for card in cards:
        items.append({
            "id": card.id,
            "card_no": card.card_no,
            "treatment_name": card.treatment.name,
            "total_sessions": card.total_sessions,
            "remaining_sessions": card.remaining_sessions,
            "purchase_date": card.purchase_date,
            "expiry_date": card.expiry_date,
            "status": card.status.value
        })
    return items
