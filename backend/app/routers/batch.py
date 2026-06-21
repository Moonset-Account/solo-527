from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app import schemas, crud, models

router = APIRouter(prefix="/batch", tags=["烘焙批次"])


@router.get("/", response_model=List[schemas.BakingBatch])
def read_batches(
    store_id: Optional[int] = None,
    status: Optional[models.BatchStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if store_id is None and current_user.store_id:
        store_id = current_user.store_id
    filters = {}
    if store_id:
        filters["store_id"] = store_id
    if status:
        filters["status"] = status
    return crud.crud_batch.get_multi(db, skip=skip, limit=limit, filters=filters)


@router.get("/{batch_id}", response_model=schemas.BakingBatch)
def read_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    batch = crud.crud_batch.get(db, id=batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return batch


@router.post("/", response_model=schemas.BakingBatch)
def create_batch(
    batch_in: schemas.BakingBatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if batch_in.baker_id is None and current_user.role in [models.UserRole.BAKER, models.UserRole.STORE_MANAGER]:
        batch_in.baker_id = current_user.id
    if current_user.store_id and not batch_in.store_id:
        batch_in.store_id = current_user.store_id
    return crud.crud_batch.create(db, obj_in=batch_in)


@router.put("/{batch_id}", response_model=schemas.BakingBatch)
def update_batch(
    batch_id: int,
    batch_in: schemas.BakingBatchUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    batch = crud.crud_batch.get(db, id=batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return crud.crud_batch.update(db, db_obj=batch, obj_in=batch_in)


@router.post("/{batch_id}/complete", response_model=schemas.BakingBatch)
def complete_batch(
    batch_id: int,
    actual_quantity: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    batch = crud.crud_batch.get(db, id=batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return crud.crud_batch.complete_batch(db, db_obj=batch, actual_quantity=actual_quantity)


@router.get("/{batch_id}/loss", response_model=List[schemas.LossRecord])
def read_batch_loss(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.crud_loss.get_multi(db, filters={"batch_id": batch_id})


@router.post("/loss", response_model=schemas.LossRecord)
def create_loss(
    loss_in: schemas.LossRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.store_id and not loss_in.store_id:
        loss_in.store_id = current_user.store_id
    loss_in.reported_by = current_user.id
    return crud.crud_loss.create(db, obj_in=loss_in)


@router.get("/loss/", response_model=List[schemas.LossRecord])
def read_loss_records(
    store_id: Optional[int] = None,
    loss_type: Optional[models.LossType] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if store_id is None and current_user.store_id:
        store_id = current_user.store_id
    filters = {}
    if store_id:
        filters["store_id"] = store_id
    if loss_type:
        filters["loss_type"] = loss_type
    return crud.crud_loss.get_multi(db, skip=skip, limit=limit, filters=filters)


@router.get("/loss/{loss_id}", response_model=schemas.LossRecord)
def read_loss(
    loss_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    loss = crud.crud_loss.get(db, id=loss_id)
    if not loss:
        raise HTTPException(status_code=404, detail="报损记录不存在")
    return loss


@router.put("/loss/{loss_id}", response_model=schemas.LossRecord)
def update_loss(
    loss_id: int,
    loss_in: schemas.LossRecordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR, models.UserRole.STORE_MANAGER))
):
    loss = crud.crud_loss.get(db, id=loss_id)
    if not loss:
        raise HTTPException(status_code=404, detail="报损记录不存在")
    return crud.crud_loss.update(db, db_obj=loss, obj_in=loss_in)


@router.post("/loss/{loss_id}/handle", response_model=schemas.LossRecord)
def handle_loss(
    loss_id: int,
    handle_result: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR, models.UserRole.STORE_MANAGER))
):
    loss = crud.crud_loss.get(db, id=loss_id)
    if not loss:
        raise HTTPException(status_code=404, detail="报损记录不存在")
    return crud.crud_loss.handle_loss(db, db_obj=loss, handler_id=current_user.id, handle_result=handle_result)


@router.get("/loss/stats/summary")
def get_loss_stats(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if store_id is None and current_user.store_id:
        store_id = current_user.store_id
    return crud.crud_loss.get_loss_stats(db, store_id=store_id)
