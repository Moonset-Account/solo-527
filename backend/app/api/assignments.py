from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
from ..core.database import get_db
from ..core.security import get_current_user, require_roles
from ..schemas.gap import AssignmentCreate, AssignmentUpdate, AssignmentResponse, AssignmentList
from ..models import (
    Assignment, AssignmentStatus, User, UserRole, ChecklistSubmission, ChecklistStatus,
    Reminder, ReminderType, ReminderStatus,
)

router = APIRouter()


def _send_assignment_reminder(db: Session, recipient_id: int, submission_id: int, kind: str, title: str, content: str, sender_id: int):
    rtype = ReminderType.ASSIGNMENT_NEW
    db.add(Reminder(
        type=rtype,
        recipient_id=recipient_id,
        sender_id=sender_id,
        submission_id=submission_id,
        title=title,
        content=content,
        status=ReminderStatus.UNREAD,
        related_data={"kind": kind},
    ))


@router.get("", response_model=AssignmentList)
def list_assignments(
    status: Optional[AssignmentStatus] = None,
    lawyer_id: Optional[int] = None,
    reviewer_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Assignment)
    if status:
        q = q.filter(Assignment.status == status)
    if lawyer_id:
        q = q.filter(Assignment.lawyer_id == lawyer_id)
    if reviewer_id:
        q = q.filter(Assignment.reviewer_id == reviewer_id)
    total = q.count()
    items = q.order_by(Assignment.assigned_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return AssignmentList(total=total, items=[AssignmentResponse.model_validate(a) for a in items])


@router.get("/mine", response_model=AssignmentList)
def my_assignments(
    status: Optional[AssignmentStatus] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    q = db.query(Assignment)
    if role == "lawyer":
        q = q.filter(Assignment.lawyer_id == current.id)
    elif role == "reviewer":
        q = q.filter(Assignment.reviewer_id == current.id)
    else:
        q = q.filter((Assignment.lawyer_id == current.id) | (Assignment.reviewer_id == current.id))
    if status:
        q = q.filter(Assignment.status == status)
    total = q.count()
    items = q.order_by(Assignment.assigned_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return AssignmentList(total=total, items=[AssignmentResponse.model_validate(a) for a in items])


@router.get("/{aid}", response_model=AssignmentResponse)
def get_assignment(aid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    a = db.query(Assignment).filter(Assignment.id == aid).first()
    if not a:
        raise HTTPException(status_code=404, detail="分派记录不存在")
    return AssignmentResponse.model_validate(a)


@router.post("", response_model=AssignmentResponse)
def create_assignment(
    req: AssignmentCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_roles(UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER)),
):
    sub = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == req.submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="提交记录不存在")
    exists = db.query(Assignment).filter(Assignment.submission_id == req.submission_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="该提交已存在分派记录")
    a = Assignment(
        submission_id=req.submission_id,
        lawyer_id=req.lawyer_id,
        reviewer_id=req.reviewer_id,
        lawyer_deadline=req.lawyer_deadline,
        reviewer_deadline=req.reviewer_deadline,
        assigned_by=current.id,
        status=AssignmentStatus.ASSIGNED,
    )
    db.add(a)
    if req.lawyer_id:
        _send_assignment_reminder(db, req.lawyer_id, req.submission_id, "lawyer",
                                   f"新的律师分派：{sub.contract_name}",
                                   f"您被分派作为律师审核《{sub.contract_name}》，请及时处理。", current.id)
    if req.reviewer_id:
        _send_assignment_reminder(db, req.reviewer_id, req.submission_id, "reviewer",
                                   f"新的复核分派：{sub.contract_name}",
                                   f"您被分派作为复核人审核《{sub.contract_name}》，请及时处理。", current.id)
    sub.status = ChecklistStatus.UNDER_REVIEW
    db.commit()
    db.refresh(a)
    return AssignmentResponse.model_validate(a)


@router.patch("/{aid}", response_model=AssignmentResponse)
def update_assignment(
    aid: int,
    req: AssignmentUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    a = db.query(Assignment).filter(Assignment.id == aid).first()
    if not a:
        raise HTTPException(status_code=404, detail="分派记录不存在")
    data = req.model_dump(exclude_unset=True)
    sub = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == a.submission_id).first()
    for k, v in data.items():
        setattr(a, k, v)
    if "status" in data:
        s = data["status"]
        now = datetime.utcnow()
        if s == AssignmentStatus.LAWYER_PROCESSING and not a.lawyer_started_at:
            a.lawyer_started_at = now
        elif s == AssignmentStatus.LAWYER_DONE and not a.lawyer_finished_at:
            a.lawyer_finished_at = now
            if a.reviewer_id and sub:
                sub.status = ChecklistStatus.LAWYER_REVIEWED
        elif s == AssignmentStatus.REVIEWER_PROCESSING and not a.reviewer_started_at:
            a.reviewer_started_at = now
        elif s == AssignmentStatus.COMPLETED:
            if not a.reviewer_finished_at:
                a.reviewer_finished_at = now
            if sub:
                sub.status = ChecklistStatus.REVIEWER_APPROVED
                sub.completed_at = now
    db.commit()
    db.refresh(a)
    return AssignmentResponse.model_validate(a)
