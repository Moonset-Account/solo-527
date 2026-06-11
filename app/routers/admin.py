from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import (
    InvoiceStatusCreate, InvoiceStatusUpdate, InvoiceStatusResponse,
    UserResponse, PaginatedResponse
)
from app.services import AdminService
from app.utils.security import get_current_user, require_role
from app.utils.file_handler import format_file_size, get_file_path
from app.models import User
from fastapi.responses import FileResponse
import os

router = APIRouter()


@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AdminService.get_dashboard_stats(db)


@router.get("/invoice-status", response_model=list[InvoiceStatusResponse])
def get_invoice_status_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "auditor", "manager"]))
):
    return AdminService.get_invoice_status_list(db)


@router.post("/invoice-status", response_model=InvoiceStatusResponse)
def create_invoice_status(
    status_in: InvoiceStatusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    return AdminService.create_invoice_status(db, status_in)


@router.put("/invoice-status/{status_id}", response_model=InvoiceStatusResponse)
def update_invoice_status(
    status_id: int,
    status_in: InvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    return AdminService.update_invoice_status(db, status_id, status_in)


@router.delete("/invoice-status/{status_id}")
def delete_invoice_status(
    status_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    AdminService.delete_invoice_status(db, status_id)
    return {"success": True, "message": "删除成功"}


@router.get("/spec-attachments")
def get_spec_attachments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attachments = AdminService.get_spec_attachments(db)
    return [
        {
            "id": att.id,
            "name": att.name,
            "description": att.description,
            "original_name": att.filename,
            "file_type": att.file_type,
            "file_size": format_file_size(att.file_size) if att.file_size else None,
            "uploaded_by": att.uploader.real_name if att.uploader else None,
            "created_at": att.created_at.isoformat()
        }
        for att in attachments
    ]


@router.post("/spec-attachment")
async def upload_spec_attachment(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    attachment = await AdminService.upload_spec_attachment(db, name, description, file, current_user)
    return {
        "success": True,
        "data": {
            "id": attachment.id,
            "name": attachment.name,
            "description": attachment.description,
            "original_name": attachment.filename,
            "created_at": attachment.created_at.isoformat()
        }
    }


@router.delete("/spec-attachment/{attachment_id}")
def delete_spec_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    AdminService.delete_spec_attachment(db, attachment_id, current_user)
    return {"success": True, "message": "删除成功"}


@router.get("/spec-attachment/{attachment_id}/download")
def download_spec_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models import SpecAttachment
    attachment = db.query(SpecAttachment).filter(SpecAttachment.id == attachment_id).first()
    if not attachment:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="规格附件不存在")
    
    file_path = get_file_path(attachment.filename, sub_dir="specs")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return FileResponse(
        file_path,
        media_type=attachment.file_type or "application/octet-stream",
        filename=attachment.name + os.path.splitext(attachment.filename)[1]
    )


@router.get("/spec-attachment/options")
def get_spec_attachment_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attachments = AdminService.get_spec_attachments(db)
    return [
        {"id": att.id, "name": att.name, "description": att.description}
        for att in attachments
    ]


@router.get("/users", response_model=PaginatedResponse[UserResponse])
def get_user_list(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    items, total = AdminService.get_user_list(db, page, page_size)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/users/options")
def get_user_options(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = AdminService.get_users(db, role)
    return [
        {"id": u.id, "real_name": u.real_name, "username": u.username, "role": u.role.value}
        for u in users
    ]


@router.post("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    user = AdminService.update_user_status(db, user_id, is_active, current_user)
    return {
        "success": True,
        "data": {
            "id": user.id,
            "is_active": user.is_active
        }
    }
