from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from app.models import (
    CleaningTask, CleaningTaskStatus,
    MaintenanceOrder, MaintenanceOrderStatus,
    RoomStatus, RoomStatusType,
    User, UserRole,
    Notification
)
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import BusinessException


class TaskService:
    @staticmethod
    def generate_task_no(prefix: str = "CT") -> str:
        now = datetime.now()
        return f"{prefix}{now.strftime('%Y%m%d%H%M%S')}{now.microsecond // 1000:03d}"

    @staticmethod
    def assign_cleaning_task(
        db: Session,
        task_id: int,
        cleaner_id: int,
        assigned_by: int
    ) -> CleaningTask:
        task = db.query(CleaningTask).filter(CleaningTask.id == task_id).first()
        if not task:
            raise BusinessException("保洁任务不存在")
        if task.status not in [CleaningTaskStatus.PENDING, CleaningTaskStatus.REJECTED]:
            raise BusinessException("当前任务状态不可分配")

        cleaner = db.query(User).filter(
            User.id == cleaner_id,
            User.role == UserRole.CLEANER,
            User.is_active == True
        ).first()
        if not cleaner:
            raise BusinessException("保洁员不存在或未激活")

        task.cleaner_id = cleaner_id
        task.status = CleaningTaskStatus.ASSIGNED
        task.updated_at = datetime.utcnow()

        db.add(Notification(
            user_id=cleaner_id,
            title="新的保洁任务",
            content=f"您被分配了新的保洁任务: {task.task_no}",
            notification_type="cleaning_task",
            related_id=task.id
        ))

        db.commit()
        db.refresh(task)
        logger.info(f"Cleaning task {task.task_no} assigned to cleaner {cleaner.full_name}")
        return task

    @staticmethod
    def start_cleaning_task(db: Session, task_id: int, user_id: int) -> CleaningTask:
        task = db.query(CleaningTask).filter(CleaningTask.id == task_id).first()
        if not task:
            raise BusinessException("保洁任务不存在")
        if task.cleaner_id != user_id:
            raise BusinessException("无权操作此任务")
        if task.status != CleaningTaskStatus.ASSIGNED:
            raise BusinessException("当前任务状态不可开始")

        task.status = CleaningTaskStatus.IN_PROGRESS
        task.started_at = datetime.utcnow()

        room_status = db.query(RoomStatus).filter(
            RoomStatus.property_id == task.property_id,
            RoomStatus.date == datetime.utcnow().date()
        ).first()
        if room_status:
            room_status.status = RoomStatusType.CLEANING
            room_status.current_cleaning_task_id = task.id

        db.commit()
        db.refresh(task)
        logger.info(f"Cleaning task {task.task_no} started")
        return task

    @staticmethod
    def submit_cleaning_task(db: Session, task_id: int, user_id: int, description: str = None) -> CleaningTask:
        task = db.query(CleaningTask).filter(CleaningTask.id == task_id).first()
        if not task:
            raise BusinessException("保洁任务不存在")
        if task.cleaner_id != user_id:
            raise BusinessException("无权操作此任务")
        if task.status != CleaningTaskStatus.IN_PROGRESS:
            raise BusinessException("当前任务状态不可提交")

        task.status = CleaningTaskStatus.SUBMITTED
        task.submitted_at = datetime.utcnow()
        if task.started_at:
            duration = (task.submitted_at - task.started_at).total_seconds() / 3600
            task.actual_duration = round(duration, 2)
        if description:
            task.description = description

        room_status = db.query(RoomStatus).filter(
            RoomStatus.property_id == task.property_id,
            RoomStatus.date == datetime.utcnow().date()
        ).first()
        if room_status:
            room_status.status = RoomStatusType.CLEANING_COMPLETED

        managers = db.query(User).filter(
            or_(User.role == UserRole.MANAGER, User.role == UserRole.ADMIN),
            User.is_active == True
        ).all()
        for manager in managers:
            db.add(Notification(
                user_id=manager.id,
                title="保洁任务待验收",
                content=f"保洁任务 {task.task_no} 已提交，等待验收",
                notification_type="cleaning_task",
                related_id=task.id
            ))

        db.commit()
        db.refresh(task)
        logger.info(f"Cleaning task {task.task_no} submitted")
        return task

    @staticmethod
    def approve_cleaning_task(db: Session, task_id: int, inspector_id: int, remarks: str = None) -> CleaningTask:
        task = db.query(CleaningTask).filter(CleaningTask.id == task_id).first()
        if not task:
            raise BusinessException("保洁任务不存在")
        if task.status not in [CleaningTaskStatus.SUBMITTED, CleaningTaskStatus.INSPECTING]:
            raise BusinessException("当前任务状态不可验收")

        task.status = CleaningTaskStatus.APPROVED
        task.completed_at = datetime.utcnow()
        task.inspector_remarks = remarks

        room_status = db.query(RoomStatus).filter(
            RoomStatus.property_id == task.property_id,
            RoomStatus.date == datetime.utcnow().date()
        ).first()
        if room_status:
            room_status.status = RoomStatusType.AVAILABLE
            room_status.current_cleaning_task_id = None

        db.add(Notification(
            user_id=task.cleaner_id,
            title="保洁任务已通过",
            content=f"您的保洁任务 {task.task_no} 已通过验收",
            notification_type="cleaning_task",
            related_id=task.id
        ))

        db.commit()
        db.refresh(task)
        logger.info(f"Cleaning task {task.task_no} approved")
        return task

    @staticmethod
    def reject_cleaning_task(db: Session, task_id: int, inspector_id: int, remarks: str) -> CleaningTask:
        task = db.query(CleaningTask).filter(CleaningTask.id == task_id).first()
        if not task:
            raise BusinessException("保洁任务不存在")
        if task.status not in [CleaningTaskStatus.SUBMITTED, CleaningTaskStatus.INSPECTING]:
            raise BusinessException("当前任务状态不可驳回")

        task.status = CleaningTaskStatus.REJECTED
        task.inspector_remarks = remarks

        room_status = db.query(RoomStatus).filter(
            RoomStatus.property_id == task.property_id,
            RoomStatus.date == datetime.utcnow().date()
        ).first()
        if room_status:
            room_status.status = RoomStatusType.CLEANING

        db.add(Notification(
            user_id=task.cleaner_id,
            title="保洁任务被驳回",
            content=f"您的保洁任务 {task.task_no} 被驳回: {remarks}",
            notification_type="cleaning_task",
            related_id=task.id
        ))

        db.commit()
        db.refresh(task)
        logger.info(f"Cleaning task {task.task_no} rejected")
        return task

    @staticmethod
    def check_and_update_overdue(db: Session) -> dict:
        now = datetime.utcnow()
        result = {"cleaning_overdue": 0, "maintenance_overdue": 0}

        cleaning_tasks = db.query(CleaningTask).filter(
            CleaningTask.status.in_([
                CleaningTaskStatus.PENDING,
                CleaningTaskStatus.ASSIGNED,
                CleaningTaskStatus.IN_PROGRESS
            ]),
            CleaningTask.deadline_time != None,
            CleaningTask.deadline_time < now,
            CleaningTask.is_overdue == 0
        ).all()

        for task in cleaning_tasks:
            task.is_overdue = 1
            result["cleaning_overdue"] += 1

            managers = db.query(User).filter(
                or_(User.role == UserRole.MANAGER, User.role == UserRole.ADMIN),
                User.is_active == True
            ).all()
            for manager in managers:
                db.add(Notification(
                    user_id=manager.id,
                    title="保洁任务超时",
                    content=f"保洁任务 {task.task_no} 已超时，请及时处理",
                    notification_type="overdue",
                    related_id=task.id
                ))

        maintenance_orders = db.query(MaintenanceOrder).filter(
            MaintenanceOrder.status.in_([
                MaintenanceOrderStatus.PENDING,
                MaintenanceOrderStatus.ASSIGNED,
                MaintenanceOrderStatus.IN_PROGRESS
            ]),
            MaintenanceOrder.deadline_time != None,
            MaintenanceOrder.deadline_time < now,
            MaintenanceOrder.is_overdue == 0
        ).all()

        for order in maintenance_orders:
            order.is_overdue = 1
            result["maintenance_overdue"] += 1

        db.commit()
        logger.info(f"Overdue check completed: {result}")
        return result

    @staticmethod
    def can_check_in(db: Session, property_id: int, date: datetime.date) -> bool:
        room_status = db.query(RoomStatus).filter(
            RoomStatus.property_id == property_id,
            RoomStatus.date == date
        ).first()

        if not room_status:
            return True

        if room_status.status in [RoomStatusType.AVAILABLE, RoomStatusType.OCCUPIED]:
            return True

        if room_status.status in [
            RoomStatusType.CLEANING,
            RoomStatusType.CLEANING_COMPLETED,
            RoomStatusType.INSPECTING,
            RoomStatusType.MAINTENANCE
        ]:
            return False

        return room_status.status == RoomStatusType.AVAILABLE

    @staticmethod
    def get_available_cleaners(db: Session, exclude_task_id: int = None) -> List[User]:
        subquery = db.query(CleaningTask.cleaner_id).filter(
            CleaningTask.status.in_([
                CleaningTaskStatus.ASSIGNED,
                CleaningTaskStatus.IN_PROGRESS
            ])
        )
        if exclude_task_id:
            subquery = subquery.filter(CleaningTask.id != exclude_task_id)

        busy_cleaner_ids = [cid for (cid,) in subquery.all()]

        available_cleaners = db.query(User).filter(
            User.role == UserRole.CLEANER,
            User.is_active == True,
            ~User.id.in_(busy_cleaner_ids) if busy_cleaner_ids else True
        ).all()

        return available_cleaners

    @staticmethod
    def get_available_technicians(db: Session, exclude_order_id: int = None) -> List[User]:
        subquery = db.query(MaintenanceOrder.technician_id).filter(
            MaintenanceOrder.status.in_([
                MaintenanceOrderStatus.ASSIGNED,
                MaintenanceOrderStatus.IN_PROGRESS
            ])
        )
        if exclude_order_id:
            subquery = subquery.filter(MaintenanceOrder.id != exclude_order_id)

        busy_tech_ids = [tid for (tid,) in subquery.all()]

        available_technicians = db.query(User).filter(
            User.role == UserRole.MAINTENANCE,
            User.is_active == True,
            ~User.id.in_(busy_tech_ids) if busy_tech_ids else True
        ).all()

        return available_technicians
