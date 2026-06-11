from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from typing import Optional, List
from app.models import PurchaseRequest, PurchaseStatus, User, Attachment, Note
from app.schemas import PurchaseRequestCreate, PurchaseRequestUpdate, ClosePurchaseRequest
from app.repositories import PurchaseRepository
from app.services.approval_service import ApprovalService
from app.services.notification_service import NotificationService
from app.utils.file_handler import save_upload_file, delete_file
from app.models.notification import NotificationType

purchase_repo = PurchaseRepository()


class PurchaseService:
    @staticmethod
    def create_purchase(
        db: Session, purchase_in: PurchaseRequestCreate, creator: User
    ) -> PurchaseRequest:
        request_no = purchase_repo.generate_request_no(db)
        
        purchase_data = purchase_in.model_dump()
        purchase_data["request_no"] = request_no
        purchase_data["created_by"] = creator.id
        purchase_data["status"] = PurchaseStatus.DRAFT
        
        db_purchase = PurchaseRequest(**purchase_data)
        db.add(db_purchase)
        db.commit()
        db.refresh(db_purchase)
        
        return db_purchase

    @staticmethod
    def submit_purchase(db: Session, purchase_id: int, user: User) -> PurchaseRequest:
        purchase = purchase_repo.get_by_id(db, purchase_id)
        if not purchase:
            raise HTTPException(status_code=404, detail="采购需求不存在")
        
        if purchase.created_by != user.id and user.role not in ["admin", "manager"]:
            raise HTTPException(status_code=403, detail="无权限提交此需求")
        
        if purchase.status not in [PurchaseStatus.DRAFT, PurchaseStatus.REJECTED]:
            raise HTTPException(status_code=400, detail="当前状态无法提交")
        
        required_level = ApprovalService.get_required_approval_level(db, purchase.budget)
        purchase.status = PurchaseStatus.PENDING
        purchase.current_approval_level = required_level
        
        NotificationService.create_approval_notification(db, purchase)
        
        db.commit()
        db.refresh(purchase)
        return purchase

    @staticmethod
    def get_purchase_list(
        db: Session, user: User, status: Optional[str] = None,
        keyword: Optional[str] = None, page: int = 1, page_size: int = 20
    ) -> tuple[List[PurchaseRequest], int]:
        filters = {}
        if status:
            filters["status"] = status
        
        if user.role == "buyer":
            return purchase_repo.get_by_creator(db, user.id, page, page_size)
        elif keyword:
            return purchase_repo.search(db, keyword, page, page_size)
        elif status:
            return purchase_repo.get_by_status(db, status, page, page_size)
        else:
            return purchase_repo.get_paginated(db, page=page, page_size=page_size)

    @staticmethod
    def get_purchase_detail(db: Session, purchase_id: int, user: User) -> PurchaseRequest:
        purchase = purchase_repo.get_by_id(db, purchase_id)
        if not purchase:
            raise HTTPException(status_code=404, detail="采购需求不存在")
        
        if user.role == "buyer" and purchase.created_by != user.id:
            raise HTTPException(status_code=403, detail="无权限查看此需求")
        
        return purchase

    @staticmethod
    def update_purchase(
        db: Session, purchase_id: int, purchase_in: PurchaseRequestUpdate, user: User
    ) -> PurchaseRequest:
        purchase = purchase_repo.get_by_id(db, purchase_id)
        if not purchase:
            raise HTTPException(status_code=404, detail="采购需求不存在")
        
        if purchase.created_by != user.id and user.role not in ["admin"]:
            raise HTTPException(status_code=403, detail="无权限修改此需求")
        
        if purchase.status not in [PurchaseStatus.DRAFT, PurchaseStatus.REJECTED]:
            raise HTTPException(status_code=400, detail="当前状态无法修改")
        
        return purchase_repo.update(db, db_obj=purchase, obj_in=purchase_in)

    @staticmethod
    def close_purchase(
        db: Session, purchase_id: int, close_data: ClosePurchaseRequest, user: User
    ) -> PurchaseRequest:
        purchase = purchase_repo.get_by_id(db, purchase_id)
        if not purchase:
            raise HTTPException(status_code=404, detail="采购需求不存在")
        
        if user.role not in ["manager", "admin"]:
            raise HTTPException(status_code=403, detail="无权限关闭此需求")
        
        if purchase.status == PurchaseStatus.CLOSED:
            raise HTTPException(status_code=400, detail="需求已关闭")
        
        purchase.status = PurchaseStatus.CLOSED
        purchase.closing_note = close_data.closing_note
        
        db.commit()
        db.refresh(purchase)
        return purchase

    @staticmethod
    def add_note(db: Session, purchase_id: int, content: str, user: User) -> Note:
        purchase = purchase_repo.get_by_id(db, purchase_id)
        if not purchase:
            raise HTTPException(status_code=404, detail="采购需求不存在")
        
        note = Note(
            related_id=purchase_id,
            related_type="purchase",
            content=content,
            created_by=user.id
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return note

    @staticmethod
    async def upload_attachment(
        db: Session, purchase_id: int, file: UploadFile, user: User
    ) -> Attachment:
        purchase = purchase_repo.get_by_id(db, purchase_id)
        if not purchase:
            raise HTTPException(status_code=404, detail="采购需求不存在")
        
        file_info = await save_upload_file(file, sub_dir=f"purchase/{purchase_id}")
        
        attachment = Attachment(
            filename=file_info["filename"],
            original_name=file_info["original_name"],
            file_type=file_info["file_type"],
            file_size=file_info["file_size"],
            related_id=purchase_id,
            related_type="purchase",
            uploaded_by=user.id
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        return attachment

    @staticmethod
    def delete_attachment(db: Session, attachment_id: int, user: User) -> bool:
        attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
        if not attachment:
            raise HTTPException(status_code=404, detail="附件不存在")
        
        if attachment.uploaded_by != user.id and user.role not in ["admin"]:
            raise HTTPException(status_code=403, detail="无权限删除此附件")
        
        if attachment.related_type == "purchase":
            delete_file(attachment.filename, sub_dir=f"purchase/{attachment.related_id}")
        
        db.delete(attachment)
        db.commit()
        return True
