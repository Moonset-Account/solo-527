from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Optional
from pydantic import BaseModel
from datetime import date

from app.database import get_db
from app.auth import get_current_user, allow_all, allow_admin
from app.models import Customer, User

router = APIRouter(prefix="/api", tags=["顾客管理"])


class CustomerCreate(BaseModel):
    name: str
    phone: str
    gender: str = ""
    birthday: Optional[date] = None
    note: str = ""


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    note: Optional[str] = None


@router.get("/customers")
def list_customers(
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
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
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all)
):
    existing = db.query(Customer).filter(Customer.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="手机号已存在")
    customer = Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
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
