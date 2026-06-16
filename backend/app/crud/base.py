from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Type, TypeVar, Generic, Any
from sqlalchemy import func, and_, or_, desc, asc

ModelType = TypeVar("ModelType")


class CRUDBase(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: int, includes: Optional[List[str]] = None) -> Optional[ModelType]:
        query = db.query(self.model)
        if includes:
            for inc in includes:
                if hasattr(self.model, inc):
                    query = query.options(joinedload(getattr(self.model, inc)))
        return query.filter(self.model.id == id).first()

    def get_multi(
        self,
        db: Session,
        *,
        page: int = 1,
        page_size: int = 20,
        keyword: Optional[str] = None,
        keyword_fields: Optional[List[str]] = None,
        filters: Optional[dict] = None,
        order_by: Optional[str] = None,
        order_dir: str = "desc",
        includes: Optional[List[str]] = None
    ):
        query = db.query(self.model)
        if includes:
            for inc in includes:
                if hasattr(self.model, inc):
                    query = query.options(joinedload(getattr(self.model, inc)))
        if filters:
            for key, value in filters.items():
                if value is not None and hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)
        if keyword and keyword_fields:
            or_conditions = []
            for field in keyword_fields:
                if hasattr(self.model, field):
                    or_conditions.append(getattr(self.model, field).ilike(f"%{keyword}%"))
            if or_conditions:
                query = query.filter(or_(*or_conditions))
        total = query.count()
        if order_by and hasattr(self.model, order_by):
            order_func = desc if order_dir == "desc" else asc
            query = query.order_by(order_func(getattr(self.model, order_by)))
        else:
            query = query.order_by(desc(self.model.id))
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def create(self, db: Session, obj_in: dict) -> ModelType:
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: ModelType, obj_in: dict) -> ModelType:
        for field, value in obj_in.items():
            if value is not None:
                setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id: int) -> ModelType:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj
