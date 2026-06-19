from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.todo import Todo, TodoStatus, TodoPriority, TodoType
from app.models.user import User
from app.schemas.todo import TodoCreate, TodoUpdate


class CRUDTodo(CRUDBase[Todo, TodoCreate, TodoUpdate]):
    def create_with_creator(
        self, db: Session, *, obj_in: TodoCreate, created_by_id: int
    ) -> Todo:
        db_obj = Todo(
            **obj_in.model_dump(),
            created_by_id=created_by_id,
            status=TodoStatus.PENDING,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100,
        status: Optional[TodoStatus] = None,
        priority: Optional[TodoPriority] = None,
        todo_type: Optional[TodoType] = None,
        assigned_to_id: Optional[int] = None,
        created_by_id: Optional[int] = None,
    ) -> Tuple[List[Todo], int]:
        query = db.query(Todo)
        if status:
            query = query.filter(Todo.status == status)
        if priority:
            query = query.filter(Todo.priority == priority)
        if todo_type:
            query = query.filter(Todo.todo_type == todo_type)
        if assigned_to_id:
            query = query.filter(Todo.assigned_to_id == assigned_to_id)
        if created_by_id:
            query = query.filter(Todo.created_by_id == created_by_id)
        total = query.count()
        items = query.order_by(Todo.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def complete(self, db: Session, *, todo_id: int, result: Optional[str] = None) -> Optional[Todo]:
        todo = self.get(db, id=todo_id)
        if todo:
            todo.status = TodoStatus.COMPLETED
            todo.completed_at = datetime.utcnow()
            if result:
                todo.result = result
            db.add(todo)
            db.commit()
            db.refresh(todo)
        return todo

    def count(
        self, db: Session, *,
        status: Optional[TodoStatus] = None,
        priority: Optional[TodoPriority] = None,
        todo_type: Optional[TodoType] = None,
        assigned_to_id: Optional[int] = None,
        created_by_id: Optional[int] = None,
    ) -> int:
        query = db.query(Todo)
        if status:
            query = query.filter(Todo.status == status)
        if priority:
            query = query.filter(Todo.priority == priority)
        if todo_type:
            query = query.filter(Todo.todo_type == todo_type)
        if assigned_to_id:
            query = query.filter(Todo.assigned_to_id == assigned_to_id)
        if created_by_id:
            query = query.filter(Todo.created_by_id == created_by_id)
        return query.count()

    def get_todo_detail(self, db: Session, *, todo_id: int) -> Optional[dict]:
        todo = self.get(db, id=todo_id)
        if not todo:
            return None
        result = {c.name: getattr(todo, c.name) for c in todo.__table__.columns}
        if todo.created_by:
            result["created_by_name"] = todo.created_by.full_name or todo.created_by.username
        if todo.assigned_to:
            result["assigned_to_name"] = todo.assigned_to.full_name or todo.assigned_to.username
        return result


crud_todo = CRUDTodo(Todo)
