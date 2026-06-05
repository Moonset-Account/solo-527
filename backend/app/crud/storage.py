from typing import Optional
from sqlalchemy.orm import Session
from ..models.storage import StorageCabinet
from ..schemas.storage import StorageCabinetCreate, StorageCabinetUpdate
from .base import CRUDBase


class CRUDStorageCabinet(CRUDBase[StorageCabinet, StorageCabinetCreate, StorageCabinetUpdate]):
    def get_by_code(self, db: Session, *, code: str) -> Optional[StorageCabinet]:
        return db.query(StorageCabinet).filter(StorageCabinet.code == code).first()

    def get_by_name(self, db: Session, *, name: str) -> Optional[StorageCabinet]:
        return db.query(StorageCabinet).filter(StorageCabinet.name == name).first()


storage_cabinet = CRUDStorageCabinet(StorageCabinet)
