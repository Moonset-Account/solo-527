from typing import Optional
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.lease import Property, Owner, Tenant
from app.schemas.lease import (
    PropertyCreate, PropertyUpdate, PropertyQuery,
    OwnerCreate, OwnerUpdate, OwnerQuery,
    TenantCreate, TenantUpdate, TenantQuery,
)
from app.schemas.common import PageResult


class PropertyService:
    @staticmethod
    def get(db: Session, property_id: int) -> Optional[Property]:
        return db.query(Property).filter(Property.id == property_id, Property.is_deleted == False).first()

    @staticmethod
    def list(db: Session, query: PropertyQuery) -> PageResult:
        q = db.query(Property).filter(Property.is_deleted == False)

        if query.keyword:
            keyword = f"%{query.keyword}%"
            q = q.filter(or_(Property.name.like(keyword), Property.code.like(keyword), Property.address.like(keyword)))

        if query.property_type:
            q = q.filter(Property.property_type == query.property_type)

        if query.status:
            q = q.filter(Property.status == query.status)

        total = q.count()
        items = q.order_by(Property.id.desc()).offset((query.page - 1) * query.page_size).limit(query.page_size).all()

        return PageResult(total=total, page=query.page, page_size=query.page_size, items=items)

    @staticmethod
    def create(db: Session, data: PropertyCreate, created_by: Optional[int] = None) -> Property:
        db_obj = Property(**data.model_dump(), created_by=created_by)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, property_id: int, data: PropertyUpdate, updated_by: Optional[int] = None) -> Optional[Property]:
        db_obj = PropertyService.get(db, property_id)
        if not db_obj:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, property_id: int, updated_by: Optional[int] = None) -> bool:
        db_obj = PropertyService.get(db, property_id)
        if not db_obj:
            return False
        db_obj.is_deleted = True
        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()
        db.commit()
        return True


class OwnerService:
    @staticmethod
    def get(db: Session, owner_id: int) -> Optional[Owner]:
        return db.query(Owner).filter(Owner.id == owner_id, Owner.is_deleted == False).first()

    @staticmethod
    def list(db: Session, query: OwnerQuery) -> PageResult:
        q = db.query(Owner).filter(Owner.is_deleted == False)

        if query.keyword:
            keyword = f"%{query.keyword}%"
            q = q.filter(or_(Owner.name.like(keyword), Owner.contact_person.like(keyword), Owner.phone.like(keyword)))

        total = q.count()
        items = q.order_by(Owner.id.desc()).offset((query.page - 1) * query.page_size).limit(query.page_size).all()

        return PageResult(total=total, page=query.page, page_size=query.page_size, items=items)

    @staticmethod
    def create(db: Session, data: OwnerCreate, created_by: Optional[int] = None) -> Owner:
        db_obj = Owner(**data.model_dump(), created_by=created_by)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, owner_id: int, data: OwnerUpdate, updated_by: Optional[int] = None) -> Optional[Owner]:
        db_obj = OwnerService.get(db, owner_id)
        if not db_obj:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, owner_id: int, updated_by: Optional[int] = None) -> bool:
        db_obj = OwnerService.get(db, owner_id)
        if not db_obj:
            return False
        db_obj.is_deleted = True
        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()
        db.commit()
        return True


class TenantService:
    @staticmethod
    def get(db: Session, tenant_id: int) -> Optional[Tenant]:
        return db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.is_deleted == False).first()

    @staticmethod
    def list(db: Session, query: TenantQuery) -> PageResult:
        q = db.query(Tenant).filter(Tenant.is_deleted == False)

        if query.keyword:
            keyword = f"%{query.keyword}%"
            q = q.filter(or_(Tenant.name.like(keyword), Tenant.contact_person.like(keyword), Tenant.phone.like(keyword)))

        if query.industry:
            q = q.filter(Tenant.industry == query.industry)

        total = q.count()
        items = q.order_by(Tenant.id.desc()).offset((query.page - 1) * query.page_size).limit(query.page_size).all()

        return PageResult(total=total, page=query.page, page_size=query.page_size, items=items)

    @staticmethod
    def create(db: Session, data: TenantCreate, created_by: Optional[int] = None) -> Tenant:
        db_obj = Tenant(**data.model_dump(), created_by=created_by)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, tenant_id: int, data: TenantUpdate, updated_by: Optional[int] = None) -> Optional[Tenant]:
        db_obj = TenantService.get(db, tenant_id)
        if not db_obj:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, tenant_id: int, updated_by: Optional[int] = None) -> bool:
        db_obj = TenantService.get(db, tenant_id)
        if not db_obj:
            return False
        db_obj.is_deleted = True
        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()
        db.commit()
        return True
