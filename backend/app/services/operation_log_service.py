from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.operation_log import OperationLog
from app.schemas.operation_log import OperationLogQuery
from app.schemas.common import PageResult


class OperationLogService:
    @staticmethod
    def get(db: Session, log_id: int) -> Optional[OperationLog]:
        return db.query(OperationLog).filter(OperationLog.id == log_id).first()

    @staticmethod
    def list(db: Session, query: OperationLogQuery) -> PageResult:
        q = db.query(OperationLog)

        if query.keyword:
            keyword = f"%{query.keyword}%"
            q = q.filter(or_(OperationLog.description.like(keyword), OperationLog.username.like(keyword)))

        if query.module:
            q = q.filter(OperationLog.module == query.module)

        if query.operation_type:
            q = q.filter(OperationLog.operation_type == query.operation_type)

        if query.user_id:
            q = q.filter(OperationLog.user_id == query.user_id)

        if query.status:
            q = q.filter(OperationLog.status == query.status)

        if query.start_time:
            q = q.filter(OperationLog.created_at >= query.start_time)

        if query.end_time:
            q = q.filter(OperationLog.created_at <= query.end_time)

        total = q.count()
        items = q.order_by(OperationLog.id.desc()).offset((query.page - 1) * query.page_size).limit(query.page_size).all()

        return PageResult(total=total, page=query.page, page_size=query.page_size, items=items)

    @staticmethod
    def create(
        db: Session,
        operation_type: str,
        module: str,
        description: str,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_method: Optional[str] = None,
        request_url: Optional[str] = None,
        request_params: Optional[Dict[str, Any]] = None,
        response_data: Optional[Dict[str, Any]] = None,
        old_data: Optional[Dict[str, Any]] = None,
        new_data: Optional[Dict[str, Any]] = None,
        status: str = "success",
        error_msg: Optional[str] = None,
        duration: Optional[int] = None,
    ) -> OperationLog:
        log = OperationLog(
            user_id=user_id,
            username=username,
            operation_type=operation_type,
            module=module,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request_method,
            request_url=request_url,
            request_params=request_params,
            response_data=response_data,
            old_data=old_data,
            new_data=new_data,
            status=status,
            error_msg=error_msg,
            duration=duration,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
