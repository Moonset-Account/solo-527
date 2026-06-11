from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import (
    ApprovalLevelCreate, ApprovalLevelUpdate, ApprovalLevelResponse,
    ApprovalRecordCreate, ApprovalRecordResponse
)
from app.services import ApprovalService
from app.utils.security import get_current_user, require_role
from app.models import User

router = APIRouter()


@router.get("/levels", response_model=list[ApprovalLevelResponse])
def get_approval_levels(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    levels = ApprovalService.get_approval_levels(db, include_inactive)
    result = []
    for level in levels:
        resp = ApprovalLevelResponse.model_validate(level)
        approvers = ApprovalService.get_level_approvers(db, level.id)
        resp.approvers = [
            {"id": u.id, "real_name": u.real_name, "username": u.username}
            for u in approvers
        ]
        result.append(resp)
    return result


@router.post("/levels", response_model=ApprovalLevelResponse)
def create_approval_level(
    level_in: ApprovalLevelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    level = ApprovalService.create_approval_level(db, level_in)
    resp = ApprovalLevelResponse.model_validate(level)
    approvers = ApprovalService.get_level_approvers(db, level.id)
    resp.approvers = [
        {"id": u.id, "real_name": u.real_name}
        for u in approvers
    ]
    return resp


@router.put("/levels/{level_id}", response_model=ApprovalLevelResponse)
def update_approval_level(
    level_id: int,
    level_in: ApprovalLevelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    level = ApprovalService.update_approval_level(db, level_id, level_in)
    resp = ApprovalLevelResponse.model_validate(level)
    approvers = ApprovalService.get_level_approvers(db, level.id)
    resp.approvers = [
        {"id": u.id, "real_name": u.real_name}
        for u in approvers
    ]
    return resp


@router.delete("/levels/{level_id}")
def delete_approval_level(
    level_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    ApprovalService.delete_approval_level(db, level_id)
    return {"success": True, "message": "删除成功"}


@router.post("/process", response_model=ApprovalRecordResponse)
def process_approval(
    approval_in: ApprovalRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = ApprovalService.process_approval(db, approval_in, current_user)
    resp = ApprovalRecordResponse.model_validate(record)
    resp.approver_name = record.approver.real_name if record.approver else None
    resp.level_name = record.level.name if record.level else None
    return resp


@router.get("/purchase/{purchase_id}/history", response_model=list[ApprovalRecordResponse])
def get_approval_history(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = ApprovalService.get_approval_history(db, purchase_id)
    result = []
    for record in records:
        resp = ApprovalRecordResponse.model_validate(record)
        resp.approver_name = record.approver.real_name if record.approver else None
        resp.level_name = record.level.name if record.level else None
        result.append(resp)
    return result


@router.get("/pending")
def get_pending_approvals(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.repositories import PurchaseRepository
    repo = PurchaseRepository()
    items, total = repo.get_pending_approval(db, current_user.id, page, page_size)
    
    return {
        "items": [
            {
                "id": p.id,
                "request_no": p.request_no,
                "material_name": p.material_name,
                "budget": float(p.budget),
                "status": p.status.value,
                "current_level": p.current_approval_level,
                "created_by": p.creator.real_name if p.creator else None,
                "created_at": p.created_at.isoformat()
            }
            for p in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }
