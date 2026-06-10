from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.schemas.candidate import CandidateCreate, CandidateUpdate, CandidateResponse
from app.services.candidate_service import CandidateService

router = APIRouter(prefix="/candidates", tags=["候选人管理"])


@router.get("", response_model=List[CandidateResponse])
def list_candidates(
    keyword: str = None,
    university: str = None,
    major: str = None,
    source_channel: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return CandidateService.list(
        db, keyword=keyword, university=university,
        major=major, source_channel=source_channel,
        skip=skip, limit=limit,
    )


@router.get("/me", response_model=CandidateResponse)
def get_my_candidate_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=400, detail="Only candidates have candidate profile")
    candidate = CandidateService.get_by_user_id(db, current_user.id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return candidate


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    candidate = CandidateService.get_by_id(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.post("", response_model=CandidateResponse)
def create_candidate(
    candidate_in: CandidateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return CandidateService.create(db, candidate_in)


@router.put("/me", response_model=CandidateResponse)
def update_my_profile(
    candidate_in: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    candidate = CandidateService.get_by_user_id(db, current_user.id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return CandidateService.update(db, candidate.id, candidate_in)


@router.put("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: int,
    candidate_in: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return CandidateService.update(db, candidate_id, candidate_in)


@router.delete("/{candidate_id}")
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    CandidateService.delete(db, candidate_id)
    return {"message": "Candidate deleted successfully"}
