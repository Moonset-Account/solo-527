from typing import Optional
from datetime import datetime
from app.models import SafetyEvent


def calculate_handle_duration_minutes(event: SafetyEvent) -> Optional[int]:
    """
    计算事件处理时长（分钟），基于真实发生时间 actual_occurred_at
    业务规则：
    1. 只使用真实发生时间 actual_occurred_at，不使用补录时间 recorded_at
    2. 关闭时间必须晚于或等于真实发生时间，否则视为异常数据返回 0
    3. 未关闭的事件返回 None
    """
    if not event.closed_at or not event.actual_occurred_at:
        return None
    
    delta = event.closed_at - event.actual_occurred_at
    minutes = int(delta.total_seconds() / 60)
    return max(minutes, 0)


def calculate_handle_duration_minutes_float(event: SafetyEvent) -> Optional[float]:
    """
    计算事件处理时长（分钟，浮点数），用于聚合统计
    异常数据（关闭时间早于真实发生时间）返回 None，将被排除在统计之外
    """
    if not event.closed_at or not event.actual_occurred_at:
        return None
    
    delta = event.closed_at - event.actual_occurred_at
    minutes = delta.total_seconds() / 60
    return minutes if minutes >= 0 else None
