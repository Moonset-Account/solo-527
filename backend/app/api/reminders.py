from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from ..core.database import get_db
from ..core.security import get_current_user
from ..schemas.gap import ReminderList, ReminderMark
from ..models import Reminder, ReminderStatus, ReminderType, User

router = APIRouter()


@router.get("", response_model=ReminderList)
def list_reminders(
    type: Optional[ReminderType] = None,
    status: Optional[ReminderStatus] = None,
    unread_only: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    q = db.query(Reminder).filter(Reminder.recipient_id == current.id)
    if type:
        q = q.filter(Reminder.type == type)
    if status:
        q = q.filter(Reminder.status == status)
    if unread_only:
        q = q.filter(Reminder.status == ReminderStatus.UNREAD)
    total = q.count()
    unread_count = db.query(Reminder).filter(
        Reminder.recipient_id == current.id,
        Reminder.status == ReminderStatus.UNREAD,
    ).count()
    items = q.order_by(Reminder.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ReminderList(total=total, unread_count=unread_count, items=items)


@router.post("/mark")
def mark_reminders(
    req: ReminderMark,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    q = db.query(Reminder).filter(
        Reminder.id.in_(req.ids),
        Reminder.recipient_id == current.id,
    )
    now = datetime.utcnow()
    count = 0
    if req.action == "read":
        for r in q.all():
            if r.status == ReminderStatus.UNREAD:
                r.status = ReminderStatus.READ
                r.read_at = now
                count += 1
    elif req.action == "processed":
        for r in q.all():
            r.status = ReminderStatus.PROCESSED
            r.processed_at = now
            count += 1
    db.commit()
    return {"updated": count}


@router.post("/read-all")
def read_all(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    q = db.query(Reminder).filter(
        Reminder.recipient_id == current.id,
        Reminder.status == ReminderStatus.UNREAD,
    )
    now = datetime.utcnow()
    count = 0
    for r in q.all():
        r.status = ReminderStatus.READ
        r.read_at = now
        count += 1
    db.commit()
    return {"updated": count}


@router.post("/{rid}/material-missing")
def send_material_missing(
    rid: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    rem = db.query(Reminder).filter(Reminder.id == rid).first()
    if not rem or rem.recipient_id != current.id:
        raise HTTPException(status_code=404, detail="提醒不存在")
    if not rem.submission_id:
        raise HTTPException(status_code=400, detail="该提醒无关联提交")
    from ..models import ChecklistSubmission
    sub = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == rem.submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="提交记录不存在")
    submitter_id = sub.submitter_id
    new_rem = Reminder(
        type=ReminderType.MATERIAL_MISSING,
        recipient_id=submitter_id,
        sender_id=current.id,
        submission_id=sub.id,
        title=f"材料缺失提醒：{sub.contract_name}",
        content=f"您提交的《{sub.contract_name}》合规检查中存在材料缺失，请尽快补充相关证明材料。",
        status=ReminderStatus.UNREAD,
        related_data={"source_reminder": rid},
    )
    db.add(new_rem)
    db.commit()
    return {"ok": True, "reminder_id": new_rem.id}


@router.post("/submission/{sid}/material-missing")
def send_material_missing_by_submission(
    sid: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    from ..models import ChecklistSubmission
    sub = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == sid).first()
    if not sub:
        raise HTTPException(status_code=404, detail="提交记录不存在")
    new_rem = Reminder(
        type=ReminderType.MATERIAL_MISSING,
        recipient_id=sub.submitter_id,
        sender_id=current.id,
        submission_id=sub.id,
        title=f"材料缺失提醒：{sub.contract_name}",
        content=f"您提交的《{sub.contract_name}》合规检查中存在材料缺失，请尽快补充相关证明材料。",
        status=ReminderStatus.UNREAD,
    )
    db.add(new_rem)
    db.commit()
    return {"ok": True, "reminder_id": new_rem.id}
