from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app import schemas, crud, models

router = APIRouter(prefix="/finance", tags=["财务管理"])


@router.get("/cash-flow", response_model=List[schemas.CashFlow])
def read_cash_flows(
    store_id: Optional[int] = None,
    flow_type: Optional[models.CashFlowType] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if store_id is None and current_user.store_id:
        store_id = current_user.store_id
    return crud.crud_cash_flow.get_by_store(
        db, store_id=store_id, flow_type=flow_type,
        start_date=start_date, end_date=end_date,
        skip=skip, limit=limit
    )


@router.get("/cash-flow/summary")
def get_cash_flow_summary(
    store_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if store_id is None and current_user.store_id:
        store_id = current_user.store_id
    return crud.crud_cash_flow.get_summary(db, store_id=store_id, start_date=start_date, end_date=end_date)


@router.post("/cash-flow", response_model=schemas.CashFlow)
def create_cash_flow(
    cash_flow_in: schemas.CashFlowCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR, models.UserRole.STORE_MANAGER, models.UserRole.CASHIER))
):
    if current_user.store_id and not cash_flow_in.store_id:
        cash_flow_in.store_id = current_user.store_id
    if cash_flow_in.operator_id is None:
        cash_flow_in.operator_id = current_user.id
    return crud.crud_cash_flow.create(db, obj_in=cash_flow_in)


@router.get("/labor", response_model=List[schemas.LaborRecord])
def read_labor_records(
    store_id: Optional[int] = None,
    user_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if store_id is None and current_user.store_id:
        store_id = current_user.store_id
    if current_user.role in [models.UserRole.BAKER, models.UserRole.CASHIER]:
        user_id = current_user.id

    if user_id:
        return crud.crud_labor.get_by_user(db, user_id=user_id, start_date=start_date, end_date=end_date)
    return crud.crud_labor.get_by_store(db, store_id=store_id, start_date=start_date, end_date=end_date)


@router.get("/labor/stats")
def get_labor_stats(
    store_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if store_id is None and current_user.store_id:
        store_id = current_user.store_id
    return crud.crud_labor.get_stats(db, store_id=store_id, start_date=start_date, end_date=end_date)


@router.post("/labor", response_model=schemas.LaborRecord)
def create_labor_record(
    labor_in: schemas.LaborRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR, models.UserRole.STORE_MANAGER))
):
    if current_user.store_id and not labor_in.store_id:
        labor_in.store_id = current_user.store_id
    return crud.crud_labor.create(db, obj_in=labor_in)


@router.put("/labor/{record_id}", response_model=schemas.LaborRecord)
def update_labor_record(
    record_id: int,
    labor_in: schemas.LaborRecordUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR, models.UserRole.STORE_MANAGER))
):
    record = crud.crud_labor.get(db, id=record_id)
    if not record:
        raise HTTPException(status_code=404, detail="工时记录不存在")
    return crud.crud_labor.update(db, db_obj=record, obj_in=labor_in)
