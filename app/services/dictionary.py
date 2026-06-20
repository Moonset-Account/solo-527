from __future__ import annotations
import uuid
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Dictionary, DictionaryVersion


class DictionaryService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.version_service = DictionaryVersionService(session)

    async def list_by_type(self, dict_type: str) -> list[Dictionary]:
        stmt = select(Dictionary).where(Dictionary.dict_type == dict_type).order_by(Dictionary.sort_order, Dictionary.created_at)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Dictionary:
        kwargs["id"] = kwargs.get("id", uuid.uuid4().hex)
        kwargs["created_at"] = datetime.utcnow()
        kwargs["updated_at"] = datetime.utcnow()
        dictionary = Dictionary(**kwargs)
        self.session.add(dictionary)
        await self.session.flush()
        await self.version_service.create_version_snapshot(dictionary)
        return dictionary

    async def update(self, dict_id: str, **kwargs) -> Dictionary | None:
        stmt = select(Dictionary).where(Dictionary.id == dict_id)
        result = await self.session.execute(stmt)
        dictionary = result.scalar_one_or_none()
        if not dictionary:
            return None
        kwargs["updated_at"] = datetime.utcnow()
        for key, value in kwargs.items():
            setattr(dictionary, key, value)
        await self.session.flush()
        await self.version_service.create_version_snapshot(dictionary)
        return dictionary

    async def toggle_active(self, dict_id: str) -> Dictionary | None:
        stmt = select(Dictionary).where(Dictionary.id == dict_id)
        result = await self.session.execute(stmt)
        dictionary = result.scalar_one_or_none()
        if not dictionary:
            return None
        dictionary.is_active = not dictionary.is_active
        dictionary.updated_at = datetime.utcnow()
        await self.session.flush()
        await self.version_service.create_version_snapshot(dictionary)
        return dictionary

    async def rollback(self, dict_id: str, version_id: str) -> Dictionary | None:
        stmt = select(Dictionary).where(Dictionary.id == dict_id)
        result = await self.session.execute(stmt)
        dictionary = result.scalar_one_or_none()
        if not dictionary:
            return None
        version_stmt = select(DictionaryVersion).where(DictionaryVersion.id == version_id, DictionaryVersion.dictionary_id == dict_id)
        version_result = await self.session.execute(version_stmt)
        version = version_result.scalar_one_or_none()
        if not version:
            return None
        dictionary.dict_type = version.dict_type
        dictionary.dict_key = version.dict_key
        dictionary.dict_value = version.dict_value
        dictionary.sort_order = version.sort_order
        dictionary.is_active = version.is_active
        dictionary.notes = version.notes
        dictionary.updated_at = datetime.utcnow()
        await self.session.flush()
        await self.version_service.create_version_snapshot(dictionary)
        return dictionary


class DictionaryVersionService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_by_dictionary(self, dictionary_id: str) -> list[DictionaryVersion]:
        stmt = select(DictionaryVersion).where(DictionaryVersion.dictionary_id == dictionary_id).order_by(DictionaryVersion.version.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def _get_next_version(self, dictionary_id: str) -> int:
        stmt = select(func.max(DictionaryVersion.version)).where(DictionaryVersion.dictionary_id == dictionary_id)
        result = await self.session.execute(stmt)
        max_version = result.scalar()
        return (max_version or 0) + 1

    async def create_version_snapshot(self, dictionary: Dictionary, operated_by: str | None = None) -> DictionaryVersion:
        version_num = await self._get_next_version(dictionary.id)
        version = DictionaryVersion(
            id=uuid.uuid4().hex,
            dictionary_id=dictionary.id,
            dict_type=dictionary.dict_type,
            dict_key=dictionary.dict_key,
            dict_value=dictionary.dict_value,
            sort_order=dictionary.sort_order,
            is_active=dictionary.is_active,
            notes=dictionary.notes,
            version=version_num,
            operated_by=operated_by,
            created_at=datetime.utcnow(),
        )
        self.session.add(version)
        await self.session.flush()
        return version
