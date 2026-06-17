from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/machine-reservations", tags=["农机预约"])


@router.get("", response_model=List[schemas.MachineReservation])
def get_machine_reservations(
    status: Optional[str] = None,
    machine_type: Optional[str] = None,
    keyword: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(models.MachineReservation)
    if status:
        query = query.filter(models.MachineReservation.status == status)
    if machine_type:
        query = query.filter(models.MachineReservation.machine_type == machine_type)
    if keyword:
        query = query.filter(
            models.MachineReservation.reservation_no.contains(keyword)
            | models.MachineReservation.machine_name.contains(keyword)
        )
    if start_date:
        query = query.filter(models.MachineReservation.start_time >= start_date)
    if end_date:
        query = query.filter(models.MachineReservation.end_time <= end_date)
    return query.order_by(models.MachineReservation.id.desc()).offset(skip).limit(limit).all()


@router.get("/{reservation_id}", response_model=schemas.MachineReservation)
def get_machine_reservation(reservation_id: int, db: Session = Depends(get_db)):
    reservation = (
        db.query(models.MachineReservation)
        .filter(models.MachineReservation.id == reservation_id)
        .first()
    )
    if not reservation:
        raise HTTPException(status_code=404, detail="农机预约不存在")
    return reservation


@router.post("", response_model=schemas.MachineReservation)
def create_machine_reservation(
    reservation: schemas.MachineReservationCreate, db: Session = Depends(get_db)
):
    existing = (
        db.query(models.MachineReservation)
        .filter(models.MachineReservation.reservation_no == reservation.reservation_no)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="预约编号已存在")
    db_reservation = models.MachineReservation(**reservation.model_dump())
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)
    return db_reservation


@router.put("/{reservation_id}", response_model=schemas.MachineReservation)
def update_machine_reservation(
    reservation_id: int,
    reservation_update: schemas.MachineReservationUpdate,
    db: Session = Depends(get_db),
):
    reservation = (
        db.query(models.MachineReservation)
        .filter(models.MachineReservation.id == reservation_id)
        .first()
    )
    if not reservation:
        raise HTTPException(status_code=404, detail="农机预约不存在")
    update_data = reservation_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(reservation, key, value)
    db.commit()
    db.refresh(reservation)
    return reservation


@router.delete("/{reservation_id}")
def delete_machine_reservation(reservation_id: int, db: Session = Depends(get_db)):
    reservation = (
        db.query(models.MachineReservation)
        .filter(models.MachineReservation.id == reservation_id)
        .first()
    )
    if not reservation:
        raise HTTPException(status_code=404, detail="农机预约不存在")
    db.delete(reservation)
    db.commit()
    return {"message": "删除成功"}
