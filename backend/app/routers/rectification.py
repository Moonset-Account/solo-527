from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app import schemas, crud, models

router = APIRouter(prefix="/rectification", tags=["整改管理"])


@router.get("/", response_model=List[schemas.RectificationTask])
def read_rectifications(
    store_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    status: Optional[models.RectificationStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role in [models.UserRole.STORE_MANAGER, models.UserRole.BAKER, models.UserRole.CASHIER]:
        assignee_id = current_user.id
    if current_user.store_id and not store_id and assignee_id is None:
        store_id = current_user.store_id

    if assignee_id:
        return crud.crud_rectification.get_by_assignee(db, assignee_id=assignee_id, status=status, skip=skip, limit=limit)
    if store_id:
        return crud.crud_rectification.get_by_store(db, store_id=store_id, status=status, skip=skip, limit=limit)
    return crud.crud_rectification.get_multi(db, skip=skip, limit=limit)


@router.get("/{rectification_id}", response_model=schemas.RectificationTask)
def read_rectification(
    rectification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    rectification = crud.crud_rectification.get(db, id=rectification_id)
    if not rectification:
        raise HTTPException(status_code=404, detail="整改任务不存在")
    return rectification


@router.post("/", response_model=schemas.RectificationTask)
def create_rectification(
    rectification_in: schemas.RectificationTaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    if current_user.role == models.UserRole.SUPERVISOR:
        rectification_in.supervisor_id = current_user.id
    return crud.crud_rectification.create(db, obj_in=rectification_in)


@router.put("/{rectification_id}", response_model=schemas.RectificationTask)
def update_rectification(
    rectification_id: int,
    rectification_in: schemas.RectificationTaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    rectification = crud.crud_rectification.get(db, id=rectification_id)
    if not rectification:
        raise HTTPException(status_code=404, detail="整改任务不存在")
    return crud.crud_rectification.update(db, db_obj=rectification, obj_in=rectification_in)


@router.post("/{rectification_id}/start", response_model=schemas.RectificationTask)
def start_rectification(
    rectification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    rectification = crud.crud_rectification.get(db, id=rectification_id)
    if not rectification:
        raise HTTPException(status_code=404, detail="整改任务不存在")
    if rectification.assignee_id and rectification.assignee_id != current_user.id and current_user.role not in [models.UserRole.ADMIN, models.UserRole.SUPERVISOR]:
        raise HTTPException(status_code=403, detail="无权操作此整改任务")
    return crud.crud_rectification.start_rectification(db, db_obj=rectification)


@router.post("/{rectification_id}/submit", response_model=schemas.RectificationTask)
def submit_rectification(
    rectification_id: int,
    result: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    rectification = crud.crud_rectification.get(db, id=rectification_id)
    if not rectification:
        raise HTTPException(status_code=404, detail="整改任务不存在")
    if rectification.assignee_id != current_user.id and current_user.role not in [models.UserRole.ADMIN, models.UserRole.SUPERVISOR]:
        raise HTTPException(status_code=403, detail="无权提交此整改任务")
    return crud.crud_rectification.submit_rectification(db, db_obj=rectification, result=result)


@router.post("/{rectification_id}/reinspect", response_model=schemas.RectificationTask)
def reinspect_rectification(
    rectification_id: int,
    result: str,
    is_pass: bool,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    rectification = crud.crud_rectification.get(db, id=rectification_id)
    if not rectification:
        raise HTTPException(status_code=404, detail="整改任务不存在")
    return crud.crud_rectification.re_inspect(db, db_obj=rectification, result=result, is_pass=is_pass)
