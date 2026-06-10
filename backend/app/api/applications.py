from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.application import ApplicationStatus, ApplicationStage
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
    ApplicationStatusChange, StatusHistoryResponse, ApplicationDetailResponse,
)
from app.services.application_service import ApplicationService
from app.services.candidate_service import CandidateService

router = APIRouter(prefix="/applications", tags=["投递管理"])


@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    position_id: int = None,
    status: ApplicationStatus = None,
    stage: ApplicationStage = None,
    source_channel: str = None,
    assigned_recruiter: int = None,
    keyword: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return ApplicationService.list(
        db, position_id=position_id, status=status, stage=stage,
        source_channel=source_channel, assigned_recruiter=assigned_recruiter,
        keyword=keyword, skip=skip, limit=limit,
    )


@router.get("/my", response_model=List[ApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=400, detail="Only candidates can view their applications")
    candidate = CandidateService.get_by_user_id(db, current_user.id)
    if not candidate:
        return []
    return ApplicationService.list_by_candidate(db, candidate.id)


@router.get("/{app_id}", response_model=ApplicationDetailResponse)
def get_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    app = ApplicationService.get_by_id(db, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role == UserRole.CANDIDATE:
        candidate = CandidateService.get_by_user_id(db, current_user.id)
        if not candidate or candidate.id != app.candidate_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    result = {
        "id": app.id,
        "candidate_id": app.candidate_id,
        "position_id": app.position_id,
        "status": app.status,
        "current_stage": app.current_stage,
        "source_channel": app.source_channel,
        "assigned_recruiter": app.assigned_recruiter,
        "notes": app.notes if current_user.role != UserRole.CANDIDATE else None,
        "rating": app.rating if current_user.role != UserRole.CANDIDATE else None,
        "applied_at": app.applied_at,
        "created_at": app.created_at,
        "updated_at": app.updated_at,
        "candidate": {
            "id": app.candidate.id,
            "name": app.candidate.name,
            "university": app.candidate.university,
            "major": app.candidate.major,
            "degree": app.candidate.degree,
        } if app.candidate else None,
        "position": {
            "id": app.position.id,
            "title": app.position.title,
            "department": app.position.department,
            "city": app.position.city,
        } if app.position else None,
    }
    return result


@router.post("", response_model=ApplicationResponse)
def create_application(
    app_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return ApplicationService.create(db, app_in, current_user)


@router.put("/{app_id}", response_model=ApplicationResponse)
def update_application(
    app_id: int,
    app_in: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return ApplicationService.update(db, app_id, app_in, current_user)


@router.post("/{app_id}/status", response_model=ApplicationResponse)
def change_application_status(
    app_id: int,
    status_in: ApplicationStatusChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return ApplicationService.change_status(db, app_id, status_in, current_user)


@router.get("/{app_id}/history", response_model=List[StatusHistoryResponse])
def get_application_history(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    app = ApplicationService.get_by_id(db, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role == UserRole.CANDIDATE:
        candidate = CandidateService.get_by_user_id(db, current_user.id)
        if not candidate or candidate.id != app.candidate_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    return ApplicationService.get_status_history(db, app_id)
