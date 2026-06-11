from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import Optional, List
from app.repositories.base import BaseRepository
from app.models import Supplier
from app.schemas import SupplierCreate, SupplierUpdate


class SupplierRepository(BaseRepository[Supplier, SupplierCreate, SupplierUpdate]):
    def __init__(self):
        super().__init__(Supplier)

    def get_by_name(self, db: Session, name: str) -> Optional[Supplier]:
        return db.query(Supplier).filter(Supplier.name == name).first()

    def search(
        self, db: Session, keyword: str, page: int = 1, page_size: int = 20
    ) -> tuple[List[Supplier], int]:
        query = db.query(Supplier).filter(
            or_(
                Supplier.name.ilike(f"%{keyword}%"),
                Supplier.contact_person.ilike(f"%{keyword}%"),
                Supplier.contact_phone.ilike(f"%{keyword}%")
            )
        )
        total = query.count()
        items = query.order_by(desc(Supplier.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_by_status(
        self, db: Session, status: str, page: int = 1, page_size: int = 20
    ) -> tuple[List[Supplier], int]:
        query = db.query(Supplier).filter(Supplier.status == status)
        total = query.count()
        items = query.order_by(desc(Supplier.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_approved(self, db: Session, skip: int = 0, limit: int = 100) -> List[Supplier]:
        return db.query(Supplier).filter(Supplier.status == "approved").offset(skip).limit(limit).all()
