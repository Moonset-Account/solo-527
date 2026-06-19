import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.crud.base import CRUDBase
from app.models.registration import Registration, RegistrationStatus, RegistrationQuality
from app.models.quality_history import RegistrationQualityHistory
from app.schemas.registration import RegistrationCreate, RegistrationUpdate


class CRUDRegistration(CRUDBase[Registration, RegistrationCreate, RegistrationUpdate]):
    def _generate_registration_no(self) -> str:
        return f"REG{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

    def create(self, db: Session, *, obj_in: RegistrationCreate) -> Registration:
        registration_no = self._generate_registration_no()
        db_obj = Registration(
            **obj_in.model_dump(),
            registration_no=registration_no,
            status=RegistrationStatus.CONFIRMED,
            quality=RegistrationQuality.MEDIUM,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_registration_no(self, db: Session, *, registration_no: str) -> Optional[Registration]:
        return db.query(Registration).filter(Registration.registration_no == registration_no).first()

    def get_by_event_and_phone(self, db: Session, *, event_id: int, phone: str) -> Optional[Registration]:
        return db.query(Registration).filter(
            and_(Registration.event_id == event_id, Registration.phone == phone)
        ).first()

    def get_multi_by_event(
        self, db: Session, *, event_id: int, skip: int = 0, limit: int = 100,
        status: Optional[RegistrationStatus] = None,
        quality: Optional[RegistrationQuality] = None,
        keyword: Optional[str] = None,
    ) -> Tuple[List[Registration], int]:
        query = db.query(Registration).filter(Registration.event_id == event_id)
        if status:
            query = query.filter(Registration.status == status)
        if quality:
            query = query.filter(Registration.quality == quality)
        if keyword:
            query = query.filter(
                or_(
                    Registration.real_name.ilike(f"%{keyword}%"),
                    Registration.phone.ilike(f"%{keyword}%"),
                    Registration.registration_no.ilike(f"%{keyword}%"),
                    Registration.company.ilike(f"%{keyword}%"),
                )
            )
        total = query.count()
        items = query.order_by(Registration.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def update_quality(
        self, db: Session, *, db_obj: Registration,
        new_quality: RegistrationQuality,
        reason: Optional[str] = None,
        changed_by: Optional[str] = None,
    ) -> Registration:
        old_quality = db_obj.quality
        db_obj.quality = new_quality
        
        history = RegistrationQualityHistory(
            registration_id=db_obj.id,
            old_quality=old_quality,
            new_quality=new_quality,
            changed_by=changed_by,
            reason=reason,
        )
        db.add(history)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_quality_histories(self, db: Session, *, registration_id: int) -> List[RegistrationQualityHistory]:
        return db.query(RegistrationQualityHistory).filter(
            RegistrationQualityHistory.registration_id == registration_id
        ).order_by(RegistrationQualityHistory.created_at.desc()).all()

    def count_by_event(self, db: Session, *, event_id: int, status: Optional[RegistrationStatus] = None) -> int:
        query = db.query(Registration).filter(Registration.event_id == event_id)
        if status:
            query = query.filter(Registration.status == status)
        return query.count()


crud_registration = CRUDRegistration(Registration)
