from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_operator
from app.schemas.operation_log import OperationLogListResponse, OperationLogResponse
from app.crud import crud_operation_log
from app.models.user import User
from app.models.operation_log import OperationType

router = APIRouter(prefix="/operation-logs", tags=["操作日志"])


@router.get("", response_model=OperationLogListResponse)
def list_operation_logs(
    operation_type: Optional[OperationType] = None,
    registration_id: Optional[int] = None,
    operator_id: Optional[int] = None,
    target_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    skip = (page - 1) * page_size
    items, total = crud_operation_log.get_multi(
        db, skip=skip, limit=page_size,
        operation_type=operation_type,
        registration_id=registration_id,
        operator_id=operator_id,
        target_type=target_type,
    )
    return {"total": total, "items": items}
