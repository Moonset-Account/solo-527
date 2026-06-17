from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, Campus, UserRole
from app.models.class_group import ClassGroup
from app.models.student import Student, ArtMajor

router = APIRouter()


@router.get("/campuses")
def list_campuses(db: Session = Depends(get_db)):
    items = db.query(Campus).filter(Campus.is_active == True).all()
    return [{"id": c.id, "name": c.name, "address": c.address, "contact_phone": c.contact_phone} for c in items]


@router.get("/teachers")
def list_teachers(
    campus_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(User).filter(User.role.in_([UserRole.TEACHER, UserRole.PRINCIPAL]), User.is_active == True)
    if campus_id:
        q = q.filter(User.campus_id == campus_id)
    items = q.all()
    return [{"id": u.id, "real_name": u.real_name, "role": u.role.value, "phone": u.phone} for u in items]


@router.get("/classes/simple")
def list_classes_simple(
    campus_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(ClassGroup)
    if campus_id:
        q = q.filter(ClassGroup.campus_id == campus_id)
    items = q.order_by(ClassGroup.name).all()
    return [
        {
            "id": c.id,
            "class_code": c.class_code,
            "name": c.name,
            "major": c.major,
            "current_students": c.current_students,
            "max_students": c.max_students,
            "status": c.status.value if hasattr(c.status, "value") else str(c.status),
        }
        for c in items
    ]


@router.get("/majors")
def list_majors():
    return [{"value": m.value, "label": {
        "fine_arts": "美术",
        "music": "音乐",
        "dance": "舞蹈",
        "broadcast": "编导播音",
        "film": "影视",
        "design": "设计",
        "performance": "表演",
        "other": "其他",
    }.get(m.value, m.value)} for m in ArtMajor]


@router.get("/students/simple")
def list_students_simple(
    campus_id: Optional[int] = Query(None),
    class_id: Optional[int] = Query(None),
    keyword: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    from app.models.class_group import ClassEnrollment
    q = db.query(Student)
    if campus_id:
        q = q.filter(Student.campus_id == campus_id)
    if class_id:
        q = q.join(ClassEnrollment, Student.id == ClassEnrollment.student_id).filter(ClassEnrollment.class_id == class_id)
    if keyword:
        q = q.filter((Student.name.like(f"%{keyword}%")) | (Student.student_no.like(f"%{keyword}%")))
    items = q.limit(200).all()
    return [
        {
            "id": s.id,
            "student_no": s.student_no,
            "name": s.name,
            "major": s.major.value,
            "phone": s.phone,
            "remaining_hours": s.remaining_hours,
            "total_hours": s.total_hours,
        }
        for s in items
    ]


@router.get("/users/me")
def get_current_user(db: Session = Depends(get_db)):
    u = db.query(User).first()
    if not u:
        return {"id": 1, "username": "system", "real_name": "系统", "role": "admin"}
    return {
        "id": u.id,
        "username": u.username,
        "real_name": u.real_name,
        "role": u.role.value if hasattr(u.role, "value") else str(u.role),
        "phone": u.phone,
        "campus_id": u.campus_id,
        "avatar": u.avatar,
    }
