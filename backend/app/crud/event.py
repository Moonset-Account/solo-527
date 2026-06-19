from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate


class CRUDEvent(CRUDBase[Event, EventCreate, EventUpdate]):
    def get_active_events(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Event]:
        return db.query(Event).filter(Event.is_active == True).offset(skip).limit(limit).all()

    def get_by_name(self, db: Session, *, name: str) -> Optional[Event]:
        return db.query(Event).filter(Event.name == name).first()


crud_event = CRUDEvent(Event)
