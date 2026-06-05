from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ...database import get_db
from ...security import get_current_user, RoleChecker
from ... import crud, schemas, models
from ...services import logger

router = APIRouter()

allow_admin_member = RoleChecker([models.UserRole.ADMIN, models.UserRole.MEMBER])
allow_admin = RoleChecker([models.UserRole.ADMIN])


@router.get("", response_model=List[schemas.StorageCabinet])
def read_cabinets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cabinets = crud.storage_cabinet.get_multi_by_filter(
        db, filters={"is_active": True}, skip=skip, limit=limit
    )
    return cabinets


@router.post("", response_model=schemas.StorageCabinet, dependencies=[Depends(allow_admin)])
def create_cabinet(
    request: Request,
    cabinet_in: schemas.StorageCabinetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = crud.storage_cabinet.get_by_code(db, code=cabinet_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="柜位编码已存在"
        )
    cabinet = crud.storage_cabinet.create(db, obj_in=cabinet_in, created_by=current_user.id)
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.CREATE,
        resource_type="storage_cabinet",
        resource_id=cabinet.id,
        details=f"创建柜位 {cabinet.name}",
        ip_address=request.client.host if request.client else None
    )
    return cabinet


@router.get("/{cabinet_id}", response_model=schemas.StorageCabinet)
def read_cabinet(
    cabinet_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cabinet = crud.storage_cabinet.get(db, id=cabinet_id)
    if not cabinet:
        raise HTTPException(status_code=404, detail="柜位不存在")
    return cabinet


@router.get("/{cabinet_id}/batches", response_model=List[schemas.ReagentBatch])
def get_cabinet_batches(
    cabinet_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.reagent_batch.get_by_cabinet(db, cabinet_id=cabinet_id)


@router.put("/{cabinet_id}", response_model=schemas.StorageCabinet, dependencies=[Depends(allow_admin)])
def update_cabinet(
    request: Request,
    cabinet_id: int,
    cabinet_in: schemas.StorageCabinetUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cabinet = crud.storage_cabinet.get(db, id=cabinet_id)
    if not cabinet:
        raise HTTPException(status_code=404, detail="柜位不存在")
    cabinet = crud.storage_cabinet.update(db, db_obj=cabinet, obj_in=cabinet_in)
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.UPDATE,
        resource_type="storage_cabinet",
        resource_id=cabinet.id,
        details=f"更新柜位 {cabinet.name}",
        ip_address=request.client.host if request.client else None
    )
    return cabinet


@router.delete("/{cabinet_id}", dependencies=[Depends(allow_admin)])
def delete_cabinet(
    request: Request,
    cabinet_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cabinet = crud.storage_cabinet.get(db, id=cabinet_id)
    if not cabinet:
        raise HTTPException(status_code=404, detail="柜位不存在")
    
    cabinet.is_active = False
    db.commit()
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.DELETE,
        resource_type="storage_cabinet",
        resource_id=cabinet.id,
        details=f"删除柜位 {cabinet.name}",
        ip_address=request.client.host if request.client else None
    )
    return {"message": "柜位已删除"}
