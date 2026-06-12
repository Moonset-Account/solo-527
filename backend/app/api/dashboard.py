from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, datetime, timedelta
from typing import List
from ..core.database import get_db
from ..core.security import get_current_user
from ..schemas.dashboard import (
    DashboardResponse, DashboardStats, TodoItem, AbnormalItem,
    TrendData, TrendPoint, RiskBoard, RiskBoardItem,
)
from ..models import (
    User, ChecklistSubmission, ChecklistStatus, ComplianceGap, GapStatus, GapSeverity,
    Assignment, AssignmentStatus, Reminder, ReminderStatus,
)

router = APIRouter()


def _days_left(d: date | None) -> int | None:
    if not d:
        return None
    return (d - date.today()).days


@router.get("", response_model=DashboardResponse)
def dashboard(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    today = date.today()

    # ---------- stats ----------
    todo_count = 0
    # 分派给我的
    my_lawyer = db.query(Assignment).filter(
        Assignment.lawyer_id == current.id,
        Assignment.status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.LAWYER_PROCESSING]),
    ).count()
    my_reviewer = db.query(Assignment).filter(
        Assignment.reviewer_id == current.id,
        Assignment.status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.LAWYER_DONE, AssignmentStatus.REVIEWER_PROCESSING]),
    ).count()
    todo_count += my_lawyer + my_reviewer
    # 合规经理待分派
    if current.role in ("admin", "compliance_manager"):
        unassigned = db.query(ChecklistSubmission).filter(
            ChecklistSubmission.status == ChecklistStatus.SUBMITTED,
            ~ChecklistSubmission.assignment.has(),
        ).count()
        todo_count += unassigned
    # 我的待整改缺口
    my_gaps = db.query(ComplianceGap).filter(
        ComplianceGap.remediation_owner_id == current.id,
        ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
    ).count()
    todo_count += my_gaps

    gap_open_count = db.query(ComplianceGap).filter(
        ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
    ).count()
    abnormal_count = db.query(ComplianceGap).filter(
        ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
        ComplianceGap.severity.in_([GapSeverity.CRITICAL, GapSeverity.HIGH]),
    ).count()
    overdue_count = db.query(ComplianceGap).filter(
        ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
        ComplianceGap.remediation_deadline < today,
    ).count()
    submission_total = db.query(ChecklistSubmission).count()
    gap_total = db.query(ComplianceGap).count()

    closed_subs = db.query(ChecklistSubmission).filter(
        ChecklistSubmission.status.in_([ChecklistStatus.REVIEWER_APPROVED, ChecklistStatus.CLOSED]),
    ).count()
    completed_rate = round(100 * closed_subs / max(submission_total, 1), 2)

    all_with_deadline = db.query(ComplianceGap).filter(ComplianceGap.actual_resolve_date != None).all()
    if all_with_deadline:
        ontime = sum(1 for g in all_with_deadline if g.remediation_deadline and g.actual_resolve_date <= g.remediation_deadline)
        on_time_rate = round(100 * ontime / len(all_with_deadline), 2)
    else:
        on_time_rate = 0.0

    stats = DashboardStats(
        todo_count=todo_count,
        abnormal_count=abnormal_count,
        overdue_count=overdue_count,
        gap_open_count=gap_open_count,
        submission_total=submission_total,
        gap_total=gap_total,
        completed_rate=completed_rate,
        on_time_rate=on_time_rate,
    )

    # ---------- todos ----------
    todos: List[TodoItem] = []
    if current.role in ("admin", "compliance_manager"):
        for s in db.query(ChecklistSubmission).filter(
            ChecklistSubmission.status == ChecklistStatus.SUBMITTED,
            ~ChecklistSubmission.assignment.has(),
        ).order_by(ChecklistSubmission.submitted_at.desc()).limit(5).all():
            todos.append(TodoItem(
                id=s.id,
                type="待分派",
                title=f"分派律师/复核人：{s.contract_name}",
                deadline=s.deadline,
                priority="high" if s.risk_level in ("critical", "high") else "medium",
                url=f"/assignments?submission_id={s.id}",
                extra={"counterparty": s.counterparty or "", "risk_level": s.risk_level or ""},
            ))
    for a in db.query(Assignment).filter(
        Assignment.lawyer_id == current.id,
        Assignment.status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.LAWYER_PROCESSING]),
    ).limit(5).all():
        s = a.submission
        todos.append(TodoItem(
            id=a.id,
            type="律师审核",
            title=f"律师审核：{s.contract_name}" if s else "律师审核",
            deadline=a.lawyer_deadline,
            priority="high" if a.lawyer_deadline and _days_left(a.lawyer_deadline) is not None and _days_left(a.lawyer_deadline) < 3 else "medium",
            url=f"/assignments/mine",
            extra={"counterparty": s.counterparty if s else ""},
        ))
    for a in db.query(Assignment).filter(
        Assignment.reviewer_id == current.id,
        Assignment.status.in_([AssignmentStatus.LAWYER_DONE, AssignmentStatus.REVIEWER_PROCESSING]),
    ).limit(5).all():
        s = a.submission
        todos.append(TodoItem(
            id=a.id,
            type="复核",
            title=f"复核审核：{s.contract_name}" if s else "复核审核",
            deadline=a.reviewer_deadline,
            priority="high" if a.reviewer_deadline and _days_left(a.reviewer_deadline) is not None and _days_left(a.reviewer_deadline) < 3 else "medium",
            url=f"/assignments/mine",
            extra={},
        ))
    for g in db.query(ComplianceGap).filter(
        ComplianceGap.remediation_owner_id == current.id,
        ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
    ).order_by(ComplianceGap.remediation_deadline.asc().nullslast()).limit(5).all():
        todos.append(TodoItem(
            id=g.id,
            type="整改",
            title=f"整改缺口：{g.description[:40]}...",
            deadline=g.remediation_deadline,
            priority="critical" if g.severity in (GapSeverity.CRITICAL, GapSeverity.HIGH) else "medium",
            url=f"/gaps/{g.id}",
            extra={"severity": g.severity.value},
        ))

    # ---------- abnormals ----------
    abnormals: List[AbnormalItem] = []
    for g in db.query(ComplianceGap).filter(
        ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
        ComplianceGap.severity.in_([GapSeverity.CRITICAL, GapSeverity.HIGH]),
    ).order_by(ComplianceGap.created_at.desc()).limit(10).all():
        abnormals.append(AbnormalItem(
            id=g.id,
            type="高危缺口",
            title=g.submission.contract_name if g.submission else "未知提交",
            description=g.description[:80],
            severity=g.severity.value,
            url=f"/gaps/{g.id}",
        ))
    for g in db.query(ComplianceGap).filter(
        ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
        ComplianceGap.remediation_deadline < today,
    ).order_by(ComplianceGap.remediation_deadline.asc()).limit(5).all():
        dl = _days_left(g.remediation_deadline) or 0
        abnormals.append(AbnormalItem(
            id=g.id,
            type="整改超期",
            title=g.submission.contract_name if g.submission else "未知",
            description=f"超期{abs(dl)}天：{g.description[:50]}",
            severity="critical" if dl < -7 else "high",
            url=f"/gaps/{g.id}",
        ))

    # ---------- trend ----------
    last_14 = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        d_start = datetime.combine(d, datetime.min.time())
        d_end = datetime.combine(d, datetime.max.time())
        sub_count = db.query(ChecklistSubmission).filter(
            ChecklistSubmission.created_at >= d_start,
            ChecklistSubmission.created_at <= d_end,
        ).count()
        gap_count = db.query(ComplianceGap).filter(
            ComplianceGap.created_at >= d_start,
            ComplianceGap.created_at <= d_end,
        ).count()
        compl_count = db.query(ChecklistSubmission).filter(
            ChecklistSubmission.completed_at >= d_start,
            ChecklistSubmission.completed_at <= d_end,
        ).count()
        last_14.append(TrendPoint(
            date=d.isoformat(),
            submission_count=sub_count,
            gap_count=gap_count,
            completed_count=compl_count,
        ))
    by_risk = {}
    for sev in GapSeverity:
        by_risk[sev.value] = db.query(ComplianceGap).filter(
            ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
            ComplianceGap.severity == sev,
        ).count()
    by_status = {}
    for st in ChecklistStatus:
        by_status[st.value] = db.query(ChecklistSubmission).filter(ChecklistSubmission.status == st).count()

    trend = TrendData(last_14_days=last_14, by_risk_level=by_risk, by_status=by_status)

    return DashboardResponse(stats=stats, todos=todos[:10], abnormals=abnormals[:10], trend=trend)


@router.get("/risk-board", response_model=RiskBoard)
def risk_board(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    today = date.today()
    subs = db.query(ChecklistSubmission).filter(
        ChecklistSubmission.status.in_([
            ChecklistStatus.SUBMITTED, ChecklistStatus.UNDER_REVIEW,
            ChecklistStatus.LAWYER_REVIEWED, ChecklistStatus.DRAFT,
        ]),
    ).order_by(ChecklistSubmission.deadline.asc().nullslast()).all()
    items = []
    summary = {"total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0,
               "overdue": 0, "within_3d": 0, "within_7d": 0, "more_than_7d": 0, "no_deadline": 0}
    for s in subs:
        gaps = db.query(ComplianceGap).filter(
            ComplianceGap.submission_id == s.id,
            ComplianceGap.status.in_([GapStatus.OPEN, GapStatus.IN_PROGRESS]),
        ).all()
        critical_cnt = sum(1 for g in gaps if g.severity == GapSeverity.CRITICAL)
        high_cnt = sum(1 for g in gaps if g.severity == GapSeverity.HIGH)
        dl = _days_left(s.deadline)
        rl = s.risk_level or "low"
        summary[rl] = summary.get(rl, 0) + 1
        if dl is None:
            summary["no_deadline"] += 1
        elif dl < 0:
            summary["overdue"] += 1
        elif dl <= 3:
            summary["within_3d"] += 1
        elif dl <= 7:
            summary["within_7d"] += 1
        else:
            summary["more_than_7d"] += 1
        items.append(RiskBoardItem(
            id=s.id,
            contract_name=s.contract_name,
            counterparty=s.counterparty or "",
            risk_level=rl,
            deadline=s.deadline,
            days_left=dl,
            status=s.status.value,
            gap_count=len(gaps),
            critical_gap_count=critical_cnt,
            high_gap_count=high_cnt,
        ))
    summary["total"] = len(items)
    return RiskBoard(total=len(items), items=items, summary=summary)
