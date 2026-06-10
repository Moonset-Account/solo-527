from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.interview import InterviewType, InterviewStatus, InterviewResult
from app.schemas.interview import (
    InterviewCreate, InterviewUpdate, InterviewResponse,
    InterviewResultUpdate, InterviewConflictResponse,
)
from app.services.interview_service import InterviewService

router = APIRouter(prefix="/interviews", tags=["面试管理"])


@router.get("", response_model=List[InterviewResponse])
def list_interviews(
    application_id: int = None,
    interview_type: InterviewType = None,
    status: InterviewStatus = None,
    start_time_from: datetime = None,
    start_time_to: datetime = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return InterviewService.list(
        db, application_id=application_id, interview_type=interview_type,
        status=status, start_time_from=start_time_from, start_time_to=start_time_to,
        skip=skip, limit=limit,
    )


@router.get("/my", response_model=List[InterviewResponse])
def get_my_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role == UserRole.CANDIDATE:
        from app.services.candidate_service import CandidateService
        candidate = CandidateService.get_by_user_id(db, current_user.id)
        if not candidate:
            return []
        from app.models.application import Application
        apps = db.query(Application).filter(Application.candidate_id == candidate.id).all()
        app_ids = [a.id for a in apps]
        if not app_ids:
            return []
        from sqlalchemy import or_
        interviews = InterviewService.list(db)
        return [i for i in interviews if i.application_id in app_ids]
    return []


@router.get("/check/conflict", response_model=InterviewConflictResponse)
def check_interview_conflict(
    start_time: datetime,
    end_time: datetime,
    interviewer_ids: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return InterviewService.check_conflict(db, start_time, end_time, interviewer_ids)


@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    interview = InterviewService.get_by_id(db, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.post("", response_model=InterviewResponse)
def create_interview(
    interview_in: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return InterviewService.create(db, interview_in, current_user)


@router.put("/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: int,
    interview_in: InterviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return InterviewService.update(db, interview_id, interview_in, current_user)


@router.post("/{interview_id}/result", response_model=InterviewResponse)
def update_interview_result(
    interview_id: int,
    result_in: InterviewResultUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return InterviewService.update_result(db, interview_id, result_in, current_user)


@router.post("/{interview_id}/cancel", response_model=InterviewResponse)
def cancel_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return InterviewService.cancel(db, interview_id, current_user)
