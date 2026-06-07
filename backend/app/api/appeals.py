from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import AppealRecord, Hazard, User
from app.schemas import AppealRecordResponse, PaginatedResponse

router = APIRouter(prefix="/appeals", tags=["申诉处理"])


@router.get("", response_model=PaginatedResponse[AppealRecordResponse])
def get_appeals(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    team_ids: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AppealRecord)
    
    if status:
        query = query.filter(AppealRecord.status == status)
    if start_date:
        query = query.filter(AppealRecord.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(AppealRecord.created_at <= datetime.fromisoformat(end_date))
    
    total = query.count()
    appeals = query.order_by(AppealRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for a in appeals:
        hazard = db.query(Hazard).filter(Hazard.id == a.hazard_id).first()
        items.append(AppealRecordResponse(
            id=a.id,
            hazard_id=a.hazard_id,
            reason=a.reason,
            submitted_by="",
            submitted_at=a.created_at,
            status=a.status,
            handled_by=a.handled_by,
            handled_at=a.handled_at,
            remark=a.handle_remark,
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
    result: str = Query(..., description="approved 或 rejected"),
    remark: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appeal = db.query(AppealRecord).filter(AppealRecord.id == appeal_id).first()
    if not appeal:
        raise HTTPException(status_code=404, detail="申诉不存在")
    
    if result not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="result 只能是 approved 或 rejected")
    
    appeal.status = result
    appeal.handled_by = current_user.full_name
    appeal.handled_at = datetime.utcnow()
    appeal.handle_remark = remark
    
    db.commit()
    return {"message": "申诉已处理", "appeal_id": appeal_id, "status": result}
