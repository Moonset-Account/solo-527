from fastapi import APIRouter, Depends, HTTPException, Query, Request, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from app.database import get_db
from app.schemas import (
    ApartmentResponse,
    ApartmentCreate,
    ApartmentUpdate,
    ApartmentRemarkUpdate,
    ChangeLogResponse,
    AttachmentResponse,
    VacancyHistoryResponse
)
from app.services.auth import get_current_user, RoleChecker
from app.services.apartment_service import (
    get_apartment,
    get_apartments,
    count_apartments,
    create_apartment,
    update_apartment,
    update_apartment_status,
    delete_apartment,
    get_change_logs,
    get_attachments,
    get_vacancy_history,
    get_vacancy_stats,
    add_attachment,
    delete_attachment,
    update_apartment_remark
)
from app.models import User

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/apartments", tags=["房源管理"])


@router.get("/", response_model=List[ApartmentResponse])
def list_apartments(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db)
):
    apartments = get_apartments(
        db, skip=skip, limit=limit,
        status=status, min_price=min_price,
        max_price=max_price, bedrooms=bedrooms,
        keyword=keyword
    )
    return apartments


@router.get("/stats")
def apartment_stats(db: Session = Depends(get_db)):
    return get_vacancy_stats(db)


@router.post("/", response_model=ApartmentResponse)
def create_new_apartment(
    apartment: ApartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    return create_apartment(db, apartment, current_user.id)


@router.get("/{apartment_id}", response_model=ApartmentResponse)
def get_apartment_detail(apartment_id: int, db: Session = Depends(get_db)):
    apartment = get_apartment(db, apartment_id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    return apartment


@router.put("/{apartment_id}", response_model=ApartmentResponse)
def update_existing_apartment(
    apartment_id: int,
    apartment_update: ApartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "consultant"]))
):
    apartment = update_apartment(db, apartment_id, apartment_update, current_user.id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    return apartment


@router.patch("/{apartment_id}/remark")
def change_apartment_remark(
    apartment_id: int,
    remark_data: ApartmentRemarkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "consultant"]))
):
    apartment = update_apartment_remark(db, apartment_id, remark_data.remark, current_user.id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    return {"message": "Remark updated successfully"}


@router.patch("/{apartment_id}/status")
def change_apartment_status(
    apartment_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "consultant"]))
):
    apartment = update_apartment_status(db, apartment_id, status, current_user.id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    return {"message": "Status updated successfully", "status": status}


@router.delete("/{apartment_id}")
def delete_existing_apartment(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    success = delete_apartment(db, apartment_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Apartment not found")
    return {"message": "Apartment deleted successfully"}


@router.get("/{apartment_id}/change-logs", response_model=List[ChangeLogResponse])
def list_change_logs(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_change_logs(db, "apartments", apartment_id)


@router.get("/{apartment_id}/attachments", response_model=List[AttachmentResponse])
def list_attachments(apartment_id: int, db: Session = Depends(get_db)):
    return get_attachments(db, apartment_id)


@router.post("/{apartment_id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(
    apartment_id: int,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "consultant"]))
):
    apartment = get_apartment(db, apartment_id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_name = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return add_attachment(
        db, apartment_id,
        file_name=file.filename or unique_name,
        file_path=file_path,
        file_size=len(content),
        file_type=file.content_type,
        category=category,
        operator_id=current_user.id
    )


@router.delete("/attachments/{attachment_id}")
def remove_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "consultant"]))
):
    success = delete_attachment(db, attachment_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return {"message": "Attachment deleted successfully"}


@router.get("/{apartment_id}/vacancy-history", response_model=List[VacancyHistoryResponse])
def list_vacancy_history(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_vacancy_history(db, apartment_id)
