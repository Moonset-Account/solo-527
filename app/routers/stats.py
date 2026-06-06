from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models
from datetime import datetime, date

router = APIRouter(tags=["统计与对账"])
allow_admin_finance = RoleChecker([models.UserRole.ADMIN, models.UserRole.FINANCE])
allow_all_staff = RoleChecker([
    models.UserRole.ADMIN,
    models.UserRole.COORDINATOR,
    models.UserRole.DOCTOR,
    models.UserRole.VOLUNTEER,
    models.UserRole.FINANCE
])


@router.get("/api/stats/overview", response_model=schemas.ServiceStatsResponse, dependencies=[Depends(allow_all_staff)])
def get_overview_stats(
    start_date: date = Query(None),
    end_date: date = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Schedule)
    if start_date:
        query = query.filter(models.Schedule.date >= start_date)
    if end_date:
        query = query.filter(models.Schedule.date <= end_date)
    
    schedules = query.all()
    schedule_ids = [s.id for s in schedules]
    
    total_schedules = len(schedules)
    total_doctors = len(set(s.doctor_id for s in schedules))
    
    total_patients = db.query(models.Registration).filter(
        models.Registration.schedule_id.in_(schedule_ids) if schedule_ids else True,
        models.Registration.status == models.RegistrationStatus.SERVICED
    ).count()
    
    total_volunteers = db.query(models.ScheduleVolunteer).filter(
        models.ScheduleVolunteer.schedule_id.in_(schedule_ids) if schedule_ids else True
    ).count()
    
    total_service_hours = 0.0
    for s in schedules:
        try:
            start_h, start_m = map(int, s.start_time.split(':'))
            end_h, end_m = map(int, s.end_time.split(':'))
            hours = (end_h * 60 + end_m - start_h * 60 - start_m) / 60.0
            total_service_hours += max(0, hours)
        except:
            pass
    
    total_medicines_used = 0
    box_items = db.query(models.MedicineBoxItem).filter(
        models.MedicineBoxItem.box_id.in_(
            db.query(models.MedicineBox.id).filter(models.MedicineBox.schedule_id.in_(schedule_ids))
        ) if schedule_ids else True
    ).all()
    for item in box_items:
        total_medicines_used += item.used_quantity
    
    schedules_by_month = {}
    for s in schedules:
        month_key = s.date.strftime("%Y-%m")
        schedules_by_month[month_key] = schedules_by_month.get(month_key, 0) + 1
    
    patients_by_location = {}
    for s in schedules:
        loc_name = s.location.name if s.location else "未知"
        count = db.query(models.Registration).filter(
            models.Registration.schedule_id == s.id,
            models.Registration.status == models.RegistrationStatus.SERVICED
        ).count()
        patients_by_location[loc_name] = patients_by_location.get(loc_name, 0) + count
    
    return schemas.ServiceStatsResponse(
        total_schedules=total_schedules,
        total_patients=total_patients,
        total_doctors=total_doctors,
        total_volunteers=total_volunteers,
        total_medicines_used=total_medicines_used,
        total_service_hours=round(total_service_hours, 2),
        schedules_by_month=schedules_by_month,
        patients_by_location=patients_by_location
    )


@router.get("/api/reconciliations", response_model=List[schemas.MonthlyReconciliationResponse], dependencies=[Depends(allow_admin_finance)])
def get_reconciliations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return db.query(models.MonthlyReconciliation).order_by(
        models.MonthlyReconciliation.month.desc()
    ).offset(skip).limit(limit).all()


@router.post("/api/reconciliations", response_model=schemas.MonthlyReconciliationResponse, dependencies=[Depends(allow_admin_finance)])
def create_reconciliation(
    month: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.MonthlyReconciliation).filter(
        models.MonthlyReconciliation.month == month
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该月对账已存在")
    
    year, mon = map(int, month.split('-'))
    start_date = date(year, mon, 1)
    if mon == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, mon + 1, 1)
    
    schedules = db.query(models.Schedule).filter(
        models.Schedule.date >= start_date,
        models.Schedule.date < end_date,
        models.Schedule.status == models.ScheduleStatus.COMPLETED
    ).all()
    
    schedule_ids = [s.id for s in schedules]
    total_schedules = len(schedules)
    
    total_patients = db.query(models.Registration).filter(
        models.Registration.schedule_id.in_(schedule_ids) if schedule_ids else False,
        models.Registration.status == models.RegistrationStatus.SERVICED
    ).count()
    
    total_medicines_used = 0
    total_medicines_returned = 0
    box_items = db.query(models.MedicineBoxItem).filter(
        models.MedicineBoxItem.box_id.in_(
            db.query(models.MedicineBox.id).filter(models.MedicineBox.schedule_id.in_(schedule_ids))
        ) if schedule_ids else False
    ).all()
    for item in box_items:
        total_medicines_used += item.used_quantity
        total_medicines_returned += item.returned_quantity
    
    total_service_hours = 0.0
    for s in schedules:
        try:
            start_h, start_m = map(int, s.start_time.split(':'))
            end_h, end_m = map(int, s.end_time.split(':'))
            hours = (end_h * 60 + end_m - start_h * 60 - start_m) / 60.0
            total_service_hours += max(0, hours)
        except:
            pass
    
    recon = models.MonthlyReconciliation(
        month=month,
        total_schedules=total_schedules,
        total_patients=total_patients,
        total_medicines_used=total_medicines_used,
        total_medicines_returned=total_medicines_returned,
        total_service_hours=round(total_service_hours, 2),
        created_by=current_user.id
    )
    db.add(recon)
    db.commit()
    db.refresh(recon)
    return recon


@router.post("/api/reconciliations/{recon_id}/verify", response_model=schemas.MonthlyReconciliationResponse, dependencies=[Depends(allow_admin_finance)])
def verify_reconciliation(
    recon_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    recon = db.query(models.MonthlyReconciliation).filter(models.MonthlyReconciliation.id == recon_id).first()
    if not recon:
        raise HTTPException(status_code=404, detail="对账记录不存在")
    recon.status = "verified"
    recon.verified_by = current_user.id
    recon.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(recon)
    return recon
