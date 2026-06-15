from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime

from app.models import SystemConfig
from app.enums import ConfigStatus
from app.services.seat_lock import seat_lock_service
from app.utils import now


class ConfigService:
    @staticmethod
    async def get_config(db: AsyncSession, key: str, use_cache: bool = True) -> Optional[dict]:
        if use_cache:
            cached = await seat_lock_service.get_config_cache(key)
            if cached:
                import json
                return json.loads(cached)
        result = await db.execute(
            select(SystemConfig).where(and_(
                SystemConfig.key == key,
                SystemConfig.status == ConfigStatus.ENABLED,
            ))
        )
        config = result.scalar_one_or_none()
        if not config:
            return None
        current = now()
        if config.effective_from and current < config.effective_from:
            return None
        if config.effective_to and current > config.effective_to:
            return None
        data = config.value
        if use_cache:
            import json
            await seat_lock_service.set_config_cache(key, json.dumps(data, ensure_ascii=False))
        return data

    @staticmethod
    async def get_value(db: AsyncSession, key: str, default: Any = None) -> Any:
        data = await ConfigService.get_config(db, key)
        if data is None:
            return default
        return data.get("value", default)

    @staticmethod
    async def list_by_category(db: AsyncSession, category: str = None,
                                status: ConfigStatus = None,
                                page: int = 1, page_size: int = 20):
        from app.utils import calc_offset
        offset = calc_offset(page, page_size)
        query = select(SystemConfig)
        conditions = []
        if category:
            conditions.append(SystemConfig.category == category)
        if status:
            conditions.append(SystemConfig.status == status)
        if conditions:
            query = query.where(and_(*conditions))
        count_q = select(SystemConfig.id)
        if conditions:
            count_q = count_q.where(and_(*conditions))
        from sqlalchemy import func
        total_result = await db.execute(select(func.count()).select_from(count_q.subquery()))
        total = total_result.scalar() or 0
        query = query.order_by(SystemConfig.category, SystemConfig.sort_order, SystemConfig.key)
        query = query.offset(offset).limit(page_size)
        result = await db.execute(query)
        items = list(result.scalars().all())
        return items, total

    @staticmethod
    async def create(db: AsyncSession, data: dict, user_id: int = None) -> SystemConfig:
        existing = await db.execute(select(SystemConfig).where(SystemConfig.key == data["key"]))
        if existing.scalar_one_or_none():
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="配置键已存在")
        config = SystemConfig(
            **data,
            created_by=user_id,
            updated_by=user_id,
            change_log=[{"action": "create", "timestamp": now().isoformat(), "user_id": user_id, "data": data}],
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)
        if data.get("status") == ConfigStatus.ENABLED:
            await seat_lock_service.del_config_cache(data["key"])
        return config

    @staticmethod
    async def update(db: AsyncSession, config_id: int, data: dict, user_id: int = None) -> SystemConfig:
        result = await db.execute(select(SystemConfig).where(SystemConfig.id == config_id))
        config = result.scalar_one_or_none()
        if not config:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="配置不存在")
        old_data = {
            "name": config.name,
            "value": config.value,
            "status": config.status.value if isinstance(config.status, ConfigStatus) else config.status,
        }
        for k, v in data.items():
            if v is not None and hasattr(config, k):
                setattr(config, k, v)
        config.updated_by = user_id
        config.version += 1
        log_entry = {
            "action": "update",
            "timestamp": now().isoformat(),
            "user_id": user_id,
            "old": old_data,
            "new": data,
        }
        if config.change_log is None:
            config.change_log = []
        config.change_log.append(log_entry)
        await db.commit()
        await db.refresh(config)
        await seat_lock_service.del_config_cache(config.key)
        return config

    @staticmethod
    async def set_status(db: AsyncSession, config_id: int, status: ConfigStatus, user_id: int = None) -> SystemConfig:
        result = await db.execute(select(SystemConfig).where(SystemConfig.id == config_id))
        config = result.scalar_one_or_none()
        if not config:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="配置不存在")
        old_status = config.status
        config.status = status
        config.updated_by = user_id
        if config.change_log is None:
            config.change_log = []
        config.change_log.append({
            "action": f"status_{old_status}_to_{status}",
            "timestamp": now().isoformat(),
            "user_id": user_id,
        })
        await db.commit()
        await db.refresh(config)
        await seat_lock_service.del_config_cache(config.key)
        return config
