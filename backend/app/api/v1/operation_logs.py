from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.schemas.operation_log import OperationLogBase, OperationLogQuery
from app.schemas.common import PageResult, ResponseModel
from app.api.deps import get_current_user, require_permission
from app.services import OperationLogService

router = APIRouter(prefix="/operation-logs", tags=["操作日志"])


@router.get("", response_model=ResponseModel[PageResult])
def list_operation_logs(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    module: Optional[str] = None,
    operation_type: Optional[str] = None,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("log:view")),
):
    query = OperationLogQuery(
        page=page, page_size=page_size, keyword=keyword, module=module,
        operation_type=operation_type, user_id=user_id, status=status,
        start_time=start_time, end_time=end_time,
    )
    result = OperationLogService.list(db, query)
    items = [OperationLogBase.model_validate(l) for l in result.items]
    return ResponseModel(
        data=PageResult(total=result.total, page=result.page, page_size=result.page_size, items=items)
    )


@router.get("/{log_id}", response_model=ResponseModel[OperationLogBase])
def get_operation_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("log:view")),
):
    log = OperationLogService.get(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="日志不存在")
    return ResponseModel(data=OperationLogBase.model_validate(log))
