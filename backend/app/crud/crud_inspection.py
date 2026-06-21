from datetime import datetime, date
from typing import Optional, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models import InspectionTask, InspectionCheckRecord, RectificationTask, InspectionStatus, RectificationStatus
from app.schemas import (
    InspectionTaskCreate, InspectionTaskUpdate,
    InspectionCheckRecordCreate,
    RectificationTaskCreate, RectificationTaskUpdate
)


class CRUDInspection(CRUDBase[InspectionTask, InspectionTaskCreate, InspectionTaskUpdate]):
    def _generate_task_no(self, db: Session, store_id: int) -> str:
        today = datetime.now().strftime("%Y%m%d")
        count = db.query(InspectionTask).filter(
            InspectionTask.store_id == store_id,
            func.date(InspectionTask.created_at) == datetime.now().date()
        ).count() + 1
        return f"I{store_id:03d}{today}{count:03d}"

    def create(self, db: Session, *, obj_in: InspectionTaskCreate) -> InspectionTask:
        obj_in_data = obj_in.model_dump()
        obj_in_data["task_no"] = self._generate_task_no(db, obj_in.store_id)
        db_obj = InspectionTask(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_store(self, db: Session, *, store_id: int, status: Optional[InspectionStatus] = None, skip: int = 0, limit: int = 100):
        query = db.query(InspectionTask).filter(InspectionTask.store_id == store_id)
        if status:
            query = query.filter(InspectionTask.status == status)
        return query.order_by(InspectionTask.scheduled_date.desc()).offset(skip).limit(limit).all()

    def get_by_supervisor(self, db: Session, *, supervisor_id: int, status: Optional[InspectionStatus] = None, skip: int = 0, limit: int = 100):
        query = db.query(InspectionTask).filter(InspectionTask.supervisor_id == supervisor_id)
        if status:
            query = query.filter(InspectionTask.status == status)
        return query.order_by(InspectionTask.scheduled_date.desc()).offset(skip).limit(limit).all()

    def start_inspection(self, db: Session, *, db_obj: InspectionTask) -> InspectionTask:
        db_obj.status = InspectionStatus.IN_PROGRESS
        db_obj.actual_start = datetime.now()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def complete_inspection(self, db: Session, *, db_obj: InspectionTask, score: float, remark: str = None) -> InspectionTask:
        db_obj.status = InspectionStatus.COMPLETED
        db_obj.actual_end = datetime.now()
        db_obj.score = score
        db_obj.remark = remark
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def add_check_record(self, db: Session, *, inspection_id: int, obj_in: InspectionCheckRecordCreate) -> InspectionCheckRecord:
        obj_in_data = obj_in.model_dump()
        db_obj = InspectionCheckRecord(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_check_records(self, db: Session, *, inspection_id: int) -> List[InspectionCheckRecord]:
        return db.query(InspectionCheckRecord).filter(
            InspectionCheckRecord.inspection_id == inspection_id
        ).all()


from sqlalchemy import func

crud_inspection = CRUDInspection(InspectionTask)


class CRUDRectification(CRUDBase[RectificationTask, RectificationTaskCreate, RectificationTaskUpdate]):
    def _generate_rectification_no(self, db: Session, inspection_id: int) -> str:
        today = datetime.now().strftime("%Y%m%d")
        count = db.query(RectificationTask).filter(
            RectificationTask.inspection_id == inspection_id,
            func.date(RectificationTask.created_at) == datetime.now().date()
        ).count() + 1
        return f"R{inspection_id:04d}{today}{count:02d}"

    def create(self, db: Session, *, obj_in: RectificationTaskCreate) -> RectificationTask:
        obj_in_data = obj_in.model_dump()
        obj_in_data["rectification_no"] = self._generate_rectification_no(db, obj_in.inspection_id)
        db_obj = RectificationTask(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_inspection(self, db: Session, *, inspection_id: int) -> List[RectificationTask]:
        return db.query(RectificationTask).filter(
            RectificationTask.inspection_id == inspection_id
        ).order_by(RectificationTask.created_at.desc()).all()

    def get_by_assignee(self, db: Session, *, assignee_id: int, status: Optional[RectificationStatus] = None, skip: int = 0, limit: int = 100):
        query = db.query(RectificationTask).filter(RectificationTask.assignee_id == assignee_id)
        if status:
            query = query.filter(RectificationTask.status == status)
        return query.order_by(RectificationTask.deadline.asc()).offset(skip).limit(limit).all()

    def get_by_store(self, db: Session, *, store_id: int, status: Optional[RectificationStatus] = None, skip: int = 0, limit: int = 100):
        query = db.query(RectificationTask).join(InspectionTask).filter(
            InspectionTask.store_id == store_id
        )
        if status:
            query = query.filter(RectificationTask.status == status)
        return query.order_by(RectificationTask.deadline.asc()).offset(skip).limit(limit).all()

    def start_rectification(self, db: Session, *, db_obj: RectificationTask) -> RectificationTask:
        db_obj.status = RectificationStatus.IN_PROGRESS
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def submit_rectification(self, db: Session, *, db_obj: RectificationTask, result: str, image_urls: Optional[List[str]] = None) -> RectificationTask:
        db_obj.status = RectificationStatus.COMPLETED
        db_obj.rectification_result = result
        db_obj.image_urls = image_urls
        db_obj.completed_at = datetime.now()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def re_inspect(self, db: Session, *, db_obj: RectificationTask, result: str, is_pass: bool) -> RectificationTask:
        db_obj.re_inspection_result = result
        db_obj.re_inspected_at = datetime.now()
        db_obj.status = RectificationStatus.RE_INSPECTED if is_pass else RectificationStatus.REJECTED
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


crud_rectification = CRUDRectification(RectificationTask)
