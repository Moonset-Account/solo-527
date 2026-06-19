from celery import Celery
from .config import get_settings
from datetime import datetime
import traceback

settings = get_settings()

celery = Celery(
    "counseling_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=25 * 60,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)


def update_task_status(task_id: str, status: str, **kwargs):
    from .database import SessionLocal
    from .models import APITask, TaskStatus
    
    db = SessionLocal()
    try:
        task = db.query(APITask).filter(APITask.task_id == task_id).first()
        if task:
            task.status = status
            if "error_message" in kwargs:
                task.error_message = kwargs["error_message"]
            if "error_traceback" in kwargs:
                task.error_traceback = kwargs["error_traceback"]
            if "response_data" in kwargs:
                task.response_data = kwargs["response_data"]
            if status == TaskStatus.RUNNING:
                task.started_at = datetime.utcnow()
            elif status in [TaskStatus.SUCCESS, TaskStatus.FAILED]:
                task.completed_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def export_report_task(self, export_params: dict, user_id: int, task_id: str):
    from .database import SessionLocal
    from .models import TaskStatus
    
    update_task_status(task_id, TaskStatus.RUNNING)
    
    try:
        db = SessionLocal()
        result = generate_report(db, export_params)
        db.close()
        
        update_task_status(task_id, TaskStatus.SUCCESS, response_data=result)
        return {"status": "success", "data": result}
    except Exception as e:
        retry_count = self.request.retries
        error_msg = str(e)
        error_tb = traceback.format_exc()
        
        if retry_count < self.max_retries:
            update_task_status(
                task_id, 
                TaskStatus.RETRYING, 
                error_message=error_msg,
                error_traceback=error_tb
            )
            self.retry(countdown=60 * (retry_count + 1))
        else:
            update_task_status(
                task_id, 
                TaskStatus.FAILED, 
                error_message=error_msg,
                error_traceback=error_tb
            )
        return {"status": "failed", "error": error_msg}


def generate_report(db, params: dict) -> dict:
    from sqlalchemy import func, and_
    from .models import Appointment, Schedule, Counselor, TimeSlot, OperationLog, NoShowList
    from datetime import date
    
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    
    result = {}
    
    date_filter = []
    if start_date:
        date_filter.append(Schedule.schedule_date >= start_date)
    if end_date:
        date_filter.append(Schedule.schedule_date <= end_date)
    
    if params.get("include_utilization", True):
        schedules = db.query(Schedule).filter(and_(*date_filter)).all()
        utilization_data = []
        
        for sched in schedules:
            booked = db.query(Appointment).filter(
                Appointment.schedule_id == sched.id,
                Appointment.status != "cancelled"
            ).count()
            
            counselor = db.query(Counselor).filter(Counselor.id == sched.counselor_id).first()
            time_slot = db.query(TimeSlot).filter(TimeSlot.id == sched.time_slot_id).first()
            
            utilization_data.append({
                "schedule_id": sched.id,
                "counselor_name": counselor.name if counselor else "Unknown",
                "schedule_date": sched.schedule_date.isoformat(),
                "time_slot": f"{time_slot.start_time} - {time_slot.end_time}" if time_slot else "Unknown",
                "max_appointments": sched.max_appointments,
                "booked_count": booked,
                "utilization_rate": round(booked / sched.max_appointments * 100, 2) if sched.max_appointments > 0 else 0,
                "status": "available" if sched.is_available else "unavailable"
            })
        result["utilization"] = utilization_data
    
    if params.get("include_conflicts", True):
        conflicts = []
        appointments = db.query(Appointment).join(Schedule).filter(and_(*date_filter)).all()
        
        for apt in appointments:
            conflict_reason = None
            no_show = db.query(NoShowList).filter(
                NoShowList.visitor_phone == apt.visitor_phone,
                NoShowList.is_blocked == True
            ).first()
            
            if no_show:
                conflict_reason = f"访客在爽约名单中，爽约次数: {no_show.no_show_count}"
            
            same_slot_count = db.query(Appointment).filter(
                Appointment.schedule_id == apt.schedule_id,
                Appointment.status != "cancelled",
                Appointment.id != apt.id
            ).count()
            
            sched = db.query(Schedule).filter(Schedule.id == apt.schedule_id).first()
            if sched and same_slot_count >= sched.max_appointments:
                conflict_reason = "档期预约冲突，已超出最大预约数"
            
            if conflict_reason:
                counselor = db.query(Counselor).filter(Counselor.id == sched.counselor_id).first()
                time_slot = db.query(TimeSlot).filter(TimeSlot.id == sched.time_slot_id).first()
                
                conflicts.append({
                    "appointment_id": apt.id,
                    "visitor_name": apt.visitor_name,
                    "visitor_phone": apt.visitor_phone,
                    "counselor_name": counselor.name if counselor else "Unknown",
                    "schedule_date": sched.schedule_date.isoformat(),
                    "time_slot": f"{time_slot.start_time} - {time_slot.end_time}" if time_slot else "Unknown",
                    "conflict_reason": conflict_reason
                })
        result["conflicts"] = conflicts
    
    if params.get("include_operations", True):
        operations = db.query(OperationLog).order_by(OperationLog.created_at.desc()).limit(1000).all()
        result["operations"] = [{
            "id": op.id,
            "operator": op.operator.real_name if op.operator else "Unknown",
            "operation_type": op.operation_type,
            "target_type": op.target_type,
            "target_id": op.target_id,
            "ip_address": op.ip_address,
            "created_at": op.created_at.isoformat()
        } for op in operations]
    
    return result


@celery.task(bind=True, max_retries=3)
def send_notification_task(self, notification_type: str, data: dict, task_id: str):
    update_task_status(task_id, TaskStatus.RUNNING)
    
    try:
        update_task_status(task_id, TaskStatus.SUCCESS, response_data={"sent": True})
        return {"status": "success"}
    except Exception as e:
        retry_count = self.request.retries
        if retry_count < self.max_retries:
            update_task_status(task_id, TaskStatus.RETRYING, error_message=str(e))
            self.retry(countdown=30)
        else:
            update_task_status(task_id, TaskStatus.FAILED, error_message=str(e))
        return {"status": "failed", "error": str(e)}
