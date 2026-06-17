from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.schemas.lease_ext import (
    LeaseCreate, LeaseUpdate, LeaseBase, LeaseQuery,
    FollowUpRecordCreate, FollowUpRecordUpdate, FollowUpRecordBase, FollowUpRecordQuery,
)
from app.schemas.common import PageResult, ResponseModel
from app.api.deps import get_current_user, require_permission
from app.services import LeaseService, FollowUpService

router = APIRouter(prefix="/leases", tags=["租约管理"])


@router.get("", response_model=ResponseModel[PageResult])
def list_leases(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    lease_type: Optional[str] = None,
    status: Optional[str] = None,
    consultant_id: Optional[int] = None,
    start_date_from: Optional[date] = None,
    start_date_to: Optional[date] = None,
    end_date_from: Optional[date] = None,
    end_date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:view")),
):
    query = LeaseQuery(
        page=page, page_size=page_size, keyword=keyword, lease_type=lease_type,
        status=status, consultant_id=consultant_id,
        start_date_from=start_date_from, start_date_to=start_date_to,
        end_date_from=end_date_from, end_date_to=end_date_to,
    )
    result = LeaseService.list(db, query)
    items = [LeaseBase.model_validate(l) for l in result.items]
    return ResponseModel(
        data=PageResult(total=result.total, page=result.page, page_size=result.page_size, items=items)
    )


@router.post("", response_model=ResponseModel[LeaseBase])
def create_lease(
    data: LeaseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    lease = LeaseService.create(db, data, created_by=current_user.id)
    return ResponseModel(data=LeaseBase.model_validate(lease))


@router.get("/{lease_id}", response_model=ResponseModel[LeaseBase])
def get_lease(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:view")),
):
    lease = LeaseService.get(db, lease_id)
    if not lease:
        raise HTTPException(status_code=404, detail="租约不存在")
    return ResponseModel(data=LeaseBase.model_validate(lease))


@router.put("/{lease_id}", response_model=ResponseModel[LeaseBase])
def update_lease(
    lease_id: int,
    data: LeaseUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    lease = LeaseService.update(db, lease_id, data, updated_by=current_user.id)
    if not lease:
        raise HTTPException(status_code=404, detail="租约不存在")
    return ResponseModel(data=LeaseBase.model_validate(lease))


@router.delete("/{lease_id}")
def delete_lease(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    if not LeaseService.delete(db, lease_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="租约不存在")
    return ResponseModel(message="删除成功")


@router.get("/{lease_id}/follow-ups", response_model=ResponseModel[PageResult])
def list_follow_ups(
    lease_id: int,
    page: int = 1,
    page_size: int = 20,
    follow_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:view")),
):
    query = FollowUpRecordQuery(page=page, page_size=page_size, lease_id=lease_id, follow_type=follow_type)
    result = FollowUpService.list(db, query)
    items = [FollowUpRecordBase.model_validate(r) for r in result.items]
    return ResponseModel(
        data=PageResult(total=result.total, page=result.page, page_size=result.page_size, items=items)
    )


@router.post("/{lease_id}/follow-ups", response_model=ResponseModel[FollowUpRecordBase])
def create_follow_up(
    lease_id: int,
    data: FollowUpRecordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("followup:manage")),
):
    data.lease_id = lease_id
    record = FollowUpService.create(db, data, user_id=current_user.id, created_by=current_user.id)
    return ResponseModel(data=FollowUpRecordBase.model_validate(record))


@router.put("/follow-ups/{record_id}", response_model=ResponseModel[FollowUpRecordBase])
def update_follow_up(
    record_id: int,
    data: FollowUpRecordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("followup:manage")),
):
    record = FollowUpService.update(db, record_id, data, updated_by=current_user.id)
    if not record:
        raise HTTPException(status_code=404, detail="跟进记录不存在")
    return ResponseModel(data=FollowUpRecordBase.model_validate(record))


@router.delete("/follow-ups/{record_id}")
def delete_follow_up(
    record_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("followup:manage")),
):
    if not FollowUpService.delete(db, record_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="跟进记录不存在")
    return ResponseModel(message="删除成功")
