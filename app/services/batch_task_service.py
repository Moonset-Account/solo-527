from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.ticket import InferenceBatchTask, TaskStatus


class BatchTaskService:
    @staticmethod
    def create(
        db: Session,
        ticket_ids: List[int],
        store_predictions: bool = True,
        created_by: Optional[str] = None,
    ) -> InferenceBatchTask:
        task = InferenceBatchTask(
            ticket_ids=list(ticket_ids),
            total_count=len(ticket_ids),
            store_predictions=store_predictions,
            created_by=created_by,
            status=TaskStatus.PENDING.value,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get(db: Session, task_id: int) -> Optional[InferenceBatchTask]:
        return db.query(InferenceBatchTask).filter(InferenceBatchTask.id == task_id).first()

    @staticmethod
    def list(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
    ) -> Tuple[List[InferenceBatchTask], int]:
        query = db.query(InferenceBatchTask)
        if status:
            query = query.filter(InferenceBatchTask.status == status)
        total = query.count()
        items = (
            query.order_by(InferenceBatchTask.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    @staticmethod
    def update(
        db: Session,
        task_id: int,
        *,
        status: Optional[str] = None,
        job_id: Optional[str] = None,
        success_count: Optional[int] = None,
        low_confidence_count: Optional[int] = None,
        error_count: Optional[int] = None,
        error_message: Optional[str] = None,
        result_summary: Optional[Dict[str, Any]] = None,
        started_at: Optional[datetime] = None,
        finished_at: Optional[datetime] = None,
    ) -> Optional[InferenceBatchTask]:
        task = db.query(InferenceBatchTask).filter(InferenceBatchTask.id == task_id).first()
        if not task:
            return None
        if status is not None:
            task.status = status
        if job_id is not None:
            task.job_id = job_id
        if success_count is not None:
            task.success_count = success_count
        if low_confidence_count is not None:
            task.low_confidence_count = low_confidence_count
        if error_count is not None:
            task.error_count = error_count
        if error_message is not None:
            task.error_message = error_message
        if result_summary is not None:
            task.result_summary = result_summary
        if started_at is not None:
            task.started_at = started_at
        if finished_at is not None:
            task.finished_at = finished_at
        db.commit()
        db.refresh(task)
        return task
