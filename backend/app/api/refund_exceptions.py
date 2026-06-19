from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_operator, get_client_ip
from app.schemas.refund_exception import (
    RefundExceptionCreate, RefundExceptionUpdate,
    RefundExceptionResponse, RefundExceptionListResponse
)
from app.schemas.todo import TodoCreate, TodoType, TodoPriority
from app.crud import crud_refund_exception, crud_registration, crud_todo, crud_operation_log
from app.models.user import User
from app.models.refund_exception import RefundExceptionStatus
from app.models.registration import RegistrationStatus
from app.models.operation_log import OperationType

router = APIRouter(prefix="/refund-exceptions", tags=["退票异常"])


@router.get("", response_model=RefundExceptionListResponse)
def list_refund_exceptions(
    status: Optional[RefundExceptionStatus] = None,
    registration_id: Optional[int] = None,
    auto_generated: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    skip = (page - 1) * page_size
    items, total = crud_refund_exception.get_multi(
        db, skip=skip, limit=page_size,
        status=status, registration_id=registration_id,
        auto_generated=auto_generated,
    )
    return {"total": total, "items": items}


@router.get("/{exception_id}", response_model=RefundExceptionResponse)
def get_refund_exception(
    exception_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    exception = crud_refund_exception.get(db, id=exception_id)
    if not exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="退票异常不存在",
        )
    return exception


@router.post("", response_model=RefundExceptionResponse)
def create_refund_exception(
    exception_in: RefundExceptionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    registration = crud_registration.get(db, id=exception_in.registration_id)
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名记录不存在",
        )
    
    exception = crud_refund_exception.create(db, obj_in=exception_in)
    
    todo_data = TodoCreate(
        title=f"退票异常处理 - {registration.real_name}",
        description=f"退票异常需要处理：{exception_in.description or exception_in.exception_type}",
        priority=TodoPriority.HIGH,
        todo_type=TodoType.REFUND_EXCEPTION,
        registration_id=registration.id,
    )
    todo = crud_todo.create_with_creator(db, obj_in=todo_data, created_by_id=current_user.id)
    todo.refund_exception_id = exception.id
    db.commit()
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.CREATE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        registration_id=registration.id,
        target_type="refund_exception",
        target_id=exception.id,
        new_value={"exception_type": exception.exception_type, "refund_amount": exception.refund_amount},
        remark="创建退票异常",
        ip_address=get_client_ip(request),
    )
    
    return exception


@router.put("/{exception_id}", response_model=RefundExceptionResponse)
def update_refund_exception(
    exception_id: int,
    exception_in: RefundExceptionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    exception = crud_refund_exception.get(db, id=exception_id)
    if not exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="退票异常不存在",
        )
    
    old_data = {c.name: getattr(exception, c.name) for c in exception.__table__.columns}
    exception = crud_refund_exception.update(db, db_obj=exception, obj_in=exception_in)
    
    update_data = exception_in.model_dump(exclude_unset=True)
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.UPDATE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        registration_id=exception.registration_id,
        target_type="refund_exception",
        target_id=exception_id,
        old_value=old_data,
        new_value=update_data,
        remark="更新退票异常",
        ip_address=get_client_ip(request),
    )
    
    return exception


@router.post("/{exception_id}/resolve", response_model=RefundExceptionResponse)
def resolve_refund_exception(
    exception_id: int,
    handle_result: str,
    request: Request,
    actual_refund_amount: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    exception = crud_refund_exception.resolve(
        db, exception_id=exception_id,
        handle_result=handle_result,
        actual_refund_amount=actual_refund_amount,
        handled_by=current_user.full_name or current_user.username,
    )
    if not exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="退票异常不存在",
        )
    
    registration = crud_registration.get(db, id=exception.registration_id)
    if registration:
        if actual_refund_amount > 0:
            crud_registration.update(db, db_obj=registration, obj_in={"status": RegistrationStatus.REFUNDED})
    
    if exception.todo:
        crud_todo.complete(db, todo_id=exception.todo.id, result=handle_result)
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.REFUND,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        registration_id=exception.registration_id,
        target_type="refund_exception",
        target_id=exception_id,
        new_value={"status": "resolved", "actual_refund_amount": actual_refund_amount},
        remark=handle_result,
        ip_address=get_client_ip(request),
    )
    
    return exception
