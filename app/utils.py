import uuid
import json
from datetime import datetime, date
from typing import Any, Optional
from pydantic import BaseModel, Field


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        return super().default(obj)


def to_dict(obj: Any) -> dict:
    if obj is None:
        return {}
    if isinstance(obj, dict):
        return obj
    if isinstance(obj, BaseModel):
        return obj.model_dump()
    if hasattr(obj, "__dict__"):
        result = {}
        for key, value in obj.__dict__.items():
            if not key.startswith("_"):
                result[key] = value
        return result
    return {}


def serialize_model(obj: Any) -> dict:
    if obj is None:
        return {}
    if hasattr(obj, "__table__"):
        data = {}
        for column in obj.__table__.columns:
            value = getattr(obj, column.name)
            if isinstance(value, (datetime, date)):
                value = value.isoformat()
            data[column.name] = value
        return data
    return to_dict(obj)


def generate_order_no(prefix: str = "ORD") -> str:
    now = datetime.now()
    return f"{prefix}{now.strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"


def format_datetime(dt: Optional[datetime]) -> str:
    if not dt:
        return ""
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def format_date(dt: Optional[date]) -> str:
    if not dt:
        return ""
    return dt.strftime("%Y-%m-%d")


def get_field_changes(old_data: dict, new_data: dict, exclude_fields: list = None) -> list:
    if exclude_fields is None:
        exclude_fields = ["id", "created_at", "updated_at"]
    changes = []
    all_keys = set(list(old_data.keys()) + list(new_data.keys()))
    for key in all_keys:
        if key in exclude_fields:
            continue
        old_val = old_data.get(key)
        new_val = new_data.get(key)
        if old_val != new_val:
            changes.append({
                "field": key,
                "old_value": old_val,
                "new_value": new_val,
            })
    return changes
