from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from typing import List, Optional
from app.models import InvoiceStatus, SpecAttachment, User
from app.schemas import InvoiceStatusCreate, InvoiceStatusUpdate
from app.utils.file_handler import save_upload_file, delete_file


class AdminService:
    @staticmethod
    def get_invoice_status_list(db: Session) -> List[InvoiceStatus]:
        return db.query(InvoiceStatus).order_by(InvoiceStatus.sort_order).all()

    @staticmethod
    def create_invoice_status(db: Session, status_in: InvoiceStatusCreate) -> InvoiceStatus:
        existing = db.query(InvoiceStatus).filter(
            InvoiceStatus.code == status_in.code
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="状态编码已存在")
        
        db_status = InvoiceStatus(**status_in.model_dump())
        db.add(db_status)
        db.commit()
        db.refresh(db_status)
        return db_status

    @staticmethod
    def get_invoice_status(db: Session, status_id: int) -> InvoiceStatus:
        status = db.query(InvoiceStatus).filter(InvoiceStatus.id == status_id).first()
        if not status:
            raise HTTPException(status_code=404, detail="发票状态不存在")
        return status

    @staticmethod
    def update_invoice_status(
        db: Session, status_id: int, status_in: InvoiceStatusUpdate
    ) -> InvoiceStatus:
        status = db.query(InvoiceStatus).filter(InvoiceStatus.id == status_id).first()
        if not status:
            raise HTTPException(status_code=404, detail="发票状态不存在")
        
        update_data = status_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(status, field, value)
        
        db.commit()
        db.refresh(status)
        return status

    @staticmethod
    def delete_invoice_status(db: Session, status_id: int) -> bool:
        status = db.query(InvoiceStatus).filter(InvoiceStatus.id == status_id).first()
        if not status:
            raise HTTPException(status_code=404, detail="发票状态不存在")
        
        db.delete(status)
        db.commit()
        return True

    @staticmethod
    def get_spec_attachments(db: Session) -> List[SpecAttachment]:
        return db.query(SpecAttachment).order_by(SpecAttachment.created_at.desc()).all()

    @staticmethod
    def get_spec_attachment_list(db: Session) -> List[SpecAttachment]:
        return db.query(SpecAttachment).order_by(SpecAttachment.created_at.desc()).all()

    @staticmethod
    async def upload_spec_attachment(
        db: Session, name: str, description: Optional[str], file: UploadFile, user: User
    ) -> SpecAttachment:
        file_info = await save_upload_file(file, sub_dir="specs")
        
        db_attachment = SpecAttachment(
            name=name,
            description=description,
            filename=file_info["filename"],
            file_type=file_info["file_type"],
            file_size=file_info["file_size"],
            uploaded_by=user.id
        )
        db.add(db_attachment)
        db.commit()
        db.refresh(db_attachment)
        return db_attachment

    @staticmethod
    def get_spec_attachment(db: Session, attachment_id: int) -> Optional[SpecAttachment]:
        return db.query(SpecAttachment).filter(SpecAttachment.id == attachment_id).first()

    @staticmethod
    def update_spec_attachment(
        db: Session, attachment_id: int, name: str, description: Optional[str]
    ) -> SpecAttachment:
        attachment = db.query(SpecAttachment).filter(
            SpecAttachment.id == attachment_id
        ).first()
        if not attachment:
            raise HTTPException(status_code=404, detail="规格附件不存在")
        
        attachment.name = name
        attachment.description = description
        db.commit()
        db.refresh(attachment)
        return attachment

    @staticmethod
    def delete_spec_attachment(db: Session, attachment_id: int, user: User) -> bool:
        attachment = db.query(SpecAttachment).filter(
            SpecAttachment.id == attachment_id
        ).first()
        if not attachment:
            raise HTTPException(status_code=404, detail="规格附件不存在")
        
        delete_file(attachment.filename, sub_dir="specs")
        
        db.delete(attachment)
        db.commit()
        return True

    @staticmethod
    def get_users(db: Session, role: Optional[str] = None) -> List[User]:
        query = db.query(User).filter(User.is_active == True)
        if role:
            query = query.filter(User.role == role)
        return query.order_by(User.real_name).all()

    @staticmethod
    def get_user_list(db: Session, page: int = 1, page_size: int = 20) -> tuple[List[User], int]:
        query = db.query(User)
        total = query.count()
        items = query.order_by(User.created_at.desc()).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        return items, total

    @staticmethod
    def update_user_status(db: Session, user_id: int, is_active: bool, admin: User) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        user.is_active = is_active
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_dashboard_stats(db: Session) -> dict:
        from app.models import PurchaseRequest, Supplier, Notification, PurchaseStatus, PriceRecord
        from sqlalchemy import func
        from datetime import date, timedelta
        
        total_purchases = db.query(func.count(PurchaseRequest.id)).scalar() or 0
        pending_purchases = db.query(func.count(PurchaseRequest.id)).filter(
            PurchaseRequest.status == PurchaseStatus.PENDING
        ).scalar() or 0
        total_suppliers = db.query(func.count(Supplier.id)).scalar() or 0
        approved_suppliers = db.query(func.count(Supplier.id)).filter(
            Supplier.status == "approved"
        ).scalar() or 0
        pending_suppliers = db.query(func.count(Supplier.id)).filter(
            Supplier.status == "pending"
        ).scalar() or 0
        
        thirty_days_later = date.today() + timedelta(days=30)
        price_alert_count = db.query(func.count(PriceRecord.id)).filter(
            PriceRecord.expires_at != None,
            PriceRecord.expires_at <= thirty_days_later,
            PriceRecord.is_expired == False
        ).scalar() or 0
        
        return {
            "total_purchases": total_purchases,
            "pending_purchases": pending_purchases,
            "total_suppliers": total_suppliers,
            "approved_suppliers": approved_suppliers,
            "pending_suppliers": pending_suppliers,
            "price_alert_count": price_alert_count
        }
