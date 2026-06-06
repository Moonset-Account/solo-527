from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List, Dict
from app.models import (
    MaintenanceOrder, MaintenanceOrderStatus,
    RoomStatus, RoomStatusType,
    User, UserRole,
    Notification,
    CleaningTask, CleaningTaskStatus,
    MaterialUsage
)
from app.core.logging import logger
from app.core.exceptions import BusinessException


class MaintenanceService:
    @staticmethod
    def generate_order_no() -> str:
        now = datetime.now()
        return f"MO{now.strftime('%Y%m%d%H%M%S')}{now.microsecond // 1000:03d}"

    @staticmethod
    def assign_maintenance_order(
        db: Session,
        order_id: int,
        technician_id: int,
        assigned_by: int,
        scheduled_time: datetime = None
    ) -> MaintenanceOrder:
        order = db.query(MaintenanceOrder).filter(MaintenanceOrder.id == order_id).first()
        if not order:
            raise BusinessException("维修工单不存在")
        if order.status not in [MaintenanceOrderStatus.PENDING, MaintenanceOrderStatus.REJECTED]:
            raise BusinessException("当前工单状态不可分配")

        technician = db.query(User).filter(
            User.id == technician_id,
            User.role == UserRole.MAINTENANCE,
            User.is_active == True
        ).first()
        if not technician:
            raise BusinessException("维修人员不存在或未激活")

        order.technician_id = technician_id
        order.status = MaintenanceOrderStatus.ASSIGNED
        if scheduled_time:
            order.scheduled_time = scheduled_time
        order.updated_at = datetime.utcnow()

        db.add(Notification(
            user_id=technician_id,
            title="新的维修工单",
            content=f"您被分配了新的维修工单: {order.order_no}",
            notification_type="maintenance_order",
            related_id=order.id
        ))

        db.commit()
        db.refresh(order)
        logger.info(f"Maintenance order {order.order_no} assigned to technician {technician.full_name}")
        return order

    @staticmethod
    def start_maintenance_order(db: Session, order_id: int, user_id: int) -> MaintenanceOrder:
        order = db.query(MaintenanceOrder).filter(MaintenanceOrder.id == order_id).first()
        if not order:
            raise BusinessException("维修工单不存在")
        if order.technician_id != user_id:
            raise BusinessException("无权操作此工单")
        if order.status != MaintenanceOrderStatus.ASSIGNED:
            raise BusinessException("当前工单状态不可开始")

        order.status = MaintenanceOrderStatus.IN_PROGRESS
        order.started_at = datetime.utcnow()

        room_status = db.query(RoomStatus).filter(
            RoomStatus.property_id == order.property_id,
            RoomStatus.date == datetime.utcnow().date()
        ).first()
        if room_status and room_status.status not in [RoomStatusType.OCCUPIED]:
            room_status.status = RoomStatusType.MAINTENANCE

        db.commit()
        db.refresh(order)
        logger.info(f"Maintenance order {order.order_no} started")
        return order

    @staticmethod
    def submit_maintenance_order(
        db: Session,
        order_id: int,
        user_id: int,
        solution: str = None,
        actual_cost: float = None
    ) -> MaintenanceOrder:
        order = db.query(MaintenanceOrder).filter(MaintenanceOrder.id == order_id).first()
        if not order:
            raise BusinessException("维修工单不存在")
        if order.technician_id != user_id:
            raise BusinessException("无权操作此工单")
        if order.status != MaintenanceOrderStatus.IN_PROGRESS:
            raise BusinessException("当前工单状态不可提交")

        order.status = MaintenanceOrderStatus.SUBMITTED
        order.submitted_at = datetime.utcnow()
        if solution:
            order.solution = solution
        if actual_cost is not None:
            order.actual_cost = actual_cost

        managers = db.query(User).filter(
            or_(User.role == UserRole.MANAGER, User.role == UserRole.ADMIN),
            User.is_active == True
        ).all()
        for manager in managers:
            db.add(Notification(
                user_id=manager.id,
                title="维修工单待验收",
                content=f"维修工单 {order.order_no} 已提交，等待验收",
                notification_type="maintenance_order",
                related_id=order.id
            ))

        db.commit()
        db.refresh(order)
        logger.info(f"Maintenance order {order.order_no} submitted")
        return order

    @staticmethod
    def approve_maintenance_order(
        db: Session,
        order_id: int,
        inspector_id: int,
        remarks: str = None
    ) -> MaintenanceOrder:
        order = db.query(MaintenanceOrder).filter(MaintenanceOrder.id == order_id).first()
        if not order:
            raise BusinessException("维修工单不存在")
        if order.status not in [MaintenanceOrderStatus.SUBMITTED, MaintenanceOrderStatus.INSPECTING]:
            raise BusinessException("当前工单状态不可验收")

        order.status = MaintenanceOrderStatus.COMPLETED
        order.completed_at = datetime.utcnow()
        order.inspector_remarks = remarks

        room_status = db.query(RoomStatus).filter(
            RoomStatus.property_id == order.property_id,
            RoomStatus.date == datetime.utcnow().date()
        ).first()
        if room_status and room_status.status == RoomStatusType.MAINTENANCE:
            active_cleaning = db.query(CleaningTask).filter(
                CleaningTask.property_id == order.property_id,
                CleaningTask.status.in_([
                    CleaningTaskStatus.ASSIGNED,
                    CleaningTaskStatus.IN_PROGRESS,
                    CleaningTaskStatus.SUBMITTED
                ])
            ).first()
            if not active_cleaning:
                room_status.status = RoomStatusType.AVAILABLE

        db.add(Notification(
            user_id=order.technician_id,
            title="维修工单已完成",
            content=f"您的维修工单 {order.order_no} 已通过验收",
            notification_type="maintenance_order",
            related_id=order.id
        ))

        db.commit()
        db.refresh(order)
        logger.info(f"Maintenance order {order.order_no} approved")
        return order

    @staticmethod
    def reject_maintenance_order(
        db: Session,
        order_id: int,
        inspector_id: int,
        remarks: str
    ) -> MaintenanceOrder:
        order = db.query(MaintenanceOrder).filter(MaintenanceOrder.id == order_id).first()
        if not order:
            raise BusinessException("维修工单不存在")
        if order.status not in [MaintenanceOrderStatus.SUBMITTED, MaintenanceOrderStatus.INSPECTING]:
            raise BusinessException("当前工单状态不可驳回")

        order.status = MaintenanceOrderStatus.REJECTED
        order.inspector_remarks = remarks

        db.add(Notification(
            user_id=order.technician_id,
            title="维修工单被驳回",
            content=f"您的维修工单 {order.order_no} 被驳回: {remarks}",
            notification_type="maintenance_order",
            related_id=order.id
        ))

        db.commit()
        db.refresh(order)
        logger.info(f"Maintenance order {order.order_no} rejected")
        return order


class ReportService:
    @staticmethod
    def get_dashboard_stats(
        db: Session, 
        start_date: datetime = None, 
        end_date: datetime = None,
        status: Optional[str] = None,
        cleaner_id: Optional[int] = None
    ) -> Dict:
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()

        stats = {}

        task_query = db.query(CleaningTask).filter(
            CleaningTask.created_at.between(start_date, end_date)
        )
        if cleaner_id:
            task_query = task_query.filter(CleaningTask.cleaner_id == cleaner_id)
        if status:
            task_query = task_query.filter(CleaningTask.status == status)

        stats["total_cleaning_tasks"] = task_query.count()

        completed_task_query = db.query(CleaningTask).filter(
            CleaningTask.status == CleaningTaskStatus.APPROVED,
            CleaningTask.completed_at.between(start_date, end_date)
        )
        if cleaner_id:
            completed_task_query = completed_task_query.filter(CleaningTask.cleaner_id == cleaner_id)
        stats["completed_cleaning_tasks"] = completed_task_query.count()

        overdue_task_query = db.query(CleaningTask).filter(
            CleaningTask.is_overdue == 1,
            CleaningTask.status.notin_([CleaningTaskStatus.APPROVED, CleaningTaskStatus.CANCELLED])
        )
        if cleaner_id:
            overdue_task_query = overdue_task_query.filter(CleaningTask.cleaner_id == cleaner_id)
        stats["overdue_cleaning_tasks"] = overdue_task_query.count()

        stats["total_maintenance_orders"] = db.query(MaintenanceOrder).filter(
            MaintenanceOrder.created_at.between(start_date, end_date)
        ).count()

        stats["completed_maintenance_orders"] = db.query(MaintenanceOrder).filter(
            MaintenanceOrder.status == MaintenanceOrderStatus.COMPLETED,
            MaintenanceOrder.completed_at.between(start_date, end_date)
        ).count()

        stats["overdue_maintenance_orders"] = db.query(MaintenanceOrder).filter(
            MaintenanceOrder.is_overdue == 1,
            MaintenanceOrder.status.notin_([MaintenanceOrderStatus.COMPLETED, MaintenanceOrderStatus.CANCELLED])
        ).count()

        material_cost_query = db.query(func.sum(MaterialUsage.total_cost)).filter(
            MaterialUsage.created_at.between(start_date, end_date)
        )
        if cleaner_id:
            material_cost_query = material_cost_query.join(CleaningTask).filter(
                CleaningTask.cleaner_id == cleaner_id
            )
        material_cost = material_cost_query.scalar() or 0

        maintenance_cost = db.query(func.sum(MaintenanceOrder.actual_cost)).filter(
            MaintenanceOrder.completed_at.between(start_date, end_date)
        ).scalar() or 0

        stats["total_cost"] = round(float(material_cost) + float(maintenance_cost), 2)

        active_cleaners = db.query(User).filter(
            User.role == UserRole.CLEANER,
            User.is_active == True
        ).count()

        busy_cleaners_query = db.query(CleaningTask.cleaner_id).filter(
            CleaningTask.status.in_([CleaningTaskStatus.ASSIGNED, CleaningTaskStatus.IN_PROGRESS])
        )
        if cleaner_id:
            busy_cleaners_query = busy_cleaners_query.filter(CleaningTask.cleaner_id == cleaner_id)
            active_cleaners = 1 if cleaner_id else active_cleaners
        busy_cleaners = busy_cleaners_query.distinct().count()

        stats["cleaner_utilization"] = round((busy_cleaners / active_cleaners * 100), 1) if active_cleaners > 0 else 0

        active_techs = db.query(User).filter(
            User.role == UserRole.MAINTENANCE,
            User.is_active == True
        ).count()

        busy_techs = db.query(MaintenanceOrder.technician_id).filter(
            MaintenanceOrder.status.in_([MaintenanceOrderStatus.ASSIGNED, MaintenanceOrderStatus.IN_PROGRESS])
        ).distinct().count()

        stats["technician_utilization"] = round((busy_techs / active_techs * 100), 1) if active_techs > 0 else 0

        return stats

    @staticmethod
    def get_cleaner_performance(db: Session, start_date: datetime, end_date: datetime) -> List[Dict]:
        cleaners = db.query(User).filter(
            User.role == UserRole.CLEANER,
            User.is_active == True
        ).all()

        performance = []
        for cleaner in cleaners:
            tasks = db.query(CleaningTask).filter(
                CleaningTask.cleaner_id == cleaner.id,
                CleaningTask.created_at.between(start_date, end_date)
            ).all()

            completed = [t for t in tasks if t.status == CleaningTaskStatus.APPROVED]
            total_duration = sum(t.actual_duration or 0 for t in completed)
            avg_duration = round(total_duration / len(completed), 2) if completed else 0

            overdue_count = db.query(CleaningTask).filter(
                CleaningTask.cleaner_id == cleaner.id,
                CleaningTask.is_overdue == 1,
                CleaningTask.created_at.between(start_date, end_date)
            ).count()

            performance.append({
                "cleaner_id": cleaner.id,
                "cleaner_name": cleaner.full_name,
                "total_tasks": len(tasks),
                "completed_tasks": len(completed),
                "completion_rate": round(len(completed) / len(tasks) * 100, 1) if tasks else 0,
                "avg_duration_hours": avg_duration,
                "overdue_count": overdue_count,
                "overdue_rate": round(overdue_count / len(tasks) * 100, 1) if tasks else 0
            })

        return sorted(performance, key=lambda x: x["completed_tasks"], reverse=True)
