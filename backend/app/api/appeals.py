from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.schemas import (
    AppealRecordResponse,
    PaginatedResponse,
    AppealHandleRequest,
)
from app.models.models import AppealRecord, User, Hazard, Team

router = APIRouter(prefix="/appeals", tags=["申诉处理"])


@router.get("", response_model=PaginatedResponse)
def get_appeal_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AppealRecord)
    
    if status:
        query = query.filter(AppealRecord.status == status)
    
    total = query.count()
    appeals = query.order_by(AppealRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for appeal in appeals:
        items.append(AppealRecordResponse(
            id=appeal.id,
            hazard_id=appeal.hazard_id,
            reason=appeal.reason,
            status=appeal.status,
            created_at=appeal.created_at,
            handled_at=appeal.handled_at,
            handled_by=appeal.handled_by,
            handle_remark=appeal.handle_remark,
        ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/{appeal_id}/handle")
def handle_appeal(
    appeal_id: str,
    request: AppealHandleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appeal = db.query(AppealRecord).filter(AppealRecord.id == appeal_id).first()
    if not appeal:
        raise HTTPException(status_code=404, detail="申诉记录不存在")
    
    appeal.status = request.result
    appeal.handled_by = current_user.name
    appeal.handled_at = datetime.utcnow()
    appeal.handle_remark = request.remark
    
    if request.result == "approved":
        hazard = db.query(Hazard).filter(Hazard.id == appeal.hazard_id).first()
        if hazard:
            pass
    
    db.commit()
    
    return {"success": True}
