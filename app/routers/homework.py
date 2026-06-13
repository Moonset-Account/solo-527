from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime

from app.database import get_db
from app.security import (
    get_current_user, allow_management, allow_staff, allow_teacher_staff
)
from app.models import (
    User, UserRole, Homework, HomeworkStatus, HomeworkSubmission,
    CourseClass, Notification, NotificationType, NotificationStatus,
    DataEnvironment
)
from app.schemas import (
    HomeworkCreate, HomeworkSubmissionCreate, HomeworkReview,
    NotificationCreate
)
from app.utils.audit import get_audit_logger, AuditLogger
from app.config import settings


router = APIRouter(prefix="/api/homework", tags=["作业管理"])


@router.post("", response_model=dict)
async def create_homework(
    data: HomeworkCreate,
    request: Request,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    hw = Homework(
        **data.model_dump(),
        created_by=user.id,
        is_demo=settings.DEMO_MODE,
        environment=user.environment,
    )
    db.add(hw)
    await db.flush()

    cls = await db.get(CourseClass, data.course_class_id)
    if cls:
        from app.models import Enrollment, Student, StudentParent, User as U
        parents_result = await db.execute(
            select(U.id)
            .select_from(Enrollment)
            .join(Student, Student.id == Enrollment.student_id)
            .join(StudentParent, StudentParent.student_id == Student.id)
            .join(U, U.id == StudentParent.parent_id)
            .where(Enrollment.course_class_id == data.course_class_id)
            .distinct()
        )
        parent_ids = [r[0] for r in parents_result.all()]
        for pid in parent_ids:
            notif = Notification(
                recipient_id=pid,
                notification_type=NotificationType.HOMEWORK,
                title=f"新作业发布：{data.title}",
                content=f"截止时间：{data.deadline}\n请督促孩子完成并提交。",
                related_type="homework",
                related_id=hw.id,
                status=NotificationStatus.PENDING,
                is_demo=settings.DEMO_MODE,
                environment=user.environment,
            )
            db.add(notif)

    await audit.log(
        user=user, action="create_homework", target_type="homework",
        target_id=hw.id, new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return {"id": hw.id, "message": "作业已发布并通知家长"}


@router.get("")
async def list_homework(
    class_id: Optional[int] = None,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Homework, CourseClass.name, User.real_name)
        .join(CourseClass, CourseClass.id == Homework.course_class_id)
        .join(User, User.id == Homework.created_by)
        .where(Homework.is_demo == settings.DEMO_MODE)
    )
    if class_id:
        q = q.where(Homework.course_class_id == class_id)
    if user.role == UserRole.TEACHER:
        q = q.where(Homework.created_by == user.id)
    q = q.order_by(Homework.created_at.desc())

    result = await db.execute(q)
    return [
        {
            "id": h.id,
            "title": h.title,
            "description": h.description,
            "class_name": cname,
            "class_id": h.course_class_id,
            "schedule_id": h.schedule_id,
            "creator_name": tname or f"ID:{h.created_by}",
            "deadline": h.deadline,
            "total_points": h.total_points,
            "created_at": h.created_at,
            "overdue": datetime.utcnow() > h.deadline,
        }
        for h, cname, tname in result.all()
    ]


@router.get("/{homework_id}")
async def get_homework_detail(
    homework_id: int,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
):
    hw = await db.get(Homework, homework_id)
    if not hw or hw.is_demo != settings.DEMO_MODE:
        raise HTTPException(status_code=404, detail="作业不存在")

    submissions = (await db.execute(
        select(HomeworkSubmission, User.real_name)
        .join(User, User.id == HomeworkSubmission.student_id)
        .where(HomeworkSubmission.homework_id == homework_id)
    )).all()

    return {
        "homework": {
            "id": hw.id, "title": hw.title, "description": hw.description,
            "deadline": hw.deadline, "total_points": hw.total_points,
            "attachments": hw.attachments,
        },
        "submissions": [
            {
                "id": s.id, "student_id": s.student_id,
                "student_name": name or f"ID:{s.student_id}",
                "status": s.status.value,
                "submitted_at": s.submitted_at,
                "content": s.content,
                "score": s.score,
                "feedback": s.feedback,
                "reviewed_at": s.reviewed_at,
            }
            for s, name in submissions
        ],
    }


@router.post("/submit")
async def submit_homework(
    data: HomeworkSubmissionCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    hw = await db.get(Homework, data.homework_id)
    if not hw:
        raise HTTPException(status_code=404, detail="作业不存在")

    now = datetime.utcnow()
    is_overdue = now > hw.deadline

    sub = HomeworkSubmission(
        homework_id=data.homework_id,
        student_id=data.student_id,
        content=data.content,
        attachments=data.attachments,
        submitted_at=now,
        status=HomeworkStatus.OVERDUE if is_overdue else HomeworkStatus.SUBMITTED,
        is_demo=settings.DEMO_MODE,
    )
    db.add(sub)
    await db.flush()

    await audit.log(
        user=user, action="submit_homework", target_type="homework_submission",
        target_id=sub.id,
        new_value={"homework_id": data.homework_id, "student_id": data.student_id, "overdue": is_overdue},
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return {"id": sub.id, "status": sub.status.value}


@router.post("/submissions/{submission_id}/review")
async def review_homework(
    submission_id: int,
    data: HomeworkReview,
    request: Request,
    user: User = Depends(allow_teacher_staff),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    sub = await db.get(HomeworkSubmission, submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="提交记录不存在")

    sub.score = data.score
    sub.feedback = data.feedback
    sub.status = HomeworkStatus.REVIEWED
    sub.reviewed_by = user.id
    sub.reviewed_at = datetime.utcnow()
    await db.flush()

    from app.models import StudentParent, User as U
    parents = (await db.execute(
        select(U.id)
        .join(StudentParent, StudentParent.parent_id == U.id)
        .where(StudentParent.student_id == sub.student_id)
    )).all()

    hw = await db.get(Homework, sub.homework_id)
    for (pid,) in parents:
        notif = Notification(
            recipient_id=pid,
            notification_type=NotificationType.FEEDBACK,
            title="作业反馈已发布",
            content=f"作业：{hw.title if hw else ''}\n得分：{data.score}/{hw.total_points if hw else '100'}\n评语：{data.feedback}",
            related_type="homework_submission",
            related_id=sub.id,
            status=NotificationStatus.PENDING,
            is_demo=settings.DEMO_MODE,
            environment=user.environment,
        )
        db.add(notif)

    await audit.log(
        user=user, action="review_homework", target_type="homework_submission",
        target_id=submission_id, new_value={"score": data.score, "feedback": data.feedback},
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return {"message": "点评完成，已通知家长"}


notif_router = APIRouter(prefix="/api/notifications", tags=["通知中心"])


@notif_router.post("", response_model=dict)
async def send_notification(
    data: NotificationCreate,
    request: Request,
    user: User = Depends(allow_management),
    db: AsyncSession = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    notif = Notification(
        **data.model_dump(),
        status=NotificationStatus.SENT,
        sent_at=datetime.utcnow(),
        is_demo=settings.DEMO_MODE,
        environment=user.environment,
    )
    db.add(notif)
    await db.flush()

    await audit.log(
        user=user, action="send_notification", target_type="notification",
        target_id=notif.id, new_value=data.model_dump(),
        ip_address=request.client.host if request.client else None,
        is_demo=settings.DEMO_MODE or user.is_demo,
        environment=user.environment,
    )
    return {"id": notif.id, "message": "已发送"}


@notif_router.get("")
async def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Notification).where(Notification.recipient_id == user.id)
    if unread_only:
        q = q.where(Notification.status.in_([
            NotificationStatus.PENDING, NotificationStatus.SENT
        ]))
    q = q.order_by(Notification.created_at.desc()).limit(limit)
    result = await db.execute(q)

    notifs = []
    for n in result.scalars().all():
        notifs.append({
            "id": n.id,
            "type": n.notification_type.value,
            "title": n.title,
            "content": n.content,
            "related_type": n.related_type,
            "related_id": n.related_id,
            "status": n.status.value,
            "is_read": n.status == NotificationStatus.READ,
            "created_at": n.created_at,
            "sent_at": n.sent_at,
        })
    return notifs


@notif_router.post("/{notif_id}/read")
async def mark_notification_read(
    notif_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    n = await db.get(Notification, notif_id)
    if not n or n.recipient_id != user.id:
        raise HTTPException(status_code=404, detail="通知不存在")
    n.status = NotificationStatus.READ
    n.read_at = datetime.utcnow()
    return {"message": "已标记已读"}


@notif_router.post("/read-all")
async def mark_all_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.recipient_id == user.id,
                Notification.status.in_([
                    NotificationStatus.PENDING, NotificationStatus.SENT
                ])
            )
        )
    )
    for n in result.scalars().all():
        n.status = NotificationStatus.READ
        n.read_at = datetime.utcnow()
    return {"message": "已全部标记已读"}
