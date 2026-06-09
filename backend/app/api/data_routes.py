from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.data import (
    DepartmentCreate, DepartmentResponse, DepartmentUpdate,
    TimeSlotCreate, TimeSlotResponse, TimeSlotUpdate,
    AppointmentCreate, AppointmentResponse, AppointmentUpdate,
    AppointmentImportResponse
)
from app.services.data_import_service import DataImportService
from app.models.user import User

router = APIRouter(prefix="/data", tags=["数据管理"])


@router.post("/departments/import", response_model=dict)
async def import_departments(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin", "operator"])),
):
    content = await file.read()
    try:
        success, failed, errors = DataImportService.import_departments(db, content, file.filename)
        return {"success": success, "failed": failed, "errors": errors[:50]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/departments", response_model=list[DepartmentResponse])
def list_departments(
    skip: int = 0, limit: int = 100, is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return DataImportService.list_departments(db, skip=skip, limit=limit, is_active=is_active)


@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin"])),
):
    return DataImportService.create_department(db, data)


@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int, data: DepartmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin"])),
):
    dept = DataImportService.get_department(db, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="科室不存在")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dept, field, value)
    db.commit()
    db.refresh(dept)
    return dept


@router.post("/time-slots/import", response_model=dict)
async def import_time_slots(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin", "operator"])),
):
    content = await file.read()
    try:
        success, failed, errors = DataImportService.import_time_slots(db, content, file.filename)
        return {"success": success, "failed": failed, "errors": errors[:50]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/time-slots", response_model=TimeSlotResponse)
def create_time_slot(
    data: TimeSlotCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin"])),
):
    return DataImportService.create_time_slot(db, data)


@router.post("/appointments/import", response_model=AppointmentImportResponse)
async def import_appointments(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin", "operator"])),
):
    content = await file.read()
    try:
        return DataImportService.import_appointments(db, content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/appointments", response_model=list[AppointmentResponse])
def list_appointments(
    skip: int = 0, limit: int = 100,
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    batch_id: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return DataImportService.list_appointments(
        db, skip=skip, limit=limit, department_id=department_id,
        status=status, date_from=date_from, date_to=date_to, batch_id=batch_id
    )


@router.post("/appointments", response_model=AppointmentResponse)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin", "operator"])),
):
    return DataImportService.create_appointment(db, data)


@router.get("/appointments/{appt_id}", response_model=AppointmentResponse)
def get_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    appt = DataImportService.get_appointment(db, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="预约记录不存在")
    return appt


@router.put("/appointments/{appt_id}", response_model=AppointmentResponse)
def update_appointment(
    appt_id: int, data: AppointmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin", "operator"])),
):
    appt = DataImportService.get_appointment(db, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="预约记录不存在")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appt, field, value)
    db.commit()
    db.refresh(appt)
    return appt
