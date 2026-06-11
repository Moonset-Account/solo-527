from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import (
    SupplierCreate, SupplierUpdate, SupplierResponse,
    SupplierAuditCreate, SupplierAuditResponse,
    RiskAssessmentCreate, RiskAssessmentResponse,
    PaginatedResponse
)
from app.services import SupplierService
from app.utils.security import get_current_user, require_role
from app.utils.file_handler import format_file_size
from app.models import User, Attachment, SupplierAudit, RiskAssessment

router = APIRouter()


@router.get("", response_model=PaginatedResponse[SupplierResponse])
def get_supplier_list(
    status: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = SupplierService.get_supplier_list(db, status, keyword, page, page_size)
    
    response_items = []
    for item in items:
        resp = SupplierResponse.model_validate(item)
        latest_risk = db.query(RiskAssessment).filter(
            RiskAssessment.supplier_id == item.id
        ).order_by(RiskAssessment.assessed_at.desc()).first()
        resp.risk_level = latest_risk.risk_level.value if latest_risk else None
        response_items.append(resp)
    
    return PaginatedResponse(
        items=response_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.post("", response_model=SupplierResponse)
def create_supplier(
    supplier_in: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "admin", "manager"]))
):
    return SupplierService.create_supplier(db, supplier_in, current_user)


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier_detail(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = SupplierService.get_supplier_detail(db, supplier_id)
    resp = SupplierResponse.model_validate(supplier)
    latest_risk = db.query(RiskAssessment).filter(
        RiskAssessment.supplier_id == supplier_id
    ).order_by(RiskAssessment.assessed_at.desc()).first()
    resp.risk_level = latest_risk.risk_level.value if latest_risk else None
    return resp


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_in: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "admin", "manager"]))
):
    return SupplierService.update_supplier(db, supplier_id, supplier_in, current_user)


@router.post("/{supplier_id}/audit", response_model=SupplierAuditResponse)
def audit_supplier(
    audit_in: SupplierAuditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "admin", "manager"]))
):
    audit = SupplierService.audit_supplier(db, audit_in, current_user)
    resp = SupplierAuditResponse.model_validate(audit)
    resp.auditor_name = audit.auditor.real_name if audit.auditor else None
    return resp


@router.post("/{supplier_id}/risk", response_model=RiskAssessmentResponse)
def assess_risk(
    risk_in: RiskAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "admin", "manager"]))
):
    risk = SupplierService.assess_risk(db, risk_in, current_user)
    resp = RiskAssessmentResponse.model_validate(risk)
    resp.assessor_name = risk.assessor.real_name if risk.assessor else None
    return resp


@router.get("/{supplier_id}/audit-history", response_model=list[SupplierAuditResponse])
def get_audit_history(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audits = SupplierService.get_audit_history(db, supplier_id)
    result = []
    for audit in audits:
        resp = SupplierAuditResponse.model_validate(audit)
        resp.auditor_name = audit.auditor.real_name if audit.auditor else None
        result.append(resp)
    return result


@router.get("/{supplier_id}/risk-history", response_model=list[RiskAssessmentResponse])
def get_risk_history(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    risks = SupplierService.get_risk_history(db, supplier_id)
    result = []
    for risk in risks:
        resp = RiskAssessmentResponse.model_validate(risk)
        resp.assessor_name = risk.assessor.real_name if risk.assessor else None
        result.append(resp)
    return result


@router.post("/{supplier_id}/attachment")
async def upload_attachment(
    supplier_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["auditor", "admin", "manager"]))
):
    attachment = await SupplierService.upload_attachment(db, supplier_id, file, current_user)
    return {
        "success": True,
        "data": {
            "id": attachment.id,
            "original_name": attachment.original_name,
            "file_size": format_file_size(attachment.file_size),
            "uploaded_at": attachment.uploaded_at.isoformat()
        }
    }


@router.get("/{supplier_id}/attachments")
def get_supplier_attachments(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = SupplierService.get_supplier_detail(db, supplier_id)
    attachments = db.query(Attachment).filter(
        Attachment.related_id == supplier_id,
        Attachment.related_type == "supplier"
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


@router.get("/options/all")
def get_supplier_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.repositories import SupplierRepository
    repo = SupplierRepository()
    suppliers = repo.get_approved(db)
    return [
        {"id": s.id, "name": s.name, "contact_person": s.contact_person}
        for s in suppliers
    ]
