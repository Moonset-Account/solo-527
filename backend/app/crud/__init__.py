from app.crud.base import CRUDBase
from app.crud.crud_user import crud_user
from app.crud.crud_master import crud_store, crud_product, crud_ingredient
from app.crud.crud_batch import crud_batch, CRUDLossRecord
from app.crud.crud_inventory import crud_inventory, crud_stock_alert
from app.crud.crud_inspection import crud_inspection, crud_rectification
from app.crud.crud_finance import crud_cash_flow, crud_labor, crud_setting
from app.models import LossRecord
from app.schemas import LossRecordCreate, LossRecordUpdate

crud_loss = CRUDLossRecord(LossRecord, LossRecordCreate, LossRecordUpdate)

__all__ = [
    "CRUDBase",
    "crud_user",
    "crud_store",
    "crud_product",
    "crud_ingredient",
    "crud_batch",
    "crud_loss",
    "crud_inventory",
    "crud_stock_alert",
    "crud_inspection",
    "crud_rectification",
    "crud_cash_flow",
    "crud_labor",
    "crud_setting",
]
