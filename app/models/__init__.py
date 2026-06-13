import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, ForeignKey,
    Enum as SAEnum, Date, Time, Numeric, JSON, Float, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    PRINCIPAL = "principal"
    TEACHER = "teacher"
    STAFF = "staff"
    PARENT = "parent"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class CourseStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ScheduleStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONDUCTED = "conducted"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    MAKEUP = "makeup"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    LEAVE = "leave"
    MAKEUP = "makeup"


class HomeworkStatus(str, enum.Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"
    OVERDUE = "overdue"


class NotificationType(str, enum.Enum):
    CLASS_REMINDER = "class_reminder"
    HOMEWORK = "homework"
    FEEDBACK = "feedback"
    HOURS_LOW = "hours_low"
    NOTICE = "notice"
    SCHEDULE_CHANGE = "schedule_change"


class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    READ = "read"


class LeadSource(str, enum.Enum):
    ONLINE_AD = "online_ad"
    REFERRAL = "referral"
    WALK_IN = "walk_in"
    PHONE = "phone"
    EVENT = "event"
    OTHER = "other"


class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    TRIAL_SCHEDULED = "trial_scheduled"
    TRIAL_COMPLETED = "trial_completed"
    CONVERTED = "converted"
    LOST = "lost"


class PaymentStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    REFUNDED = "refunded"


class DataEnvironment(str, enum.Enum):
    PRODUCTION = "production"
    TEST = "test"
    DEMO = "demo"


class Campus(Base):
    __tablename__ = "campuses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    address = Column(String(255))
    phone = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    rooms = relationship("Classroom", back_populates="campus")
    users = relationship("User", back_populates="campus")


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    campus_id = Column(Integer, ForeignKey("campuses.id", ondelete="CASCADE"), nullable=False)
    capacity = Column(Integer, default=20)
    equipment = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)

    campus = relationship("Campus", back_populates="rooms")
    schedules = relationship("Schedule", back_populates="classroom")

    __table_args__ = (UniqueConstraint("campus_id", "name", name="uq_campus_classroom"),)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(50), unique=True, index=True)
    username = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.STAFF, index=True)
    status = Column(SAEnum(UserStatus), default=UserStatus.ACTIVE, index=True)
    campus_id = Column(Integer, ForeignKey("campuses.id"), nullable=True)
    avatar = Column(String(255))
    real_name = Column(String(50))
    gender = Column(String(10))
    birthday = Column(Date)
    address = Column(String(255))
    remarks = Column(Text)
    last_login_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    campus = relationship("Campus", back_populates="users")
    teacher_hour_rates = relationship("TeacherHourRate", back_populates="teacher")
    teacher_schedules = relationship("Schedule", back_populates="teacher", foreign_keys="Schedule.teacher_id")
    created_schedules = relationship("Schedule", back_populates="created_by_user", foreign_keys="Schedule.created_by")
    homework_submissions = relationship("HomeworkSubmission", back_populates="student")
    created_homework = relationship("Homework", back_populates="creator")
    reviewed_homework = relationship("HomeworkSubmission", back_populates="reviewer", foreign_keys="HomeworkSubmission.reviewed_by")
    notifications = relationship("Notification", back_populates="recipient")
    parent_students = relationship("StudentParent", back_populates="parent", foreign_keys="StudentParent.parent_id")
    student_enrollments = relationship("StudentParent", back_populates="student", foreign_keys="StudentParent.student_id")
    created_leads = relationship("Lead", back_populates="creator", foreign_keys="Lead.created_by")
    assigned_leads = relationship("Lead", back_populates="assigned_to", foreign_keys="Lead.assigned_to")
    audit_logs = relationship("AuditLog", back_populates="user")


class TeacherHourRate(Base):
    __tablename__ = "teacher_hour_rates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date)
    base_rate = Column(Numeric(10, 2), nullable=False)
    overtime_rate = Column(Numeric(10, 2))
    remarks = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)

    teacher = relationship("User", back_populates="teacher_hour_rates")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    gender = Column(String(10))
    birthday = Column(Date)
    school = Column(String(100))
    grade = Column(String(20))
    phone = Column(String(50))
    address = Column(String(255))
    remarks = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    parents = relationship("StudentParent", back_populates="student", foreign_keys="StudentParent.student_id")
    enrollments = relationship("Enrollment", back_populates="student")
    attendances = relationship("Attendance", back_populates="student")
    homework_submissions = relationship("HomeworkSubmission", back_populates="student_user")
    lead = relationship("Lead", back_populates="student_converted", uselist=False)

    __table_args__ = (Index("ix_student_name_phone", "name", "phone"),)


class StudentParent(Base):
    __tablename__ = "student_parents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship = Column(String(20), default="parent")
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)

    student = relationship("Student", back_populates="parents", foreign_keys=[student_id])
    parent = relationship("User", back_populates="parent_students", foreign_keys=[parent_id])

    __table_args__ = (UniqueConstraint("student_id", "parent_id", name="uq_student_parent"),)


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), unique=True, index=True)
    category = Column(String(50))
    level = Column(String(50))
    description = Column(Text)
    total_hours = Column(Integer, default=0)
    default_sessions = Column(Integer, default=0)
    default_duration = Column(Integer, default=90)
    price = Column(Numeric(12, 2))
    status = Column(SAEnum(CourseStatus), default=CourseStatus.DRAFT, index=True)
    syllabus = Column(JSON, default=list)
    materials = Column(JSON, default=list)
    cover_image = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    classes = relationship("CourseClass", back_populates="course")
    packages = relationship("HourPackage", back_populates="course")


class CourseClass(Base):
    __tablename__ = "course_classes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    campus_id = Column(Integer, ForeignKey("campuses.id"), nullable=False, index=True)
    max_students = Column(Integer, default=20)
    min_students = Column(Integer, default=1)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(SAEnum(CourseStatus), default=CourseStatus.PUBLISHED, index=True)
    remarks = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    course = relationship("Course", back_populates="classes")
    enrollments = relationship("Enrollment", back_populates="course_class")
    schedules = relationship("Schedule", back_populates="course_class")
    homework = relationship("Homework", back_populates="course_class")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    course_class_id = Column(Integer, ForeignKey("course_classes.id", ondelete="CASCADE"), nullable=False, index=True)
    package_id = Column(Integer, ForeignKey("hour_packages.id"))
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    student = relationship("Student", back_populates="enrollments")
    course_class = relationship("CourseClass", back_populates="enrollments")
    package = relationship("HourPackage", back_populates="enrollments")
    attendance = relationship("Attendance", back_populates="enrollment")

    __table_args__ = (UniqueConstraint("student_id", "course_class_id", name="uq_student_class"),)


class HourPackage(Base):
    __tablename__ = "hour_packages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    total_hours = Column(Integer, nullable=False)
    bonus_hours = Column(Integer, default=0)
    price = Column(Numeric(12, 2), nullable=False)
    valid_days = Column(Integer, default=365)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    course = relationship("Course", back_populates="packages")
    enrollments = relationship("Enrollment", back_populates="package")
    student_packages = relationship("StudentHourPackage", back_populates="package")


class StudentHourPackage(Base):
    __tablename__ = "student_hour_packages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    package_id = Column(Integer, ForeignKey("hour_packages.id"), nullable=False, index=True)
    purchased_at = Column(DateTime, default=datetime.utcnow)
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=False)
    total_hours = Column(Integer, nullable=False)
    used_hours = Column(Integer, default=0)
    frozen_hours = Column(Integer, default=0)
    payment_status = Column(SAEnum(PaymentStatus), default=PaymentStatus.UNPAID, index=True)
    paid_amount = Column(Numeric(12, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    student = relationship("Student")
    package = relationship("HourPackage", back_populates="student_packages")
    hour_consumptions = relationship("HourConsumption", back_populates="student_package")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_class_id = Column(Integer, ForeignKey("course_classes.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False, index=True)
    schedule_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    status = Column(SAEnum(ScheduleStatus), default=ScheduleStatus.SCHEDULED, index=True)
    session_no = Column(Integer)
    topic = Column(String(255))
    content_summary = Column(Text)
    is_makeup = Column(Boolean, default=False)
    parent_schedule_id = Column(Integer, ForeignKey("schedules.id"))
    conflict_notified = Column(Boolean, default=False)
    conflict_details = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    course_class = relationship("CourseClass", back_populates="schedules")
    teacher = relationship("User", back_populates="teacher_schedules", foreign_keys=[teacher_id])
    classroom = relationship("Classroom", back_populates="schedules")
    created_by_user = relationship("User", back_populates="created_schedules", foreign_keys=[created_by])
    attendances = relationship("Attendance", back_populates="schedule")
    homework = relationship("Homework", back_populates="schedule")
    hour_consumptions = relationship("HourConsumption", back_populates="schedule")

    __table_args__ = (
        Index("ix_schedule_teacher_date", "teacher_id", "schedule_date"),
        Index("ix_schedule_classroom_date", "classroom_id", "schedule_date"),
        Index("ix_schedule_class_date", "course_class_id", "schedule_date"),
    )


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, autoincrement=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"))
    status = Column(SAEnum(AttendanceStatus), default=AttendanceStatus.PRESENT, index=True)
    check_in_time = Column(DateTime)
    check_out_time = Column(DateTime)
    remarks = Column(Text)
    recorded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    schedule = relationship("Schedule", back_populates="attendances")
    student = relationship("Student", back_populates="attendances")
    enrollment = relationship("Enrollment", back_populates="attendance")

    __table_args__ = (UniqueConstraint("schedule_id", "student_id", name="uq_schedule_student_attendance"),)


class HourConsumption(Base):
    __tablename__ = "hour_consumptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_package_id = Column(Integer, ForeignKey("student_hour_packages.id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False, index=True)
    attendance_id = Column(Integer, ForeignKey("attendances.id"))
    hours_used = Column(Float, nullable=False)
    consumption_type = Column(String(20), default="normal")
    consumed_at = Column(DateTime, default=datetime.utcnow, index=True)
    remarks = Column(Text)
    is_reversed = Column(Boolean, default=False)
    reversed_at = Column(DateTime)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    student_package = relationship("StudentHourPackage", back_populates="hour_consumptions")
    schedule = relationship("Schedule", back_populates="hour_consumptions")
    attendance = relationship("Attendance")


class Homework(Base):
    __tablename__ = "homework"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    course_class_id = Column(Integer, ForeignKey("course_classes.id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    deadline = Column(DateTime, nullable=False)
    attachments = Column(JSON, default=list)
    total_points = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    course_class = relationship("CourseClass", back_populates="homework")
    schedule = relationship("Schedule", back_populates="homework")
    creator = relationship("User", back_populates="created_homework")
    submissions = relationship("HomeworkSubmission", back_populates="homework")


class HomeworkSubmission(Base):
    __tablename__ = "homework_submissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    homework_id = Column(Integer, ForeignKey("homework.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    content = Column(Text)
    attachments = Column(JSON, default=list)
    status = Column(SAEnum(HomeworkStatus), default=HomeworkStatus.SUBMITTED, index=True)
    score = Column(Integer)
    feedback = Column(Text)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)

    homework = relationship("Homework", back_populates="submissions")
    student = relationship("User", back_populates="homework_submissions", foreign_keys=[student_id])
    student_user = relationship("Student", back_populates="homework_submissions")
    reviewer = relationship("User", back_populates="reviewed_homework", foreign_keys=[reviewed_by])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notification_type = Column(SAEnum(NotificationType), default=NotificationType.NOTICE, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    related_type = Column(String(50))
    related_id = Column(Integer)
    status = Column(SAEnum(NotificationStatus), default=NotificationStatus.PENDING, index=True)
    sent_at = Column(DateTime)
    read_at = Column(DateTime)
    channel = Column(String(20), default="in_app")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    recipient = relationship("User", back_populates="notifications")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    phone = Column(String(50), nullable=False, index=True)
    email = Column(String(150))
    student_name = Column(String(50))
    student_age = Column(Integer)
    student_grade = Column(String(20))
    source = Column(SAEnum(LeadSource), default=LeadSource.OTHER, index=True)
    status = Column(SAEnum(LeadStatus), default=LeadStatus.NEW, index=True)
    campus_id = Column(Integer, ForeignKey("campuses.id"), index=True)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    student_id = Column(Integer, ForeignKey("students.id"))
    next_follow_up = Column(DateTime)
    remarks = Column(Text)
    follow_up_count = Column(Integer, default=0)
    last_follow_up_at = Column(DateTime)
    converted_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    campus = relationship("Campus")
    assigned_to_user = relationship("User", back_populates="assigned_leads", foreign_keys=[assigned_to])
    creator = relationship("User", back_populates="created_leads", foreign_keys=[created_by])
    student_converted = relationship("Student", back_populates="lead")
    follow_ups = relationship("LeadFollowUp", back_populates="lead")


class LeadFollowUp(Base):
    __tablename__ = "lead_follow_ups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    followed_by = Column(Integer, ForeignKey("users.id"))
    method = Column(String(20))
    content = Column(Text, nullable=False)
    result = Column(String(100))
    next_action = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_demo = Column(Boolean, default=False, index=True)

    lead = relationship("Lead", back_populates="follow_ups")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action = Column(String(50), nullable=False, index=True)
    target_type = Column(String(50), index=True)
    target_id = Column(Integer, index=True)
    old_value = Column(JSON)
    new_value = Column(JSON)
    ip_address = Column(String(50))
    user_agent = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    user = relationship("User", back_populates="audit_logs")


class MonthlyReport(Base):
    __tablename__ = "monthly_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_month = Column(String(7), nullable=False, index=True)
    campus_id = Column(Integer, ForeignKey("campuses.id"), index=True)
    report_data = Column(JSON, default=dict)
    generated_by = Column(Integer, ForeignKey("users.id"))
    generated_at = Column(DateTime, default=datetime.utcnow)
    is_locked = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=False, index=True)
    environment = Column(SAEnum(DataEnvironment), default=DataEnvironment.PRODUCTION, index=True)

    __table_args__ = (UniqueConstraint("report_month", "campus_id", name="uq_monthly_report"),)
