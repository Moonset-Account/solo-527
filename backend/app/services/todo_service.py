from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.todo import Todo, TodoPriority, TodoType, TodoStatus, ReminderRule
from app.models.user import User
from app.schemas.todo import TodoCreate, TodoUpdate, ReminderRuleCreate, ReminderRuleUpdate
from app.services.audit_service import AuditService
from app.models.audit import AuditAction


class TodoService:
    @staticmethod
    def get_by_id(db: Session, todo_id: int) -> Optional[Todo]:
        return db.query(Todo).filter(Todo.id == todo_id).first()

    @staticmethod
    def list(
        db: Session,
        assigned_to: int = None,
        todo_type: TodoType = None,
        priority: TodoPriority = None,
        status: TodoStatus = None,
        is_escalated: bool = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Todo]:
        query = db.query(Todo)
        if assigned_to:
            query = query.filter(Todo.assigned_to == assigned_to)
        if todo_type:
            query = query.filter(Todo.todo_type == todo_type)
        if priority:
            query = query.filter(Todo.priority == priority)
        if status:
            query = query.filter(Todo.status == status)
        if is_escalated is not None:
            query = query.filter(Todo.is_escalated == is_escalated)
        return query.order_by(Todo.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, todo_in: TodoCreate, current_user: User) -> Todo:
        db_todo = Todo(
            **todo_in.model_dump(),
            created_by=current_user.id,
        )
        db.add(db_todo)
        db.commit()
        db.refresh(db_todo)
        return db_todo

    @staticmethod
    def update(db: Session, todo_id: int, todo_in: TodoUpdate, current_user: User) -> Todo:
        db_todo = TodoService.get_by_id(db, todo_id)
        if not db_todo:
            raise HTTPException(status_code=404, detail="Todo not found")

        update_data = todo_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_todo, field, value)

        if todo_in.status == TodoStatus.COMPLETED and db_todo.status != TodoStatus.COMPLETED:
            db_todo.completed_at = datetime.utcnow()
            db_todo.completed_by = current_user.id

        db.commit()
        db.refresh(db_todo)
        return db_todo

    @staticmethod
    def complete(db: Session, todo_id: int, current_user: User) -> Todo:
        db_todo = TodoService.get_by_id(db, todo_id)
        if not db_todo:
            raise HTTPException(status_code=404, detail="Todo not found")

        db_todo.status = TodoStatus.COMPLETED
        db_todo.completed_at = datetime.utcnow()
        db_todo.completed_by = current_user.id
        db.commit()
        db.refresh(db_todo)
        return db_todo

    @staticmethod
    def escalate(db: Session, todo_id: int, reason: str, current_user: User) -> Todo:
        db_todo = TodoService.get_by_id(db, todo_id)
        if not db_todo:
            raise HTTPException(status_code=404, detail="Todo not found")

        db_todo.is_escalated = True
        db_todo.escalated_at = datetime.utcnow()
        db_todo.escalation_reason = reason
        db_todo.todo_type = TodoType.ESCALATED
        db_todo.priority = TodoPriority.URGENT
        db.commit()
        db.refresh(db_todo)

        AuditService.log(
            db, current_user, AuditAction.STATUS_CHANGE,
            "todo", todo_id,
            description=f"待办升级催办: {reason}"
        )

        return db_todo

    @staticmethod
    def get_normal_todos(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Todo]:
        return db.query(Todo).filter(
            Todo.assigned_to == user_id,
            Todo.todo_type.notin_([TodoType.ESCALATED, TodoType.INTERVIEW_CONFLICT]),
            Todo.status == TodoStatus.PENDING,
        ).order_by(Todo.priority.desc(), Todo.due_date.asc().nullslast()).offset(skip).limit(limit).all()

    @staticmethod
    def get_escalated_todos(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Todo]:
        return db.query(Todo).filter(
            Todo.assigned_to == user_id,
            Todo.is_escalated == True,
            Todo.status != TodoStatus.COMPLETED,
        ).order_by(Todo.escalated_at.desc()).offset(skip).limit(limit).all()


class ReminderRuleService:
    @staticmethod
    def get_by_id(db: Session, rule_id: int) -> Optional[ReminderRule]:
        return db.query(ReminderRule).filter(ReminderRule.id == rule_id).first()

    @staticmethod
    def list(db: Session, rule_type: str = None, is_active: bool = None) -> List[ReminderRule]:
        query = db.query(ReminderRule)
        if rule_type:
            query = query.filter(ReminderRule.rule_type == rule_type)
        if is_active is not None:
            query = query.filter(ReminderRule.is_active == is_active)
        return query.order_by(ReminderRule.created_at.desc()).all()

    @staticmethod
    def create(db: Session, rule_in: ReminderRuleCreate, current_user: User) -> ReminderRule:
        db_rule = ReminderRule(
            **rule_in.model_dump(),
            created_by=current_user.id,
        )
        db.add(db_rule)
        db.commit()
        db.refresh(db_rule)
        return db_rule

    @staticmethod
    def update(db: Session, rule_id: int, rule_in: ReminderRuleUpdate, current_user: User) -> ReminderRule:
        db_rule = ReminderRuleService.get_by_id(db, rule_id)
        if not db_rule:
            raise HTTPException(status_code=404, detail="Reminder rule not found")

        update_data = rule_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_rule, field, value)

        db.commit()
        db.refresh(db_rule)
        return db_rule

    @staticmethod
    def delete(db: Session, rule_id: int) -> bool:
        db_rule = ReminderRuleService.get_by_id(db, rule_id)
        if not db_rule:
            raise HTTPException(status_code=404, detail="Reminder rule not found")
        db.delete(db_rule)
        db.commit()
        return True
