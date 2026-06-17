from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import io

from app.core.database import get_db
from app.models.notification import (
    Notification, Receipt, NotificationType, NotificationPriority, ReceiptStatus,
)
from app.models.class_group import ClassGroup
from app.models.user import User
from app.models.student import Student, StudentParent
from app.schemas.common import (
    NotificationCreate, NotificationUpdate, NotificationResponse,
    ReceiptResponse,
)

router = APIRouter()


def _gen_code(prefix, db, model):
    p = f"{prefix}{datetime.now().strftime('%Y%m%d')}"
    last = db.query(model).order_by(model.id.desc()).first()
    seq = (last.id + 1) if last else 1
    return f"{p}{seq:04d}"


@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    class_id: Optional[int] = Query(None),
    campus_id: Optional[int] = Query(None),
    publisher_id: Optional[int] = Query(None),
    type: Optional[NotificationType] = Query(None),
    is_draft: Optional[bool] = Query(None),
    require_receipt: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Notification)
    if class_id:
        query = query.filter(Notification.class_id == class_id)
    if campus_id:
        query = query.filter(Notification.campus_id == campus_id)
    if publisher_id:
        query = query.filter(Notification.publisher_id == publisher_id)
    if type:
        query = query.filter(Notification.type == type)
    if is_draft is not None:
        query = query.filter(Notification.is_draft == is_draft)
    if require_receipt is not None:
        query = query.filter(Notification.require_receipt == require_receipt)
    items = query.order_by(Notification.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    return [NotificationResponse(
        **{c.name: getattr(n, c.name) for c in n.__table__.columns},
        class_name=n.class_group.name if n.class_group else None,
        publisher_name=n.publisher.real_name if hasattr(n, "publisher") and n.publisher else None,
    ) for n in items]


@router.post("", response_model=NotificationResponse)
def create_notification(data: NotificationCreate, db: Session = Depends(get_db)):
    n = Notification(
        **data.model_dump(),
        notification_code=_gen_code("NF", db, Notification),
        publisher_id=1,
    )
    if not n.is_draft and not n.publish_time:
        n.publish_time = datetime.utcnow()
    db.add(n)
    db.flush()

    if n.require_receipt:
        target_users = set()
        if n.class_id:
            enrolls = db.query(StudentParent).join(
                Student, StudentParent.student_id == Student.id
            ).join(
                ClassEnrollment, Student.id == ClassEnrollment.student_id
            ).filter(ClassEnrollment.class_id == n.class_id).all()
            from app.models.class_group import ClassEnrollment
            enrolls = db.query(StudentParent).join(
                Student, StudentParent.student_id == Student.id
            ).join(
                ClassEnrollment, Student.id == ClassEnrollment.student_id
            ).filter(ClassEnrollment.class_id == n.class_id).all()
            for sp in enrolls:
                target_users.add((sp.parent_id, sp.student_id))
        if not target_users:
            principals = db.query(User).filter(User.role == "principal").all()
            for p in principals:
                target_users.add((p.id, None))
        for uid, sid in target_users:
            rc = Receipt(
                notification_id=n.id, user_id=uid, student_id=sid,
                status=ReceiptStatus.PENDING,
            )
            db.add(rc)
        n.total_receipts = len(target_users)

    db.commit()
    db.refresh(n)
    return NotificationResponse(
        **{c.name: getattr(n, c.name) for c in n.__table__.columns},
        class_name=n.class_group.name if n.class_group else None,
    )


@router.put("/{nf_id}", response_model=NotificationResponse)
def update_notification(nf_id: int, data: NotificationUpdate, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == nf_id).first()
    if not n:
        raise HTTPException(404, "通知不存在")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(n, key, value)
    if data.is_draft is False and not n.publish_time:
        n.publish_time = datetime.utcnow()
    n.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(n)
    return NotificationResponse(
        **{c.name: getattr(n, c.name) for c in n.__table__.columns},
        class_name=n.class_group.name if n.class_group else None,
    )


@router.get("/{nf_id}/receipts", response_model=List[ReceiptResponse])
def list_receipts(nf_id: int, status: Optional[ReceiptStatus] = Query(None), db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == nf_id).first()
    if not n:
        raise HTTPException(404, "通知不存在")
    q = db.query(Receipt).filter(Receipt.notification_id == nf_id)
    if status:
        q = q.filter(Receipt.status == status)
    items = q.order_by(Receipt.created_at.desc()).all()
    results = []
    for r in items:
        u = db.query(User).filter(User.id == r.user_id).first()
        s = db.query(Student).filter(Student.id == r.student_id).first() if r.student_id else None
        results.append(ReceiptResponse(
            **{c.name: getattr(r, c.name) for c in r.__table__.columns},
            user_name=u.real_name if u else None,
            student_name=s.name if s else None,
        ))
    return results


@router.post("/{nf_id}/receipts/{rc_id}/confirm")
def confirm_receipt(nf_id: int, rc_id: int, remark: Optional[str] = None, db: Session = Depends(get_db)):
    rc = db.query(Receipt).filter(Receipt.id == rc_id, Receipt.notification_id == nf_id).first()
    if not rc:
        raise HTTPException(404, "回执不存在")
    rc.status = ReceiptStatus.CONFIRMED
    rc.confirmed_at = datetime.utcnow()
    rc.remark = remark
    n = db.query(Notification).filter(Notification.id == nf_id).first()
    if n:
        n.confirmed_receipts = (n.confirmed_receipts or 0) + 1
    db.commit()
    return {"message": "回执已确认", "confirmed_at": str(rc.confirmed_at)}


@router.get("/export/receipts/{nf_id}/xlsx")
def export_receipts(nf_id: int, db: Session = Depends(get_db)):
    import pandas as pd
    n = db.query(Notification).filter(Notification.id == nf_id).first()
    if not n:
        raise HTTPException(404, "通知不存在")
    receipts = db.query(Receipt).filter(Receipt.notification_id == nf_id).all()
    rows = []
    for r in receipts:
        u = db.query(User).filter(User.id == r.user_id).first()
        s = db.query(Student).filter(Student.id == r.student_id).first() if r.student_id else None
        rows.append({
            "通知编号": n.notification_code,
            "通知标题": n.title,
            "回执人": u.real_name if u else "",
            "关联学生": s.name if s else "",
            "状态": r.status.value,
            "确认时间": str(r.confirmed_at) if r.confirmed_at else "",
            "备注": r.remark or "",
        })
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="回执记录")
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="receipts_{nf_id}.xlsx"'},
    )
