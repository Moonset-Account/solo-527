from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from ...database import get_db
from ...security import get_current_user, RoleChecker
from ... import crud, schemas, models
from ...services import logger, notification_service

router = APIRouter()

allow_admin_member = RoleChecker([models.UserRole.ADMIN, models.UserRole.MEMBER])
allow_admin = RoleChecker([models.UserRole.ADMIN])


@router.get("", response_model=List[schemas.Reagent])
def read_reagents(
    skip: int = 0,
    limit: int = 100,
    keyword: Optional[str] = None,
    category: Optional[models.ReagentCategory] = None,
    hazard_level: Optional[models.HazardLevel] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if keyword:
        reagents = crud.reagent.search(db, keyword=keyword, skip=skip, limit=limit)
    else:
        filters = {}
        if category:
            filters["category"] = category
        if hazard_level:
            filters["hazard_level"] = hazard_level
        filters["is_active"] = True
        reagents = crud.reagent.get_multi_by_filter(db, filters=filters, skip=skip, limit=limit)
    return reagents


@router.post("", response_model=schemas.Reagent, dependencies=[Depends(allow_admin_member)])
def create_reagent(
    request: Request,
    reagent_in: schemas.ReagentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reagent = crud.reagent.create(db, obj_in=reagent_in, created_by=current_user.id)
    logger.info(f"创建试剂: {reagent.name} by {current_user.username}")
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.CREATE,
        resource_type="reagent",
        resource_id=reagent.id,
        details=f"创建试剂 {reagent.name}",
        ip_address=request.client.host if request.client else None
    )
    return reagent


@router.get("/low-stock", response_model=List[schemas.Reagent])
def get_low_stock_reagents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.reagent.get_low_stock(db)


@router.get("/batches")
def read_batches(
    skip: int = 0,
    limit: int = 100,
    in_stock_only: bool = False,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    filters = {}
    if in_stock_only:
        filters["remaining_quantity_gt"] = 0
    batches, total = crud.reagent_batch.get_multi_with_total(db, filters=filters, skip=skip, limit=limit)
    page = (skip // limit) + 1
    total_pages = (total + limit - 1) // limit
    return {
        "items": batches,
        "total": total,
        "page": page,
        "page_size": limit,
        "total_pages": total_pages
    }


@router.get("/batches/expiring-soon", response_model=List[schemas.ReagentBatch])
def get_expiring_soon(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.reagent_batch.get_expiring_soon(db, days=days)


@router.get("/batches/by-barcode/{barcode}", response_model=schemas.ReagentBatch)
def get_batch_by_barcode(
    barcode: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    batch = crud.reagent_batch.get_by_barcode(db, barcode=barcode)
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return batch


@router.put("/batches/{batch_id}", response_model=schemas.ReagentBatch, dependencies=[Depends(allow_admin_member)])
def update_batch(
    request: Request,
    batch_id: int,
    batch_in: schemas.ReagentBatchUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    batch = crud.reagent_batch.get(db, id=batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    batch = crud.reagent_batch.update(db, db_obj=batch, obj_in=batch_in)
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.UPDATE,
        resource_type="reagent_batch",
        resource_id=batch.id,
        details=f"更新批次 {batch.batch_number}",
        ip_address=request.client.host if request.client else None
    )
    return batch


@router.get("/by-barcode/{barcode}", response_model=schemas.Reagent)
def get_reagent_by_barcode(
    barcode: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reagent = crud.reagent.get_by_barcode(db, barcode=barcode)
    if not reagent:
        raise HTTPException(status_code=404, detail="试剂不存在")
    return reagent


@router.get("/{reagent_id}", response_model=schemas.ReagentWithBatches)
def read_reagent(
    reagent_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reagent = crud.reagent.get(db, id=reagent_id)
    if not reagent:
        raise HTTPException(status_code=404, detail="试剂不存在")
    return reagent


@router.put("/{reagent_id}", response_model=schemas.Reagent, dependencies=[Depends(allow_admin_member)])
def update_reagent(
    request: Request,
    reagent_id: int,
    reagent_in: schemas.ReagentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reagent = crud.reagent.get(db, id=reagent_id)
    if not reagent:
        raise HTTPException(status_code=404, detail="试剂不存在")
    reagent = crud.reagent.update(db, db_obj=reagent, obj_in=reagent_in)
    logger.info(f"更新试剂: {reagent.name} by {current_user.username}")
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.UPDATE,
        resource_type="reagent",
        resource_id=reagent.id,
        details=f"更新试剂 {reagent.name}",
        ip_address=request.client.host if request.client else None
    )
    return reagent


@router.delete("/{reagent_id}", dependencies=[Depends(allow_admin)])
def delete_reagent(
    request: Request,
    reagent_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reagent = crud.reagent.get(db, id=reagent_id)
    if not reagent:
        raise HTTPException(status_code=404, detail="试剂不存在")
    
    reagent.is_active = False
    for batch in reagent.batches:
        batch.is_active = False
    db.commit()
    
    logger.info(f"删除试剂: {reagent.name} by {current_user.username}")
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.DELETE,
        resource_type="reagent",
        resource_id=reagent.id,
        details=f"删除试剂 {reagent.name}",
        ip_address=request.client.host if request.client else None
    )
    return {"message": "试剂已删除"}


@router.get("/{reagent_id}/batches", response_model=List[schemas.ReagentBatch])
def get_reagent_batches(
    reagent_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.reagent_batch.get_by_reagent(db, reagent_id=reagent_id)


@router.post("/{reagent_id}/batches", response_model=schemas.ReagentBatch, dependencies=[Depends(allow_admin_member)])
def create_batch(
    request: Request,
    reagent_id: int,
    batch_in: schemas.ReagentBatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    reagent = crud.reagent.get(db, id=reagent_id)
    if not reagent:
        raise HTTPException(status_code=404, detail="试剂不存在")
    
    batch_in.reagent_id = reagent_id
    batch = crud.reagent_batch.create(db, obj_in=batch_in, created_by=current_user.id)
    
    try:
        notification_service.check_low_stock(db)
        notification_service.check_expiry(db)
    except Exception:
        pass
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.CREATE,
        resource_type="reagent_batch",
        resource_id=batch.id,
        details=f"入库批次 {batch.batch_number} for {reagent.name}",
        ip_address=request.client.host if request.client else None
    )
    return batch
