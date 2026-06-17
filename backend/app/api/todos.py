from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/todos", tags=["待办事项"])


@router.get("", response_model=List[schemas.TodoItem])
def get_todos(
    is_completed: Optional[bool] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    assignee: Optional[str] = None,
    overdue_only: Optional[bool] = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(models.TodoItem)
    if is_completed is not None:
        query = query.filter(models.TodoItem.is_completed == is_completed)
    if priority:
        query = query.filter(models.TodoItem.priority == priority)
    if category:
        query = query.filter(models.TodoItem.category == category)
    if assignee:
        query = query.filter(models.TodoItem.assignee == assignee)
    if overdue_only:
        query = query.filter(
            models.TodoItem.due_time < datetime.now(),
            models.TodoItem.is_completed == False,
        )
    return query.order_by(desc(models.TodoItem.created_at)).offset(skip).limit(limit).all()


@router.get("/{todo_id}", response_model=schemas.TodoItem)
def get_todo(todo_id: int, db: Session = Depends(get_db)):
    todo = db.query(models.TodoItem).filter(models.TodoItem.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="待办事项不存在")
    return todo


@router.post("", response_model=schemas.TodoItem)
def create_todo(todo: schemas.TodoItemCreate, db: Session = Depends(get_db)):
    db_todo = models.TodoItem(**todo.model_dump())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


@router.put("/{todo_id}", response_model=schemas.TodoItem)
def update_todo(todo_id: int, todo_update: schemas.TodoItemUpdate, db: Session = Depends(get_db)):
    todo = db.query(models.TodoItem).filter(models.TodoItem.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="待办事项不存在")
    update_data = todo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(todo, key, value)
    if todo_update.is_completed and not todo.completed_at:
        todo.completed_at = datetime.now()
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    todo = db.query(models.TodoItem).filter(models.TodoItem.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="待办事项不存在")
    db.delete(todo)
    db.commit()
    return {"message": "删除成功"}
