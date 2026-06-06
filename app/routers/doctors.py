from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models, crud

router = APIRouter(prefix="/api/doctors", tags=["医生管理"])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])


@router.get("", response_model=List[schemas.DoctorResponse])
def get_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    return crud.doctor.get_multi(db, skip=skip, limit=limit)


@router.get("/available", response_model=List[schemas.DoctorResponse])
def get_available_doctors(db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    return crud.doctor.get_available(db)


@router.get("/{doctor_id}", response_model=schemas.DoctorResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    db_doctor = crud.doctor.get(db, id=doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="医生不存在")
    return db_doctor


@router.post("", response_model=schemas.DoctorResponse, dependencies=[Depends(allow_admin_coordinator)])
def create_doctor(doctor_in: schemas.DoctorCreate, db: Session = Depends(get_db)):
    return crud.doctor.create(db, obj_in=doctor_in)


@router.put("/{doctor_id}", response_model=schemas.DoctorResponse, dependencies=[Depends(allow_admin_coordinator)])
def update_doctor(doctor_id: int, doctor_in: schemas.DoctorUpdate, db: Session = Depends(get_db)):
    db_doctor = crud.doctor.get(db, id=doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="医生不存在")
    return crud.doctor.update(db, db_obj=db_doctor, obj_in=doctor_in)


@router.delete("/{doctor_id}", dependencies=[Depends(allow_admin_coordinator)])
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    db_doctor = crud.doctor.get(db, id=doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="医生不存在")
    crud.doctor.remove(db, id=doctor_id)
    return {"message": "医生已删除"}
