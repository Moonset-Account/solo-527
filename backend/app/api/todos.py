from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_client_ip
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse, TodoListResponse
from app.crud import crud_todo, crud_operation_log
from app.models.user import User
from app.models.todo import TodoStatus, TodoPriority, TodoType
from app.models.operation_log import OperationType

router = APIRouter(prefix="/todos", tags=["待办事项"])


@router.get("", response_model=TodoListResponse)
def list_todos(
    status: Optional[TodoStatus] = None,
    priority: Optional[TodoPriority] = None,
    todo_type: Optional[TodoType] = None,
    assigned_to_id: Optional[int] = None,
    created_by_id: Optional[int] = None,
    my_tasks: Optional[bool] = False,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * page_size
    
    assign_filter = assigned_to_id
    if my_tasks:
        assign_filter = current_user.id
    
    items, total = crud_todo.get_multi(
        db, skip=skip, limit=page_size,
        status=status, priority=priority,
        todo_type=todo_type, assigned_to_id=assign_filter,
        created_by_id=created_by_id,
    )
    
    result_items = []
    for item in items:
        detail = crud_todo.get_todo_detail(db, todo_id=item.id)
        if detail:
            result_items.append(detail)
    
    return {"total": total, "items": result_items}


@router.get("/{todo_id}", response_model=TodoResponse)
def get_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = crud_todo.get_todo_detail(db, todo_id=todo_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="待办事项不存在",
        )
    return result


@router.post("", response_model=TodoResponse)
def create_todo(
    todo_in: TodoCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = crud_todo.create_with_creator(db, obj_in=todo_in, created_by_id=current_user.id)
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.CREATE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        target_type="todo",
        target_id=todo.id,
        new_value={"title": todo.title, "priority": todo.priority.value},
        remark="创建待办事项",
        ip_address=get_client_ip(request),
    )
    
    result = crud_todo.get_todo_detail(db, todo_id=todo.id)
    return result


@router.put("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    todo_in: TodoUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = crud_todo.get(db, id=todo_id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="待办事项不存在",
        )
    
    old_data = {c.name: getattr(todo, c.name) for c in todo.__table__.columns}
    todo = crud_todo.update(db, db_obj=todo, obj_in=todo_in)
    
    update_data = todo_in.model_dump(exclude_unset=True)
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.UPDATE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        target_type="todo",
        target_id=todo_id,
        old_value=old_data,
        new_value=update_data,
        remark="更新待办事项",
        ip_address=get_client_ip(request),
    )
    
    result = crud_todo.get_todo_detail(db, todo_id=todo_id)
    return result


@router.post("/{todo_id}/complete", response_model=TodoResponse)
def complete_todo(
    todo_id: int,
    request: Request,
    result: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    todo = crud_todo.complete(db, todo_id=todo_id, result=result)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="待办事项不存在",
        )
    
    crud_operation_log.create_log(
        db,
        operation_type=OperationType.UPDATE,
        operator_id=current_user.id,
        operator_name=current_user.full_name or current_user.username,
        target_type="todo",
        target_id=todo_id,
        new_value={"status": "completed", "result": result},
        remark="完成待办事项",
        ip_address=get_client_ip(request),
    )
    
    detail = crud_todo.get_todo_detail(db, todo_id=todo_id)
    return detail
