from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models import Store, Product, Ingredient
from app.schemas import StoreCreate, StoreUpdate, ProductCreate, ProductUpdate, IngredientCreate, IngredientUpdate


class CRUDStore(CRUDBase[Store, StoreCreate, StoreUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Store | None:
        return db.query(Store).filter(Store.name == name).first()

    def get_all_active(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Store).filter(Store.is_active == True).offset(skip).limit(limit).all()


crud_store = CRUDStore(Store)


class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    def get_by_sku(self, db: Session, *, sku: str) -> Product | None:
        return db.query(Product).filter(Product.sku == sku).first()

    def get_by_category(self, db: Session, *, category: str, skip: int = 0, limit: int = 100):
        return db.query(Product).filter(
            Product.category == category,
            Product.is_active == True
        ).offset(skip).limit(limit).all()


crud_product = CRUDProduct(Product)


class CRUDIngredient(CRUDBase[Ingredient, IngredientCreate, IngredientUpdate]):
    def get_by_sku(self, db: Session, *, sku: str) -> Ingredient | None:
        return db.query(Ingredient).filter(Ingredient.sku == sku).first()

    def get_by_category(self, db: Session, *, category: str, skip: int = 0, limit: int = 100):
        return db.query(Ingredient).filter(
            Ingredient.category == category,
            Ingredient.is_active == True
        ).offset(skip).limit(limit).all()


crud_ingredient = CRUDIngredient(Ingredient)
