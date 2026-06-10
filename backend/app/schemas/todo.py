from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.todo import TodoPriority, TodoType, TodoStatus


class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    todo_type: TodoType = TodoType.NORMAL
    priority: TodoPriority = TodoPriority.NORMAL
    assigned_to: Optional[int] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    due_date: Optional[datetime] = None


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TodoPriority] = None
    status: Optional[TodoStatus] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None


class TodoResponse(TodoBase):
    id: int
    status: TodoStatus
    is_escalated: bool = False
    escalated_at: Optional[datetime] = None
    escalation_reason: Optional[str] = None
    completed_at: Optional[datetime] = None
    completed_by: Optional[int] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReminderRuleBase(BaseModel):
    rule_name: str
    rule_type: str
    trigger_condition: Optional[str] = None
    reminder_frequency_minutes: int = 60
    max_reminders: int = 3
    is_active: bool = True
    notify_channels: Optional[str] = None
    escalation_minutes: Optional[int] = None
    description: Optional[str] = None


class ReminderRuleCreate(ReminderRuleBase):
    pass


class ReminderRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    rule_type: Optional[str] = None
    trigger_condition: Optional[str] = None
    reminder_frequency_minutes: Optional[int] = None
    max_reminders: Optional[int] = None
    is_active: Optional[bool] = None
    notify_channels: Optional[str] = None
    escalation_minutes: Optional[int] = None
    description: Optional[str] = None


class ReminderRuleResponse(ReminderRuleBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
