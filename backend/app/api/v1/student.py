from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.student import Student, StudentStatus, ArtMajor, Gender
from app.models.user import User, Campus
from app.models.class_group import ClassGroup, ClassEnrollment
from app.schemas.common import (
    StudentCreate, StudentUpdate, StudentResponse, StudentListResponse,
)
import uuid

router = APIRouter()


def _generate_student_no(db: Session) -> str:
    prefix = f"STU{date.today().strftime('%Y%m')}"
    last = db.query(Student).order_by(Student.id.desc()).first()
    seq = (last.id + 1) if last else 1
    return f"{prefix}{seq:05d}"


@router.get("", response_model=StudentListResponse)
def list_students(
    campus_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    major: Optional[ArtMajor] = Query(None),
    status: Optional[StudentStatus] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Student)
    if campus_id:
        query = query.filter(Student.campus_id == campus_id)
    if teacher_id:
        query = query.filter(Student.teacher_id == teacher_id)
    if class_id:
        query = query.join(ClassEnrollment, Student.id == ClassEnrollment.student_id).filter(ClassEnrollment.class_id == class_id)
    if major:
        query = query.filter(Student.major == major)
    if status:
        query = query.filter(Student.status == status)
    if keyword:
        query = query.filter(
            (Student.name.like(f"%{keyword}%")) |
            (Student.student_no.like(f"%{keyword}%")) |
            (Student.phone.like(f"%{keyword}%"))
        )
    total = query.count()
    items = query.order_by(Student.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    responses = []
    for s in items:
        r = StudentResponse(
            **{c.name: getattr(s, c.name) for c in s.__table__.columns},
            campus_name=s.campus.name if s.campus else None,
            teacher_name=s.teacher.real_name if s.teacher else None,
        )
        responses.append(r)
    return StudentListResponse(total=total, items=responses)


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(404, "学生不存在")
    return StudentResponse(
        **{c.name: getattr(s, c.name) for c in s.__table__.columns},
        campus_name=s.campus.name if s.campus else None,
        teacher_name=s.teacher.real_name if s.teacher else None,
    )


@router.post("", response_model=StudentResponse)
def create_student(data: StudentCreate, db: Session = Depends(get_db)):
    no = data.model_dump().get("student_no") or _generate_student_no(db)
    s = Student(
        **data.model_dump(exclude={"student_no"}),
        student_no=no,
        remaining_hours=data.total_hours,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return StudentResponse(
        **{c.name: getattr(s, c.name) for c in s.__table__.columns},
        campus_name=s.campus.name if s.campus else None,
        teacher_name=s.teacher.real_name if s.teacher else None,
    )


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, data: StudentUpdate, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(404, "学生不存在")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(s, key, value)
    s.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(s)
    return StudentResponse(
        **{c.name: getattr(s, c.name) for c in s.__table__.columns},
        campus_name=s.campus.name if s.campus else None,
        teacher_name=s.teacher.real_name if s.teacher else None,
    )


@router.get("/{student_id}/classes")
def get_student_classes(student_id: int, db: Session = Depends(get_db)):
    enrollments = db.query(ClassEnrollment).filter(ClassEnrollment.student_id == student_id).all()
    return [
        {
            "id": e.class_id,
            "class_code": e.class_group.class_code,
            "class_name": e.class_group.name,
            "major": e.class_group.major,
            "enroll_date": str(e.enroll_date),
            "allocated_hours": e.allocated_hours,
            "used_hours": e.used_hours,
            "remaining_hours": e.remaining_hours,
            "status": e.status,
        }
        for e in enrollments
    ]
