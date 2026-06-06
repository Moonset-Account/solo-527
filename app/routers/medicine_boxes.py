from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models, crud
from app.models import MedicineBoxStatus, MedicineBoxItem

router = APIRouter(prefix="/api/medicine-boxes", tags=["药品箱管理"])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])
allow_all_staff = RoleChecker([
    models.UserRole.ADMIN,
    models.UserRole.COORDINATOR,
    models.UserRole.DOCTOR,
    models.UserRole.VOLUNTEER
])


@router.get("", response_model=List[schemas.MedicineBoxResponse])
def get_medicine_boxes(
    skip: int = 0,
    limit: int = 100,
    status: MedicineBoxStatus = None,
    schedule_id: int = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    query = db.query(models.MedicineBox)
    if status:
        query = query.filter(models.MedicineBox.status == status)
    if schedule_id:
        query = query.filter(models.MedicineBox.schedule_id == schedule_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{box_id}", response_model=schemas.MedicineBoxResponse)
def get_medicine_box(box_id: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    db_box = crud.medicine_box.get(db, id=box_id)
    if db_box is None:
        raise HTTPException(status_code=404, detail="药品箱不存在")
    return db_box


@router.post("", response_model=schemas.MedicineBoxResponse, dependencies=[Depends(allow_admin_coordinator)])
def create_medicine_box(box_in: schemas.MedicineBoxCreate, db: Session = Depends(get_db)):
    existing = crud.medicine_box.get_by_code(db, box_code=box_in.box_code)
    if existing:
        raise HTTPException(status_code=400, detail="药品箱编号已存在")
    
    box_data = box_in.model_dump(exclude={"items"})
    db_box = models.MedicineBox(**box_data)
    db.add(db_box)
    db.flush()

    for item_in in box_in.items:
        medicine = crud.medicine.get(db, id=item_in.medicine_id)
        if not medicine:
            raise HTTPException(status_code=400, detail=f"药品ID {item_in.medicine_id} 不存在")
        if medicine.stock_quantity < item_in.packed_quantity:
            raise HTTPException(status_code=400, detail=f"药品 {medicine.name} 库存不足")
        
        item = MedicineBoxItem(
            box_id=db_box.id,
            medicine_id=item_in.medicine_id,
            packed_quantity=item_in.packed_quantity
        )
        db.add(item)
        medicine.stock_quantity -= item_in.packed_quantity

    db_box.status = MedicineBoxStatus.PACKED
    db.commit()
    db.refresh(db_box)
    return db_box


@router.post("/{box_id}/assign/{schedule_id}", response_model=schemas.MedicineBoxResponse, dependencies=[Depends(allow_admin_coordinator)])
def assign_box_to_schedule(box_id: int, schedule_id: int, db: Session = Depends(get_db)):
    db_box = crud.medicine_box.get(db, id=box_id)
    if db_box is None:
        raise HTTPException(status_code=404, detail="药品箱不存在")
    db_schedule = crud.schedule.get(db, id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="排班不存在")
    
    db_box.schedule_id = schedule_id
    db_box.status = MedicineBoxStatus.IN_USE
    db.commit()
    db.refresh(db_box)
    return db_box


@router.post("/{box_id}/return", response_model=schemas.MedicineBoxResponse, dependencies=[Depends(allow_all_staff)])
def return_box(box_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    from datetime import datetime
    db_box = crud.medicine_box.get(db, id=box_id)
    if db_box is None:
        raise HTTPException(status_code=404, detail="药品箱不存在")
    if db_box.status != MedicineBoxStatus.IN_USE:
        raise HTTPException(status_code=400, detail="药品箱未在使用中")
    
    db_box.status = MedicineBoxStatus.RETURNED
    db_box.last_checked_by = current_user.id
    db_box.last_checked_at = datetime.utcnow()
    db.commit()
    db.refresh(db_box)
    return db_box


@router.put("/{box_id}", response_model=schemas.MedicineBoxResponse, dependencies=[Depends(allow_admin_coordinator)])
def update_medicine_box(box_id: int, box_in: schemas.MedicineBoxUpdate, db: Session = Depends(get_db)):
    db_box = crud.medicine_box.get(db, id=box_id)
    if db_box is None:
        raise HTTPException(status_code=404, detail="药品箱不存在")
    return crud.medicine_box.update(db, db_obj=db_box, obj_in=box_in)


@router.delete("/{box_id}", dependencies=[Depends(allow_admin_coordinator)])
def delete_medicine_box(box_id: int, db: Session = Depends(get_db)):
    db_box = crud.medicine_box.get(db, id=box_id)
    if db_box is None:
        raise HTTPException(status_code=404, detail="药品箱不存在")
    crud.medicine_box.remove(db, id=box_id)
    return {"message": "药品箱已删除"}
