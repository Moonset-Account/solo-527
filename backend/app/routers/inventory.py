from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app import schemas, crud, models

router = APIRouter(prefix="/inventory", tags=["库存管理"])


@router.get("/", response_model=List[schemas.InventoryItem])
def read_inventory(
    store_id: Optional[int] = None,
    status: Optional[models.InventoryStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if store_id is None and current_user.store_id:
        store_id = current_user.store_id
    if store_id:
        return crud.crud_inventory.get_by_store(db, store_id=store_id, status=status, skip=skip, limit=limit)
    return crud.crud_inventory.get_multi(db, skip=skip, limit=limit)


@router.get("/low-stock", response_model=List[schemas.InventoryItem])
def read_low_stock(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if store_id is None and current_user.store_id:
        store_id = current_user.store_id
    return crud.crud_inventory.get_low_stock_items(db, store_id=store_id)


@router.get("/{item_id}", response_model=schemas.InventoryItem)
def read_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    item = crud.crud_inventory.get(db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="库存记录不存在")
    return item


@router.post("/", response_model=schemas.InventoryItem)
def create_inventory(
    inventory_in: schemas.InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR, models.UserRole.STORE_MANAGER))
):
    if current_user.store_id and not inventory_in.store_id:
        inventory_in.store_id = current_user.store_id
    return crud.crud_inventory.create(db, obj_in=inventory_in)


@router.put("/{item_id}", response_model=schemas.InventoryItem)
def update_inventory(
    item_id: int,
    inventory_in: schemas.InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR, models.UserRole.STORE_MANAGER))
):
    item = crud.crud_inventory.get(db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="库存记录不存在")
    return crud.crud_inventory.update(db, db_obj=item, obj_in=inventory_in)


@router.post("/{item_id}/stock-in", response_model=schemas.InventoryItem)
def stock_in(
    item_id: int,
    quantity: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR, models.UserRole.STORE_MANAGER))
):
    item = crud.crud_inventory.get(db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="库存记录不存在")
    return crud.crud_inventory.update_stock(db, db_obj=item, quantity=quantity, is_add=True)


@router.post("/{item_id}/stock-out", response_model=schemas.InventoryItem)
def stock_out(
    item_id: int,
    quantity: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR, models.UserRole.STORE_MANAGER, models.UserRole.BAKER))
):
    item = crud.crud_inventory.get(db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="库存记录不存在")
    if item.quantity < quantity:
        raise HTTPException(status_code=400, detail="库存不足")
    new_quantity = item.quantity - quantity
    return crud.crud_inventory.update_stock(db, db_obj=item, quantity=new_quantity, is_add=False)


@router.get("/alerts/", response_model=List[schemas.StockAlert])
def read_alerts(
    store_id: Optional[int] = None,
    unhandled_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if store_id is None and current_user.store_id:
        store_id = current_user.store_id
    if unhandled_only:
        return crud.crud_stock_alert.get_unhandled(db, store_id=store_id, skip=skip, limit=limit)
    filters = {}
    if store_id:
        filters["store_id"] = store_id
    return crud.crud_stock_alert.get_multi(db, skip=skip, limit=limit, filters=filters)


@router.put("/alerts/{alert_id}/handle", response_model=schemas.StockAlert)
def handle_alert(
    alert_id: int,
    handle_result: str,
    remark: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR, models.UserRole.STORE_MANAGER))
):
    alert = crud.crud_stock_alert.get(db, id=alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="预警不存在")
    return crud.crud_stock_alert.handle_alert(
        db, db_obj=alert, handler_id=current_user.id, handle_result=handle_result, remark=remark
    )


@router.post("/check-alerts")
def check_and_create_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    alerts = crud.crud_inventory.check_and_create_alerts(db)
    return {"created": len(alerts), "alerts": alerts}
