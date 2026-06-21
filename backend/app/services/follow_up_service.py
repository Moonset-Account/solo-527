from datetime import datetime, timedelta, date
from typing import Optional, List
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.follow_up import FollowUpTask
from app.schemas.follow_up import FollowUpTaskCreate, FollowUpTaskUpdate


class FollowUpService:
    @staticmethod
    async def get_by_id(db: AsyncSession, task_id: int) -> Optional[FollowUpTask]:
        result = await db.execute(select(FollowUpTask).where(FollowUpTask.id == task_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, task_in: FollowUpTaskCreate) -> FollowUpTask:
        task = FollowUpTask(**task_in.model_dump(), status="pending")
        db.add(task)
        await db.commit()
        await db.refresh(task)
        return task

    @staticmethod
    async def update(
        db: AsyncSession, db_task: FollowUpTask, task_in: FollowUpTaskUpdate
    ) -> FollowUpTask:
        update_data = task_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_task, field, value)
        if "status" in update_data and update_data["status"] == "completed" and not db_task.completed_at:
            db_task.completed_at = datetime.utcnow()
        await db.commit()
        await db.refresh(db_task)
        return db_task

    @staticmethod
    async def delete(db: AsyncSession, task_id: int) -> bool:
        result = await db.execute(select(FollowUpTask).where(FollowUpTask.id == task_id))
        task = result.scalar_one_or_none()
        if task:
            await db.delete(task)
            await db.commit()
            return True
        return False

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        type: Optional[str] = None,
        related_type: Optional[str] = None,
        assigned_to: Optional[int] = None,
        scheduled_from: Optional[datetime] = None,
        scheduled_to: Optional[datetime] = None,
    ) -> tuple[int, List[FollowUpTask]]:
        query = select(FollowUpTask)
        if status:
            query = query.where(FollowUpTask.status == status)
        if type:
            query = query.where(FollowUpTask.type == type)
        if related_type:
            query = query.where(FollowUpTask.related_type == related_type)
        if assigned_to:
            query = query.where(FollowUpTask.assigned_to == assigned_to)
        if scheduled_from:
            query = query.where(FollowUpTask.scheduled_time >= scheduled_from)
        if scheduled_to:
            query = query.where(FollowUpTask.scheduled_time <= scheduled_to)

        count_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()

        query = query.order_by(FollowUpTask.scheduled_time.asc()).offset(skip).limit(limit)
        result = await db.execute(query)
        tasks = result.scalars().all()
        return total, tasks

    @staticmethod
    async def get_overdue_tasks(db: AsyncSession, assigned_to: Optional[int] = None) -> List[FollowUpTask]:
        query = select(FollowUpTask).where(
            FollowUpTask.status == "pending",
            FollowUpTask.scheduled_time < datetime.utcnow(),
        )
        if assigned_to:
            query = query.where(FollowUpTask.assigned_to == assigned_to)
        query = query.order_by(FollowUpTask.scheduled_time.asc())
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def complete_task(
        db: AsyncSession, task_id: int, result: str, next_follow_up: Optional[date] = None
    ) -> Optional[FollowUpTask]:
        result_obj = await db.execute(select(FollowUpTask).where(FollowUpTask.id == task_id))
        task = result_obj.scalar_one_or_none()
        if not task:
            return None
        task.status = "completed"
        task.result = result
        task.completed_at = datetime.utcnow()
        if next_follow_up:
            task.next_follow_up = next_follow_up
        await db.commit()
        await db.refresh(task)
        return task

    @staticmethod
    def generate_mock_tasks(count: int = 25) -> List[dict]:
        types = ["service", "adoption", "health", "repurchase"]
        type_names = {
            "service": "服务回访",
            "adoption": "领养回访",
            "health": "健康回访",
            "repurchase": "复购提醒",
        }
        related_types = ["order", "adoption", "pet"]
        statuses = ["pending", "in_progress", "completed", "cancelled"]
        now = datetime.now()
        mock_tasks = []
        for i in range(1, count + 1):
            t_type = types[i % len(types)]
            scheduled = now + timedelta(days=i % 14 - 3, hours=i % 10)
            is_completed = i % 4 == 0
            mock_tasks.append({
                "id": i,
                "type": t_type,
                "related_id": (i % 20) + 1,
                "related_type": related_types[i % len(related_types)],
                "customer_name": f"客户{(i % 10) + 1}",
                "customer_phone": f"137{30000000 + i:08d}",
                "pet_name": f"宠物{(i % 5) + 1}" if i % 3 != 0 else None,
                "scheduled_time": scheduled.isoformat(),
                "status": statuses[i % len(statuses)],
                "content": f"{type_names[t_type]}任务内容描述-{i}，请联系客户了解服务体验。",
                "result": f"回访结果反馈-{i}，客户表示满意" if is_completed else None,
                "next_follow_up": (date.today() + timedelta(days=30 + i)).isoformat() if is_completed and i % 3 == 0 else None,
                "assigned_to": (i % 5) + 1,
                "completed_at": (now - timedelta(days=i // 2)).isoformat() if is_completed else None,
                "created_at": (now - timedelta(days=i + 2)).isoformat(),
                "updated_at": (now - timedelta(days=i // 2)).isoformat(),
            })
        return mock_tasks
