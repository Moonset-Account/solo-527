from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models import InventoryItem, StockAlert, Ingredient, InventoryStatus
from app.schemas import InventoryItemCreate, InventoryItemUpdate, StockAlertCreate, StockAlertUpdate


class CRUDInventory(CRUDBase[InventoryItem, InventoryItemCreate, InventoryItemUpdate]):
    def get_by_ingredient(self, db: Session, *, store_id: int, ingredient_id: int) -> Optional[InventoryItem]:
        return db.query(InventoryItem).filter(
            InventoryItem.store_id == store_id,
            InventoryItem.ingredient_id == ingredient_id
        ).first()

    def get_by_store(self, db: Session, *, store_id: int, skip: int = 0, limit: int = 100, status: Optional[InventoryStatus] = None):
        query = db.query(InventoryItem).filter(InventoryItem.store_id == store_id)
        if status:
            query = query.filter(InventoryItem.status == status)
        return query.order_by(InventoryItem.updated_at.desc()).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: InventoryItemCreate) -> InventoryItem:
        existing = self.get_by_ingredient(db, store_id=obj_in.store_id, ingredient_id=obj_in.ingredient_id)
        if existing:
            return self.update(db, db_obj=existing, obj_in=obj_in)

        obj_in_data = obj_in.model_dump()
        ingredient = db.query(Ingredient).filter(Ingredient.id == obj_in.ingredient_id).first()
        if ingredient:
            obj_in_data.setdefault("min_stock", ingredient.min_stock)

        if obj_in_data["quantity"] <= obj_in_data.get("min_stock", 10):
            obj_in_data["status"] = InventoryStatus.LOW_STOCK if obj_in_data["quantity"] > 0 else InventoryStatus.OUT_OF_STOCK

        db_obj = InventoryItem(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        if db_obj.status in [InventoryStatus.LOW_STOCK, InventoryStatus.OUT_OF_STOCK]:
            self._create_stock_alert(db, db_obj)

        return db_obj

    def update_stock(self, db: Session, *, db_obj: InventoryItem, quantity: float, is_add: bool = False) -> InventoryItem:
        if is_add:
            db_obj.quantity += quantity
            db_obj.last_restocked = datetime.now()
        else:
            db_obj.quantity = max(0, quantity)
        db_obj.last_check = datetime.now()

        if db_obj.quantity <= 0:
            db_obj.status = InventoryStatus.OUT_OF_STOCK
        elif db_obj.quantity <= db_obj.min_stock:
            db_obj.status = InventoryStatus.LOW_STOCK
        else:
            db_obj.status = InventoryStatus.IN_STOCK

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        if db_obj.status in [InventoryStatus.LOW_STOCK, InventoryStatus.OUT_OF_STOCK]:
            existing_alert = db.query(StockAlert).filter(
                StockAlert.inventory_item_id == db_obj.id,
                StockAlert.is_handled == False
            ).first()
            if not existing_alert:
                self._create_stock_alert(db, db_obj)

        return db_obj

    def _create_stock_alert(self, db: Session, inventory_item: InventoryItem) -> StockAlert:
        alert = StockAlert(
            inventory_item_id=inventory_item.id,
            store_id=inventory_item.store_id,
            alert_level="critical" if inventory_item.status == InventoryStatus.OUT_OF_STOCK else "warning",
            current_quantity=inventory_item.quantity,
            min_stock=inventory_item.min_stock
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert

    def get_low_stock_items(self, db: Session, *, store_id: int = None):
        query = db.query(InventoryItem).filter(
            InventoryItem.status.in_([InventoryStatus.LOW_STOCK, InventoryStatus.OUT_OF_STOCK])
        )
        if store_id:
            query = query.filter(InventoryItem.store_id == store_id)
        return query.all()

    def check_and_create_alerts(self, db: Session):
        low_stock_items = self.get_low_stock_items(db)
        alerts_created = []
        for item in low_stock_items:
            existing_alert = db.query(StockAlert).filter(
                StockAlert.inventory_item_id == item.id,
                StockAlert.is_handled == False
            ).first()
            if not existing_alert:
                alert = self._create_stock_alert(db, item)
                alerts_created.append(alert)
        return alerts_created


crud_inventory = CRUDInventory(InventoryItem)


class CRUDStockAlert(CRUDBase[StockAlert, StockAlertCreate, StockAlertUpdate]):
    def get_unhandled(self, db: Session, *, store_id: int = None, skip: int = 0, limit: int = 100):
        query = db.query(StockAlert).filter(StockAlert.is_handled == False)
        if store_id:
            query = query.filter(StockAlert.store_id == store_id)
        return query.order_by(StockAlert.created_at.desc()).offset(skip).limit(limit).all()

    def handle_alert(self, db: Session, *, db_obj: StockAlert, handler_id: int, handle_result: str, remark: str = None) -> StockAlert:
        db_obj.handler_id = handler_id
        db_obj.handle_result = handle_result
        db_obj.remark = remark
        db_obj.is_handled = True
        db_obj.handled_at = datetime.now()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


crud_stock_alert = CRUDStockAlert(StockAlert)
