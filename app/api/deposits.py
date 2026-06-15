from fastapi import APIRouter, Depends, HTTPException, Request, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from app.database import get_db
from app.schemas import DepositResponse, DepositCreate, DepositUpdate, ApartmentRemarkUpdate, ChangeLogResponse, AttachmentResponse
from app.services.auth import get_current_user, RoleChecker
from app.services.deposit_service import (
    get_deposit,
    get_deposits,
    count_deposits,
    create_deposit,
    update_deposit,
    refund_deposit,
    get_total_deposit_amount,
    update_deposit_remark,
    get_deposit_change_logs,
    get_deposit_attachments,
)
from app.services.common import add_attachment, delete_attachment
from app.models import User

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/deposits", tags=["押金记录"])

DEPOSIT_ROLES = ["admin", "customer_service", "consultant"]
DEPOSIT_WRITE_ROLES = ["admin", "customer_service"]


@router.get("/", response_model=List[DepositResponse])
def list_deposits(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    apartment_id: Optional[int] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEPOSIT_ROLES)),
):
    deposits = get_deposits(
        db, skip=skip, limit=limit,
        status=status, apartment_id=apartment_id,
        keyword=keyword
    )
    return deposits


@router.get("/stats")
def deposit_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEPOSIT_ROLES)),
):
    total_amount = get_total_deposit_amount(db)
    paid_count = count_deposits(db, status="paid")
    refunded_count = count_deposits(db, status="refunded")
    return {
        "total_amount": total_amount,
        "paid_count": paid_count,
        "refunded_count": refunded_count,
    }


@router.get("/{deposit_id}", response_model=DepositResponse)
def get_deposit_detail(
    deposit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEPOSIT_ROLES)),
):
    deposit = get_deposit(db, deposit_id)
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return deposit


@router.post("/", response_model=DepositResponse)
def create_new_deposit(
    deposit: DepositCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEPOSIT_WRITE_ROLES)),
):
    return create_deposit(db, deposit, current_user.id)


@router.put("/{deposit_id}", response_model=DepositResponse)
def update_existing_deposit(
    deposit_id: int,
    deposit_update: DepositUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEPOSIT_WRITE_ROLES)),
):
    deposit = update_deposit(db, deposit_id, deposit_update, current_user.id)
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return deposit


@router.patch("/{deposit_id}/remark")
def change_deposit_remark(
    deposit_id: int,
    remark_data: ApartmentRemarkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEPOSIT_WRITE_ROLES)),
):
    deposit = update_deposit_remark(db, deposit_id, remark_data.remark, current_user.id)
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return {"message": "Remark updated successfully"}


@router.post("/{deposit_id}/refund")
def refund_deposit_by_id(
    deposit_id: int,
    refund_amount: float,
    remark: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEPOSIT_WRITE_ROLES)),
):
    deposit = refund_deposit(db, deposit_id, refund_amount, remark, current_user.id)
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return {"message": "Deposit refunded successfully", "refund_amount": refund_amount}


@router.get("/{deposit_id}/change-logs", response_model=List[ChangeLogResponse])
def list_deposit_change_logs(
    deposit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEPOSIT_ROLES)),
):
    deposit = get_deposit(db, deposit_id)
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return get_deposit_change_logs(db, deposit_id)


@router.get("/{deposit_id}/attachments", response_model=List[AttachmentResponse])
def list_deposit_attachments(
    deposit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEPOSIT_ROLES)),
):
    deposit = get_deposit(db, deposit_id)
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return get_deposit_attachments(db, deposit_id)


@router.post("/{deposit_id}/attachments", response_model=AttachmentResponse)
async def upload_deposit_attachment(
    deposit_id: int,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEPOSIT_WRITE_ROLES)),
):
    deposit = get_deposit(db, deposit_id)
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")

    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_name = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return add_attachment(
        db, "deposit", deposit_id,
        file_name=file.filename or unique_name,
        file_path=file_path,
        file_size=len(content),
        file_type=file.content_type,
        category=category,
        operator_id=current_user.id,
        apartment_id=deposit.apartment_id,
    )


@router.delete("/attachments/{attachment_id}")
def remove_deposit_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(DEPOSIT_WRITE_ROLES)),
):
    success = delete_attachment(db, attachment_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return {"message": "Attachment deleted successfully"}
