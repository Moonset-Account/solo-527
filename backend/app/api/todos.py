from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.todo import TodoPriority, TodoType, TodoStatus
from app.schemas.todo import (
    TodoCreate, TodoUpdate, TodoResponse,
    ReminderRuleCreate, ReminderRuleUpdate, ReminderRuleResponse,
)
from app.services.todo_service import TodoService, ReminderRuleService

router = APIRouter(prefix="/todos", tags=["待办管理"])


@router.get("", response_model=List[TodoResponse])
def list_todos(
    assigned_to: int = None,
    todo_type: TodoType = None,
    priority: TodoPriority = None,
    status: TodoStatus = None,
    is_escalated: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role == UserRole.CANDIDATE:
        assigned_to = current_user.id
    return TodoService.list(
        db, assigned_to=assigned_to, todo_type=todo_type,
        priority=priority, status=status, is_escalated=is_escalated,
        skip=skip, limit=limit,
    )


@router.get("/my", response_model=List[TodoResponse])
def get_my_todos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return TodoService.list(db, assigned_to=current_user.id)


@router.get("/my/normal", response_model=List[TodoResponse])
def get_my_normal_todos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return TodoService.get_normal_todos(db, current_user.id, skip=skip, limit=limit)


@router.get("/my/escalated", response_model=List[TodoResponse])
def get_my_escalated_todos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return TodoService.get_escalated_todos(db, current_user.id, skip=skip, limit=limit)


@router.get("/reminder-rules", response_model=List[ReminderRuleResponse])
def list_reminder_rules(
    rule_type: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return ReminderRuleService.list(db, rule_type=rule_type, is_active=is_active)


@router.post("/reminder-rules", response_model=ReminderRuleResponse)
def create_reminder_rule(
    rule_in: ReminderRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return ReminderRuleService.create(db, rule_in, current_user)


@router.put("/reminder-rules/{rule_id}", response_model=ReminderRuleResponse)
def update_reminder_rule(
    rule_id: int,
    rule_in: ReminderRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return ReminderRuleService.update(db, rule_id, rule_in, current_user)


@router.delete("/reminder-rules/{rule_id}")
def delete_reminder_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    ReminderRuleService.delete(db, rule_id)
    return {"message": "Reminder rule deleted successfully"}


@router.get("/{todo_id}", response_model=TodoResponse)
def get_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    todo = TodoService.get_by_id(db, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.post("", response_model=TodoResponse)
def create_todo(
    todo_in: TodoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return TodoService.create(db, todo_in, current_user)


@router.put("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    todo_in: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return TodoService.update(db, todo_id, todo_in, current_user)


@router.post("/{todo_id}/complete", response_model=TodoResponse)
def complete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return TodoService.complete(db, todo_id, current_user)


@router.post("/{todo_id}/escalate", response_model=TodoResponse)
def escalate_todo(
    todo_id: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return TodoService.escalate(db, todo_id, reason, current_user)
