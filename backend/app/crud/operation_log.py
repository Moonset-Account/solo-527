from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.operation_log import OperationLog, OperationType
from app.models.user import User


class CRUDOperationLog:
    def create_log(
        self, db: Session,
        operation_type: OperationType,
        operator_id: Optional[int] = None,
        operator_name: Optional[str] = None,
        registration_id: Optional[int] = None,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        remark: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> OperationLog:
        db_obj = OperationLog(
            operation_type=operation_type,
            operator_id=operator_id,
            operator_name=operator_name,
            registration_id=registration_id,
            target_type=target_type,
            target_id=target_id,
            old_value=old_value,
            new_value=new_value,
            remark=remark,
            ip_address=ip_address,
            created_at=datetime.utcnow(),
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100,
        operation_type: Optional[OperationType] = None,
        registration_id: Optional[int] = None,
        operator_id: Optional[int] = None,
        target_type: Optional[str] = None,
    ) -> Tuple[List[OperationLog], int]:
        query = db.query(OperationLog)
        if operation_type:
            query = query.filter(OperationLog.operation_type == operation_type)
        if registration_id:
            query = query.filter(OperationLog.registration_id == registration_id)
        if operator_id:
            query = query.filter(OperationLog.operator_id == operator_id)
        if target_type:
            query = query.filter(OperationLog.target_type == target_type)
        total = query.count()
        items = query.order_by(OperationLog.created_at.desc()).offset(skip).limit(limit).all()
        return items, total


crud_operation_log = CRUDOperationLog()
