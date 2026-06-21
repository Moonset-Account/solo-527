from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.crud.base import CRUDBase
from app.models import BakingBatch, LossRecord, InventoryStatus, UserRole
from app.schemas import BakingBatchCreate, BakingBatchUpdate


class CRUDBakingBatch(CRUDBase[BakingBatch, BakingBatchCreate, BakingBatchUpdate]):
    def _generate_batch_no(self, db: Session, store_id: int) -> str:
        today = datetime.now().strftime("%Y%m%d")
        count = db.query(BakingBatch).filter(
            BakingBatch.store_id == store_id,
            func.date(BakingBatch.created_at) == datetime.now().date()
        ).count() + 1
        return f"B{store_id:03d}{today}{count:03d}"

    def create(self, db: Session, *, obj_in: BakingBatchCreate) -> BakingBatch:
        obj_in_data = obj_in.model_dump()
        obj_in_data["batch_no"] = self._generate_batch_no(db, obj_in.store_id)
        db_obj = BakingBatch(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_store(self, db: Session, *, store_id: int, skip: int = 0, limit: int = 100):
        return db.query(BakingBatch).filter(
            BakingBatch.store_id == store_id
        ).order_by(BakingBatch.created_at.desc()).offset(skip).limit(limit).all()

    def complete_batch(self, db: Session, *, db_obj: BakingBatch, actual_quantity: float, end_time: datetime = None) -> BakingBatch:
        if end_time is None:
            end_time = datetime.now()
        db_obj.actual_quantity = actual_quantity
        db_obj.end_time = end_time
        from app.models import BatchStatus
        if actual_quantity < db_obj.planned_quantity * 0.8:
            db_obj.status = BatchStatus.PARTIAL_DAMAGED
        else:
            db_obj.status = BatchStatus.COMPLETED
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


crud_batch = CRUDBakingBatch(BakingBatch)


class CRUDLossRecord(CRUDBase[LossRecord, BakingBatchCreate, BakingBatchUpdate]):
    def create(self, db: Session, *, obj_in) -> LossRecord:
        obj_in_data = obj_in.model_dump()
        obj_in_data["total_amount"] = obj_in_data.get("quantity", 0) * obj_in_data.get("unit_price", 0)
        db_obj = LossRecord(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        if obj_in.ingredient_id:
            from app.crud.crud_inventory import crud_inventory
            inventory = crud_inventory.get_by_ingredient(db, store_id=obj_in.store_id, ingredient_id=obj_in.ingredient_id)
            if inventory:
                new_qty = max(0, inventory.quantity - obj_in.quantity)
                inventory.quantity = new_qty
                if new_qty <= inventory.min_stock:
                    inventory.status = InventoryStatus.LOW_STOCK if new_qty > 0 else InventoryStatus.OUT_OF_STOCK
                db.add(inventory)
                db.commit()

        return db_obj

    def get_by_store(self, db: Session, *, store_id: int, skip: int = 0, limit: int = 100):
        return db.query(LossRecord).filter(
            LossRecord.store_id == store_id
        ).order_by(LossRecord.created_at.desc()).offset(skip).limit(limit).all()

    def handle_loss(self, db: Session, *, db_obj: LossRecord, handler_id: int, handle_result: str) -> LossRecord:
        db_obj.handler_id = handler_id
        db_obj.handle_result = handle_result
        db_obj.handled_at = datetime.now()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_loss_stats(self, db: Session, *, store_id: int = None, start_date: datetime = None, end_date: datetime = None):
        query = db.query(LossRecord)
        if store_id:
            query = query.filter(LossRecord.store_id == store_id)
        if start_date:
            query = query.filter(LossRecord.created_at >= start_date)
        if end_date:
            query = query.filter(LossRecord.created_at <= end_date)

        records = query.all()
        total_amount = sum(r.total_amount for r in records)

        type_breakdown = {}
        for r in records:
            if r.loss_type not in type_breakdown:
                type_breakdown[r.loss_type] = 0
            type_breakdown[r.loss_type] += r.total_amount

        return {
            "total_amount": total_amount,
            "type_breakdown": type_breakdown,
            "count": len(records)
        }
