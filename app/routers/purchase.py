from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, Request
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import (
    PurchaseRequestCreate, PurchaseRequestUpdate, PurchaseRequestResponse,
    ClosePurchaseRequest, NoteCreate, NoteResponse, ApiResponse, PaginatedResponse
)
from app.services import PurchaseService
from app.utils.security import get_current_user
from app.utils.file_handler import get_file_path, format_file_size
from app.models import User, Attachment, Note
from datetime import datetime, date
from decimal import Decimal

router = APIRouter()


@router.get("", response_model=PaginatedResponse[PurchaseRequestResponse])
def get_purchase_list(
    status: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = PurchaseService.get_purchase_list(
        db, current_user, status, keyword, page, page_size
    )
    
    response_items = []
    for item in items:
        resp = PurchaseRequestResponse.model_validate(item)
        resp.created_by_name = item.creator.real_name if item.creator else None
        resp.supplier_name = item.supplier.name if item.supplier else None
        response_items.append(resp)
    
    return PaginatedResponse(
        items=response_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.post("", response_model=PurchaseRequestResponse)
def create_purchase(
    request: Request,
    purchase_in: PurchaseRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["buyer", "admin", "manager"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="无权限创建采购需求")
    return PurchaseService.create_purchase(db, purchase_in, current_user)


@router.post("/{purchase_id}/submit", response_model=PurchaseRequestResponse)
def submit_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return PurchaseService.submit_purchase(db, purchase_id, current_user)


@router.get("/{purchase_id}", response_model=PurchaseRequestResponse)
def get_purchase_detail(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    purchase = PurchaseService.get_purchase_detail(db, purchase_id, current_user)
    resp = PurchaseRequestResponse.model_validate(purchase)
    resp.created_by_name = purchase.creator.real_name if purchase.creator else None
    resp.supplier_name = purchase.supplier.name if purchase.supplier else None
    return resp


@router.put("/{purchase_id}", response_model=PurchaseRequestResponse)
def update_purchase(
    purchase_id: int,
    purchase_in: PurchaseRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return PurchaseService.update_purchase(db, purchase_id, purchase_in, current_user)


@router.post("/{purchase_id}/close", response_model=PurchaseRequestResponse)
def close_purchase(
    purchase_id: int,
    close_data: ClosePurchaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return PurchaseService.close_purchase(db, purchase_id, close_data, current_user)


@router.post("/{purchase_id}/note", response_model=NoteResponse)
def add_note(
    purchase_id: int,
    note_in: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = PurchaseService.add_note(db, purchase_id, note_in.content, current_user)
    resp = NoteResponse.model_validate(note)
    resp.created_by_name = note.creator.real_name if note.creator else None
    return resp


@router.get("/{purchase_id}/notes", response_model=list[NoteResponse])
def get_purchase_notes(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    purchase = PurchaseService.get_purchase_detail(db, purchase_id, current_user)
    notes = db.query(Note).filter(
        Note.related_id == purchase_id,
        Note.related_type == "purchase"
    ).order_by(Note.created_at.desc()).all()
    
    result = []
    for note in notes:
        resp = NoteResponse.model_validate(note)
        resp.created_by_name = note.creator.real_name if note.creator else None
        result.append(resp)
    return result


@router.post("/{purchase_id}/attachment")
async def upload_attachment(
    purchase_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attachment = await PurchaseService.upload_attachment(db, purchase_id, file, current_user)
    return {
        "success": True,
        "data": {
            "id": attachment.id,
            "original_name": attachment.original_name,
            "file_size": format_file_size(attachment.file_size),
            "uploaded_at": attachment.uploaded_at.isoformat()
        }
    }


@router.get("/{purchase_id}/attachments")
def get_purchase_attachments(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    purchase = PurchaseService.get_purchase_detail(db, purchase_id, current_user)
    attachments = db.query(Attachment).filter(
        Attachment.related_id == purchase_id,
        Attachment.related_type == "purchase"
    ).order_by(Attachment.uploaded_at.desc()).all()
    
    return [
        {
            "id": att.id,
            "original_name": att.original_name,
            "file_type": att.file_type,
            "file_size": format_file_size(att.file_size),
            "uploaded_by": att.uploader.real_name if att.uploader else None,
            "uploaded_at": att.uploaded_at.isoformat()
        }
        for att in attachments
    ]


@router.delete("/attachment/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    PurchaseService.delete_attachment(db, attachment_id, current_user)
    return {"success": True, "message": "删除成功"}


@router.get("/attachment/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="附件不存在")
    
    file_path = get_file_path(attachment.filename, sub_dir=f"{attachment.related_type}/{attachment.related_id}")
    
    import os
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return FileResponse(
        file_path,
        media_type=attachment.file_type or "application/octet-stream",
        filename=attachment.original_name
    )
