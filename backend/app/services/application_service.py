from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.application import Application, ApplicationStatus, ApplicationStage
from app.models.application_history import ApplicationStatusHistory
from app.models.candidate import Candidate
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationStatusChange
from app.services.audit_service import AuditService
from app.models.audit import AuditAction


class ApplicationService:
    @staticmethod
    def get_by_id(db: Session, app_id: int) -> Optional[Application]:
        return db.query(Application).filter(Application.id == app_id).first()

    @staticmethod
    def list_by_candidate(db: Session, candidate_id: int) -> List[Application]:
        return db.query(Application).filter(
            Application.candidate_id == candidate_id
        ).order_by(Application.created_at.desc()).all()

    @staticmethod
    def list(
        db: Session,
        position_id: int = None,
        status: ApplicationStatus = None,
        stage: ApplicationStage = None,
        source_channel: str = None,
        assigned_recruiter: int = None,
        keyword: str = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Application]:
        query = db.query(Application)
        if position_id:
            query = query.filter(Application.position_id == position_id)
        if status:
            query = query.filter(Application.status == status)
        if stage:
            query = query.filter(Application.current_stage == stage)
        if source_channel:
            query = query.filter(Application.source_channel == source_channel)
        if assigned_recruiter:
            query = query.filter(Application.assigned_recruiter == assigned_recruiter)
        return query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, app_in: ApplicationCreate, current_user: User) -> Application:
        candidate_id = app_in.candidate_id
        if current_user.role == "candidate" and not candidate_id:
            candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
            if not candidate:
                raise HTTPException(status_code=400, detail="Candidate profile not found")
            candidate_id = candidate.id

        if not candidate_id:
            raise HTTPException(status_code=400, detail="Candidate ID is required")

        existing = db.query(Application).filter(
            Application.candidate_id == candidate_id,
            Application.position_id == app_in.position_id,
            Application.status.notin_([ApplicationStatus.REJECTED, ApplicationStatus.CANCELLED])
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Already applied for this position")

        db_app = Application(
            candidate_id=candidate_id,
            position_id=app_in.position_id,
            source_channel=app_in.source_channel,
            notes=app_in.notes,
            status=ApplicationStatus.SUBMITTED,
            current_stage=ApplicationStage.RESUME_SCREEN,
        )
        db.add(db_app)
        db.flush()

        history = ApplicationStatusHistory(
            application_id=db_app.id,
            to_status=ApplicationStatus.SUBMITTED,
            to_stage=ApplicationStage.RESUME_SCREEN,
            changed_by=current_user.id if current_user else None,
            channel=app_in.source_channel,
            change_reason="简历投递",
        )
        db.add(history)
        db.commit()
        db.refresh(db_app)

        AuditService.log(
            db, current_user, AuditAction.CREATE,
            "application", db_app.id,
            description=f"投递职位: {app_in.position_id}"
        )

        return db_app

    @staticmethod
    def change_status(
        db: Session,
        app_id: int,
        status_in: ApplicationStatusChange,
        current_user: User,
    ) -> Application:
        db_app = ApplicationService.get_by_id(db, app_id)
        if not db_app:
            raise HTTPException(status_code=404, detail="Application not found")

        old_status = db_app.status
        old_stage = db_app.current_stage

        if old_status == status_in.to_status:
            return db_app

        last_history = db.query(ApplicationStatusHistory).filter(
            ApplicationStatusHistory.application_id == app_id
        ).order_by(ApplicationStatusHistory.changed_at.desc()).first()

        cycle_days = None
        if last_history:
            delta = datetime.utcnow() - last_history.changed_at.replace(tzinfo=None)
            cycle_days = delta.days

        db_app.status = status_in.to_status
        if status_in.to_stage:
            db_app.current_stage = status_in.to_stage

        history = ApplicationStatusHistory(
            application_id=app_id,
            from_status=old_status,
            to_status=status_in.to_status,
            from_stage=old_stage,
            to_stage=status_in.to_stage or old_stage,
            changed_by=current_user.id,
            change_reason=status_in.change_reason,
            channel=status_in.channel,
            cycle_days=cycle_days,
            remarks=status_in.remarks,
        )
        db.add(history)
        db.commit()
        db.refresh(db_app)

        AuditService.log(
            db, current_user, AuditAction.STATUS_CHANGE,
            "application", app_id,
            old_value=f"{old_status}",
            new_value=f"{status_in.to_status}",
            description=f"状态变更: {old_status} -> {status_in.to_status}"
        )

        return db_app

    @staticmethod
    def update(db: Session, app_id: int, app_in: ApplicationUpdate, current_user: User) -> Application:
        db_app = ApplicationService.get_by_id(db, app_id)
        if not db_app:
            raise HTTPException(status_code=404, detail="Application not found")

        update_data = app_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_app, field, value)

        db.commit()
        db.refresh(db_app)

        AuditService.log(
            db, current_user, AuditAction.UPDATE,
            "application", app_id,
            description="更新申请信息"
        )

        return db_app

    @staticmethod
    def get_status_history(db: Session, app_id: int) -> List[ApplicationStatusHistory]:
        return db.query(ApplicationStatusHistory).filter(
            ApplicationStatusHistory.application_id == app_id
        ).order_by(ApplicationStatusHistory.changed_at.desc()).all()
