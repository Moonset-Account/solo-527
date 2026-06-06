from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from app.models import (
    RoomStatus, RoomStatusType,
    CleaningTask, CleaningTaskStatus, CleaningTaskPriority,
    User
)
from app.core.config import settings
from app.core.exceptions import BusinessException
from app.core.logging import logger
from app.services.task_service import TaskService


class RoomStatusService:
    @staticmethod
    def validate_status_transition(
        db: Session,
        room_status: RoomStatus,
        new_status: RoomStatusType,
        current_user: User
    ) -> None:
        old_status = room_status.status

        if new_status == RoomStatusType.AVAILABLE:
            if room_status.current_cleaning_task_id:
                task = db.query(CleaningTask).filter(
                    CleaningTask.id == room_status.current_cleaning_task_id
                ).first()
                if task and task.status != CleaningTaskStatus.APPROVED:
                    raise BusinessException(
                        f"保洁任务(编号: {task.task_no})尚未验收通过，不能改为可入住状态"
                    )

        if new_status == RoomStatusType.OCCUPIED:
            if room_status.current_cleaning_task_id:
                task = db.query(CleaningTask).filter(
                    CleaningTask.id == room_status.current_cleaning_task_id
                ).first()
                if task and task.status != CleaningTaskStatus.APPROVED:
                    raise BusinessException(
                        f"保洁任务(编号: {task.task_no})尚未验收通过，不能办理入住"
                    )

    @staticmethod
    def on_status_changed(
        db: Session,
        room_status: RoomStatus,
        old_status: Optional[RoomStatusType],
        new_status: RoomStatusType,
        current_user: User
    ) -> None:
        if new_status == RoomStatusType.CHECKED_OUT and old_status != RoomStatusType.CHECKED_OUT:
            RoomStatusService._handle_checkout(db, room_status, current_user)

        if new_status == RoomStatusType.CLEANING and room_status.current_cleaning_task_id:
            task = db.query(CleaningTask).filter(
                CleaningTask.id == room_status.current_cleaning_task_id
            ).first()
            if task and task.status == CleaningTaskStatus.ASSIGNED:
                task.status = CleaningTaskStatus.IN_PROGRESS
                task.started_at = datetime.utcnow()
                logger.info(f"Cleaning task {task.task_no} started via room status change")

        if new_status == RoomStatusType.CLEANING_COMPLETED and room_status.current_cleaning_task_id:
            task = db.query(CleaningTask).filter(
                CleaningTask.id == room_status.current_cleaning_task_id
            ).first()
            if task and task.status == CleaningTaskStatus.IN_PROGRESS:
                task.status = CleaningTaskStatus.SUBMITTED
                task.submitted_at = datetime.utcnow()
                logger.info(f"Cleaning task {task.task_no} submitted via room status change")

        if new_status in [RoomStatusType.AVAILABLE, RoomStatusType.OCCUPIED]:
            if room_status.current_cleaning_task_id:
                task = db.query(CleaningTask).filter(
                    CleaningTask.id == room_status.current_cleaning_task_id
                ).first()
                if task and task.status == CleaningTaskStatus.SUBMITTED:
                    task.status = CleaningTaskStatus.APPROVED
                    task.completed_at = datetime.utcnow()
                    task.inspected_by = current_user.id
                    logger.info(f"Cleaning task {task.task_no} approved via room status change")
            room_status.current_cleaning_task_id = None

    @staticmethod
    def _handle_checkout(db: Session, room_status: RoomStatus, current_user: User) -> CleaningTask:
        existing_task = db.query(CleaningTask).filter(
            CleaningTask.property_id == room_status.property_id,
            CleaningTask.status.in_([
                CleaningTaskStatus.PENDING,
                CleaningTaskStatus.ASSIGNED,
                CleaningTaskStatus.IN_PROGRESS,
                CleaningTaskStatus.SUBMITTED
            ])
        ).first()

        if existing_task:
            room_status.current_cleaning_task_id = existing_task.id
            room_status.status = RoomStatusType.CLEANING
            logger.info(f"Linked existing cleaning task {existing_task.task_no} to room status")
            return existing_task

        now = datetime.utcnow()
        task_no = TaskService.generate_task_no()
        deadline = now + timedelta(minutes=settings.CLEANING_TIMEOUT_MINUTES)

        task = CleaningTask(
            task_no=task_no,
            property_id=room_status.property_id,
            created_by=current_user.id,
            status=CleaningTaskStatus.PENDING,
            priority=CleaningTaskPriority.NORMAL,
            description=f"退房保洁 - 房态变更自动生成",
            scheduled_time=now,
            deadline_time=deadline,
            estimated_duration=2,
        )
        db.add(task)
        db.flush()

        room_status.current_cleaning_task_id = task.id
        room_status.status = RoomStatusType.CLEANING

        logger.info(f"Auto-created cleaning task {task_no} for property {room_status.property_id}")
        return task

    @staticmethod
    def update_status(
        db: Session,
        room_status: RoomStatus,
        new_status: RoomStatusType,
        current_user: User,
        **kwargs
    ) -> RoomStatus:
        old_status = room_status.status

        if old_status == new_status:
            return room_status

        RoomStatusService.validate_status_transition(db, room_status, new_status, current_user)

        for key, value in kwargs.items():
            if hasattr(room_status, key) and value is not None:
                setattr(room_status, key, value)

        room_status.status = new_status

        RoomStatusService.on_status_changed(db, room_status, old_status, new_status, current_user)

        return room_status
