from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.check_in import CheckInRecord, CheckInStatus
from app.models.interview import Interview
from app.models.user import User
from app.schemas.check_in import CheckInCreate
from app.services.audit_service import AuditService
from app.models.audit import AuditAction


class CheckInService:
    @staticmethod
    def get_by_id(db: Session, check_in_id: int) -> Optional[CheckInRecord]:
        return db.query(CheckInRecord).filter(CheckInRecord.id == check_in_id).first()

    @staticmethod
    def get_by_interview_id(db: Session, interview_id: int) -> Optional[CheckInRecord]:
        return db.query(CheckInRecord).filter(CheckInRecord.interview_id == interview_id).first()

    @staticmethod
    def list(
        db: Session,
        interview_id: int = None,
        candidate_id: int = None,
        status: CheckInStatus = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[CheckInRecord]:
        query = db.query(CheckInRecord)
        if interview_id:
            query = query.filter(CheckInRecord.interview_id == interview_id)
        if candidate_id:
            query = query.filter(CheckInRecord.candidate_id == candidate_id)
        if status:
            query = query.filter(CheckInRecord.status == status)
        return query.order_by(CheckInRecord.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create_check_in(db: Session, check_in_in: CheckInCreate, current_user: User) -> CheckInRecord:
        interview = db.query(Interview).filter(Interview.id == check_in_in.interview_id).first()
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        existing = CheckInService.get_by_interview_id(db, check_in_in.interview_id)
        if existing:
            raise HTTPException(status_code=400, detail="Check-in record already exists for this interview")

        now = datetime.utcnow()
        status = CheckInStatus.CHECKED_IN
        if now < interview.start_time.replace(tzinfo=None):
            status = CheckInStatus.EARLY
        elif now > interview.end_time.replace(tzinfo=None):
            status = CheckInStatus.LATE

        db_check_in = CheckInRecord(
            interview_id=check_in_in.interview_id,
            candidate_id=check_in_in.candidate_id,
            check_in_time=now,
            status=status,
            check_in_method=check_in_in.check_in_method,
            location=check_in_in.location,
            notes=check_in_in.notes,
        )
        db.add(db_check_in)
        db.commit()
        db.refresh(db_check_in)

        AuditService.log(
            db, current_user, AuditAction.CREATE,
            "check_in", db_check_in.id,
            description=f"面试签到: 面试 {check_in_in.interview_id}"
        )

        return db_check_in
