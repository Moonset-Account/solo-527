from fastapi import APIRouter, Depends, HTTPException, Request, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid

from app.database import get_db
from app.schemas import (
    ContractRiskResponse, ContractRiskCreate, ContractRiskHandle,
    ApartmentRemarkUpdate, ChangeLogResponse, AttachmentResponse
)
from app.services.auth import get_current_user, RoleChecker
from app.services.risk_service import (
    get_risk,
    get_risks,
    count_risks,
    create_risk,
    handle_risk,
    update_risk_status,
    update_risk_remark,
    get_risk_change_logs,
    get_risk_attachments,
)
from app.services.common import add_attachment, delete_attachment
from app.models import User

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/risks", tags=["合同风险"])

RISK_ROLES = ["admin", "customer_service"]


@router.get("/", response_model=List[ContractRiskResponse])
def list_risks(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    risk_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RISK_ROLES)),
):
    risks = get_risks(
        db, skip=skip, limit=limit,
        status=status, risk_type=risk_type,
        risk_level=risk_level, keyword=keyword
    )
    return risks


@router.get("/stats")
def risk_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RISK_ROLES)),
):
    pending_count = count_risks(db, status="pending")
    processing_count = count_risks(db, status="processing")
    resolved_count = count_risks(db, status="resolved")
    high_count = count_risks(db, risk_level="high")
    return {
        "pending": pending_count,
        "processing": processing_count,
        "resolved": resolved_count,
        "high_risk": high_count,
    }


@router.get("/{risk_id}", response_model=ContractRiskResponse)
def get_risk_detail(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RISK_ROLES)),
):
    risk = get_risk(db, risk_id)
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return risk


@router.post("/", response_model=ContractRiskResponse)
def create_new_risk(
    risk: ContractRiskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RISK_ROLES)),
):
    return create_risk(db, risk, current_user.id)


@router.patch("/{risk_id}/remark")
def change_risk_remark(
    risk_id: int,
    remark_data: ApartmentRemarkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RISK_ROLES)),
):
    risk = update_risk_remark(db, risk_id, remark_data.remark, current_user.id)
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return {"message": "Remark updated successfully"}


@router.post("/{risk_id}/handle", response_model=ContractRiskResponse)
def handle_risk_by_id(
    risk_id: int,
    handle_data: ContractRiskHandle,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RISK_ROLES)),
):
    risk = handle_risk(db, risk_id, handle_data, current_user.id)
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return risk


@router.patch("/{risk_id}/status")
def change_risk_status(
    risk_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RISK_ROLES)),
):
    risk = update_risk_status(db, risk_id, status, current_user.id)
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return {"message": "Risk status updated successfully", "status": status}


@router.get("/{risk_id}/change-logs", response_model=List[ChangeLogResponse])
def list_risk_change_logs(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RISK_ROLES)),
):
    risk = get_risk(db, risk_id)
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return get_risk_change_logs(db, risk_id)


@router.get("/{risk_id}/attachments", response_model=List[AttachmentResponse])
def list_risk_attachments(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RISK_ROLES)),
):
    risk = get_risk(db, risk_id)
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return get_risk_attachments(db, risk_id)


@router.post("/{risk_id}/attachments", response_model=AttachmentResponse)
async def upload_risk_attachment(
    risk_id: int,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RISK_ROLES)),
):
    risk = get_risk(db, risk_id)
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")

    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_name = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return add_attachment(
        db, "risk", risk_id,
        file_name=file.filename or unique_name,
        file_path=file_path,
        file_size=len(content),
        file_type=file.content_type,
        category=category,
        operator_id=current_user.id,
        apartment_id=risk.apartment_id,
    )


@router.delete("/attachments/{attachment_id}")
def remove_risk_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(RISK_ROLES)),
):
    success = delete_attachment(db, attachment_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return {"message": "Attachment deleted successfully"}
