from app.tasks.celery_app import celery_app


@celery_app.task(name="send_notification")
def send_notification_task(user_id: int, title: str, content: str):
    return {"status": "success", "message": f"通知已发送给用户 {user_id}"}


@celery_app.task(name="send_overdue_reminder")
def send_overdue_reminder_task(bill_id: int):
    return {"status": "success", "message": f"逾期提醒已发送给账单 {bill_id}"}
