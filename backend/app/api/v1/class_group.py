from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.class_group import ClassGroup, ClassStatus, ClassEnrollment
from app.models.user import User, Campus
from app.models.student import Student
from app.schemas.common import (
    ClassGroupCreate, ClassGroupUpdate, ClassGroupResponse, ClassListResponse,
)

router = APIRouter()


def _generate_class_code(db: Session) -> str:
    prefix = f"CLS{date.today().strftime('%Y%m')}"
    last = db.query(ClassGroup).order_by(ClassGroup.id.desc()).first()
    seq = (last.id + 1) if last else 1
    return f"{prefix}{seq:04d}"


@router.get("", response_model=ClassListResponse)
def list_classes(
    campus_id: Optional[int] = Query(None),
    head_teacher_id: Optional[int] = Query(None),
    status: Optional[ClassStatus] = Query(None),
    major: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(ClassGroup)
    if campus_id:
        query = query.filter(ClassGroup.campus_id == campus_id)
    if head_teacher_id:
        query = query.filter(ClassGroup.head_teacher_id == head_teacher_id)
    if status:
        query = query.filter(ClassGroup.status == status)
    if major:
        query = query.filter(ClassGroup.major == major)
    if keyword:
        query = query.filter(
            (ClassGroup.name.like(f"%{keyword}%")) |
            (ClassGroup.class_code.like(f"%{keyword}%"))
        )
    total = query.count()
    items = query.order_by(ClassGroup.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    responses = []
    for c in items:
        fill_rate = round(c.current_students / c.max_students * 100, 2) if c.max_students else 0
        responses.append(ClassGroupResponse(
            **{col.name: getattr(c, col.name) for col in c.__table__.columns},
            campus_name=c.campus.name if c.campus else None,
            head_teacher_name=c.head_teacher.real_name if c.head_teacher else None,
            fill_rate=fill_rate,
        ))
    return ClassListResponse(total=total, items=responses)


@router.get("/{class_id}", response_model=ClassGroupResponse)
def get_class(class_id: int, db: Session = Depends(get_db)):
    c = db.query(ClassGroup).filter(ClassGroup.id == class_id).first()
    if not c:
        raise HTTPException(404, "班级不存在")
    fill_rate = round(c.current_students / c.max_students * 100, 2) if c.max_students else 0
    return ClassGroupResponse(
        **{col.name: getattr(c, col.name) for col in c.__table__.columns},
        campus_name=c.campus.name if c.campus else None,
        head_teacher_name=c.head_teacher.real_name if c.head_teacher else None,
        fill_rate=fill_rate,
    )


@router.post("", response_model=ClassGroupResponse)
def create_class(data: ClassGroupCreate, db: Session = Depends(get_db)):
    c = ClassGroup(
        **data.model_dump(),
        class_code=_generate_class_code(db),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    fill_rate = round(c.current_students / c.max_students * 100, 2) if c.max_students else 0
    return ClassGroupResponse(
        **{col.name: getattr(c, col.name) for col in c.__table__.columns},
        campus_name=c.campus.name if c.campus else None,
        head_teacher_name=c.head_teacher.real_name if c.head_teacher else None,
        fill_rate=fill_rate,
    )


@router.put("/{class_id}", response_model=ClassGroupResponse)
def update_class(class_id: int, data: ClassGroupUpdate, db: Session = Depends(get_db)):
    c = db.query(ClassGroup).filter(ClassGroup.id == class_id).first()
    if not c:
        raise HTTPException(404, "班级不存在")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(c, key, value)
    c.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(c)
    fill_rate = round(c.current_students / c.max_students * 100, 2) if c.max_students else 0
    return ClassGroupResponse(
        **{col.name: getattr(c, col.name) for col in c.__table__.columns},
        campus_name=c.campus.name if c.campus else None,
        head_teacher_name=c.head_teacher.real_name if c.head_teacher else None,
        fill_rate=fill_rate,
    )


@router.post("/{class_id}/students/{student_id}")
def enroll_student(class_id: int, student_id: int, allocated_hours: int = 100, db: Session = Depends(get_db)):
    c = db.query(ClassGroup).filter(ClassGroup.id == class_id).first()
    s = db.query(Student).filter(Student.id == student_id).first()
    if not c:
        raise HTTPException(404, "班级不存在")
    if not s:
        raise HTTPException(404, "学生不存在")
    existing = db.query(ClassEnrollment).filter_by(class_id=class_id, student_id=student_id).first()
    if existing:
        return {"message": "已在班级中", "enrollment_id": existing.id}
    if c.current_students >= c.max_students:
        raise HTTPException(400, "班级已满")
    enroll = ClassEnrollment(
        class_id=class_id, student_id=student_id,
        allocated_hours=allocated_hours, remaining_hours=allocated_hours,
    )
    db.add(enroll)
    c.current_students = c.current_students + 1
    db.commit()
    return {"message": "报名成功", "enrollment_id": enroll.id, "current_students": c.current_students}


@router.delete("/{class_id}/students/{student_id}")
def remove_student(class_id: int, student_id: int, db: Session = Depends(get_db)):
    enroll = db.query(ClassEnrollment).filter_by(class_id=class_id, student_id=student_id).first()
    if not enroll:
        raise HTTPException(404, "报名记录不存在")
    c = db.query(ClassGroup).filter(ClassGroup.id == class_id).first()
    db.delete(enroll)
    if c:
        c.current_students = max(0, c.current_students - 1)
    db.commit()
    return {"message": "已移出班级", "current_students": c.current_students if c else 0}


@router.get("/{class_id}/students")
def get_class_students(class_id: int, db: Session = Depends(get_db)):
    enrollments = db.query(ClassEnrollment).filter(ClassEnrollment.class_id == class_id).all()
    results = []
    for e in enrollments:
        s = db.query(Student).filter(Student.id == e.student_id).first()
        if s:
            results.append({
                "enrollment_id": e.id,
                "student_id": s.id,
                "student_no": s.student_no,
                "name": s.name,
                "gender": s.gender.value if s.gender else None,
                "phone": s.phone,
                "major": s.major.value,
                "status": s.status.value,
                "teacher_name": s.teacher.real_name if s.teacher else None,
                "enroll_date": str(e.enroll_date),
                "allocated_hours": e.allocated_hours,
                "used_hours": e.used_hours,
                "remaining_hours": e.remaining_hours,
                "enroll_status": e.status,
            })
    return results
