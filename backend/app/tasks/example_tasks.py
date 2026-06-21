import time
from app.tasks.celery_app import celery_app


@celery_app.task(name="example.add")
def add(x: int, y: int) -> int:
    return x + y


@celery_app.task(name="example.long_running_task")
def long_running_task(seconds: int = 5) -> str:
    time.sleep(seconds)
    return f"任务完成，耗时 {seconds} 秒"


@celery_app.task(name="example.send_email")
def send_email(to_email: str, subject: str, body: str) -> bool:
    print(f"发送邮件到: {to_email}")
    print(f"主题: {subject}")
    print(f"内容: {body}")
    return True
