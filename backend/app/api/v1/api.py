from fastapi import APIRouter

from app.api.v1 import (
    auth,
    dashboard,
    schedule,
    student,
    class_group,
    feedback,
    notification,
    question,
    reminder,
    report,
    common,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["首页看板"])
api_router.include_router(schedule.router, prefix="/schedules", tags=["排课消课台"])
api_router.include_router(student.router, prefix="/students", tags=["学生档案"])
api_router.include_router(class_group.router, prefix="/classes", tags=["班级管理"])
api_router.include_router(feedback.router, prefix="/feedbacks", tags=["家校反馈"])
api_router.include_router(notification.router, prefix="/notifications", tags=["通知回执"])
api_router.include_router(question.router, prefix="/questions", tags=["题库版本"])
api_router.include_router(reminder.router, prefix="/reminders", tags=["提醒中心"])
api_router.include_router(report.router, prefix="/reports", tags=["报表导出"])
api_router.include_router(common.router, prefix="/common", tags=["通用接口"])
