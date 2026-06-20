from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional
from pydantic import BaseModel
from datetime import date

from app.database import get_db
from app.auth import get_current_user, allow_all, allow_admin
from app.models import Customer, User
from app.htmx_utils import is_htmx, get_page
from app.templates import templates

router = APIRouter(prefix="/api", tags=["顾客管理"])


class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: str = ""
    birthday: Optional[date] = None
    level: str = ""
    note: str = ""


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    birthday: Optional[date] = None
    level: Optional[str] = None
    note: Optional[str] = None


@router.get("/customers")
def list_customers(
    request: Request,
    keyword: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    skip = (page - 1) * limit
    query = db.query(Customer)
    if keyword:
        query = query.filter(
            or_(
                Customer.name.contains(keyword),
                Customer.phone.contains(keyword)
            )
        )
    total = query.count()
    customers = query.order_by(desc(Customer.created_at)).offset(skip).limit(limit).all()
    items = []
    for c in customers:
        items.append({
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "email": c.email,
            "gender": c.gender,
            "birthday": c.birthday,
            "level": c.level,
            "note": c.note,
            "created_at": c.created_at
        })
    
    if is_htmx(request):
        total_pages = (total + limit - 1) // limit
        return templates.TemplateResponse(
            "partials/customer_list.html",
            {
                "request": request,
                "items": items,
                "total": total,
                "current_page": page,
                "total_pages": total_pages
            }
        )
    
    return {"total": total, "items": customers}


@router.get("/customers/{customer_id}")
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="顾客不存在")
    return customer


@router.post("/customers")
async def create_customer(
    request: Request,
    name: Optional[str] = None,
    phone: Optional[str] = None,
    email: str = "",
    birthday: Optional[date] = None,
    level: str = "",
    note: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/x-www-form-urlencoded") or content_type.startswith("multipart/form-data"):
        form = await request.form()
        if form.get("name"):
            name = form.get("name")
        if form.get("phone"):
            phone = form.get("phone")
        if form.get("email"):
            email = form.get("email")
        if form.get("birthday"):
            birthday = date.fromisoformat(form.get("birthday"))
        if form.get("level"):
            level = form.get("level")
        if form.get("note"):
            note = form.get("note")
    elif content_type.startswith("application/json"):
        try:
            body = await request.json()
            name = body.get("name", name)
            phone = body.get("phone", phone)
            email = body.get("email", email)
            birthday = body.get("birthday", birthday)
            level = body.get("level", level)
            note = body.get("note", note)
        except Exception:
            pass
    
    if not name or not phone:
        if is_htmx(request):
            return HTMLResponse(
                '<div class="toast toast-error" style="position:fixed;top:20px;right:20px;z-index:9999">请填写姓名和手机号</div>',
                status_code=400
            )
        raise HTTPException(status_code=400, detail="name and phone are required")

    existing = db.query(Customer).filter(Customer.phone == phone).first()
    if existing:
        if is_htmx(request):
            return HTMLResponse(
                '<div class="toast toast-error" style="position:fixed;top:20px;right:20px;z-index:9999">手机号已存在</div>',
                status_code=400
            )
        raise HTTPException(status_code=400, detail="手机号已存在")

    customer = Customer(
        name=name,
        phone=phone,
        email=email,
        birthday=birthday,
        level=level,
        note=note
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    if is_htmx(request):
        return list_customers(
            request=request,
            page=1,
            limit=50,
            db=db,
            current_user=current_user
        )
    
    return customer


@router.put("/customers/{customer_id}")
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="顾客不存在")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="顾客不存在")
    db.delete(customer)
    db.commit()
    return {"message": "删除成功"}
