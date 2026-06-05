from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from ..models.reagent import Reagent, ReagentBatch, HazardLevel
from ..schemas.reagent import ReagentCreate, ReagentUpdate, ReagentBatchCreate, ReagentBatchUpdate
from .base import CRUDBase
from ..config import settings
import uuid


class CRUDReagent(CRUDBase[Reagent, ReagentCreate, ReagentUpdate]):
    def generate_barcode(self) -> str:
        return f"REAG-{uuid.uuid4().hex[:12].upper()}"

    def create(self, db: Session, *, obj_in: ReagentCreate, created_by: Optional[int] = None) -> Reagent:
        obj_in_data = obj_in.model_dump()
        obj_in_data["barcode"] = self.generate_barcode()
        if created_by:
            obj_in_data["created_by"] = created_by
        if obj_in_data.get("hazard_level") in [HazardLevel.HIGH, HazardLevel.EXTREME]:
            obj_in_data["requires_double_confirm"] = True
        db_obj = Reagent(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def search(self, db: Session, *, keyword: str, skip: int = 0, limit: int = 100) -> List[Reagent]:
        return db.query(Reagent).filter(
            or_(
                Reagent.name.ilike(f"%{keyword}%"),
                Reagent.english_name.ilike(f"%{keyword}%"),
                Reagent.cas_number.ilike(f"%{keyword}%"),
                Reagent.barcode.ilike(f"%{keyword}%"),
            ),
            Reagent.is_active == True
        ).offset(skip).limit(limit).all()

    def get_low_stock(self, db: Session) -> List[Reagent]:
        from sqlalchemy import func
        subquery = db.query(
            ReagentBatch.reagent_id,
            func.sum(ReagentBatch.remaining_quantity).label("total_remaining")
        ).filter(
            ReagentBatch.is_active == True
        ).group_by(ReagentBatch.reagent_id).subquery()

        return db.query(Reagent).join(
            subquery, Reagent.id == subquery.c.reagent_id
        ).filter(
            subquery.c.total_remaining <= Reagent.min_stock,
            Reagent.is_active == True
        ).all()

    def get_by_barcode(self, db: Session, *, barcode: str) -> Optional[Reagent]:
        return db.query(Reagent).filter(Reagent.barcode == barcode).first()


class CRUDReagentBatch(CRUDBase[ReagentBatch, ReagentBatchCreate, ReagentBatchUpdate]):
    def generate_barcode(self) -> str:
        return f"BATCH-{uuid.uuid4().hex[:12].upper()}"

    def create(self, db: Session, *, obj_in: ReagentBatchCreate, created_by: Optional[int] = None) -> ReagentBatch:
        obj_in_data = obj_in.model_dump()
        obj_in_data["barcode"] = self.generate_barcode()
        obj_in_data["remaining_quantity"] = obj_in_data["quantity"]
        if created_by:
            obj_in_data["received_by"] = created_by
        db_obj = ReagentBatch(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_expiring_soon(self, db: Session, days: int = None) -> List[ReagentBatch]:
        if days is None:
            days = settings.EXPIRY_WARNING_DAYS
        threshold = datetime.now().date() + timedelta(days=days)
        return db.query(ReagentBatch).filter(
            ReagentBatch.expiry_date <= threshold,
            ReagentBatch.expiry_date >= datetime.now().date(),
            ReagentBatch.remaining_quantity > 0,
            ReagentBatch.is_active == True
        ).order_by(ReagentBatch.expiry_date).all()

    def get_expired(self, db: Session) -> List[ReagentBatch]:
        return db.query(ReagentBatch).filter(
            ReagentBatch.expiry_date < datetime.now().date(),
            ReagentBatch.remaining_quantity > 0,
            ReagentBatch.is_active == True
        ).all()

    def get_by_barcode(self, db: Session, *, barcode: str) -> Optional[ReagentBatch]:
        return db.query(ReagentBatch).filter(ReagentBatch.barcode == barcode).first()

    def get_by_reagent(self, db: Session, *, reagent_id: int) -> List[ReagentBatch]:
        return db.query(ReagentBatch).filter(
            ReagentBatch.reagent_id == reagent_id,
            ReagentBatch.is_active == True
        ).order_by(ReagentBatch.expiry_date).all()

    def get_by_cabinet(self, db: Session, *, cabinet_id: int) -> List[ReagentBatch]:
        return db.query(ReagentBatch).filter(
            ReagentBatch.storage_cabinet_id == cabinet_id,
            ReagentBatch.is_active == True
        ).all()

    def update_quantity(self, db: Session, *, batch_id: int, quantity_change: float) -> Optional[ReagentBatch]:
        batch = self.get(db, id=batch_id)
        if batch:
            batch.remaining_quantity += quantity_change
            db.commit()
            db.refresh(batch)
        return batch

    def search(self, db: Session, *, keyword: str, skip: int = 0, limit: int = 100) -> List[ReagentBatch]:
        return db.query(ReagentBatch).join(Reagent).filter(
            or_(
                Reagent.name.ilike(f"%{keyword}%"),
                ReagentBatch.batch_number.ilike(f"%{keyword}%"),
                ReagentBatch.barcode.ilike(f"%{keyword}%"),
            ),
            ReagentBatch.is_active == True
        ).offset(skip).limit(limit).all()


reagent = CRUDReagent(Reagent)
reagent_batch = CRUDReagentBatch(ReagentBatch)
