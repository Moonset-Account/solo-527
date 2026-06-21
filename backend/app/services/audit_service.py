from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogCreate


class AuditService:
    @staticmethod
    async def get_by_id(db: AsyncSession, log_id: int) -> Optional[AuditLog]:
        result = await db.execute(select(AuditLog).where(AuditLog.id == log_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        db: AsyncSession,
        log_in: AuditLogCreate,
        user_id: int,
        user_name: str,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            user_name=user_name,
            action=log_in.action,
            target_type=log_in.target_type,
            target_id=log_in.target_id,
            description=log_in.description,
            old_value=log_in.old_value,
            new_value=log_in.new_value,
            ip_address=ip_address,
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    @staticmethod
    async def log_action(
        db: AsyncSession,
        user_id: int,
        user_name: str,
        action: str,
        target_type: str,
        target_id: int,
        description: str,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            user_name=user_name,
            action=action,
            target_type=target_type,
            target_id=target_id,
            description=description,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    @staticmethod
    async def get_multi(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple[int, List[AuditLog]]:
        query = select(AuditLog)
        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        if action:
            query = query.where(AuditLog.action == action)
        if target_type:
            query = query.where(AuditLog.target_type == target_type)
        if target_id:
            query = query.where(AuditLog.target_id == target_id)
        if date_from:
            query = query.where(AuditLog.created_at >= date_from)
        if date_to:
            query = query.where(AuditLog.created_at <= date_to)

        count_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()

        query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        logs = result.scalars().all()
        return total, logs

    @staticmethod
    async def get_by_target(
        db: AsyncSession, target_type: str, target_id: int, limit: int = 50
    ) -> List[AuditLog]:
        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.target_type == target_type, AuditLog.target_id == target_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    def generate_mock_logs(count: int = 50) -> List[dict]:
        actions = ["create", "update", "delete", "review", "complete", "cancel"]
        action_names = {
            "create": "创建",
            "update": "更新",
            "delete": "删除",
            "review": "审核",
            "complete": "完成",
            "cancel": "取消",
        }
        target_types = ["order", "pet", "customer", "adoption", "follow_up", "schedule", "user"]
        target_names = {
            "order": "订单",
            "pet": "宠物",
            "customer": "客户",
            "adoption": "领养申请",
            "follow_up": "回访任务",
            "schedule": "排班",
            "user": "用户",
        }
        now = datetime.now()
        mock_logs = []
        for i in range(1, count + 1):
            action = actions[i % len(actions)]
            target_type = target_types[i % len(target_types)]
            user_id = (i % 5) + 1
            mock_logs.append({
                "id": i,
                "user_id": user_id,
                "user_name": f"管理员{user_id}",
                "action": action,
                "target_type": target_type,
                "target_id": (i % 30) + 1,
                "description": f"{action_names[action]}了{target_names[target_type]}#{(i % 30) + 1}",
                "old_value": {"status": "pending", "name": "旧值"} if i % 3 == 0 else None,
                "new_value": {"status": "approved", "name": "新值"} if i % 3 == 0 else None,
                "ip_address": f"192.168.1.{(i % 255) + 1}",
                "created_at": (now - timedelta(minutes=i * 15)).isoformat(),
                "updated_at": (now - timedelta(minutes=i * 15)).isoformat(),
            })
        return mock_logs
