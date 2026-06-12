from datetime import datetime
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import RepairOrder, User, ExportRecord
from sqlalchemy import func


@celery_app.task
def send_notification(user_id: int, order_id: int, channel: str, content: str):
    from app.models import NotificationReceipt
    db = SessionLocal()
    try:
        receipt = NotificationReceipt(
            user_id=user_id,
            order_id=order_id,
            channel=channel,
            content=content,
            is_read=False,
            sent_at=datetime.utcnow(),
        )
        db.add(receipt)
        db.commit()
    finally:
        db.close()
    return {"user_id": user_id, "order_id": order_id, "channel": channel, "status": "sent"}


@celery_app.task
def generate_export(export_id: int, filter_params: dict):
    import os
    from app.utils.export_utils import generate_excel
    db = SessionLocal()
    try:
        export_record = db.query(ExportRecord).filter(ExportRecord.id == export_id).first()
        if not export_record:
            return {"error": "Export record not found"}

        operator = db.query(User).filter(User.id == export_record.operator_id).first()
        operator_name = operator.real_name or operator.username if operator else "Unknown"

        queryset = db.query(RepairOrder)
        if filter_params:
            if filter_params.get("status"):
                queryset = queryset.filter(RepairOrder.status == filter_params["status"])
            if filter_params.get("category"):
                queryset = queryset.filter(RepairOrder.category == filter_params["category"])
            if filter_params.get("student_id"):
                queryset = queryset.filter(RepairOrder.student_id == filter_params["student_id"])

        columns = ["id", "title", "category", "status", "urgency", "dorm_room", "created_at", "updated_at"]
        filename = f"export_{export_record.export_type}_{export_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.xlsx"

        os.makedirs("exports", exist_ok=True)
        file_path = os.path.join("exports", filename)

        generate_excel(queryset.all(), columns, filter_params, operator_name, file_path, db)

        export_record.file_path = file_path
        export_record.generated_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()
    return {"export_id": export_id, "status": "completed"}


@celery_app.task
def calculate_statistics():
    db = SessionLocal()
    try:
        total = db.query(func.count(RepairOrder.id)).scalar()
        pending = db.query(func.count(RepairOrder.id)).filter(RepairOrder.status == "pending").scalar()
        in_progress = db.query(func.count(RepairOrder.id)).filter(RepairOrder.status == "in_progress").scalar()
        completed = db.query(func.count(RepairOrder.id)).filter(RepairOrder.status == "completed").scalar()

        category_dist = {}
        for row in db.query(RepairOrder.category, func.count(RepairOrder.id)).group_by(RepairOrder.category).all():
            category_dist[row[0]] = row[1]

        urgency_dist = {}
        for row in db.query(RepairOrder.urgency, func.count(RepairOrder.id)).group_by(RepairOrder.urgency).all():
            urgency_dist[row[0]] = row[1]

        avg_days = None
        if completed > 0:
            from sqlalchemy import extract
            avg_result = db.query(
                func.avg(
                    func.julianday(RepairOrder.updated_at) - func.julianday(RepairOrder.created_at)
                )
            ).filter(RepairOrder.status == "completed").scalar()
            avg_days = round(avg_result, 2) if avg_result else None

        return {
            "total_orders": total,
            "pending_orders": pending,
            "in_progress_orders": in_progress,
            "completed_orders": completed,
            "avg_processing_days": avg_days,
            "category_distribution": category_dist,
            "urgency_distribution": urgency_dist,
        }
    finally:
        db.close()
