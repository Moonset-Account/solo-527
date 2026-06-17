from datetime import date, datetime, time, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import io

from app.core.database import get_db
from app.services import schedule_service
from app.models.schedule import ScheduleStatus, ConsumptionStatus, AttendanceStatus
from app.schemas.schedule import (
    ScheduleCreate, ScheduleUpdate, ScheduleResponse, ScheduleDetail,
    ScheduleListResponse, ScheduleCalendarItem,
    ConsumptionCreate, ConsumptionBatchCreate, ConsumptionUpdate,
    ConsumptionResponse, ConsumptionDetail, ConsumptionListResponse,
    ConsumptionStats, ScheduleFillRate,
)

router = APIRouter()


@router.get("", response_model=ScheduleListResponse)
def list_schedules(
    campus_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[ScheduleStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    items, total = schedule_service.list_schedules(
        db, campus_id, class_id, teacher_id, start_date, end_date, status,
        (page - 1) * page_size, page_size,
    )
    return ScheduleListResponse(total=total, items=items)


@router.get("/calendar", response_model=List[ScheduleCalendarItem])
def get_calendar(
    start: date = Query(...),
    end: date = Query(...),
    campus_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    return schedule_service.get_calendar_schedules(db, start, end, campus_id, class_id, teacher_id)


@router.get("/{schedule_id}", response_model=ScheduleDetail)
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    s = schedule_service.get_schedule(db, schedule_id)
    if not s:
        raise HTTPException(404, "排课不存在")
    consumptions_count = len(s.consumptions)
    return ScheduleDetail(
        **{c.name: getattr(s, c.name) for c in s.__table__.columns},
        class_name=s.class_group.name if s.class_group else None,
        teacher_name=s.teacher.real_name if s.teacher else None,
        consumptions_count=consumptions_count,
    )


@router.post("", response_model=ScheduleResponse)
def create_schedule(data: ScheduleCreate, db: Session = Depends(get_db)):
    return schedule_service.create_schedule(db, data, created_by=1)


@router.put("/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(schedule_id: int, data: ScheduleUpdate, db: Session = Depends(get_db)):
    s = schedule_service.update_schedule(db, schedule_id, data, operator_id=1)
    if not s:
        raise HTTPException(404, "排课不存在")
    return s


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    ok = schedule_service.delete_schedule(db, schedule_id, operator_id=1)
    if not ok:
        raise HTTPException(404, "排课不存在")
    return {"message": "操作成功"}


@router.post("/generate-monthly")
def generate_monthly_schedules(
    class_id: int,
    year: int,
    month: int,
    weekdays: List[int] = Query([1, 2, 3, 4, 5], description="1=周一到7=周日"),
    start_time: str = Query("09:00"),
    end_time: str = Query("12:00"),
    teacher_id: Optional[int] = Query(None),
    classroom: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    from app.models.class_group import ClassGroup
    cls = db.query(ClassGroup).filter(ClassGroup.id == class_id).first()
    if not cls:
        raise HTTPException(404, "班级不存在")

    from datetime import date as _date, timedelta as _td
    from calendar import monthrange
    first_day = _date(year, month, 1)
    _, days = monthrange(year, month)
    created = []

    sh, sm = map(int, start_time.split(":"))
    eh, em = map(int, end_time.split(":"))
    duration = (eh * 60 + em) - (sh * 60 + sm)
    hours_per_session = max(1, duration // 60)

    for i in range(days):
        d = first_day + _td(days=i)
        if (d.weekday() + 1) in weekdays:
            topic = f"{cls.name} 日常训练"
            content = f"第{i+1}课: 常规教学训练"
            data = ScheduleCreate(
                class_id=class_id,
                teacher_id=teacher_id or cls.head_teacher_id,
                classroom=classroom or f"画室A-{hash(str(class_id))%3+1}",
                course_date=d,
                start_time=time(sh, sm),
                end_time=time(eh, em),
                duration_minutes=duration,
                topic=topic,
                content=content,
                status=ScheduleStatus.CONFIRMED,
                max_hours_per_student=hours_per_session,
            )
            s = schedule_service.create_schedule(db, data, created_by=1)
            created.append(s.id)
    return {"message": f"成功生成 {len(created)} 条排课", "schedule_ids": created}


@router.get("/consumptions/stats", response_model=List[ConsumptionStats])
def get_consumption_stats(
    start_date: date = Query(...),
    end_date: date = Query(...),
    campus_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    return schedule_service.get_consumption_stats(db, start_date, end_date, campus_id, class_id)


@router.get("/fill-rates", response_model=List[ScheduleFillRate])
def get_fill_rates(
    campus_id: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    if year and month:
        m = date(year, month, 1)
    else:
        m = None
    return schedule_service.get_class_fill_rates(db, campus_id, m)


@router.get("/consumptions", response_model=ConsumptionListResponse)
def list_consumptions(
    campus_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    schedule_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[ConsumptionStatus] = Query(None),
    attendance: Optional[AttendanceStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    items, total = schedule_service.list_consumptions(
        db, campus_id, class_id, student_id, teacher_id, schedule_id,
        start_date, end_date, status, attendance,
        (page - 1) * page_size, page_size,
    )
    return ConsumptionListResponse(total=total, items=items)


@router.get("/consumptions/{consumption_id}", response_model=ConsumptionDetail)
def get_consumption(consumption_id: int, db: Session = Depends(get_db)):
    c = schedule_service.get_consumption(db, consumption_id)
    if not c:
        raise HTTPException(404, "消课记录不存在")
    return ConsumptionDetail(
        **{col.name: getattr(c, col.name) for col in c.__table__.columns},
        student_name=c.student.name if c.student else None,
        student_no=c.student.student_no if c.student else None,
        schedule_topic=c.schedule.topic if c.schedule else None,
        schedule_code=c.schedule.schedule_code if c.schedule else None,
        course_date=c.schedule.course_date if c.schedule else None,
        class_name=c.class_group.name if hasattr(c, "class_group") and c.class_group else (c.schedule.class_group.name if c.schedule and c.schedule.class_group else None),
        attachments=schedule_service.get_attachments(db, "course_consumption", consumption_id),
        remarks=schedule_service.get_remarks(db, "course_consumption", consumption_id),
        history_records=schedule_service.get_history(db, "course_consumption", consumption_id),
    )


@router.post("/consumptions", response_model=ConsumptionResponse)
def create_consumption(data: ConsumptionCreate, db: Session = Depends(get_db)):
    return schedule_service.create_consumption(db, data, operator_id=1)


@router.post("/consumptions/batch", response_model=List[ConsumptionResponse])
def batch_create_consumptions(data: ConsumptionBatchCreate, db: Session = Depends(get_db)):
    return schedule_service.batch_create_consumptions(db, data, operator_id=1)


@router.put("/consumptions/{consumption_id}", response_model=ConsumptionResponse)
def update_consumption(consumption_id: int, data: ConsumptionUpdate, db: Session = Depends(get_db)):
    c = schedule_service.update_consumption(db, consumption_id, data, operator_id=1)
    if not c:
        raise HTTPException(404, "消课记录不存在")
    return c


@router.post("/consumptions/confirm-all/{schedule_id}")
def confirm_all_consumptions(schedule_id: int, db: Session = Depends(get_db)):
    from app.models.schedule import CourseConsumption as CC
    items = db.query(CC).filter(CC.schedule_id == schedule_id, CC.status == ConsumptionStatus.PENDING).all()
    now = datetime.utcnow()
    count = 0
    for item in items:
        item.status = ConsumptionStatus.CONSUMED
        item.confirmed_by = 1
        item.confirmed_at = now
        count += 1
    db.commit()
    return {"confirmed": count, "message": f"批量确认 {count} 条消课记录"}


@router.get("/consumptions/export/xlsx")
def export_consumptions(
    start_date: date = Query(...),
    end_date: date = Query(...),
    campus_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    import pandas as pd
    from app.models import Student, ClassGroup

    items, _ = schedule_service.list_consumptions(
        db, campus_id, class_id, None, None, None, start_date, end_date, None, None, 0, 10000,
    )
    rows = []
    for c in items:
        student = db.query(Student).filter(Student.id == c.student_id).first()
        rows.append({
            "消课编号": c.consumption_code,
            "日期": str(c.consumption_date),
            "学生姓名": student.name if student else "",
            "学号": student.student_no if student else "",
            "课时": c.hours_consumed,
            "状态": c.status.value,
            "出勤": c.attendance.value,
            "备注": c.remark or "",
            "家长确认": "是" if c.parent_verified else "否",
            "创建时间": str(c.created_at),
        })
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="消课记录")
    output.seek(0)
    filename = f"consumptions_{start_date}_{end_date}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
