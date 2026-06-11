from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import Optional, List
from app.repositories.base import BaseRepository
from app.models import PurchaseRequest, PurchaseStatus
from app.schemas import PurchaseRequestCreate, PurchaseRequestUpdate


class PurchaseRepository(BaseRepository[PurchaseRequest, PurchaseRequestCreate, PurchaseRequestUpdate]):
    def __init__(self):
        super().__init__(PurchaseRequest)

    def get_by_request_no(self, db: Session, request_no: str) -> Optional[PurchaseRequest]:
        return db.query(PurchaseRequest).filter(PurchaseRequest.request_no == request_no).first()

    def get_by_creator(
        self, db: Session, creator_id: int, page: int = 1, page_size: int = 20
    ) -> tuple[List[PurchaseRequest], int]:
        query = db.query(PurchaseRequest).filter(PurchaseRequest.created_by == creator_id)
        total = query.count()
        items = query.order_by(desc(PurchaseRequest.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_by_status(
        self, db: Session, status: str, page: int = 1, page_size: int = 20
    ) -> tuple[List[PurchaseRequest], int]:
        query = db.query(PurchaseRequest).filter(PurchaseRequest.status == status)
        total = query.count()
        items = query.order_by(desc(PurchaseRequest.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def search(
        self, db: Session, keyword: str, page: int = 1, page_size: int = 20
    ) -> tuple[List[PurchaseRequest], int]:
        query = db.query(PurchaseRequest).filter(
            or_(
                PurchaseRequest.material_name.ilike(f"%{keyword}%"),
                PurchaseRequest.request_no.ilike(f"%{keyword}%"),
                PurchaseRequest.specification.ilike(f"%{keyword}%")
            )
        )
        total = query.count()
        items = query.order_by(desc(PurchaseRequest.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def generate_request_no(self, db: Session) -> str:
        from datetime import datetime
        today = datetime.now()
        prefix = f"PR{today.strftime('%Y%m%d')}"
        
        last_req = db.query(PurchaseRequest).filter(
            PurchaseRequest.request_no.like(f"{prefix}%")
        ).order_by(desc(PurchaseRequest.request_no)).first()
        
        if last_req:
            seq = int(last_req.request_no[-4:]) + 1
        else:
            seq = 1
        
        return f"{prefix}{seq:04d}"

    def get_pending_approval(
        self, db: Session, approver_id: int, page: int = 1, page_size: int = 20
    ) -> tuple[List[PurchaseRequest], int]:
        from app.models import ApprovalLevelUser
        subquery = db.query(ApprovalLevelUser.level_id).filter(
            ApprovalLevelUser.user_id == approver_id
        )
        
        query = db.query(PurchaseRequest).filter(
            PurchaseRequest.status == PurchaseStatus.PENDING,
            PurchaseRequest.current_approval_level.in_(subquery)
        )
        
        total = query.count()
        items = query.order_by(desc(PurchaseRequest.created_at)).offset((page - 1) * page_size).limit(page_size).all()
        return items, total
