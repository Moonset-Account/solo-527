from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from ..core.database import get_db
from ..core.security import get_current_user, require_roles
from ..schemas.gap import GapCreate, GapUpdate, GapResponse, GapList
from ..models import (
    ComplianceGap, GapStatus, GapSeverity, GapHistory, User, UserRole,
    ChecklistSubmission, ChecklistItem,
)

router = APIRouter()


def _auto_create_gaps_from_answers(db: Session, submission_id: int, creator_id: int):
    from ..models import ChecklistAnswer, AnswerStatus
    answers = db.query(ChecklistAnswer).filter(
        ChecklistAnswer.submission_id == submission_id,
        ChecklistAnswer.status.in_([AnswerStatus.NON_COMPLIANT, AnswerStatus.PARTIAL]),
    ).all()
    existing = {(g.submission_id, g.item_id) for g in
                db.query(ComplianceGap).filter(ComplianceGap.submission_id == submission_id).all()}
    created = 0
    for a in answers:
        key = (submission_id, a.item_id)
        if key in existing:
            continue
        item = db.query(ChecklistItem).filter(ChecklistItem.id == a.item_id).first()
        sev_map = {"critical": GapSeverity.CRITICAL, "high": GapSeverity.HIGH,
                   "medium": GapSeverity.MEDIUM, "low": GapSeverity.LOW}
        sev = sev_map.get((item.default_risk_level or "medium").lower(), GapSeverity.MEDIUM)
        gap = ComplianceGap(
            submission_id=submission_id,
            item_id=a.item_id,
            description=f"[自动识别] {item.question} - 当前状态：{a.status.value}，答复：{a.answer_text or '（未填写）'}",
            severity=sev,
            status=GapStatus.OPEN,
            created_by=creator_id,
        )
        db.add(gap)
        created += 1
    if created:
        db.commit()
    return created


def _add_history(db: Session, gap: ComplianceGap, action: str, user_id: int,
                 field: Optional[str] = None, old: Optional[str] = None, new: Optional[str] = None,
                 comment: Optional[str] = None):
    db.add(GapHistory(
        gap_id=gap.id,
        action=action,
        field_changed=field,
        old_value=old,
        new_value=new,
        comment=comment,
        user_id=user_id,
    ))


@router.get("", response_model=GapList)
def list_gaps(
    status: Optional[GapStatus] = None,
    severity: Optional[GapSeverity] = None,
    submission_id: Optional[int] = None,
    owner_id: Optional[int] = None,
    deadline_from: Optional[date] = None,
    deadline_to: Optional[date] = None,
    overdue_only: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(ComplianceGap)
    if status:
        q = q.filter(ComplianceGap.status == status)
    if severity:
        q = q.filter(ComplianceGap.severity == severity)
    if submission_id:
        q = q.filter(ComplianceGap.submission_id == submission_id)
    if owner_id:
        q = q.filter(ComplianceGap.remediation_owner_id == owner_id)
    if deadline_from:
        q = q.filter(ComplianceGap.remediation_deadline >= deadline_from)
    if deadline_to:
        q = q.filter(ComplianceGap.remediation_deadline <= deadline_to)
    if overdue_only:
        today = date.today()
        q = q.filter(
            ComplianceGap.remediation_deadline < today,
            ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
        )
    total = q.count()
    items = q.order_by(ComplianceGap.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return GapList(total=total, items=[GapResponse.model_validate(g) for g in items])


@router.get("/{gid}", response_model=GapResponse)
def get_gap(gid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    g = db.query(ComplianceGap).filter(ComplianceGap.id == gid).first()
    if not g:
        raise HTTPException(status_code=404, detail="合规缺口不存在")
    return GapResponse.model_validate(g)


@router.post("", response_model=GapResponse)
def create_gap(
    req: GapCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    sub = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == req.submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="提交记录不存在")
    gap = ComplianceGap(
        **req.model_dump(exclude={"evidence_details"}),
        evidence_details=req.evidence_details or [],
        created_by=current.id,
    )
    db.add(gap)
    db.flush()
    _add_history(db, gap, "创建", current.id)
    db.commit()
    db.refresh(gap)
    return GapResponse.model_validate(gap)


@router.post("/auto-generate/{submission_id}")
def auto_generate_gaps(
    submission_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    n = _auto_create_gaps_from_answers(db, submission_id, current.id)
    return {"created": n}


@router.patch("/{gid}", response_model=GapResponse)
def update_gap(
    gid: int,
    req: GapUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    g = db.query(ComplianceGap).filter(ComplianceGap.id == gid).first()
    if not g:
        raise HTTPException(status_code=404, detail="合规缺口不存在")
    data = req.model_dump(exclude_unset=True)
    comment = data.pop("comment", None)
    field_map = {
        "status": "状态",
        "severity": "严重程度",
        "remediation_deadline": "整改期限",
        "remediation_owner_id": "整改责任人",
    }
    for k, v in data.items():
        old = getattr(g, k)
        if old != v:
            label = field_map.get(k, k)
            _add_history(db, g, "更新", current.id, field=label,
                         old=str(old.value) if hasattr(old, "value") else str(old) if old else "",
                         new=str(v.value) if hasattr(v, "value") else str(v) if v else "")
            setattr(g, k, v)
    if "status" in data and data["status"] == GapStatus.CLOSED and not g.actual_resolve_date:
        g.actual_resolve_date = date.today()
    if comment:
        _add_history(db, g, "备注", current.id, comment=comment)
    db.commit()
    db.refresh(g)
    return GapResponse.model_validate(g)


@router.get("/{gid}/detail")
def gap_detail(gid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    g = db.query(ComplianceGap).filter(ComplianceGap.id == gid).first()
    if not g:
        raise HTTPException(status_code=404, detail="合规缺口不存在")
    sub = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == g.submission_id).first()
    item = db.query(ChecklistItem).filter(ChecklistItem.id == g.item_id).first()
    submitter = db.query(User).filter(User.id == sub.submitter_id).first() if sub else None
    owner = db.query(User).filter(User.id == g.remediation_owner_id).first() if g.remediation_owner_id else None
    histories = sorted(g.histories, key=lambda h: h.created_at or "", reverse=True)
    return {
        "gap": {
            "id": g.id,
            "description": g.description,
            "severity": g.severity.value,
            "status": g.status.value,
            "remediation_plan": g.remediation_plan,
            "remediation_deadline": g.remediation_deadline.isoformat() if g.remediation_deadline else None,
            "resolution_note": g.resolution_note,
            "actual_resolve_date": g.actual_resolve_date.isoformat() if g.actual_resolve_date else None,
            "evidence_details": g.evidence_details,
            "created_at": g.created_at.isoformat() if g.created_at else None,
        },
        "submission": {
            "id": sub.id,
            "contract_name": sub.contract_name,
            "counterparty": sub.counterparty,
            "contract_version": sub.contract_version,
            "risk_level": sub.risk_level,
            "status": sub.status.value,
            "submitter": submitter.full_name if submitter else None,
        } if sub else None,
        "item": {
            "id": item.id,
            "section": item.section,
            "question": item.question,
            "required_evidence": item.required_evidence,
        } if item else None,
        "owner": owner.full_name if owner else None,
        "histories": [
            {
                "id": h.id,
                "action": h.action,
                "field": h.field_changed,
                "old": h.old_value,
                "new": h.new_value,
                "comment": h.comment,
                "user_id": h.user_id,
                "time": h.created_at.isoformat() if h.created_at else None,
            }
            for h in histories
        ],
    }
