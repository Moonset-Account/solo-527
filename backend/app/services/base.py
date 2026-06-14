from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import inspect as sa_inspect


def model_to_dict(obj: DeclarativeBase) -> dict:
    mapper = sa_inspect(obj).mapper
    result = {}
    for column in mapper.columns:
        value = getattr(obj, column.key)
        if hasattr(value, 'isoformat'):
            value = value.isoformat()
        result[column.key] = value
    return result
