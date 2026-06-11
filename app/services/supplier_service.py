from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from typing import Optional, List
from app.models import Supplier, SupplierAudit, RiskAssessment, RiskLevel, User, Attachment
from app.schemas import SupplierCreate, SupplierUpdate, SupplierAuditCreate, RiskAssessmentCreate
from app.repositories import SupplierRepository
from app.utils.file_handler import save_upload_file, delete_file

supplier_repo = SupplierRepository()


class SupplierService:
    @staticmethod
    def create_supplier(db: Session, supplier_in: SupplierCreate, creator: User) -> Supplier:
        existing = supplier_repo.get_by_name(db, supplier_in.name)
        if existing:
            raise HTTPException(status_code=400, detail="供应商名称已存在")
        
        supplier_data = supplier_in.model_dump()
        db_supplier = Supplier(**supplier_data)
        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)
        return db_supplier

    @staticmethod
    def get_supplier_list(
        db: Session, status: Optional[str] = None, keyword: Optional[str] = None,
        page: int = 1, page_size: int = 20
    ) -> tuple[List[Supplier], int]:
        if keyword:
            return supplier_repo.search(db, keyword, page, page_size)
        elif status:
            return supplier_repo.get_by_status(db, status, page, page_size)
        else:
            return supplier_repo.get_paginated(db, page=page, page_size=page_size)

    @staticmethod
    def get_supplier_detail(db: Session, supplier_id: int) -> Supplier:
        supplier = supplier_repo.get_by_id(db, supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="供应商不存在")
        return supplier

    @staticmethod
    def update_supplier(
        db: Session, supplier_id: int, supplier_in: SupplierUpdate, user: User
    ) -> Supplier:
        supplier = supplier_repo.get_by_id(db, supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="供应商不存在")
        
        return supplier_repo.update(db, db_obj=supplier, obj_in=supplier_in)

    @staticmethod
    def audit_supplier(db: Session, audit_in: SupplierAuditCreate, auditor: User) -> SupplierAudit:
        supplier = supplier_repo.get_by_id(db, audit_in.supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="供应商不存在")
        
        if audit_in.audit_result == "pass":
            supplier.status = "approved"
        elif audit_in.audit_result == "reject":
            supplier.status = "rejected"
        
        audit = SupplierAudit(
            supplier_id=audit_in.supplier_id,
            auditor_id=auditor.id,
            audit_result=audit_in.audit_result,
            audit_opinion=audit_in.audit_opinion
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit

    @staticmethod
    def assess_risk(db: Session, risk_in: RiskAssessmentCreate, assessor: User) -> RiskAssessment:
        supplier = supplier_repo.get_by_id(db, risk_in.supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="供应商不存在")
        
        risk = RiskAssessment(
            supplier_id=risk_in.supplier_id,
            assessor_id=assessor.id,
            risk_level=RiskLevel(risk_in.risk_level),
            description=risk_in.description
        )
        db.add(risk)
        db.commit()
        db.refresh(risk)
        return risk

    @staticmethod
    def get_audit_history(db: Session, supplier_id: int) -> List[SupplierAudit]:
        supplier = supplier_repo.get_by_id(db, supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="供应商不存在")
        
        return db.query(SupplierAudit).filter(
            SupplierAudit.supplier_id == supplier_id
        ).order_by(SupplierAudit.audited_at.desc()).all()

    @staticmethod
    def get_risk_history(db: Session, supplier_id: int) -> List[RiskAssessment]:
        supplier = supplier_repo.get_by_id(db, supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="供应商不存在")
        
        return db.query(RiskAssessment).filter(
            RiskAssessment.supplier_id == supplier_id
        ).order_by(RiskAssessment.assessed_at.desc()).all()

    @staticmethod
    async def upload_attachment(
        db: Session, supplier_id: int, file: UploadFile, user: User
    ) -> Attachment:
        supplier = supplier_repo.get_by_id(db, supplier_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="供应商不存在")
        
        file_info = await save_upload_file(file, sub_dir=f"supplier/{supplier_id}")
        
        attachment = Attachment(
            filename=file_info["filename"],
            original_name=file_info["original_name"],
            file_type=file_info["file_type"],
            file_size=file_info["file_size"],
            related_id=supplier_id,
            related_type="supplier",
            uploaded_by=user.id
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        return attachment
