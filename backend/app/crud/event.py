from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate


class CRUDEvent(CRUDBase[Event, EventCreate, EventUpdate]):
    def get_active_events(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Event]:
        return db.query(Event).filter(Event.is_active == True).offset(skip).limit(limit).all()

    def get_by_name(self, db: Session, *, name: str) -> Optional[Event]:
        return db.query(Event).filter(Event.name == name).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100,
        is_active: Optional[bool] = None,
    ) -> Tuple[List[Event], int]:
        query = db.query(Event)
        if is_active is not None:
            query = query.filter(Event.is_active == is_active)
        total = query.count()
        items = query.order_by(Event.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def count(self, db: Session, *, is_active: Optional[bool] = None) -> int:
        query = db.query(Event)
        if is_active is not None:
            query = query.filter(Event.is_active == is_active)
        return query.count()


crud_event = CRUDEvent(Event)
