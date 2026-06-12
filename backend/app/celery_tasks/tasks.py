from .celery_app import celery_app
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from ..core.database import SessionLocal
from ..models import (
    ComplianceGap, GapStatus, GapSeverity, UserRole, User,
    ChecklistSubmission, ChecklistStatus, AnswerStatus, ChecklistAnswer,
    Reminder, ReminderType, ReminderStatus,
)


def _insert_reminder(db: Session, type_: ReminderType, recipient_id: int, title: str, content: str,
                     submission_id=None, gap_id=None, related_data=None, sender_id=None):
    exists = db.query(Reminder).filter(
        Reminder.type == type_,
        Reminder.recipient_id == recipient_id,
        Reminder.submission_id == submission_id,
        Reminder.gap_id == gap_id,
        Reminder.status == ReminderStatus.UNREAD,
    ).first()
    if exists:
        return None
    rem = Reminder(
        type=type_,
        recipient_id=recipient_id,
        sender_id=sender_id,
        submission_id=submission_id,
        gap_id=gap_id,
        title=title,
        content=content,
        status=ReminderStatus.UNREAD,
        related_data=related_data or {},
    )
    db.add(rem)
    return rem


@celery_app.task(name="app.celery_tasks.tasks.deadline_patrol_task")
def deadline_patrol_task():
    db = SessionLocal()
    try:
        today = date.today()
        in_3d = today + timedelta(days=3)
        in_7d = today + timedelta(days=7)

        managers = [u.id for u in db.query(User).filter(User.role == UserRole.COMPLIANCE_MANAGER).all()]

        # 缺口整改超期
        overdue = db.query(ComplianceGap).filter(
            ComplianceGap.remediation_deadline < today,
            ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
        ).all()
        for g in overdue:
            dl = (today - g.remediation_deadline).days
            owners = [g.remediation_owner_id] if g.remediation_owner_id else []
            for rid in set(owners + managers):
                if not rid:
                    continue
                _insert_reminder(
                    db, ReminderType.DEADLINE_OVERDUE, rid,
                    f"整改超期{dl}天：{g.description[:30]}",
                    f"缺口ID {g.id} 已超期 {dl} 天，请立即跟进处理。关联提交：{g.submission.contract_name if g.submission else ''}",
                    gap_id=g.id, submission_id=g.submission_id,
                    related_data={"overdue_days": dl},
                )

        # 缺口即将到期（3天内）
        near_3d = db.query(ComplianceGap).filter(
            ComplianceGap.remediation_deadline >= today,
            ComplianceGap.remediation_deadline <= in_3d,
            ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
        ).all()
        for g in near_3d:
            days = (g.remediation_deadline - today).days
            owners = [g.remediation_owner_id] if g.remediation_owner_id else []
            for rid in set(owners + managers):
                if not rid:
                    continue
                _insert_reminder(
                    db, ReminderType.DEADLINE_APPROACHING, rid,
                    f"整改仅剩{days}天：{g.description[:30]}",
                    f"缺口ID {g.id} 将在 {days} 天后到期，请抓紧处理。",
                    gap_id=g.id, submission_id=g.submission_id,
                    related_data={"days_left": days},
                )

        # 提交期限巡检：合同审查期限
        sub_overdue = db.query(ChecklistSubmission).filter(
            ChecklistSubmission.deadline < today,
            ChecklistSubmission.status.in_([
                ChecklistStatus.SUBMITTED, ChecklistStatus.UNDER_REVIEW, ChecklistStatus.LAWYER_REVIEWED,
            ]),
        ).all()
        for s in sub_overdue:
            for rid in managers:
                _insert_reminder(
                    db, ReminderType.DEADLINE_OVERDUE, rid,
                    f"合同审查超期：{s.contract_name}",
                    f"《{s.contract_name}》审查已超期 {abs((today - s.deadline).days)} 天，状态：{s.status.value}",
                    submission_id=s.id,
                )

        db.commit()
        return {"overdue_gaps": len(overdue), "near_gaps": len(near_3d), "sub_overdue": len(sub_overdue)}
    finally:
        db.close()


@celery_app.task(name="app.celery_tasks.tasks.material_missing_check_task")
def material_missing_check_task():
    db = SessionLocal()
    try:
        managers = [u.id for u in db.query(User).filter(User.role == UserRole.COMPLIANCE_MANAGER).all()]

        pending_answers = db.query(ChecklistAnswer).join(
            ChecklistSubmission, ChecklistAnswer.submission_id == ChecklistSubmission.id
        ).filter(
            ChecklistAnswer.status == AnswerStatus.PENDING,
            ChecklistSubmission.status.in_([ChecklistStatus.DRAFT, ChecklistStatus.SUBMITTED]),
        ).all()

        missing_by_sub = {}
        for a in pending_answers:
            if a.submission_id not in missing_by_sub:
                missing_by_sub[a.submission_id] = 0
            missing_by_sub[a.submission_id] += 1

        for sid, cnt in missing_by_sub.items():
            sub = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == sid).first()
            if not sub or cnt < 2:
                continue
            # 通知合规经理
            for rid in managers:
                _insert_reminder(
                    db, ReminderType.MATERIAL_MISSING, rid,
                    f"材料缺失预警：{sub.contract_name}",
                    f"《{sub.contract_name}》存在 {cnt} 项待补充材料/未答复项，请提醒提交人及时完善。",
                    submission_id=sid,
                    related_data={"missing_count": cnt},
                )
            # 通知提交人
            _insert_reminder(
                db, ReminderType.MATERIAL_MISSING, sub.submitter_id,
                f"您提交的《{sub.contract_name}》需补充材料",
                f"您有 {cnt} 项检查项尚未完成，请尽快补充证明材料并完善答复。",
                submission_id=sid,
                related_data={"missing_count": cnt},
            )

        db.commit()
        return {"submissions_alerted": len(missing_by_sub)}
    finally:
        db.close()


@celery_app.task(name="app.celery_tasks.tasks.send_material_missing_manual")
def send_material_missing_manual(submission_id: int, operator_id: int):
    db = SessionLocal()
    try:
        sub = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == submission_id).first()
        if not sub:
            return {"error": "submission not found"}
        _insert_reminder(
            db, ReminderType.MATERIAL_MISSING, sub.submitter_id,
            f"请补充《{sub.contract_name}》的相关材料",
            f"合规经理要求您补充提交《{sub.contract_name}》合规检查中的证明材料。",
            submission_id=submission_id,
            sender_id=operator_id,
        )
        db.commit()
        return {"ok": True, "recipient": sub.submitter_id}
    finally:
        db.close()
