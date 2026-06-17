from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole
from app.models.student import Gender, StudentStatus, ArtMajor
from app.models.class_group import ClassStatus
from app.models.feedback import FeedbackType, HomeworkStatus, SubmissionStatus
from app.models.notification import NotificationType, NotificationPriority, ReceiptStatus
from app.models.question import QuestionBankStatus


class UserBase(BaseModel):
    username: str
    real_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    role: UserRole = UserRole.TEACHER
    campus_id: Optional[int] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    real_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    campus_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    real_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    role: UserRole
    campus_id: Optional[int] = None
    is_active: bool = True
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CampusBase(BaseModel):
    name: str
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    description: Optional[str] = None


class CampusCreate(CampusBase):
    pass


class CampusResponse(CampusBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool = True
    created_at: datetime


class StudentBase(BaseModel):
    name: str
    gender: Optional[Gender] = None
    birthday: Optional[date] = None
    id_card: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    major: ArtMajor = ArtMajor.FINE_ARTS
    target_school: Optional[str] = None
    enroll_date: Optional[date] = None
    status: StudentStatus = StudentStatus.ACTIVE
    total_hours: int = 0
    campus_id: int
    teacher_id: Optional[int] = None
    remark: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[Gender] = None
    birthday: Optional[date] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    major: Optional[ArtMajor] = None
    target_school: Optional[str] = None
    status: Optional[StudentStatus] = None
    total_hours: Optional[int] = None
    remaining_hours: Optional[int] = None
    teacher_id: Optional[int] = None
    remark: Optional[str] = None


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_no: str
    name: str
    gender: Optional[Gender] = None
    birthday: Optional[date] = None
    phone: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    major: ArtMajor
    target_school: Optional[str] = None
    enroll_date: Optional[date] = None
    status: StudentStatus
    total_hours: int = 0
    remaining_hours: int = 0
    consumed_hours: int = 0
    campus_id: int
    campus_name: Optional[str] = None
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime


class StudentListResponse(BaseModel):
    total: int
    items: List[StudentResponse]


class ClassGroupBase(BaseModel):
    name: str
    major: Optional[str] = None
    class_type: Optional[str] = None
    description: Optional[str] = None
    max_students: int = 20
    campus_id: int
    head_teacher_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_hours: int = 0
    status: ClassStatus = ClassStatus.PREPARING
    remark: Optional[str] = None


class ClassGroupCreate(ClassGroupBase):
    pass


class ClassGroupUpdate(BaseModel):
    name: Optional[str] = None
    major: Optional[str] = None
    class_type: Optional[str] = None
    description: Optional[str] = None
    max_students: Optional[int] = None
    head_teacher_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_hours: Optional[int] = None
    status: Optional[ClassStatus] = None
    remark: Optional[str] = None


class ClassGroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    class_code: str
    name: str
    major: Optional[str] = None
    class_type: Optional[str] = None
    description: Optional[str] = None
    max_students: int = 20
    current_students: int = 0
    status: ClassStatus
    campus_id: int
    campus_name: Optional[str] = None
    head_teacher_id: Optional[int] = None
    head_teacher_name: Optional[str] = None
    fill_rate: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_hours: int = 0
    cover_image: Optional[str] = None
    created_at: datetime


class ClassListResponse(BaseModel):
    total: int
    items: List[ClassGroupResponse]


class FeedbackBase(BaseModel):
    type: FeedbackType = FeedbackType.WORK
    class_id: Optional[int] = None
    student_id: int
    schedule_id: Optional[int] = None
    homework_id: Optional[int] = None
    teacher_id: int
    title: str
    content: str
    score: Optional[int] = None
    max_score: int = 100
    level: Optional[str] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    suggestions: Optional[str] = None
    work_images: Optional[List[str]] = None
    is_private: bool = False


class FeedbackCreate(FeedbackBase):
    pass


class FeedbackUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    score: Optional[int] = None
    level: Optional[str] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    suggestions: Optional[str] = None
    work_images: Optional[List[str]] = None
    is_private: Optional[bool] = None
    parent_reply: Optional[str] = None


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    feedback_code: str
    type: FeedbackType
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    student_id: int
    student_name: Optional[str] = None
    teacher_id: int
    teacher_name: Optional[str] = None
    title: str
    content: str
    score: Optional[int] = None
    max_score: int = 100
    level: Optional[str] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    suggestions: Optional[str] = None
    work_images: Optional[List[str]] = None
    is_private: bool = False
    parent_seen: bool = False
    parent_reply: Optional[str] = None
    parent_reply_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class FeedbackListResponse(BaseModel):
    total: int
    items: List[FeedbackResponse]


class HomeworkBase(BaseModel):
    title: str
    description: Optional[str] = None
    class_id: int
    teacher_id: int
    schedule_id: Optional[int] = None
    deadline: Optional[datetime] = None
    max_score: int = 100
    status: HomeworkStatus = HomeworkStatus.DRAFT
    allow_late_submission: bool = True
    attachments: Optional[List[str]] = None


class HomeworkCreate(HomeworkBase):
    pass


class HomeworkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[HomeworkStatus] = None
    allow_late_submission: Optional[bool] = None
    attachments: Optional[List[str]] = None


class HomeworkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    homework_code: str
    title: str
    description: Optional[str] = None
    class_id: int
    class_name: Optional[str] = None
    teacher_id: int
    teacher_name: Optional[str] = None
    publish_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    max_score: int = 100
    status: HomeworkStatus
    total_submissions: int = 0
    attachments: Optional[List[str]] = None
    created_at: datetime


class SubmissionBase(BaseModel):
    homework_id: int
    student_id: int
    content: Optional[str] = None
    attachments: Optional[List[str]] = None


class SubmissionCreate(SubmissionBase):
    pass


class SubmissionGrade(BaseModel):
    score: int
    feedback: Optional[str] = None
    status: SubmissionStatus = SubmissionStatus.GRADED


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    homework_id: int
    homework_title: Optional[str] = None
    student_id: int
    student_name: Optional[str] = None
    submit_time: Optional[datetime] = None
    status: SubmissionStatus
    content: Optional[str] = None
    attachments: Optional[List[str]] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    graded_at: Optional[datetime] = None
    resubmit_count: int = 0
    created_at: datetime


class NotificationBase(BaseModel):
    type: NotificationType = NotificationType.NOTICE
    priority: NotificationPriority = NotificationPriority.NORMAL
    title: str
    content: str
    class_id: Optional[int] = None
    campus_id: Optional[int] = None
    target_roles: Optional[List[str]] = None
    require_receipt: bool = False
    receipt_deadline: Optional[datetime] = None
    scheduled_time: Optional[datetime] = None
    attachments: Optional[List[str]] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[NotificationType] = None
    priority: Optional[NotificationPriority] = None
    require_receipt: Optional[bool] = None
    receipt_deadline: Optional[datetime] = None
    is_draft: Optional[bool] = None
    attachments: Optional[List[str]] = None


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    notification_code: str
    type: NotificationType
    priority: NotificationPriority
    title: str
    content: str
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    campus_id: Optional[int] = None
    publisher_id: int
    publisher_name: Optional[str] = None
    publish_time: Optional[datetime] = None
    is_draft: bool = True
    require_receipt: bool = False
    receipt_deadline: Optional[datetime] = None
    total_receipts: int = 0
    confirmed_receipts: int = 0
    attachments: Optional[List[str]] = None
    created_at: datetime


class ReceiptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    notification_id: int
    user_id: int
    user_name: Optional[str] = None
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    status: ReceiptStatus
    confirmed_at: Optional[datetime] = None
    remark: Optional[str] = None
    created_at: datetime


class QuestionBankBase(BaseModel):
    version_name: str
    major: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    status: QuestionBankStatus = QuestionBankStatus.DRAFT
    total_questions: int = 0
    total_score: int = 100
    duration_minutes: int = 120
    passing_score: int = 60
    tags: Optional[List[str]] = None


class QuestionBankCreate(QuestionBankBase):
    pass


class QuestionBankResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    version_code: str
    version_name: str
    major: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    status: QuestionBankStatus
    total_questions: int = 0
    total_score: int = 100
    duration_minutes: int = 120
    passing_score: int = 60
    published_at: Optional[datetime] = None
    file_path: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime


class AttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    file_name: str
    original_name: Optional[str] = None
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    entity_type: str
    entity_id: int
    category: Optional[str] = None
    uploaded_by: Optional[int] = None
    created_at: datetime


class RemarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    entity_type: str
    entity_id: int
    created_by: int
    created_by_name: Optional[str] = None
    is_private: bool = False
    tags: Optional[List[str]] = None
    created_at: datetime


class HistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_type: str
    entity_id: int
    action: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    change_summary: Optional[str] = None
    operator_id: int
    operator_name: Optional[str] = None
    created_at: datetime
