from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import uuid

from app.models.exception_order import ExceptionOrder
from app.models.user import User
from app.schemas.exception_order import (
    ExceptionOrderCreate,
    ExceptionOrderUpdate,
    ExceptionOrderResolve,
    ExceptionOrderQuery,
)
from app.schemas.common import PageResult


class ExceptionOrderService:
    @staticmethod
    def get(db: Session, order_id: int) -> Optional[ExceptionOrder]:
        return db.query(ExceptionOrder).filter(ExceptionOrder.id == order_id, ExceptionOrder.is_deleted == False).first()

    @staticmethod
    def list(db: Session, query: ExceptionOrderQuery) -> PageResult:
        q = db.query(ExceptionOrder).filter(ExceptionOrder.is_deleted == False)

        if query.keyword:
            keyword = f"%{query.keyword}%"
            q = q.filter(or_(ExceptionOrder.order_no.like(keyword), ExceptionOrder.title.like(keyword)))

        if query.exception_type:
            q = q.filter(ExceptionOrder.exception_type == query.exception_type)

        if query.status:
            q = q.filter(ExceptionOrder.status == query.status)

        if query.priority:
            q = q.filter(ExceptionOrder.priority == query.priority)

        if query.assigned_to:
            q = q.filter(ExceptionOrder.assigned_to == query.assigned_to)

        if query.lease_id:
            q = q.filter(ExceptionOrder.lease_id == query.lease_id)

        if query.created_from:
            q = q.filter(ExceptionOrder.created_at >= query.created_from)

        if query.created_to:
            q = q.filter(ExceptionOrder.created_at <= query.created_to)

        total = q.count()
        items = q.order_by(ExceptionOrder.id.desc()).offset((query.page - 1) * query.page_size).limit(query.page_size).all()

        return PageResult(total=total, page=query.page, page_size=query.page_size, items=items)

    @staticmethod
    def generate_order_no() -> str:
        date_str = datetime.now().strftime("%Y%m%d")
        unique_id = str(uuid.uuid4().hex)[:8].upper()
        return f"YC{date_str}{unique_id}"

    @staticmethod
    def create(db: Session, data: ExceptionOrderCreate, created_by: Optional[int] = None) -> ExceptionOrder:
        order_no = ExceptionOrderService.generate_order_no()
        db_obj = ExceptionOrder(**data.model_dump(), order_no=order_no, created_by=created_by)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, order_id: int, data: ExceptionOrderUpdate, updated_by: Optional[int] = None) -> Optional[ExceptionOrder]:
        db_obj = ExceptionOrderService.get(db, order_id)
        if not db_obj:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def resolve(db: Session, order_id: int, data: ExceptionOrderResolve, resolved_by: int) -> Optional[ExceptionOrder]:
        db_obj = ExceptionOrderService.get(db, order_id)
        if not db_obj:
            return None

        db_obj.resolution = data.resolution
        db_obj.status = "resolved"
        db_obj.resolved_at = datetime.utcnow()
        db_obj.assigned_to = db_obj.assigned_to or resolved_by
        db_obj.updated_by = resolved_by
        db_obj.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, order_id: int, updated_by: Optional[int] = None) -> bool:
        db_obj = ExceptionOrderService.get(db, order_id)
        if not db_obj:
            return False
        db_obj.is_deleted = True
        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()
        db.commit()
        return True
