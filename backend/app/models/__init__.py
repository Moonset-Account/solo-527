from app.models.user import User, Campus, UserRole
from app.models.student import Student, StudentParent, Gender, StudentStatus, ArtMajor
from app.models.class_group import ClassGroup, ClassEnrollment, ClassStatus
from app.models.schedule import (
    CourseSchedule, CourseConsumption, ScheduleStatus,
    ConsumptionStatus, AttendanceStatus
)
from app.models.feedback import (
    WorkFeedback, Homework, HomeworkSubmission, FeedbackType,
    HomeworkStatus, SubmissionStatus
)
from app.models.notification import (
    Notification, Receipt, NotificationType, NotificationPriority, ReceiptStatus
)
from app.models.question import (
    QuestionBank, Attachment, Remark, HistoryRecord, QuestionBankStatus
)
from app.models.reminder import (
    Reminder, ReportRecord, ReminderType, ReminderStatus,
    ReminderPriority, ReportType
)

__all__ = [
    "User", "Campus", "UserRole",
    "Student", "StudentParent", "Gender", "StudentStatus", "ArtMajor",
    "ClassGroup", "ClassEnrollment", "ClassStatus",
    "CourseSchedule", "CourseConsumption", "ScheduleStatus",
    "ConsumptionStatus", "AttendanceStatus",
    "WorkFeedback", "Homework", "HomeworkSubmission", "FeedbackType",
    "HomeworkStatus", "SubmissionStatus",
    "Notification", "Receipt", "NotificationType", "NotificationPriority", "ReceiptStatus",
    "QuestionBank", "Attachment", "Remark", "HistoryRecord", "QuestionBankStatus",
    "Reminder", "ReportRecord", "ReminderType", "ReminderStatus",
    "ReminderPriority", "ReportType",
]
