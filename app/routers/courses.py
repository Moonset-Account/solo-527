from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from datetime import datetime, date, time, timedelta

from app.database import get_db
from app.security import (
    get_current_user, allow_management, allow_staff, allow_teacher_staff
)
from app.models import (
    User, UserRole, Course, CourseStatus, CourseClass, Student, Enrollment,
    HourPackage, StudentHourPackage, DataEnvironment, AttendanceStatus
)
from app.schemas import (
    CourseCreate, CourseUpdate, CourseResponse, CourseClassCreate,
    CourseClassResponse, StudentCreate, StudentResponse, EnrollmentCreate,
    HourPackageCreate, HourPackageResponse, StudentHourPackageCreate
)
from app.utils.audit import get_audit_logger, AuditLogger
from app.config import settings


router = APIRouter(prefix="/api/courses", tags=["课程管理"])


@router.post("", response_model=CourseResponse)
async def create_course(
    data: CourseCreate,
    request: Request,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    if data.code:
        existing = await db.execute(select(Course).where(Course.code == data.code))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="课程编号已存在")

    course = Course(
        **data.model_dump(exclude_none=True),
        status=CourseStatus.PUBLISHED,
        is_demo=settings.DEMO_MODE,
        environment=user.environment,
    )
    db.add(course)
    await db.flush()

    await audit.log(
        user=user, action="create_course", target_type="course",
        target_id=course.id, new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return course


@router.get("", response_model=List[CourseResponse])
async def list_courses(
    status: Optional[CourseStatus] = None,
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(Course).where(Course.is_demo == settings.DEMO_MODE)
    if status:
        query = query.where(Course.status == status)
    if category:
        query = query.where(Course.category == category)
    if keyword:
        kw = f"%{keyword}%"
        query = query.where(or_(
            Course.name.ilike(kw), Course.code.ilike(kw),
            Course.category.ilike(kw)
        ))
    query = query.order_by(Course.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if not course or course.is_demo != settings.DEMO_MODE:
        raise HTTPException(status_code=404, detail="课程不存在")
    return course


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    data: CourseUpdate,
    request: Request,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    course = await db.get(Course, course_id)
    if not course or course.is_demo != settings.DEMO_MODE:
        raise HTTPException(status_code=404, detail="课程不存在")

    old_val = {
        "name": course.name, "total_hours": course.total_hours,
        "status": course.status.value
    }
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(course, field, value)

    await db.flush()

    await audit.log(
        user=user, action="update_course", target_type="course",
        target_id=course_id, old_value=old_val,
        new_value={"name": course.name, "status": course.status.value},
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return course


@router.post("/classes", response_model=CourseClassResponse)
async def create_class(
    data: CourseClassCreate,
    request: Request,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    cls = CourseClass(
        **data.model_dump(),
        is_demo=settings.DEMO_MODE,
        environment=user.environment,
    )
    db.add(cls)
    await db.flush()

    await audit.log(
        user=user, action="create_class", target_type="course_class",
        target_id=cls.id, new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return cls


@router.get("/classes/list", response_model=List[CourseClassResponse])
async def list_classes(
    course_id: Optional[int] = None,
    campus_id: Optional[int] = None,
    status: Optional[CourseStatus] = None,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(CourseClass).where(CourseClass.is_demo == settings.DEMO_MODE)
    if course_id:
        query = query.where(CourseClass.course_id == course_id)
    if campus_id:
        query = query.where(CourseClass.campus_id == campus_id)
    elif user.campus_id and user.role != UserRole.SUPER_ADMIN:
        query = query.where(CourseClass.campus_id == user.campus_id)
    if status:
        query = query.where(CourseClass.status == status)
    query = query.order_by(CourseClass.id.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/students", response_model=StudentResponse)
async def create_student(
    data: StudentCreate,
    request: Request,
    user: User = Depends(allow_staff),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    from app.models import StudentParent

    student = Student(
        name=data.name, gender=data.gender, birthday=data.birthday,
        school=data.school, grade=data.grade, phone=data.phone,
        address=data.address,
        is_demo=settings.DEMO_MODE,
        environment=user.environment,
    )
    db.add(student)
    await db.flush()

    if data.parent_ids:
        for pid in data.parent_ids:
            sp = StudentParent(
                student_id=student.id, parent_id=pid,
                is_primary=(pid == data.parent_ids[0]),
                is_demo=settings.DEMO_MODE,
            )
            db.add(sp)

    new_val = {
        "name": data.name, "phone": data.phone,
        "grade": data.grade, "parent_count": len(data.parent_ids) if data.parent_ids else 0
    }
    await audit.log(
        user=user, action="create_student", target_type="student",
        target_id=student.id, new_value=new_val,
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return student


@router.get("/students/list", response_model=List[StudentResponse])
async def list_students(
    keyword: Optional[str] = None,
    grade: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 200,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(Student).where(Student.is_demo == settings.DEMO_MODE)
    if keyword:
        kw = f"%{keyword}%"
        query = query.where(or_(
            Student.name.ilike(kw), Student.phone.ilike(kw),
            Student.school.ilike(kw)
        ))
    if grade:
        query = query.where(Student.grade == grade)
    if is_active is not None:
        query = query.where(Student.is_active == is_active)
    query = query.order_by(Student.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/enrollments")
async def create_enrollment(
    data: EnrollmentCreate,
    request: Request,
    user: User = Depends(allow_staff),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    existing = await db.execute(
        select(Enrollment).where(
            and_(
                Enrollment.student_id == data.student_id,
                Enrollment.course_class_id == data.course_class_id,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="学生已在该班级报名")

    enrollment = Enrollment(
        **data.model_dump(),
        is_demo=settings.DEMO_MODE,
        environment=user.environment,
    )
    db.add(enrollment)
    await db.flush()

    await audit.log(
        user=user, action="create_enrollment", target_type="enrollment",
        target_id=enrollment.id, new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return enrollment


@router.get("/enrollments/{class_id}")
async def list_class_enrollments(
    class_id: int,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Enrollment, Student)
        .join(Student, Student.id == Enrollment.student_id)
        .where(Enrollment.course_class_id == class_id)
        .where(Enrollment.is_demo == settings.DEMO_MODE)
    )
    result = await db.execute(query)
    enrollments = []
    for enrollment, student in result.all():
        enrollments.append({
            "id": enrollment.id,
            "student_id": student.id,
            "student_name": student.name,
            "grade": student.grade,
            "phone": student.phone,
            "enrolled_at": enrollment.enrolled_at,
            "status": enrollment.status,
        })
    return enrollments


@router.post("/hour-packages", response_model=HourPackageResponse)
async def create_hour_package(
    data: HourPackageCreate,
    request: Request,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    pkg = HourPackage(
        **data.model_dump(),
        is_demo=settings.DEMO_MODE,
        environment=user.environment,
    )
    db.add(pkg)
    await db.flush()

    await audit.log(
        user=user, action="create_hour_package", target_type="hour_package",
        target_id=pkg.id, new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return pkg


@router.get("/hour-packages/list", response_model=List[HourPackageResponse])
async def list_hour_packages(
    course_id: Optional[int] = None,
    is_active: bool = True,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
):
    query = select(HourPackage).where(HourPackage.is_demo == settings.DEMO_MODE)
    if course_id:
        query = query.where(HourPackage.course_id == course_id)
    if is_active:
        query = query.where(HourPackage.is_active == is_active)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/student-hour-packages")
async def create_student_package(
    data: StudentHourPackageCreate,
    request: Request,
    user: User = Depends(allow_staff),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    pkg = await db.get(HourPackage, data.package_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="课时包不存在")

    total = pkg.total_hours + pkg.bonus_hours
    sp = StudentHourPackage(
        student_id=data.student_id,
        package_id=data.package_id,
        valid_from=data.valid_from,
        valid_to=data.valid_to,
        total_hours=total,
        used_hours=0,
        payment_status=data.payment_status,
        paid_amount=data.paid_amount if data.paid_amount is not None else pkg.price,
        is_demo=settings.DEMO_MODE,
        environment=user.environment,
    )
    db.add(sp)
    await db.flush()

    await audit.log(
        user=user, action="assign_hour_package", target_type="student_hour_package",
        target_id=sp.id,
        new_value={"student_id": data.student_id, "total_hours": total, "valid_to": str(data.valid_to)},
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return sp


@router.get("/student-hour-packages/{student_id}")
async def list_student_packages(
    student_id: int,
    include_expired: bool = False,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(StudentHourPackage, HourPackage.name)
        .join(HourPackage, HourPackage.id == StudentHourPackage.package_id)
        .where(StudentHourPackage.student_id == student_id)
        .where(StudentHourPackage.is_demo == settings.DEMO_MODE)
    )
    if not include_expired:
        today = date.today()
        query = query.where(StudentHourPackage.valid_to >= today)

    result = await db.execute(query)
    packages = []
    for sp, name in result.all():
        packages.append({
            "id": sp.id,
            "package_name": name,
            "total_hours": sp.total_hours,
            "used_hours": sp.used_hours,
            "remaining": sp.total_hours - sp.used_hours,
            "frozen_hours": sp.frozen_hours,
            "valid_from": sp.valid_from,
            "valid_to": sp.valid_to,
            "payment_status": sp.payment_status.value,
            "paid_amount": float(sp.paid_amount),
        })
    return packages
