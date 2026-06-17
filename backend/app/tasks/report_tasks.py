from datetime import datetime, date, timedelta
from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models import (
    ReportRecord, ReportType, ClassGroup, Student,
    CourseSchedule, CourseConsumption, WorkFeedback,
    Notification, Receipt, ReceiptStatus,
)
from app.models.feedback import Homework, HomeworkSubmission, SubmissionStatus
from sqlalchemy import func


@celery_app.task(name="app.tasks.report_tasks.generate_daily_report")
def generate_daily_report():
    db = SessionLocal()
    try:
        today = date.today()
        yesterday = today - timedelta(days=1)
        start_dt = datetime.combine(yesterday, datetime.min.time())
        end_dt = datetime.combine(yesterday, datetime.max.time())

        campuses = db.query(ClassGroup.campus_id).distinct().all()
        campus_ids = [c[0] for c in campuses if c[0]] or [None]

        results = []
        for cid in campus_ids:
            classes_q = db.query(ClassGroup)
            students_q = db.query(Student)
            if cid:
                classes_q = classes_q.filter(ClassGroup.campus_id == cid)
                students_q = students_q.filter(Student.campus_id == cid)
            classes = classes_q.all()
            total_classes = len(classes)
            total_students = students_q.count()
            active_students = students_q.filter(Student.status == "active").count()

            sched_q = db.query(CourseSchedule).filter(
                CourseSchedule.course_date == yesterday
            )
            cons_q = db.query(CourseConsumption).filter(
                CourseConsumption.consumption_date == yesterday
            )
            if cid:
                sched_q = sched_q.join(ClassGroup, CourseSchedule.class_id == ClassGroup.id).filter(ClassGroup.campus_id == cid)
                cons_q = cons_q.join(ClassGroup, CourseConsumption.class_id == ClassGroup.id).filter(ClassGroup.campus_id == cid)
            total_schedules = sched_q.count()
            total_consumptions = cons_q.count()
            total_hours_consumed = cons_q.with_entities(func.coalesce(func.sum(CourseConsumption.hours_consumed), 0)).scalar() or 0

            rates = []
            fill_details = []
            for c in classes:
                if c.max_students and c.max_students > 0:
                    r = c.current_students / c.max_students * 100
                    rates.append(r)
                    fill_details.append({"class_id": c.id, "class_name": c.name, "fill_rate": round(r, 2)})
            average_fill_rate = round(sum(rates) / len(rates), 2) if rates else 0.0

            fb_q = db.query(WorkFeedback).filter(
                WorkFeedback.created_at >= start_dt,
                WorkFeedback.created_at <= end_dt,
            )
            total_feedbacks = fb_q.count()

            notif_q = db.query(Notification).filter(
                Notification.created_at >= start_dt,
                Notification.created_at <= end_dt,
            )
            if cid:
                notif_q = notif_q.filter(Notification.campus_id == cid)
            total_notifications = notif_q.count()

            receipt_q = db.query(Receipt)
            total_rc = receipt_q.count()
            confirmed_rc = receipt_q.filter(Receipt.status == ReceiptStatus.CONFIRMED).count()
            receipt_rate = round(confirmed_rc / total_rc * 100, 2) if total_rc > 0 else 0.0

            hw_sub_q = db.query(HomeworkSubmission).filter(
                HomeworkSubmission.created_at >= start_dt,
                HomeworkSubmission.created_at <= end_dt,
            )
            total_sub = hw_sub_q.count()
            submitted_sub = hw_sub_q.filter(
                HomeworkSubmission.status.in_([SubmissionStatus.SUBMITTED, SubmissionStatus.LATE, SubmissionStatus.GRADED])
            ).count()
            homework_completion_rate = round(submitted_sub / total_sub * 100, 2) if total_sub > 0 else 0.0

            prefix = f"RPT{yesterday.strftime('%Y%m%d')}"
            last = db.query(ReportRecord).order_by(ReportRecord.id.desc()).first()
            seq = (last.id + 1) if last else 1
            rpt = ReportRecord(
                report_code=f"{prefix}{seq:04d}",
                type=ReportType.DAILY,
                title=f"{yesterday} 每日运营报表",
                campus_id=cid,
                period_start=start_dt,
                period_end=end_dt,
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
                summary=f"日报 {yesterday}: {total_classes}班, {total_consumptions}消课, {total_hours_consumed}课时, 平均满班率{average_fill_rate}%",
            )
            db.add(rpt)
            results.append(rpt.report_code)
        db.commit()
        return {"task": "generate_daily_report", "date": str(yesterday), "reports": results}
    finally:
        db.close()


@celery_app.task
def generate_monthly_fill_rate_report(year: int, month: int, campus_id: int = None):
    from app.services.dashboard_service import get_monthly_fill_rate
    db = SessionLocal()
    try:
        from datetime import date as _date
        m = _date(year, month, 1)
        report = get_monthly_fill_rate(db, campus_id, m)

        details_list = []
        for d in report.class_details:
            details_list.append(d.model_dump() if hasattr(d, "model_dump") else d)

        prefix = f"RPTFR{m.strftime('%Y%m')}"
        last = db.query(ReportRecord).order_by(ReportRecord.id.desc()).first()
        seq = (last.id + 1) if last else 1
        rpt = ReportRecord(
            report_code=f"{prefix}{seq:04d}",
            type=ReportType.MONTHLY,
            title=f"{m.strftime('%Y年%m月')} 满班率报表",
            campus_id=campus_id,
            period_start=datetime.combine(m, datetime.min.time()),
            period_end=datetime.combine(_date(year, month, 28), datetime.max.time()),
            average_fill_rate=report.overall_fill_rate,
            class_fill_rates=details_list,
            total_classes=report.total_classes,
            total_students=report.total_students,
            generated_by=1,
            summary=f"满班率: {report.overall_fill_rate}%, 共{report.total_classes}班, {report.total_students}生",
        )
        db.add(rpt)
        db.commit()
        return {"task": "generate_monthly_fill_rate_report", "report_code": rpt.report_code}
    finally:
        db.close()
