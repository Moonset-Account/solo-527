from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, timedelta
from ..core.database import get_db
from ..core.security import get_current_user, require_roles
from ..schemas.gap import (
    GapCreate, GapUpdate, GapResponse, GapList, GapHistoryResponse,
)
from ..models import (
    ComplianceGap, GapStatus, GapSeverity, GapHistory, User, UserRole,
    ChecklistSubmission, ChecklistItem, SystemConfig, ConfigType,
)

router = APIRouter()


def _get_rectification_days(db: Session, severity: GapSeverity) -> int:
    mapping = {
        GapSeverity.CRITICAL: "P7",
        GapSeverity.HIGH: "P15",
        GapSeverity.MEDIUM: "P30",
        GapSeverity.LOW: "P60",
    }
    key = mapping.get(severity, "P30")
    cfg = db.query(SystemConfig).filter(
        SystemConfig.config_type == ConfigType.RECTIFICATION_PERIOD,
        SystemConfig.config_key == key,
        SystemConfig.is_active == True,
    ).first()
    try:
        return int(cfg.config_value) if cfg and cfg.config_value else 30
    except (ValueError, TypeError):
        return 30


def _auto_create_gaps_from_answers(db: Session, submission_id: int, creator_id: int):
    from ..models import ChecklistAnswer, AnswerStatus
    answers = db.query(ChecklistAnswer).filter(
        ChecklistAnswer.submission_id == submission_id,
        ChecklistAnswer.status.in_([AnswerStatus.NON_COMPLIANT, AnswerStatus.PARTIAL]),
    ).all()
    existing = {(g.submission_id, g.item_id) for g in
                db.query(ComplianceGap).filter(ComplianceGap.submission_id == submission_id).all()}
    created = 0
    today = date.today()
    for a in answers:
        key = (submission_id, a.item_id)
        if key in existing:
            continue
        item = db.query(ChecklistItem).filter(ChecklistItem.id == a.item_id).first()
        sev_map = {"critical": GapSeverity.CRITICAL, "high": GapSeverity.HIGH,
                   "medium": GapSeverity.MEDIUM, "low": GapSeverity.LOW}
        sev = sev_map.get((item.default_risk_level or "medium").lower(), GapSeverity.MEDIUM)
        days = _get_rectification_days(db, sev)
        gap = ComplianceGap(
            submission_id=submission_id,
            item_id=a.item_id,
            description=f"[自动识别] {item.question} - 当前状态：{a.status.value}，答复：{a.answer_text or '（未填写）'}",
            severity=sev,
            status=GapStatus.OPEN,
            remediation_deadline=today + timedelta(days=days),
            created_by=creator_id,
        )
        db.add(gap)
        db.flush()
        db.add(GapHistory(
            gap_id=gap.id,
            action="创建",
            field_changed="初始化",
            old_value="",
            new_value=sev.value,
            comment=f"系统自动识别合规缺口，整改期限 {days} 天（{gap.remediation_deadline.isoformat()}）",
            user_id=creator_id,
        ))
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


def _enrich_gap_response(db: Session, g: ComplianceGap) -> dict:
    data = GapResponse.model_validate(g).model_dump()
    today = date.today()
    if g.remediation_deadline:
        data["days_left"] = (g.remediation_deadline - today).days
    if g.remediation_owner_id:
        owner = db.query(User).filter(User.id == g.remediation_owner_id).first()
        if owner:
            data["remediation_owner_name"] = owner.full_name
    data["histories"] = [GapHistoryResponse.model_validate(h).model_dump() for h in sorted(g.histories, key=lambda x: x.created_at or "", reverse=True)]
    return data


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
    return GapList(total=total, items=[_enrich_gap_response(db, g) for g in items])


@router.get("/{gid}", response_model=GapResponse)
def get_gap(gid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    g = db.query(ComplianceGap).filter(ComplianceGap.id == gid).first()
    if not g:
        raise HTTPException(status_code=404, detail="合规缺口不存在")
    return _enrich_gap_response(db, g)


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
    return _enrich_gap_response(db, gap)


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
    return _enrich_gap_response(db, g)


@router.get("/{gid}/detail")
def gap_detail(gid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    g = db.query(ComplianceGap).filter(ComplianceGap.id == gid).first()
    if not g:
        raise HTTPException(status_code=404, detail="合规缺口不存在")
    sub = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == g.submission_id).first()
    item = db.query(ChecklistItem).filter(ChecklistItem.id == g.item_id).first()
    submitter = db.query(User).filter(User.id == sub.submitter_id).first() if sub else None
    owner = db.query(User).filter(User.id == g.remediation_owner_id).first() if g.remediation_owner_id else None
    user_ids = {h.user_id for h in g.histories if h.user_id}
    users_by_id = {u.id: u for u in db.query(User).filter(User.id.in_(list(user_ids))).all()} if user_ids else {}
    histories = sorted(g.histories, key=lambda h: h.created_at or "", reverse=True)
    today = date.today()
    days_left = None
    if g.remediation_deadline:
        days_left = (g.remediation_deadline - today).days
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
            "days_left": days_left,
            "remediation_owner_id": g.remediation_owner_id,
        },
        "submission": {
            "id": sub.id,
            "contract_name": sub.contract_name,
            "counterparty": sub.counterparty,
            "contract_version": sub.contract_version,
            "risk_level": sub.risk_level,
            "status": sub.status.value,
            "deadline": sub.deadline.isoformat() if sub.deadline else None,
            "contract_amount": sub.contract_amount,
            "department": "",
            "contract_owner": "",
            "submitter": submitter.full_name if submitter else None,
            "submitter_id": sub.submitter_id,
        } if sub else None,
        "item": {
            "id": item.id,
            "section": item.section,
            "question": item.question,
            "required_evidence": item.required_evidence,
            "description": item.description,
            "default_risk_level": item.default_risk_level,
        } if item else None,
        "owner": {
            "id": owner.id,
            "full_name": owner.full_name,
            "role": owner.role.value,
            "department": owner.department,
        } if owner else None,
        "histories": [
            {
                "id": h.id,
                "action": h.action,
                "field": h.field_changed,
                "old": h.old_value,
                "new": h.new_value,
                "comment": h.comment,
                "user_id": h.user_id,
                "changed_by_name": users_by_id[h.user_id].full_name if h.user_id and h.user_id in users_by_id else None,
                "time": h.created_at.isoformat() if h.created_at else None,
            }
            for h in histories
        ],
    }
