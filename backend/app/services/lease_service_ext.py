from typing import Optional, List
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
import uuid

from app.models.lease_ext import Lease, FollowUpRecord
from app.models.lease import Property, Tenant
from app.schemas.lease_ext import LeaseCreate, LeaseUpdate, LeaseQuery
from app.schemas.lease_ext import FollowUpRecordCreate, FollowUpRecordUpdate, FollowUpRecordQuery
from app.schemas.common import PageResult


class LeaseService:
    @staticmethod
    def get(db: Session, lease_id: int) -> Optional[Lease]:
        return db.query(Lease).filter(Lease.id == lease_id, Lease.is_deleted == False).first()

    @staticmethod
    def list(db: Session, query: LeaseQuery) -> PageResult:
        q = db.query(Lease).filter(Lease.is_deleted == False)

        if query.keyword:
            keyword = f"%{query.keyword}%"
            q = q.join(Tenant, Lease.tenant_id == Tenant.id).join(Property, Lease.property_id == Property.id).filter(
                or_(Lease.lease_no.like(keyword), Tenant.name.like(keyword), Property.name.like(keyword))
            )

        if query.lease_type:
            q = q.filter(Lease.lease_type == query.lease_type)

        if query.status:
            q = q.filter(Lease.status == query.status)

        if query.consultant_id:
            q = q.filter(Lease.consultant_id == query.consultant_id)

        if query.start_date_from:
            q = q.filter(Lease.start_date >= query.start_date_from)

        if query.start_date_to:
            q = q.filter(Lease.start_date <= query.start_date_to)

        if query.end_date_from:
            q = q.filter(Lease.end_date >= query.end_date_from)

        if query.end_date_to:
            q = q.filter(Lease.end_date <= query.end_date_to)

        total = q.count()
        items = q.order_by(Lease.id.desc()).offset((query.page - 1) * query.page_size).limit(query.page_size).all()

        return PageResult(total=total, page=query.page, page_size=query.page_size, items=items)

    @staticmethod
    def generate_lease_no() -> str:
        date_str = datetime.now().strftime("%Y%m%d")
        unique_id = str(uuid.uuid4().hex)[:8].upper()
        return f"ZL{date_str}{unique_id}"

    @staticmethod
    def create(db: Session, data: LeaseCreate, created_by: Optional[int] = None) -> Lease:
        lease_no = LeaseService.generate_lease_no()
        db_obj = Lease(**data.model_dump(), lease_no=lease_no, created_by=created_by)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, lease_id: int, data: LeaseUpdate, updated_by: Optional[int] = None) -> Optional[Lease]:
        db_obj = LeaseService.get(db, lease_id)
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
    def delete(db: Session, lease_id: int, updated_by: Optional[int] = None) -> bool:
        db_obj = LeaseService.get(db, lease_id)
        if not db_obj:
            return False
        db_obj.is_deleted = True
        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()
        db.commit()
        return True


class FollowUpService:
    @staticmethod
    def get(db: Session, record_id: int) -> Optional[FollowUpRecord]:
        return db.query(FollowUpRecord).filter(FollowUpRecord.id == record_id, FollowUpRecord.is_deleted == False).first()

    @staticmethod
    def list(db: Session, query: FollowUpRecordQuery) -> PageResult:
        q = db.query(FollowUpRecord).filter(FollowUpRecord.is_deleted == False)

        if query.lease_id:
            q = q.filter(FollowUpRecord.lease_id == query.lease_id)

        if query.user_id:
            q = q.filter(FollowUpRecord.user_id == query.user_id)

        if query.follow_type:
            q = q.filter(FollowUpRecord.follow_type == query.follow_type)

        total = q.count()
        items = q.order_by(FollowUpRecord.id.desc()).offset((query.page - 1) * query.page_size).limit(query.page_size).all()

        return PageResult(total=total, page=query.page, page_size=query.page_size, items=items)

    @staticmethod
    def create(db: Session, data: FollowUpRecordCreate, user_id: int, created_by: Optional[int] = None) -> FollowUpRecord:
        db_obj = FollowUpRecord(**data.model_dump(), user_id=user_id, created_by=created_by or user_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, record_id: int, data: FollowUpRecordUpdate, updated_by: Optional[int] = None) -> Optional[FollowUpRecord]:
        db_obj = FollowUpService.get(db, record_id)
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
    def delete(db: Session, record_id: int, updated_by: Optional[int] = None) -> bool:
        db_obj = FollowUpService.get(db, record_id)
        if not db_obj:
            return False
        db_obj.is_deleted = True
        db_obj.updated_by = updated_by
        db_obj.updated_at = datetime.utcnow()
        db.commit()
        return True
