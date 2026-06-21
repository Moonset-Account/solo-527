from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app import schemas, crud, models

router = APIRouter(prefix="/inspection", tags=["巡店管理"])


@router.get("/", response_model=List[schemas.InspectionTask])
def read_inspections(
    store_id: Optional[int] = None,
    supervisor_id: Optional[int] = None,
    status: Optional[models.InspectionStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role == models.UserRole.SUPERVISOR and not supervisor_id:
        supervisor_id = current_user.id
    if current_user.store_id and not store_id and current_user.role != models.UserRole.SUPERVISOR:
        store_id = current_user.store_id

    if supervisor_id:
        return crud.crud_inspection.get_by_supervisor(db, supervisor_id=supervisor_id, status=status, skip=skip, limit=limit)
    if store_id:
        return crud.crud_inspection.get_by_store(db, store_id=store_id, status=status, skip=skip, limit=limit)
    return crud.crud_inspection.get_multi(db, skip=skip, limit=limit)


@router.get("/{inspection_id}", response_model=schemas.InspectionTask)
def read_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    inspection = crud.crud_inspection.get(db, id=inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="巡店任务不存在")
    return inspection


@router.post("/", response_model=schemas.InspectionTask)
def create_inspection(
    inspection_in: schemas.InspectionTaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    if current_user.role == models.UserRole.SUPERVISOR:
        inspection_in.supervisor_id = current_user.id
    return crud.crud_inspection.create(db, obj_in=inspection_in)


@router.put("/{inspection_id}", response_model=schemas.InspectionTask)
def update_inspection(
    inspection_id: int,
    inspection_in: schemas.InspectionTaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    inspection = crud.crud_inspection.get(db, id=inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="巡店任务不存在")
    return crud.crud_inspection.update(db, db_obj=inspection, obj_in=inspection_in)


@router.post("/{inspection_id}/start", response_model=schemas.InspectionTask)
def start_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    inspection = crud.crud_inspection.get(db, id=inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="巡店任务不存在")
    return crud.crud_inspection.start_inspection(db, db_obj=inspection)


@router.post("/{inspection_id}/complete", response_model=schemas.InspectionTask)
def complete_inspection(
    inspection_id: int,
    score: float,
    remark: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    inspection = crud.crud_inspection.get(db, id=inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="巡店任务不存在")
    return crud.crud_inspection.complete_inspection(db, db_obj=inspection, score=score, remark=remark)


@router.get("/{inspection_id}/checks", response_model=List[schemas.InspectionCheckRecord])
def read_check_records(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.crud_inspection.get_check_records(db, inspection_id=inspection_id)


@router.post("/{inspection_id}/checks", response_model=schemas.InspectionCheckRecord)
def add_check_record(
    inspection_id: int,
    check_in: schemas.InspectionCheckRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    check_in.inspection_id = inspection_id
    return crud.crud_inspection.add_check_record(db, inspection_id=inspection_id, obj_in=check_in)


@router.get("/{inspection_id}/rectifications", response_model=List[schemas.RectificationTask])
def read_inspection_rectifications(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.crud_rectification.get_by_inspection(db, inspection_id=inspection_id)
