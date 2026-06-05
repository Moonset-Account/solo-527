from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.inventory import InventoryCheck, InventoryCheckItem, InventoryCheckStatus
from ..models.reagent import ReagentBatch
from ..schemas.inventory import InventoryCheckCreate, InventoryCheckUpdate, InventoryCheckItemUpdate
from .base import CRUDBase
import uuid


class CRUDInventoryCheck(CRUDBase[InventoryCheck, InventoryCheckCreate, InventoryCheckUpdate]):
    def generate_check_number(self) -> str:
        return f"INV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    def create(self, db: Session, *, obj_in: InventoryCheckCreate, created_by: Optional[int] = None) -> InventoryCheck:
        db_obj = InventoryCheck(
            check_number=self.generate_check_number(),
            title=obj_in.title,
            type=obj_in.type,
            status=InventoryCheckStatus.DRAFT,
            created_by=created_by,
            remarks=obj_in.remarks,
        )
        db.add(db_obj)
        db.flush()

        if obj_in.batch_ids:
            batches = db.query(ReagentBatch).filter(
                ReagentBatch.id.in_(obj_in.batch_ids),
                ReagentBatch.is_active == True
            ).all()
        else:
            batches = db.query(ReagentBatch).filter(
                ReagentBatch.is_active == True,
                ReagentBatch.remaining_quantity > 0
            ).all()

        for batch in batches:
            item = InventoryCheckItem(
                inventory_check_id=db_obj.id,
                reagent_batch_id=batch.id,
                expected_quantity=batch.remaining_quantity,
            )
            db.add(item)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def start_check(self, db: Session, *, check_id: int, user_id: int) -> Optional[InventoryCheck]:
        check = self.get(db, id=check_id)
        if check and check.status == InventoryCheckStatus.DRAFT:
            check.status = InventoryCheckStatus.IN_PROGRESS
            check.started_at = datetime.utcnow()
            check.checked_by = user_id
            db.commit()
            db.refresh(check)
        return check

    def complete_check(self, db: Session, *, check_id: int) -> Optional[InventoryCheck]:
        check = self.get(db, id=check_id)
        if check and check.status == InventoryCheckStatus.IN_PROGRESS:
            check.status = InventoryCheckStatus.COMPLETED
            check.completed_at = datetime.utcnow()
            discrepancies = 0
            for item in check.items:
                if item.actual_quantity is not None:
                    item.difference = item.actual_quantity - item.expected_quantity
                    item.is_matched = abs(item.difference) < 0.001
                    if not item.is_matched:
                        discrepancies += 1
            check.discrepancies_count = discrepancies
            db.commit()
            db.refresh(check)
        return check

    def get_by_creator(self, db: Session, *, creator_id: int, skip: int = 0, limit: int = 100) -> List[InventoryCheck]:
        return db.query(InventoryCheck).filter(
            InventoryCheck.created_by == creator_id
        ).order_by(InventoryCheck.created_at.desc()).offset(skip).limit(limit).all()


class CRUDInventoryCheckItem(CRUDBase[InventoryCheckItem, dict, InventoryCheckItemUpdate]):
    def update_item(
        self, db: Session, *, item_id: int, obj_in: InventoryCheckItemUpdate, checked_by: int
    ) -> Optional[InventoryCheckItem]:
        item = self.get(db, id=item_id)
        if item:
            item.actual_quantity = obj_in.actual_quantity
            item.remarks = obj_in.remarks
            item.photo_url = obj_in.photo_url
            item.checked_by = checked_by
            item.checked_at = datetime.utcnow()
            item.difference = obj_in.actual_quantity - item.expected_quantity
            item.is_matched = abs(item.difference) < 0.001
            db.commit()
            db.refresh(item)
        return item


inventory_check = CRUDInventoryCheck(InventoryCheck)
inventory_check_item = CRUDInventoryCheckItem(InventoryCheckItem)
