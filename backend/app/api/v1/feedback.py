from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import io

from app.core.database import get_db
from app.models.feedback import (
    WorkFeedback, Homework, HomeworkSubmission, FeedbackType,
    HomeworkStatus, SubmissionStatus,
)
from app.models.class_group import ClassGroup
from app.models.student import Student
from app.models.user import User
from app.schemas.common import (
    FeedbackCreate, FeedbackUpdate, FeedbackResponse, FeedbackListResponse,
    HomeworkCreate, HomeworkUpdate, HomeworkResponse,
    SubmissionCreate, SubmissionGrade, SubmissionResponse,
)

router = APIRouter()


def _gen_code(prefix, db, model, code_field):
    p = f"{prefix}{datetime.now().strftime('%Y%m%d')}"
    last = db.query(model).order_by(model.id.desc()).first()
    seq = (last.id + 1) if last else 1
    return f"{p}{seq:04d}"


@router.get("/works", response_model=FeedbackListResponse)
def list_feedbacks(
    class_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    type: Optional[FeedbackType] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(WorkFeedback)
    if class_id:
        query = query.filter(WorkFeedback.class_id == class_id)
    if student_id:
        query = query.filter(WorkFeedback.student_id == student_id)
    if teacher_id:
        query = query.filter(WorkFeedback.teacher_id == teacher_id)
    if type:
        query = query.filter(WorkFeedback.type == type)
    if start_date:
        query = query.filter(WorkFeedback.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(WorkFeedback.created_at <= datetime.combine(end_date, datetime.max.time()))
    total = query.count()
    items = query.order_by(WorkFeedback.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    responses = []
    for f in items:
        responses.append(FeedbackResponse(
            **{c.name: getattr(f, c.name) for c in f.__table__.columns},
            class_name=f.class_group.name if hasattr(f, "class_group") and f.class_group else (ClassGroup.name if False else None),
            student_name=f.student.name if f.student else None,
            teacher_name=f.teacher.real_name if f.teacher else None,
        ))
    return FeedbackListResponse(total=total, items=responses)


@router.post("/works", response_model=FeedbackResponse)
def create_feedback(data: FeedbackCreate, db: Session = Depends(get_db)):
    f = WorkFeedback(
        **data.model_dump(),
        feedback_code=_gen_code("FB", db, WorkFeedback, "feedback_code"),
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return FeedbackResponse(
        **{c.name: getattr(f, c.name) for c in f.__table__.columns},
        student_name=f.student.name if f.student else None,
        teacher_name=f.teacher.real_name if f.teacher else None,
    )


@router.put("/works/{fb_id}", response_model=FeedbackResponse)
def update_feedback(fb_id: int, data: FeedbackUpdate, db: Session = Depends(get_db)):
    f = db.query(WorkFeedback).filter(WorkFeedback.id == fb_id).first()
    if not f:
        raise HTTPException(404, "反馈不存在")
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "parent_reply" and value and not f.parent_reply_at:
            f.parent_reply_at = datetime.utcnow()
        setattr(f, key, value)
    f.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(f)
    return FeedbackResponse(
        **{c.name: getattr(f, c.name) for c in f.__table__.columns},
        student_name=f.student.name if f.student else None,
        teacher_name=f.teacher.real_name if f.teacher else None,
    )


@router.get("/homeworks", response_model=List[HomeworkResponse])
def list_homeworks(
    class_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    status: Optional[HomeworkStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Homework)
    if class_id:
        query = query.filter(Homework.class_id == class_id)
    if teacher_id:
        query = query.filter(Homework.teacher_id == teacher_id)
    if status:
        query = query.filter(Homework.status == status)
    items = query.order_by(Homework.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    return [HomeworkResponse(
        **{c.name: getattr(hw, c.name) for c in hw.__table__.columns},
        class_name=hw.class_group.name if hw.class_group else None,
        teacher_name=hw.teacher.real_name if hasattr(hw, "teacher") and hw.teacher else None,
    ) for hw in items]


@router.post("/homeworks", response_model=HomeworkResponse)
def create_homework(data: HomeworkCreate, db: Session = Depends(get_db)):
    hw = Homework(
        **data.model_dump(),
        homework_code=_gen_code("HW", db, Homework, "homework_code"),
    )
    if hw.status == HomeworkStatus.PUBLISHED and not hw.publish_date:
        hw.publish_date = datetime.utcnow()
    db.add(hw)
    db.flush()

    enrollments = db.query(ClassEnrollment).filter(ClassEnrollment.class_id == hw.class_id).all() if ClassEnrollment else []
    from app.models.class_group import ClassEnrollment
    enrollments = db.query(ClassEnrollment).filter(ClassEnrollment.class_id == hw.class_id).all()
    for en in enrollments:
        sub = HomeworkSubmission(
            homework_id=hw.id,
            student_id=en.student_id,
            status=SubmissionStatus.NOT_SUBMITTED,
        )
        db.add(sub)
    hw.total_submissions = len(enrollments)

    db.commit()
    db.refresh(hw)
    return HomeworkResponse(
        **{c.name: getattr(hw, c.name) for c in hw.__table__.columns},
        class_name=hw.class_group.name if hw.class_group else None,
    )


@router.put("/homeworks/{hw_id}", response_model=HomeworkResponse)
def update_homework(hw_id: int, data: HomeworkUpdate, db: Session = Depends(get_db)):
    hw = db.query(Homework).filter(Homework.id == hw_id).first()
    if not hw:
        raise HTTPException(404, "作业不存在")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(hw, key, value)
    if data.status == HomeworkStatus.PUBLISHED and not hw.publish_date:
        hw.publish_date = datetime.utcnow()
    hw.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(hw)
    return HomeworkResponse(
        **{c.name: getattr(hw, c.name) for c in hw.__table__.columns},
        class_name=hw.class_group.name if hw.class_group else None,
    )


@router.get("/homeworks/{hw_id}/submissions", response_model=List[SubmissionResponse])
def list_submissions(hw_id: int, status: Optional[SubmissionStatus] = Query(None), db: Session = Depends(get_db)):
    hw = db.query(Homework).filter(Homework.id == hw_id).first()
    if not hw:
        raise HTTPException(404, "作业不存在")
    q = db.query(HomeworkSubmission).filter(HomeworkSubmission.homework_id == hw_id)
    if status:
        q = q.filter(HomeworkSubmission.status == status)
    items = q.order_by(HomeworkSubmission.submit_time.desc()).all()
    return [SubmissionResponse(
        **{c.name: getattr(s, c.name) for c in s.__table__.columns},
        homework_title=hw.title,
        student_name=s.student.name if s.student else None,
    ) for s in items]


@router.post("/submissions", response_model=SubmissionResponse)
def submit_homework(data: SubmissionCreate, db: Session = Depends(get_db)):
    sub = db.query(HomeworkSubmission).filter_by(
        homework_id=data.homework_id, student_id=data.student_id
    ).first()
    if not sub:
        raise HTTPException(404, "作业提交记录不存在，请先创建作业")
    hw = db.query(Homework).filter(Homework.id == data.homework_id).first()
    now = datetime.utcnow()
    if hw and hw.deadline and now > hw.deadline and not hw.allow_late_submission:
        raise HTTPException(400, "已超过截止时间，不允许补交")
    is_late = hw and hw.deadline and now > hw.deadline
    sub.submit_time = now
    sub.content = data.content
    sub.attachments = data.attachments
    sub.status = SubmissionStatus.LATE if is_late else SubmissionStatus.SUBMITTED
    if is_late:
        sub.resubmit_count = (sub.resubmit_count or 0) + 1
    db.commit()
    db.refresh(sub)
    return SubmissionResponse(
        **{c.name: getattr(sub, c.name) for c in sub.__table__.columns},
        homework_title=hw.title if hw else None,
        student_name=sub.student.name if sub.student else None,
    )


@router.post("/submissions/{sub_id}/grade", response_model=SubmissionResponse)
def grade_submission(sub_id: int, data: SubmissionGrade, db: Session = Depends(get_db)):
    sub = db.query(HomeworkSubmission).filter(HomeworkSubmission.id == sub_id).first()
    if not sub:
        raise HTTPException(404, "提交记录不存在")
    sub.score = data.score
    sub.feedback = data.feedback
    sub.status = data.status
    sub.graded_at = datetime.utcnow()
    sub.graded_by = 1
    db.commit()
    db.refresh(sub)
    return SubmissionResponse(
        **{c.name: getattr(sub, c.name) for c in sub.__table__.columns},
        student_name=sub.student.name if sub.student else None,
    )


@router.get("/works/export/xlsx")
def export_feedbacks(
    start_date: date = Query(...),
    end_date: date = Query(...),
    class_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    import pandas as pd
    query = db.query(WorkFeedback).filter(
        WorkFeedback.created_at >= datetime.combine(start_date, datetime.min.time()),
        WorkFeedback.created_at <= datetime.combine(end_date, datetime.max.time()),
    )
    if class_id:
        query = query.filter(WorkFeedback.class_id == class_id)
    items = query.all()
    rows = []
    for f in items:
        rows.append({
            "反馈编号": f.feedback_code,
            "类型": f.type.value,
            "学生": f.student.name if f.student else "",
            "教师": f.teacher.real_name if f.teacher else "",
            "标题": f.title,
            "内容": f.content,
            "分数": f.score or "",
            "等级": f.level or "",
            "优点": f.strengths or "",
            "不足": f.weaknesses or "",
            "建议": f.suggestions or "",
            "家长已查看": "是" if f.parent_seen else "否",
            "家长回复": f.parent_reply or "",
            "创建时间": str(f.created_at),
        })
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="作品反馈")
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="feedbacks_{start_date}_{end_date}.xlsx"'},
    )
