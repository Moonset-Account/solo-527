from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from decimal import Decimal
from app.models import ApprovalLevel, ApprovalLevelUser, ApprovalRecord, ApprovalAction, PurchaseRequest, PurchaseStatus, User
from app.schemas import ApprovalLevelCreate, ApprovalLevelUpdate, ApprovalRecordCreate


class ApprovalService:
    @staticmethod
    def get_required_approval_level(db: Session, budget: Decimal) -> int:
        levels = db.query(ApprovalLevel).filter(
            ApprovalLevel.is_active == True
        ).order_by(ApprovalLevel.level).all()
        
        for level in levels:
            if level.condition:
                try:
                    namespace = {"budget": budget}
                    if eval(level.condition, {"__builtins__": {}}, namespace):
                        return level.level
                except Exception:
                    continue
            else:
                return level.level
        
        return 1

    @staticmethod
    def get_approval_levels(db: Session, include_inactive: bool = False) -> List[ApprovalLevel]:
        query = db.query(ApprovalLevel)
        if not include_inactive:
            query = query.filter(ApprovalLevel.is_active == True)
        return query.order_by(ApprovalLevel.level).all()

    @staticmethod
    def create_approval_level(db: Session, level_in: ApprovalLevelCreate) -> ApprovalLevel:
        existing = db.query(ApprovalLevel).filter(ApprovalLevel.level == level_in.level).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"审批层级 {level_in.level} 已存在")
        
        level_data = level_in.model_dump(exclude={"approver_ids"})
        db_level = ApprovalLevel(**level_data)
        db.add(db_level)
        db.flush()
        
        for user_id in level_in.approver_ids:
            lu = ApprovalLevelUser(level_id=db_level.id, user_id=user_id)
            db.add(lu)
        
        db.commit()
        db.refresh(db_level)
        return db_level

    @staticmethod
    def update_approval_level(
        db: Session, level_id: int, level_in: ApprovalLevelUpdate
    ) -> ApprovalLevel:
        level = db.query(ApprovalLevel).filter(ApprovalLevel.id == level_id).first()
        if not level:
            raise HTTPException(status_code=404, detail="审批层级不存在")
        
        update_data = level_in.model_dump(exclude_unset=True, exclude={"approver_ids"})
        for field, value in update_data.items():
            if value is not None:
                setattr(level, field, value)
        
        if level_in.approver_ids is not None:
            db.query(ApprovalLevelUser).filter(
                ApprovalLevelUser.level_id == level_id
            ).delete()
            
            for user_id in level_in.approver_ids:
                lu = ApprovalLevelUser(level_id=level_id, user_id=user_id)
                db.add(lu)
        
        db.commit()
        db.refresh(level)
        return level

    @staticmethod
    def delete_approval_level(db: Session, level_id: int) -> bool:
        level = db.query(ApprovalLevel).filter(ApprovalLevel.id == level_id).first()
        if not level:
            raise HTTPException(status_code=404, detail="审批层级不存在")
        
        db.query(ApprovalLevelUser).filter(
            ApprovalLevelUser.level_id == level_id
        ).delete()
        db.delete(level)
        db.commit()
        return True

    @staticmethod
    def get_level_approvers(db: Session, level_id: int) -> List[User]:
        level_users = db.query(ApprovalLevelUser).filter(
            ApprovalLevelUser.level_id == level_id
        ).all()
        
        user_ids = [lu.user_id for lu in level_users]
        return db.query(User).filter(User.id.in_(user_ids)).all()

    @staticmethod
    def is_user_approver(db: Session, user_id: int, level: int) -> bool:
        level_obj = db.query(ApprovalLevel).filter(
            ApprovalLevel.level == level,
            ApprovalLevel.is_active == True
        ).first()
        
        if not level_obj:
            return False
        
        return db.query(ApprovalLevelUser).filter(
            ApprovalLevelUser.level_id == level_obj.id,
            ApprovalLevelUser.user_id == user_id
        ).first() is not None

    @staticmethod
    def process_approval(
        db: Session, approval_in: ApprovalRecordCreate, approver: User
    ) -> ApprovalRecord:
        purchase = db.query(PurchaseRequest).filter(
            PurchaseRequest.id == approval_in.purchase_id
        ).first()
        
        if not purchase:
            raise HTTPException(status_code=404, detail="采购需求不存在")
        
        if purchase.status != PurchaseStatus.PENDING:
            raise HTTPException(status_code=400, detail="当前状态无法审批")
        
        if not ApprovalService.is_user_approver(db, approver.id, purchase.current_approval_level):
            raise HTTPException(status_code=403, detail="您不是当前审批层级的审批人")
        
        action = ApprovalAction(approval_in.action)
        
        approval_record = ApprovalRecord(
            purchase_id=approval_in.purchase_id,
            level_id=db.query(ApprovalLevel).filter(
                ApprovalLevel.level == purchase.current_approval_level
            ).first().id,
            approver_id=approver.id,
            action=action,
            opinion=approval_in.opinion
        )
        db.add(approval_record)
        
        if action == ApprovalAction.APPROVE:
            max_level = db.query(ApprovalLevel).filter(
                ApprovalLevel.is_active == True
            ).count()
            
            if purchase.current_approval_level >= max_level:
                purchase.status = PurchaseStatus.APPROVED
            else:
                purchase.current_approval_level += 1
                
                from app.services.notification_service import NotificationService
                NotificationService.create_approval_notification(db, purchase)
                
        elif action == ApprovalAction.REJECT:
            purchase.status = PurchaseStatus.REJECTED
            
        elif action == ApprovalAction.TRANSFER:
            pass
        
        db.commit()
        db.refresh(approval_record)
        return approval_record

    @staticmethod
    def get_approval_history(db: Session, purchase_id: int) -> List[ApprovalRecord]:
        return db.query(ApprovalRecord).filter(
            ApprovalRecord.purchase_id == purchase_id
        ).order_by(ApprovalRecord.approved_at.desc()).all()

    @staticmethod
    def get_pending_approvals(
        db: Session, user_id: int, page: int = 1, page_size: int = 20
    ) -> tuple[List[PurchaseRequest], int]:
        level_users = db.query(ApprovalLevelUser).filter(
            ApprovalLevelUser.user_id == user_id
        ).all()
        
        level_ids = [lu.level_id for lu in level_users]
        
        levels = db.query(ApprovalLevel).filter(
            ApprovalLevel.id.in_(level_ids),
            ApprovalLevel.is_active == True
        ).all()
        
        level_nums = [l.level for l in levels]
        
        query = db.query(PurchaseRequest).filter(
            PurchaseRequest.status == PurchaseStatus.PENDING,
            PurchaseRequest.current_approval_level.in_(level_nums)
        ).order_by(PurchaseRequest.created_at.desc())
        
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        
        return items, total
