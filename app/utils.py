import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional, Any

from app.models import ActionLog, ActionType


def generate_order_no() -> str:
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    suffix = uuid.uuid4().hex[:6].upper()
    return f"RP{ts}{suffix}"


def log_action(
    db: Session,
    action_type: ActionType,
    operator: str = "系统管理员",
    order_id: Optional[int] = None,
    detail: Optional[dict] = None
) -> ActionLog:
    at = action_type.value if hasattr(action_type, "value") else action_type
    log = ActionLog(
        order_id=order_id,
        action_type=at,
        operator=operator,
        detail=detail or {}
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def build_full_address(region_name: Optional[str], community_name: Optional[str], detail: str) -> str:
    parts = [p for p in [region_name, community_name, detail] if p]
    return " ".join(parts)
