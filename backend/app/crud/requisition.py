from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.requisition import Requisition, RequisitionItem, RequisitionStatus
from ..models.reagent import ReagentBatch, Reagent
from ..schemas.requisition import RequisitionCreate, RequisitionUpdate, RequisitionItemCreate
from .base import CRUDBase
from .. import crud
import uuid


class CRUDRequisition(CRUDBase[Requisition, RequisitionCreate, RequisitionUpdate]):
    def generate_requisition_number(self) -> str:
        return f"REQ-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    def create(self, db: Session, *, obj_in: RequisitionCreate, created_by: Optional[int] = None) -> Requisition:
        requires_double = False
        for item in obj_in.items:
            batch = db.query(ReagentBatch).filter(ReagentBatch.id == item.reagent_batch_id).first()
            if batch and batch.reagent and batch.reagent.requires_double_confirm:
                requires_double = True
                break

        db_obj = Requisition(
            requisition_number=self.generate_requisition_number(),
            title=obj_in.title,
            applicant_id=created_by,
            purpose=obj_in.purpose,
            status=RequisitionStatus.PENDING,
            priority=obj_in.priority,
            requires_double_confirm=requires_double,
            expected_return_date=obj_in.expected_return_date,
            remarks=obj_in.remarks,
        )
        db.add(db_obj)
        db.flush()

        for item_in in obj_in.items:
            item = RequisitionItem(
                requisition_id=db_obj.id,
                reagent_batch_id=item_in.reagent_batch_id,
                quantity=item_in.quantity,
                purpose=item_in.purpose,
                remarks=item_in.remarks,
            )
            db.add(item)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_applicant(self, db: Session, *, applicant_id: int, skip: int = 0, limit: int = 100) -> List[Requisition]:
        return db.query(Requisition).filter(
            Requisition.applicant_id == applicant_id
        ).order_by(Requisition.created_at.desc()).offset(skip).limit(limit).all()

    def get_pending_approval(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Requisition]:
        return db.query(Requisition).filter(
            Requisition.status.in_([RequisitionStatus.PENDING, RequisitionStatus.APPROVED])
        ).order_by(Requisition.created_at.desc()).offset(skip).limit(limit).all()

    def get_pending_confirmation(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[Requisition]:
        return db.query(Requisition).filter(
            Requisition.requires_double_confirm == True,
            Requisition.status == RequisitionStatus.PENDING,
            (Requisition.first_confirmer_id == None) | 
            ((Requisition.first_confirmer_id != None) & (Requisition.second_confirmer_id == None))
        ).filter(
            Requisition.applicant_id != user_id
        ).order_by(Requisition.created_at.desc()).offset(skip).limit(limit).all()

    def confirm(self, db: Session, *, requisition_id: int, confirmer_id: int, is_first: bool = True) -> Optional[Requisition]:
        req = self.get(db, id=requisition_id)
        if req:
            now = datetime.utcnow()
            if is_first:
                req.first_confirmer_id = confirmer_id
                req.first_confirmed_at = now
            else:
                req.second_confirmer_id = confirmer_id
                req.second_confirmed_at = now
            db.commit()
            db.refresh(req)
        return req

    def approve(self, db: Session, *, requisition_id: int, approver_id: int) -> Optional[Requisition]:
        req = self.get(db, id=requisition_id)
        if req:
            req.approver_id = approver_id
            req.approved_at = datetime.utcnow()
            req.status = RequisitionStatus.APPROVED
            db.commit()
            db.refresh(req)
        return req

    def reject(self, db: Session, *, requisition_id: int, approver_id: int, reason: str) -> Optional[Requisition]:
        req = self.get(db, id=requisition_id)
        if req:
            req.approver_id = approver_id
            req.status = RequisitionStatus.REJECTED
            req.rejection_reason = reason
            db.commit()
            db.refresh(req)
        return req

    def pick_up(self, db: Session, *, requisition_id: int, picked_by: int) -> Optional[Requisition]:
        req = self.get(db, id=requisition_id)
        if req and req.status == RequisitionStatus.APPROVED:
            req.picked_up_by = picked_by
            req.picked_up_at = datetime.utcnow()
            req.status = RequisitionStatus.PICKED_UP
            for item in req.items:
                crud.reagent_batch.update_quantity(
                    db, batch_id=item.reagent_batch_id, 
                    quantity_change=-item.quantity
                )
            db.commit()
            db.refresh(req)
        return req

    def return_req(self, db: Session, *, requisition_id: int) -> Optional[Requisition]:
        req = self.get(db, id=requisition_id)
        if req and req.status == RequisitionStatus.PICKED_UP:
            req.returned_at = datetime.utcnow()
            req.status = RequisitionStatus.RETURNED
            for item in req.items:
                return_qty = item.returned_quantity or 0
                if return_qty > 0:
                    crud.reagent_batch.update_quantity(
                        db, batch_id=item.reagent_batch_id,
                        quantity_change=return_qty
                    )
            db.commit()
            db.refresh(req)
        return req

    def get_pending_for_user(self, db: Session, user_id: int) -> List[Requisition]:
        return db.query(Requisition).filter(
            (Requisition.first_confirmer_id == None) | 
            (Requisition.second_confirmer_id == None),
            Requisition.status == RequisitionStatus.PENDING,
            Requisition.applicant_id != user_id,
            Requisition.requires_double_confirm == True
        ).all()


class CRUDRequisitionItem(CRUDBase[RequisitionItem, RequisitionItemCreate, dict]):
    pass


requisition = CRUDRequisition(Requisition)
requisition_item = CRUDRequisitionItem(RequisitionItem)
