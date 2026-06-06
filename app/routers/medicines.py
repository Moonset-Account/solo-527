from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models, crud

router = APIRouter(prefix="/api/medicines", tags=["药品管理"])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])
allow_all_roles = RoleChecker([
    models.UserRole.ADMIN,
    models.UserRole.COORDINATOR,
    models.UserRole.DOCTOR,
    models.UserRole.VOLUNTEER,
    models.UserRole.FINANCE
])


@router.get("", response_model=List[schemas.MedicineResponse])
def get_medicines(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    low_stock: bool = False,
    search: str = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    if search:
        return crud.medicine.search(db, keyword=search)
    if low_stock:
        return crud.medicine.get_low_stock(db)
    if active_only:
        return crud.medicine.get_active(db)
    return crud.medicine.get_multi(db, skip=skip, limit=limit)


@router.get("/{medicine_id}", response_model=schemas.MedicineResponse)
def get_medicine(medicine_id: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    db_medicine = crud.medicine.get(db, id=medicine_id)
    if db_medicine is None:
        raise HTTPException(status_code=404, detail="药品不存在")
    return db_medicine


@router.post("", response_model=schemas.MedicineResponse, dependencies=[Depends(allow_admin_coordinator)])
def create_medicine(medicine_in: schemas.MedicineCreate, db: Session = Depends(get_db)):
    return crud.medicine.create(db, obj_in=medicine_in)


@router.put("/{medicine_id}", response_model=schemas.MedicineResponse, dependencies=[Depends(allow_admin_coordinator)])
def update_medicine(medicine_id: int, medicine_in: schemas.MedicineUpdate, db: Session = Depends(get_db)):
    db_medicine = crud.medicine.get(db, id=medicine_id)
    if db_medicine is None:
        raise HTTPException(status_code=404, detail="药品不存在")
    return crud.medicine.update(db, db_obj=db_medicine, obj_in=medicine_in)


@router.delete("/{medicine_id}", dependencies=[Depends(allow_admin_coordinator)])
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)):
    db_medicine = crud.medicine.get(db, id=medicine_id)
    if db_medicine is None:
        raise HTTPException(status_code=404, detail="药品不存在")
    crud.medicine.remove(db, id=medicine_id)
    return {"message": "药品已删除"}


@router.post("/{medicine_id}/adjust-stock", response_model=schemas.MedicineResponse, dependencies=[Depends(allow_admin_coordinator)])
def adjust_stock(medicine_id: int, quantity_change: int, db: Session = Depends(get_db)):
    db_medicine = crud.medicine.update_stock(db, medicine_id=medicine_id, quantity_change=quantity_change)
    if db_medicine is None:
        raise HTTPException(status_code=404, detail="药品不存在")
    return db_medicine
