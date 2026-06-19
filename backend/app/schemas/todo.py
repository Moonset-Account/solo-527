from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.todo import TodoStatus, TodoPriority, TodoType


class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TodoPriority = TodoPriority.MEDIUM
    todo_type: TodoType = TodoType.MANUAL
    registration_id: Optional[int] = None
    assigned_to_id: Optional[int] = None


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TodoStatus] = None
    priority: Optional[TodoPriority] = None
    assigned_to_id: Optional[int] = None
    result: Optional[str] = None


class TodoResponse(TodoBase):
    id: int
    status: TodoStatus
    created_by_id: Optional[int] = None
    refund_exception_id: Optional[int] = None
    result: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    created_by_name: Optional[str] = None
    assigned_to_name: Optional[str] = None

    class Config:
        from_attributes = True


class TodoListResponse(BaseModel):
    total: int
    items: List[TodoResponse]
