import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from app.celery_app import celery
from app.config import settings
from app.database import SessionLocal
from app import models
from datetime import datetime
import json
import pandas as pd
import io


@celery.task(bind=True)
def send_email_task(self, to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        
        msg.attach(MIMEText(body, "html", "utf-8"))
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        return {"status": "success", "to": to_email}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


@celery.task(bind=True)
def send_notification_task(self, recipient_id: int, title: str, content: str, notification_type: str = "system"):
    db = SessionLocal()
    try:
        notification = models.Notification(
            recipient_id=recipient_id,
            title=title,
            content=content,
            notification_type=notification_type
        )
        db.add(notification)
        db.commit()
        
        user = db.query(models.User).filter(models.User.id == recipient_id).first()
        if user and user.email:
            send_email_task.delay(user.email, title, content)
        
        return {"status": "success", "notification_id": notification.id}
    except Exception as e:
        db.rollback()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()


@celery.task(bind=True)
def schedule_reminder_task(self, schedule_id: int):
    db = SessionLocal()
    try:
        schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
        if not schedule:
            return {"status": "failed", "error": "Schedule not found"}
        
        if schedule.doctor.user_id:
            send_notification_task.delay(
                schedule.doctor.user_id,
                f"排班提醒: {schedule.title}",
                f"您有一个排班: {schedule.title}\n时间: {schedule.date} {schedule.start_time}-{schedule.end_time}\n地点: {schedule.location.name}",
                "schedule_reminder"
            )
        
        for sv in schedule.volunteers:
            if sv.volunteer.user_id:
                send_notification_task.delay(
                    sv.volunteer.user_id,
                    f"排班提醒: {schedule.title}",
                    f"您有一个志愿排班: {schedule.title}\n时间: {schedule.date} {schedule.start_time}-{schedule.end_time}\n地点: {schedule.location.name}",
                    "schedule_reminder"
                )
        
        return {"status": "success"}
    except Exception as e:
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()


@celery.task(bind=True)
def import_data_task(self, task_id: int, file_content: bytes, entity_type: str):
    db = SessionLocal()
    try:
        task = db.query(models.ImportExportTask).filter(models.ImportExportTask.id == task_id).first()
        if not task:
            return
        
        task.status = models.TaskStatus.PROCESSING
        task.started_at = datetime.utcnow()
        db.commit()
        
        df = pd.read_excel(io.BytesIO(file_content))
        task.total_count = len(df)
        success_count = 0
        failed_count = 0
        
        for _, row in df.iterrows():
            try:
                if entity_type == "medicine":
                    medicine = models.Medicine(
                        name=row.get("名称", ""),
                        generic_name=row.get("通用名"),
                        category=row.get("分类"),
                        specification=row.get("规格"),
                        unit=row.get("单位", "盒"),
                        manufacturer=row.get("生产厂家"),
                        stock_quantity=int(row.get("库存数量", 0)),
                        minimum_stock=int(row.get("最低库存", 10))
                    )
                    db.add(medicine)
                elif entity_type == "location":
                    location = models.Location(
                        name=row.get("名称", ""),
                        address=row.get("地址", ""),
                        district=row.get("区县"),
                        city=row.get("城市"),
                        contact_person=row.get("联系人"),
                        contact_phone=row.get("联系电话"),
                        capacity=int(row.get("容量", 0)) if row.get("容量") else None
                    )
                    db.add(location)
                success_count += 1
            except Exception:
                failed_count += 1
        
        task.success_count = success_count
        task.failed_count = failed_count
        task.status = models.TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        task.status = models.TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()


@celery.task(bind=True)
def export_data_task(self, task_id: int, entity_type: str):
    db = SessionLocal()
    try:
        task = db.query(models.ImportExportTask).filter(models.ImportExportTask.id == task_id).first()
        if not task:
            return
        
        task.status = models.TaskStatus.PROCESSING
        task.started_at = datetime.utcnow()
        db.commit()
        
        data = []
        if entity_type == "medicine":
            medicines = db.query(models.Medicine).all()
            for m in medicines:
                data.append({
                    "ID": m.id,
                    "名称": m.name,
                    "通用名": m.generic_name,
                    "分类": m.category,
                    "规格": m.specification,
                    "单位": m.unit,
                    "生产厂家": m.manufacturer,
                    "库存数量": m.stock_quantity,
                    "最低库存": m.minimum_stock
                })
        elif entity_type == "registration":
            regs = db.query(models.Registration).all()
            for r in regs:
                data.append({
                    "登记号": r.registration_number,
                    "患者姓名": r.patient_name,
                    "性别": r.patient_gender,
                    "年龄": r.patient_age,
                    "电话": r.patient_phone,
                    "状态": r.status.value,
                    "创建时间": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
                })
        
        df = pd.DataFrame(data)
        output = io.BytesIO()
        df.to_excel(output, index=False)
        output.seek(0)
        
        task.status = models.TaskStatus.COMPLETED
        task.total_count = len(data)
        task.success_count = len(data)
        task.completed_at = datetime.utcnow()
        db.commit()
        
        return {"status": "success", "file_name": f"{entity_type}_export_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    except Exception as e:
        task.status = models.TaskStatus.FAILED
        task.error_message = str(e)
        task.completed_at = datetime.utcnow()
        db.commit()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()
