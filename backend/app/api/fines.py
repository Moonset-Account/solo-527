from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List

from app.core.database import get_db
from app.models import Fine, Hazard, Team
from app.schemas import (
    FineResponse,
    FineStatistics,
    PaginatedResponse,
)

router = APIRouter(prefix="/api/fines", tags=["罚款管理"])


@router.get("", response_model=PaginatedResponse[FineResponse])
def get_fines(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    team_ids: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Fine)
    
    if status:
        query = query.filter(Fine.status == status)
    if team_ids:
        query = query.filter(Fine.team_id.in_(team_ids))
    if start_date:
        query = query.filter(Fine.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Fine.created_at <= datetime.fromisoformat(end_date))
    
    total = query.count()
    items = query.order_by(Fine.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/{fine_id}/confirm")
def confirm_fine(fine_id: str, db: Session = Depends(get_db)):
    fine = db.query(Fine).filter(Fine.id == fine_id).first()
    if not fine:
        return {"error": "罚款记录不存在"}
    
    fine.status = "confirmed"
    fine.confirmed_at = datetime.utcnow()
    
    hazard = db.query(Hazard).filter(Hazard.id == fine.hazard_id).first()
    if hazard:
        hazard.fine_status = "confirmed"
    
    db.commit()
    return {"message": "罚款已确认", "fine_id": fine_id}


@router.post("/{fine_id}/reject")
def reject_fine(fine_id: str, reason: str = Query(...), db: Session = Depends(get_db)):
    fine = db.query(Fine).filter(Fine.id == fine_id).first()
    if not fine:
        return {"error": "罚款记录不存在"}
    
    fine.status = "rejected"
    fine.reject_reason = reason
    fine.rejected_at = datetime.utcnow()
    
    hazard = db.query(Hazard).filter(Hazard.id == fine.hazard_id).first()
    if hazard:
        hazard.fine_status = "rejected"
    
    db.commit()
    return {"message": "罚款已驳回", "fine_id": fine_id}


@router.get("/statistics", response_model=FineStatistics)
def get_fine_statistics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    team_ids: Optional[List[str]] = Query(None),
    type_ids: Optional[List[str]] = Query(None),
    levels: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    confirmed_query = db.query(Fine).filter(Fine.status == "confirmed")
    pending_query = db.query(Fine).filter(Fine.status == "pending")
    
    if team_ids:
        confirmed_query = confirmed_query.filter(Fine.team_id.in_(team_ids))
        pending_query = pending_query.filter(Fine.team_id.in_(team_ids))
    if start_date:
        confirmed_query = confirmed_query.filter(Fine.created_at >= datetime.fromisoformat(start_date))
        pending_query = pending_query.filter(Fine.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        confirmed_query = confirmed_query.filter(Fine.created_at <= datetime.fromisoformat(end_date))
        pending_query = pending_query.filter(Fine.created_at <= datetime.fromisoformat(end_date))
    
    confirmed_fines = confirmed_query.all()
    pending_fines = pending_query.all()
    
    total_confirmed = sum(float(f.amount) for f in confirmed_fines)
    total_pending = sum(float(f.amount) for f in pending_fines)
    
    by_team = {}
    by_type = {}
    by_month = {}
    
    hazards_dict = {}
    for h in db.query(Hazard).all():
        hazards_dict[h.id] = h
    
    for fine in confirmed_fines:
        team_name = fine.team_name
        if not team_name and fine.team_id:
            team = db.query(Team).filter(Team.id == fine.team_id).first()
            team_name = team.name if team else "未知"
        
        hazard = hazards_dict.get(fine.hazard_id)
        type_name = hazard.type_name if hazard and hazard.type_name else "未知类型"
        
        month = fine.created_at.strftime("%Y-%m") if fine.created_at else "未知"
        
        by_team[team_name] = by_team.get(team_name, 0) + float(fine.amount)
        by_type[type_name] = by_type.get(type_name, 0) + float(fine.amount)
        by_month[month] = by_month.get(month, 0) + float(fine.amount)
    
    by_team_list = [{"name": k, "value": round(v, 2)} for k, v in sorted(by_team.items(), key=lambda x: x[1], reverse=True)]
    by_type_list = [{"name": k, "value": round(v, 2)} for k, v in sorted(by_type.items(), key=lambda x: x[1], reverse=True)]
    by_month_list = [{"name": k, "value": round(v, 2)} for k, v in sorted(by_month.items())]
    
    return FineStatistics(
        total_confirmed=round(total_confirmed, 2),
        total_pending=round(total_pending, 2),
        by_team=by_team_list,
        by_type=by_type_list,
        by_month=by_month_list,
    )
