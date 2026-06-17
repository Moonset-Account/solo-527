from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import io

from app.core.database import get_db
from app.models.reminder import ReportRecord, ReportType
from app.schemas.dashboard import (
    ReportCreate, ReportResponse, MonthlyFillRateReport,
)
from app.services.dashboard_service import get_monthly_fill_rate

router = APIRouter()


def _gen_code(db: Session) -> str:
    p = f"RPT{datetime.now().strftime('%Y%m%d')}"
    last = db.query(ReportRecord).order_by(ReportRecord.id.desc()).first()
    seq = (last.id + 1) if last else 1
    return f"{p}{seq:04d}"


@router.get("/fill-rate/monthly", response_model=MonthlyFillRateReport)
def get_fill_rate_report(
    campus_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    if year and month:
        m = date(year, month, 1)
    else:
        m = None
    return get_monthly_fill_rate(db, campus_id, m)


@router.get("/fill-rate/monthly/export/xlsx")
def export_fill_rate_report(
    campus_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    import pandas as pd
    report = get_fill_rate_report(campus_id, year if year and month else None)
    import sys
    sys.path.insert(0, "/Volumes/TraeProjects/trae-solo-generated-projects/work-0252/backend")
    if year and month:
        from datetime import date as _date
        m = _date(year, month, 1)
        report = get_monthly_fill_rate(db, campus_id, m)
    else:
        report = get_monthly_fill_rate(db, campus_id, None)

    rows = []
    for d in report.class_details:
        rows.append({
            "月份": report.month,
            "校区": report.campus_name or "全部校区",
            "班级ID": d.class_id,
            "班级名称": d.class_name,
            "专业": d.major or "",
            "最大人数": d.max_students,
            "当前人数": d.current_students,
            "满班率(%)": d.fill_rate,
            "本月排课数": d.schedules_count,
            "本月消耗课时": d.consumed_hours,
        })
    df = pd.DataFrame(rows)
    summary_df = pd.DataFrame([{
        "统计项": "整体满班率",
        "数值": f"{report.overall_fill_rate}%",
        "说明": f"共 {report.total_classes} 个班级，{report.total_students} 名学生，生成时间 {report.generated_at}",
    }])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="满班率明细")
        summary_df.to_excel(writer, index=False, sheet_name="汇总")
    output.seek(0)
    filename = f"fill_rate_{report.month}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("", response_model=List[ReportResponse])
def list_reports(
    type: Optional[ReportType] = Query(None),
    campus_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(ReportRecord)
    if type:
        query = query.filter(ReportRecord.type == type)
    if campus_id:
        query = query.filter(ReportRecord.campus_id == campus_id)
    items = query.order_by(ReportRecord.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    return [ReportResponse(
        **{c.name: getattr(r, c.name) for c in r.__table__.columns}
    ) for r in items]


@router.post("", response_model=ReportResponse)
def generate_report(data: ReportCreate, db: Session = Depends(get_db)):
    from app.models.class_group import ClassGroup, ClassEnrollment
    from app.models.schedule import CourseSchedule, CourseConsumption
    from app.models.student import Student
    from app.models.feedback import WorkFeedback, Homework, HomeworkSubmission, SubmissionStatus
    from app.models.notification import Notification, Receipt, ReceiptStatus
    from sqlalchemy import func

    classes = db.query(ClassGroup)
    students = db.query(Student)
    if data.campus_id:
        classes = classes.filter(ClassGroup.campus_id == data.campus_id)
        students = students.filter(Student.campus_id == data.campus_id)
    class_list = classes.all()
    total_classes = len(class_list)
    total_students = students.count()
    active_students = students.filter(Student.status == "active").count()

    sched_q = db.query(CourseSchedule)
    cons_q = db.query(CourseConsumption)
    if data.campus_id:
        sched_q = sched_q.join(ClassGroup, CourseSchedule.class_id == ClassGroup.id).filter(ClassGroup.campus_id == data.campus_id)
        cons_q = cons_q.join(ClassGroup, CourseConsumption.class_id == ClassGroup.id).filter(ClassGroup.campus_id == data.campus_id)
    sched_q = sched_q.filter(
        CourseSchedule.course_date >= data.period_start.date(),
        CourseSchedule.course_date <= data.period_end.date(),
    )
    cons_q = cons_q.filter(
        CourseConsumption.consumption_date >= data.period_start.date(),
        CourseConsumption.consumption_date <= data.period_end.date(),
    )
    total_schedules = sched_q.count()
    total_consumptions = cons_q.count()
    total_hours_consumed = cons_q.with_entities(func.coalesce(func.sum(CourseConsumption.hours_consumed), 0)).scalar() or 0

    rates = []
    fill_details = []
    for c in class_list:
        if c.max_students and c.max_students > 0:
            r = c.current_students / c.max_students * 100
            rates.append(r)
            fill_details.append({"class_id": c.id, "class_name": c.name, "fill_rate": round(r, 2)})
    average_fill_rate = round(sum(rates) / len(rates), 2) if rates else 0.0

    fb_q = db.query(WorkFeedback).filter(
        WorkFeedback.created_at >= data.period_start,
        WorkFeedback.created_at <= data.period_end,
    )
    total_feedbacks = fb_q.count()

    notif_q = db.query(Notification).filter(
        Notification.created_at >= data.period_start,
        Notification.created_at <= data.period_end,
    )
    if data.campus_id:
        notif_q = notif_q.filter(Notification.campus_id == data.campus_id)
    total_notifications = notif_q.count()

    receipt_q = db.query(Receipt)
    total_rc = receipt_q.count()
    confirmed_rc = receipt_q.filter(Receipt.status == ReceiptStatus.CONFIRMED).count()
    receipt_rate = round(confirmed_rc / total_rc * 100, 2) if total_rc > 0 else 0.0

    hw_sub_q = db.query(HomeworkSubmission).filter(
        HomeworkSubmission.created_at >= data.period_start,
        HomeworkSubmission.created_at <= data.period_end,
    )
    total_sub = hw_sub_q.count()
    submitted_sub = hw_sub_q.filter(
        HomeworkSubmission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.LATE, SubmissionStatus.GRADED])
    ).count()
    homework_completion_rate = round(submitted_sub / total_sub * 100, 2) if total_sub > 0 else 0.0

    rpt = ReportRecord(
        **data.model_dump(),
        report_code=_gen_code(db),
        total_classes=total_classes,
        total_schedules=total_schedules,
        total_consumptions=total_consumptions,
        total_hours_consumed=total_hours_consumed,
        average_fill_rate=average_fill_rate,
        class_fill_rates=fill_details,
        total_students=total_students,
        active_students=active_students,
        homework_completion_rate=homework_completion_rate,
        total_feedbacks=total_feedbacks,
        total_notifications=total_notifications,
        receipt_rate=receipt_rate,
        generated_by=1,
    )
    db.add(rpt)
    db.commit()
    db.refresh(rpt)
    return ReportResponse(
        **{c.name: getattr(rpt, c.name) for c in rpt.__table__.columns}
    )
