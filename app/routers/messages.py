from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional
from pydantic import BaseModel
from datetime import date, datetime

from app.database import get_db
from app.auth import get_current_user, allow_all, allow_admin, allow_manager
from app.models import Message, Todo, User, MessageType, TodoStatus
from app.htmx_utils import is_htmx, get_page
from app.templates import templates

router = APIRouter(prefix="/api", tags=["消息与待办"])


class TodoCreate(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TodoStatus] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None


@router.get("/todos")
def list_todos(
    request: Request,
    status: Optional[TodoStatus] = None,
    priority: Optional[str] = None,
    assignee_id: Optional[int] = None,
    keyword: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    skip = (page - 1) * limit
    query = db.query(Todo)
    if status:
        query = query.filter(Todo.status == status)
    if priority:
        query = query.filter(Todo.priority == priority)
    if assignee_id:
        query = query.filter(Todo.assignee_id == assignee_id)
    if keyword:
        query = query.filter(
            or_(
                Todo.title.contains(keyword),
                Todo.description.contains(keyword)
            )
        )
    total = query.count()
    todos = query.order_by(desc(Todo.created_at)).offset(skip).limit(limit).all()
    items = []
    for t in todos:
        items.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "status": t.status.value,
            "assignee_id": t.assignee_id,
            "assignee_name": t.assignee.full_name if t.assignee else None,
            "creator_name": t.creator.full_name if t.creator else None,
            "due_date": t.due_date,
            "related_type": t.related_type,
            "related_id": t.related_id,
            "created_at": t.created_at,
            "completed_at": t.completed_at
        })
    
    if is_htmx(request):
        total_pages = (total + limit - 1) // limit
        return templates.TemplateResponse(
            "partials/todo_list.html",
            {
                "request": request,
                "items": items,
                "total": total,
                "current_page": page,
                "total_pages": total_pages
            }
        )
    
    return {"total": total, "items": items}


@router.get("/todos/statistics")
def todo_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    stats = {
        "pending": db.query(Todo).filter(Todo.status == TodoStatus.PENDING).count(),
        "in_progress": db.query(Todo).filter(Todo.status == TodoStatus.IN_PROGRESS).count(),
        "completed": db.query(Todo).filter(Todo.status == TodoStatus.COMPLETED).count(),
        "high_priority": db.query(Todo).filter(
            Todo.priority == "high",
            Todo.status != TodoStatus.COMPLETED
        ).count()
    }
    return stats


@router.post("/todos")
async def create_todo(
    request: Request,
    title: Optional[str] = None,
    description: str = "",
    priority: str = "medium",
    assignee_id: Optional[int] = None,
    due_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/x-www-form-urlencoded") or content_type.startswith("multipart/form-data"):
        form = await request.form()
        if form.get("title"):
            title = form.get("title")
        if form.get("description"):
            description = form.get("description")
        if form.get("priority"):
            priority = form.get("priority")
        if form.get("assignee_id"):
            assignee_id = int(form.get("assignee_id"))
        if form.get("due_date"):
            due_date = date.fromisoformat(form.get("due_date"))
    elif content_type.startswith("application/json"):
        try:
            body = await request.json()
            title = body.get("title", title)
            description = body.get("description", description)
            priority = body.get("priority", priority)
            assignee_id = body.get("assignee_id", assignee_id)
            due_date = body.get("due_date", due_date)
        except Exception:
            pass
    
    if not title:
        if is_htmx(request):
            return HTMLResponse(
                '<div class="toast toast-error" style="position:fixed;top:20px;right:20px;z-index:9999">请填写标题</div>',
                status_code=400
            )
        raise HTTPException(status_code=400, detail="title is required")

    todo = Todo(
        title=title,
        description=description,
        priority=priority,
        assignee_id=assignee_id,
        due_date=due_date,
        creator_id=current_user.id,
        status=TodoStatus.PENDING
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    
    if is_htmx(request):
        return list_todos(
            request=request,
            page=1,
            limit=50,
            db=db,
            current_user=current_user
        )
    
    return todo


@router.put("/todos/{todo_id}")
def update_todo(
    todo_id: int,
    data: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="待办不存在")
    update_data = data.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] == TodoStatus.COMPLETED and todo.status != TodoStatus.COMPLETED:
        update_data["completed_at"] = datetime.now()
    for key, value in update_data.items():
        setattr(todo, key, value)
    db.commit()
    db.refresh(todo)
    return todo


@router.post("/todos/{todo_id}/complete")
async def complete_todo(
    request: Request,
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/x-www-form-urlencoded") or content_type.startswith("multipart/form-data"):
        form = await request.form()
    
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        if is_htmx(request):
            return HTMLResponse(
                '<div class="toast toast-error" style="position:fixed;top:20px;right:20px;z-index:9999">待办不存在</div>',
                status_code=404
            )
        raise HTTPException(status_code=404, detail="待办不存在")
    todo.status = TodoStatus.COMPLETED
    todo.completed_at = datetime.now()
    db.commit()
    
    if is_htmx(request):
        return list_todos(
            request=request,
            page=1,
            limit=50,
            db=db,
            current_user=current_user
        )
    
    return {"message": "已完成"}


@router.get("/messages")
def list_messages(
    request: Request,
    type: Optional[MessageType] = None,
    is_read: Optional[bool] = None,
    keyword: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    skip = (page - 1) * limit
    query = db.query(Message)
    if type:
        query = query.filter(Message.type == type)
    if is_read is not None:
        query = query.filter(Message.is_read == is_read)
    if keyword:
        query = query.filter(
            or_(
                Message.title.contains(keyword),
                Message.content.contains(keyword)
            )
        )
    total = query.count()
    messages = query.order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
    items = []
    for m in messages:
        items.append({
            "id": m.id,
            "title": m.title,
            "content": m.content,
            "type": m.type.value,
            "is_read": m.is_read,
            "related_type": m.related_type,
            "related_id": m.related_id,
            "created_at": m.created_at
        })
    
    if is_htmx(request):
        total_pages = (total + limit - 1) // limit
        return templates.TemplateResponse(
            "partials/message_list.html",
            {
                "request": request,
                "items": items,
                "total": total,
                "current_page": page,
                "total_pages": total_pages
            }
        )
    
    return {"total": total, "items": items}


@router.get("/messages/unread-count")
def unread_message_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    count = db.query(Message).filter(Message.is_read == False).count()
    return {"count": count}


@router.post("/messages/{message_id}/read")
async def mark_message_read(
    request: Request,
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/x-www-form-urlencoded") or content_type.startswith("multipart/form-data"):
        form = await request.form()
    
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        if is_htmx(request):
            return HTMLResponse(
                '<div class="toast toast-error" style="position:fixed;top:20px;right:20px;z-index:9999">消息不存在</div>',
                status_code=404
            )
        raise HTTPException(status_code=404, detail="消息不存在")
    message.is_read = True
    db.commit()
    
    if is_htmx(request):
        return list_messages(
            request=request,
            page=1,
            limit=50,
            db=db,
            current_user=current_user
        )
    
    return {"message": "已标记为已读"}


@router.post("/messages/read-all")
async def mark_all_read(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/x-www-form-urlencoded") or content_type.startswith("multipart/form-data"):
        form = await request.form()
    
    db.query(Message).filter(Message.is_read == False).update({Message.is_read: True})
    db.commit()
    
    if is_htmx(request):
        return list_messages(
            request=request,
            page=1,
            limit=50,
            db=db,
            current_user=current_user
        )
    
    return {"message": "全部已读"}


@router.get("/dashboard/overview")
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    from app.models import PaymentRecord, Verification, TreatmentCard, TreatmentCardStatus, PaymentStatus
    from sqlalchemy import func
    from datetime import date, timedelta

    today = date.today()

    today_payments = db.query(PaymentRecord).filter(
        func.date(PaymentRecord.payment_time) == today,
        PaymentRecord.status == PaymentStatus.PAID
    ).count()

    today_verifications = db.query(Verification).filter(
        func.date(Verification.verification_time) == today
    ).count()

    active_cards = db.query(TreatmentCard).filter(
        TreatmentCard.status == TreatmentCardStatus.ACTIVE
    ).count()

    pending_todos = db.query(Todo).filter(
        Todo.status == TodoStatus.PENDING
    ).count()

    high_priority_todos = db.query(Todo).filter(
        Todo.priority == "high",
        Todo.status != TodoStatus.COMPLETED
    ).all()

    unread_messages = db.query(Message).filter(
        Message.is_read == False
    ).count()

    recent_todos = db.query(Todo).filter(
        Todo.status != TodoStatus.COMPLETED
    ).order_by(Todo.priority.desc(), desc(Todo.created_at)).limit(10).all()

    todo_items = []
    for t in recent_todos:
        todo_items.append({
            "id": t.id,
            "title": t.title,
            "priority": t.priority,
            "status": t.status.value,
            "due_date": t.due_date,
            "created_at": t.created_at
        })

    from app.models import PaymentStatus
    abnormal_payments = db.query(PaymentRecord).filter(
        PaymentRecord.diff_amount != 0
    ).order_by(desc(PaymentRecord.payment_time)).limit(5).all()

    payment_items = []
    for p in abnormal_payments:
        payment_items.append({
            "id": p.id,
            "payment_no": p.payment_no,
            "amount": p.amount,
            "actual_amount": p.actual_amount,
            "diff_amount": p.diff_amount,
            "cashier_name": p.cashier.full_name if p.cashier else "",
            "payment_time": p.payment_time
        })

    return {
        "today_payments": today_payments,
        "today_verifications": today_verifications,
        "active_cards": active_cards,
        "pending_todos": pending_todos,
        "unread_messages": unread_messages,
        "high_priority_todos": len(high_priority_todos),
        "recent_todos": todo_items,
        "abnormal_payments": payment_items
    }
