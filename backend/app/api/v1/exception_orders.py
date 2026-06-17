from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.schemas.exception_order import (
    ExceptionOrderCreate, ExceptionOrderUpdate, ExceptionOrderResolve,
    ExceptionOrderBase, ExceptionOrderQuery,
)
from app.schemas.common import PageResult, ResponseModel
from app.api.deps import get_current_user, require_permission
from app.services import ExceptionOrderService

router = APIRouter(prefix="/exception-orders", tags=["异常单管理"])


@router.get("", response_model=ResponseModel[PageResult])
def list_exception_orders(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    exception_type: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[int] = None,
    lease_id: Optional[int] = None,
    created_from: Optional[datetime] = None,
    created_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("exception:view")),
):
    query = ExceptionOrderQuery(
        page=page, page_size=page_size, keyword=keyword, exception_type=exception_type,
        status=status, priority=priority, assigned_to=assigned_to,
        lease_id=lease_id, created_from=created_from, created_to=created_to,
    )
    result = ExceptionOrderService.list(db, query)
    items = [ExceptionOrderBase.model_validate(e) for e in result.items]
    return ResponseModel(
        data=PageResult(total=result.total, page=result.page, page_size=result.page_size, items=items)
    )


@router.post("", response_model=ResponseModel[ExceptionOrderBase])
def create_exception_order(
    data: ExceptionOrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("exception:handle")),
):
    order = ExceptionOrderService.create(db, data, created_by=current_user.id)
    return ResponseModel(data=ExceptionOrderBase.model_validate(order))


@router.get("/{order_id}", response_model=ResponseModel[ExceptionOrderBase])
def get_exception_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("exception:view")),
):
    order = ExceptionOrderService.get(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="异常单不存在")
    return ResponseModel(data=ExceptionOrderBase.model_validate(order))


@router.put("/{order_id}", response_model=ResponseModel[ExceptionOrderBase])
def update_exception_order(
    order_id: int,
    data: ExceptionOrderUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("exception:handle")),
):
    order = ExceptionOrderService.update(db, order_id, data, updated_by=current_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="异常单不存在")
    return ResponseModel(data=ExceptionOrderBase.model_validate(order))


@router.post("/{order_id}/resolve", response_model=ResponseModel[ExceptionOrderBase])
def resolve_exception_order(
    order_id: int,
    data: ExceptionOrderResolve,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("exception:handle")),
):
    order = ExceptionOrderService.resolve(db, order_id, data, resolved_by=current_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="异常单不存在")
    return ResponseModel(data=ExceptionOrderBase.model_validate(order))


@router.delete("/{order_id}")
def delete_exception_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("exception:handle")),
):
    if not ExceptionOrderService.delete(db, order_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="异常单不存在")
    return ResponseModel(message="删除成功")
