from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.check_in import CheckInStatus
from app.models.offer import OfferStatus
from app.models.audit import AuditAction
from app.schemas.check_in import CheckInCreate, CheckInResponse
from app.schemas.offer import OfferCreate, OfferUpdate, OfferResponse
from app.services.check_in_service import CheckInService
from app.services.offer_service import OfferService
from app.services.audit_service import AuditService
from app.services.candidate_service import CandidateService

router = APIRouter(prefix="/admin", tags=["管理员后台"])


@router.get("/check-ins", response_model=List[CheckInResponse])
def list_check_ins(
    interview_id: int = None,
    candidate_id: int = None,
    status: CheckInStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return CheckInService.list(
        db, interview_id=interview_id, candidate_id=candidate_id,
        status=status, skip=skip, limit=limit,
    )


@router.post("/check-ins", response_model=CheckInResponse)
def create_check_in(
    check_in_in: CheckInCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return CheckInService.create_check_in(db, check_in_in, current_user)


@router.get("/offers", response_model=List[OfferResponse])
def list_offers(
    candidate_id: int = None,
    position_id: int = None,
    status: OfferStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return OfferService.list(
        db, candidate_id=candidate_id, position_id=position_id,
        status=status, skip=skip, limit=limit,
    )


@router.get("/offers/my", response_model=List[OfferResponse])
def get_my_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=400, detail="Only candidates have offers")
    candidate = CandidateService.get_by_user_id(db, current_user.id)
    if not candidate:
        return []
    return OfferService.list(db, candidate_id=candidate.id)


@router.get("/offers/{offer_id}", response_model=OfferResponse)
def get_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    offer = OfferService.get_by_id(db, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer


@router.post("/offers", response_model=OfferResponse)
def create_offer(
    offer_in: OfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return OfferService.create(db, offer_in, current_user)


@router.put("/offers/{offer_id}", response_model=OfferResponse)
def update_offer(
    offer_id: int,
    offer_in: OfferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return OfferService.update(db, offer_id, offer_in, current_user)


@router.post("/offers/{offer_id}/send", response_model=OfferResponse)
def send_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return OfferService.send_offer(db, offer_id, current_user)


@router.post("/offers/{offer_id}/respond")
def respond_offer(
    offer_id: int,
    accepted: bool,
    note: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    offer = OfferService.get_by_id(db, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if current_user.role == UserRole.CANDIDATE:
        candidate = CandidateService.get_by_user_id(db, current_user.id)
        if not candidate or candidate.id != offer.candidate_id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    OfferService.respond(db, offer_id, accepted, note, current_user)
    return {"message": "Offer response recorded successfully"}


@router.get("/audit-logs")
def list_audit_logs(
    user_id: int = None,
    action: AuditAction = None,
    entity_type: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return AuditService.list_logs(
        db, user_id=user_id, action=action, entity_type=entity_type,
        skip=skip, limit=limit,
    )


@router.get("/stats/summary")
def get_stats_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    from app.models.application import Application, ApplicationStatus
    from app.models.candidate import Candidate
    from app.models.position import Position
    from app.models.interview import Interview, InterviewStatus

    total_candidates = db.query(Candidate).count()
    total_positions = db.query(Position).count()
    total_applications = db.query(Application).count()
    total_interviews = db.query(Interview).count()

    status_counts = {}
    for status in ApplicationStatus:
        count = db.query(Application).filter(Application.status == status).count()
        status_counts[status.value] = count

    pending_interviews = db.query(Interview).filter(
        Interview.status == InterviewStatus.SCHEDULED
    ).count()

    return {
        "total_candidates": total_candidates,
        "total_positions": total_positions,
        "total_applications": total_applications,
        "total_interviews": total_interviews,
        "pending_interviews": pending_interviews,
        "status_counts": status_counts,
    }
