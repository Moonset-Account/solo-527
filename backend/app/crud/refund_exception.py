from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.refund_exception import RefundException, RefundExceptionStatus
from app.schemas.refund_exception import RefundExceptionCreate, RefundExceptionUpdate


class CRUDRefundException(CRUDBase[RefundException, RefundExceptionCreate, RefundExceptionUpdate]):
    def create_auto(self, db: Session, *, registration_id: int, description: str, refund_amount: int = 0) -> RefundException:
        db_obj = RefundException(
            registration_id=registration_id,
            exception_type="auto_refund",
            description=description,
            refund_amount=refund_amount,
            status=RefundExceptionStatus.PENDING,
            auto_generated=True,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100,
        status: Optional[RefundExceptionStatus] = None,
        registration_id: Optional[int] = None,
        auto_generated: Optional[bool] = None,
    ) -> Tuple[List[RefundException], int]:
        query = db.query(RefundException)
        if status:
            query = query.filter(RefundException.status == status)
        if registration_id:
            query = query.filter(RefundException.registration_id == registration_id)
        if auto_generated is not None:
            query = query.filter(RefundException.auto_generated == auto_generated)
        total = query.count()
        items = query.order_by(RefundException.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def resolve(
        self, db: Session, *, exception_id: int,
        handle_result: str,
        actual_refund_amount: Optional[int] = None,
        handled_by: Optional[str] = None,
    ) -> Optional[RefundException]:
        exception = self.get(db, id=exception_id)
        if exception:
            exception.status = RefundExceptionStatus.RESOLVED
            exception.handle_result = handle_result
            exception.handled_by = handled_by
            exception.resolved_at = datetime.utcnow()
            if actual_refund_amount is not None:
                exception.actual_refund_amount = actual_refund_amount
            db.add(exception)
            db.commit()
            db.refresh(exception)
        return exception


crud_refund_exception = CRUDRefundException(RefundException)
