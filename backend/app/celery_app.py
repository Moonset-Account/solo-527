from celery import Celery
from .config import get_settings
from datetime import datetime, date
import traceback
import io
import pandas as pd

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


def generate_report(db, params: dict) -> dict:
    from sqlalchemy import func, and_, or_
    from .models import Appointment, Schedule, Counselor, TimeSlot, OperationLog, NoShowList, User

    start_date = params.get("start_date")
    end_date = params.get("end_date")

    result = {}

    date_filter = []
    if start_date:
        date_filter.append(Schedule.schedule_date >= start_date)
    if end_date:
        date_filter.append(Schedule.schedule_date <= end_date)

    if params.get("include_utilization", True):
        schedules_query = db.query(Schedule)
        if date_filter:
            schedules_query = schedules_query.filter(and_(*date_filter))
        schedules = schedules_query.all()
        utilization_data = []

        for sched in schedules:
            appointments_in_sched = db.query(Appointment).filter(
                Appointment.schedule_id == sched.id,
                Appointment.status != "cancelled"
            ).all()

            booked = len(appointments_in_sched)

            counselor = db.query(Counselor).filter(Counselor.id == sched.counselor_id).first()
            time_slot = db.query(TimeSlot).filter(TimeSlot.id == sched.time_slot_id).first()

            apt_ids = [a.id for a in appointments_in_sched]
            last_op = None
            if apt_ids:
                last_op = db.query(OperationLog).filter(
                    OperationLog.target_type == "appointment",
                    OperationLog.target_id.in_(apt_ids)
                ).order_by(OperationLog.created_at.desc()).first()

            last_operator_name = None
            last_operation_time = None
            last_operation_type = None
            if last_op:
                op_user = db.query(User).filter(User.id == last_op.operator_id).first()
                if op_user:
                    last_operator_name = op_user.real_name
                last_operation_time = last_op.created_at.isoformat() if last_op.created_at else None
                last_operation_type = last_op.operation_type

            utilization_data.append({
                "schedule_id": sched.id,
                "counselor_name": counselor.name if counselor else "未知",
                "schedule_date": sched.schedule_date.isoformat(),
                "time_slot": f"{time_slot.start_time} - {time_slot.end_time}" if time_slot else "未知",
                "max_appointments": sched.max_appointments,
                "booked_count": booked,
                "available_slots": max(0, sched.max_appointments - booked),
                "utilization_rate": round(booked / sched.max_appointments * 100, 2) if sched.max_appointments > 0 else 0,
                "status": "可预约" if sched.is_available else "已停用",
                "last_operator": last_operator_name or "无",
                "last_operation_time": last_operation_time or "-",
                "last_operation_type": last_operation_type or "-"
            })
        result["utilization"] = utilization_data

    if params.get("include_conflicts", True):
        conflicts = []

        apt_query = db.query(Appointment).join(Schedule)
        if date_filter:
            apt_query = apt_query.filter(and_(*date_filter))
        appointments = apt_query.all()

        for apt in appointments:
            conflict_reason = None
            conflict_details = []

            no_show = db.query(NoShowList).filter(
                NoShowList.visitor_phone == apt.visitor_phone,
                NoShowList.is_blocked == True
            ).first()

            if no_show:
                conflict_details.append(f"访客在爽约名单中(爽约{no_show.no_show_count}次)")

            sched = db.query(Schedule).filter(Schedule.id == apt.schedule_id).first()
            if sched:
                same_slot_appts = db.query(Appointment).filter(
                    Appointment.schedule_id == apt.schedule_id,
                    Appointment.status != "cancelled",
                    Appointment.id != apt.id
                ).all()
                conflict_ids = [a.id for a in same_slot_appts]

                if len(same_slot_appts) >= sched.max_appointments:
                    conflict_details.append(f"档期超出最大预约数(预约{len(same_slot_appts)+1}/{sched.max_appointments})")
                elif len(same_slot_appts) > 0:
                    pass
            else:
                conflict_ids = []

            if apt.status == "no_show":
                conflict_details.append("访客已爽约")
            elif apt.status == "cancelled":
                conflict_details.append("预约已取消")

            if conflict_details:
                conflict_reason = "; ".join(conflict_details)

            if conflict_reason or apt.status in ["no_show", "cancelled"]:
                counselor = db.query(Counselor).filter(Counselor.id == sched.counselor_id).first() if sched else None
                time_slot = db.query(TimeSlot).filter(TimeSlot.id == sched.time_slot_id).first() if sched else None

                conflicts.append({
                    "appointment_id": apt.id,
                    "visitor_name": apt.visitor_name,
                    "visitor_phone": apt.visitor_phone,
                    "counselor_name": counselor.name if counselor else "未知",
                    "schedule_date": sched.schedule_date.isoformat() if sched else "-",
                    "time_slot": f"{time_slot.start_time} - {time_slot.end_time}" if time_slot else "-",
                    "appointment_status": get_status_text(apt.status),
                    "conflict_reason": conflict_reason or f"预约状态: {get_status_text(apt.status)}",
                    "conflict_with_ids": ",".join(map(str, conflict_ids)) if conflict_ids else "-"
                })
        result["conflicts"] = conflicts

    if params.get("include_operations", True):
        op_query = db.query(OperationLog).order_by(OperationLog.created_at.desc())
        if start_date:
            op_query = op_query.filter(OperationLog.created_at >= start_date)
        if end_date:
            op_query = op_query.filter(OperationLog.created_at <= end_date + " 23:59:59")
        operations = op_query.limit(5000).all()

        result["operations"] = [{
            "id": op.id,
            "operator": op.operator.real_name if op.operator else "未知",
            "operator_username": op.operator.username if op.operator else "-",
            "operation_type": get_operation_text(op.operation_type),
            "target_type": get_target_type_text(op.target_type),
            "target_id": op.target_id,
            "ip_address": op.ip_address or "-",
            "old_value_summary": summarize_value(op.old_value),
            "new_value_summary": summarize_value(op.new_value),
            "created_at": op.created_at.isoformat() if op.created_at else "-"
        } for op in operations]

    result["summary"] = {
        "generated_at": datetime.now().isoformat(),
        "date_range": {
            "start_date": start_date or "全部",
            "end_date": end_date or "全部"
        },
        "stats": {
            "total_schedules": len(result.get("utilization", [])),
            "total_conflicts": len(result.get("conflicts", [])),
            "total_operations": len(result.get("operations", []))
        }
    }

    return result


def get_status_text(status: str) -> str:
    map = {
        "pending": "待确认",
        "confirmed": "已确认",
        "completed": "已完成",
        "cancelled": "已取消",
        "no_show": "爽约"
    }
    return map.get(status, status)


def get_operation_text(op_type: str) -> str:
    map = {
        "create": "创建",
        "update": "更新",
        "delete": "删除",
        "cancel": "取消",
        "confirm": "确认",
        "complete": "完成",
        "mark_no_show": "标记爽约",
        "toggle_active": "启用/停用",
        "batch_create": "批量创建"
    }
    return map.get(op_type, op_type)


def get_target_type_text(target: str) -> str:
    map = {
        "user": "用户",
        "counselor": "咨询师",
        "time_slot": "时段",
        "schedule": "排班",
        "appointment": "预约",
        "no_show_list": "爽约名单",
        "config": "系统配置"
    }
    return map.get(target, target)


def summarize_value(value) -> str:
    if not value:
        return "-"
    if isinstance(value, dict):
        keys = list(value.keys())
        if len(keys) <= 5:
            return ", ".join([f"{k}={value[k]}" for k in keys])
        else:
            return f"{len(keys)}个字段变更"
    return str(value)[:100]


def generate_excel_bytes(data: dict) -> bytes:
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        if "summary" in data:
            summary = data["summary"]
            summary_rows = []
            summary_rows.append(["报表生成时间", summary["generated_at"]])
            summary_rows.append(["日期范围", f"{summary['date_range']['start_date']} 至 {summary['date_range']['end_date']}"])
            summary_rows.append(["总排档数", summary["stats"]["total_schedules"]])
            summary_rows.append(["冲突/异常数", summary["stats"]["total_conflicts"]])
            summary_rows.append(["操作记录数", summary["stats"]["total_operations"]])
            df_summary = pd.DataFrame(summary_rows, columns=["项目", "内容"])
            df_summary.to_excel(writer, sheet_name="报表概览", index=False)

        util_cols = ["排班ID", "咨询师", "日期", "时段", "最大预约数", "已预约数",
                     "剩余名额", "利用率(%)", "档期状态", "最近操作人", "最近操作类型", "最近操作时间"]
        util_data = data.get("utilization") or []
        if util_data:
            df_util = pd.DataFrame(util_data)
            df_util = df_util[[
                "schedule_id", "counselor_name", "schedule_date", "time_slot",
                "max_appointments", "booked_count", "available_slots",
                "utilization_rate", "status",
                "last_operator", "last_operation_type", "last_operation_time"
            ]]
            df_util.columns = util_cols
        else:
            df_util = pd.DataFrame(columns=util_cols)
        df_util.to_excel(writer, sheet_name="档期利用明细", index=False)

        conflict_cols = ["预约ID", "访客姓名", "访客电话", "咨询师", "预约日期",
                         "时段", "预约状态", "冲突/异常原因", "冲突预约ID"]
        conflict_data = data.get("conflicts") or []
        if conflict_data:
            df_conflict = pd.DataFrame(conflict_data)
            df_conflict = df_conflict[[
                "appointment_id", "visitor_name", "visitor_phone",
                "counselor_name", "schedule_date", "time_slot",
                "appointment_status", "conflict_reason", "conflict_with_ids"
            ]]
            df_conflict.columns = conflict_cols
        else:
            df_conflict = pd.DataFrame(columns=conflict_cols)
        df_conflict.to_excel(writer, sheet_name="预约冲突明细", index=False)

        ops_cols = ["日志ID", "操作人姓名", "操作人账号", "操作类型", "目标类型",
                    "目标ID", "IP地址", "变更前摘要", "变更后摘要", "操作时间"]
        ops_data = data.get("operations") or []
        if ops_data:
            df_ops = pd.DataFrame(ops_data)
            df_ops = df_ops[[
                "id", "operator", "operator_username", "operation_type",
                "target_type", "target_id", "ip_address",
                "old_value_summary", "new_value_summary", "created_at"
            ]]
            df_ops.columns = ops_cols
        else:
            df_ops = pd.DataFrame(columns=ops_cols)
        df_ops.to_excel(writer, sheet_name="操作记录明细", index=False)

    output.seek(0)
    return output.getvalue()


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
