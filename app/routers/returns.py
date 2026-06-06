from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models, crud
from datetime import datetime

router = APIRouter(prefix="/api/returned-items", tags=["物资回收"])
allow_all_staff = RoleChecker([
    models.UserRole.ADMIN,
    models.UserRole.COORDINATOR,
    models.UserRole.VOLUNTEER
])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])


@router.get("", response_model=List[schemas.ReturnedItemResponse])
def get_returned_items(
    skip: int = 0,
    limit: int = 100,
    box_id: int = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    query = db.query(models.ReturnedItem)
    if box_id:
        query = query.filter(models.ReturnedItem.box_id == box_id)
    return query.order_by(models.ReturnedItem.returned_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=schemas.ReturnedItemResponse, dependencies=[Depends(allow_all_staff)])
def create_returned_item(
    item_in: schemas.ReturnedItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    box = crud.medicine_box.get(db, id=item_in.box_id)
    if not box:
        raise HTTPException(status_code=404, detail="药品箱不存在")
    
    medicine = crud.medicine.get(db, id=item_in.medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="药品不存在")
    
    box_item = db.query(models.MedicineBoxItem).filter(
        models.MedicineBoxItem.box_id == item_in.box_id,
        models.MedicineBoxItem.medicine_id == item_in.medicine_id
    ).first()
    if not box_item:
        raise HTTPException(status_code=400, detail="该药品不在此药品箱中")
    
    available = box_item.packed_quantity - box_item.used_quantity
    if item_in.returned_quantity > available:
        raise HTTPException(status_code=400, detail=f"归还数量超出可用数量，最多可归还 {available}")
    
    db_item = models.ReturnedItem(
        **item_in.model_dump(),
        returned_by=current_user.id
    )
    db.add(db_item)
    
    box_item.returned_quantity += item_in.returned_quantity
    box_item.used_quantity = box_item.packed_quantity - box_item.returned_quantity
    medicine.stock_quantity += item_in.returned_quantity
    
    db.commit()
    db.refresh(db_item)
    return db_item


@router.post("/{item_id}/verify", response_model=schemas.ReturnedItemResponse, dependencies=[Depends(allow_admin_coordinator)])
def verify_returned_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_item = db.query(models.ReturnedItem).filter(models.ReturnedItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="归还记录不存在")
    if db_item.verified_by:
        raise HTTPException(status_code=400, detail="已核验")
    
    db_item.verified_by = current_user.id
    db_item.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return db_item
