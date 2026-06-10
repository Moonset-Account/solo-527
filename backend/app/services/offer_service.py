from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.offer import Offer, OfferStatus
from app.models.user import User
from app.schemas.offer import OfferCreate, OfferUpdate
from app.services.audit_service import AuditService
from app.models.audit import AuditAction


class OfferService:
    @staticmethod
    def get_by_id(db: Session, offer_id: int) -> Optional[Offer]:
        return db.query(Offer).filter(Offer.id == offer_id).first()

    @staticmethod
    def list(
        db: Session,
        candidate_id: int = None,
        position_id: int = None,
        status: OfferStatus = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Offer]:
        query = db.query(Offer)
        if candidate_id:
            query = query.filter(Offer.candidate_id == candidate_id)
        if position_id:
            query = query.filter(Offer.position_id == position_id)
        if status:
            query = query.filter(Offer.status == status)
        return query.order_by(Offer.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, offer_in: OfferCreate, current_user: User) -> Offer:
        db_offer = Offer(
            **offer_in.model_dump(),
            created_by=current_user.id,
        )
        db.add(db_offer)
        db.commit()
        db.refresh(db_offer)

        AuditService.log(
            db, current_user, AuditAction.CREATE,
            "offer", db_offer.id,
            description=f"创建录用通知: {offer_in.offer_title}"
        )

        return db_offer

    @staticmethod
    def update(db: Session, offer_id: int, offer_in: OfferUpdate, current_user: User) -> Offer:
        db_offer = OfferService.get_by_id(db, offer_id)
        if not db_offer:
            raise HTTPException(status_code=404, detail="Offer not found")

        old_status = db_offer.status
        update_data = offer_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_offer, field, value)

        if offer_in.status and offer_in.status != old_status:
            if offer_in.status == OfferStatus.SENT:
                db_offer.sent_at = datetime.utcnow()

        db.commit()
        db.refresh(db_offer)

        AuditService.log(
            db, current_user, AuditAction.UPDATE,
            "offer", offer_id,
            description="更新录用通知"
        )

        return db_offer

    @staticmethod
    def send_offer(db: Session, offer_id: int, current_user: User) -> Offer:
        db_offer = OfferService.get_by_id(db, offer_id)
        if not db_offer:
            raise HTTPException(status_code=404, detail="Offer not found")

        db_offer.status = OfferStatus.SENT
        db_offer.sent_at = datetime.utcnow()
        db.commit()
        db.refresh(db_offer)

        AuditService.log(
            db, current_user, AuditAction.STATUS_CHANGE,
            "offer", offer_id,
            new_value="sent",
            description="发送录用通知"
        )

        return db_offer

    @staticmethod
    def respond(db: Session, offer_id: int, accepted: bool, note: str = None, current_user: User = None) -> Offer:
        db_offer = OfferService.get_by_id(db, offer_id)
        if not db_offer:
            raise HTTPException(status_code=404, detail="Offer not found")

        db_offer.status = OfferStatus.ACCEPTED if accepted else OfferStatus.REJECTED
        db_offer.responded_at = datetime.utcnow()
        db_offer.response_note = note
        db.commit()
        db.refresh(db_offer)

        if current_user:
            AuditService.log(
                db, current_user, AuditAction.STATUS_CHANGE,
                "offer", offer_id,
                new_value="accepted" if accepted else "rejected",
                description=f"候选人回应: {'接受' if accepted else '拒绝'}"
            )

        return db_offer
