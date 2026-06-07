from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import Hazard, HazardType, Team, InspectionPoint, User, RectificationRecord, AppealRecord, Attachment, Fine
from app.schemas import (
    HazardListItem,
    HazardDetail,
    PaginatedResponse,
    WeatherRecord,
    StopWorkRecord,
)

router = APIRouter(prefix="/hazards", tags=["隐患管理"])


class SubmitRectificationRequest(BaseModel):
    description: str
    photo_ids: Optional[List[str]] = []


class ReviewRequest(BaseModel):
    result: str
    reason: Optional[str] = None


class AppealRequest(BaseModel):
    reason: str


@router.get("", response_model=PaginatedResponse[HazardListItem])
def get_hazard_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    floors: Optional[List[int]] = Query(None),
    team_ids: Optional[List[str]] = Query(None),
    type_ids: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
    levels: Optional[List[str]] = Query(None),
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Hazard)
    
    if floors:
        query = query.filter(Hazard.inspection_point_floor.in_(floors))
    if team_ids:
        query = query.filter(Hazard.team_id.in_(team_ids))
    if type_ids:
        query = query.filter(Hazard.type_id.in_(type_ids))
    if statuses:
        query = query.filter(Hazard.status.in_(statuses))
    if levels:
        query = query.filter(Hazard.level.in_(levels))
    if keyword:
        query = query.filter(Hazard.title.ilike(f"%{keyword}%"))
    if start_date:
        query = query.filter(Hazard.discovered_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Hazard.discovered_at <= datetime.fromisoformat(end_date))
    
    total = query.count()
    hazards = query.order_by(Hazard.discovered_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    items = []
    for h in hazards:
        now = datetime.utcnow()
        is_overdue = h.deadline < now and h.status != 'closed'
        
        items.append(HazardListItem(
            id=h.id,
            title=h.title,
            description=h.description,
            level=h.level,
            status=h.status,
            is_overdue=is_overdue,
            deadline=h.deadline,
            discovered_at=h.discovered_at,
            fine_amount=float(h.fine_amount) if h.fine_amount else 0,
            fine_status=h.fine_status,
            team_id=h.team_id,
            team_name=h.team_name,
            type_id=h.type_id,
            type_name=h.type_name,
            inspection_point_id=h.inspection_point_id,
            inspection_point_floor=h.inspection_point_floor,
            inspection_point_name=h.inspection_point_name,
        ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{hazard_id}", response_model=HazardDetail)
def get_hazard_detail(
    hazard_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    h = db.query(Hazard).filter(Hazard.id == hazard_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="隐患不存在")
    
    now = datetime.utcnow()
    is_overdue = h.deadline < now and h.status != 'closed'
    
    rectification_records = db.query(RectificationRecord).filter(RectificationRecord.hazard_id == hazard_id).order_by(RectificationRecord.created_at.desc()).all()
    appeal_records = db.query(AppealRecord).filter(AppealRecord.hazard_id == hazard_id).order_by(AppealRecord.created_at.desc()).all()
    discovery_photos = db.query(Attachment).filter(
        Attachment.related_type == "hazard",
        Attachment.related_id == hazard_id,
    ).all()
    
    rect_records = []
    all_photo_ids = []
    for r in rectification_records:
        if r.photo_ids:
            all_photo_ids.extend(r.photo_ids)
    
    all_photos = db.query(Attachment).filter(Attachment.id.in_(all_photo_ids)).all() if all_photo_ids else []
    photos_map = {p.id: p for p in all_photos}
    
    for r in rectification_records:
        record_photos = []
        if r.photo_ids:
            for pid in r.photo_ids:
                p = photos_map.get(pid)
                if p:
                    record_photos.append({
                        "id": p.id,
                        "file_name": p.name or "photo.jpg",
                        "file_path": p.url or "",
                        "file_size": 0,
                        "content_type": "image/jpeg",
                        "is_sensitive": p.sensitive or False,
                        "uploaded_by": "",
                        "created_at": p.created_at,
                    })
        
        rect_records.append({
            "id": r.id,
            "hazard_id": r.hazard_id,
            "description": r.description,
            "submitted_by": r.submitted_by,
            "submitted_at": r.submitted_at,
            "status": r.review_result or "pending",
            "reviewer": r.reviewed_by,
            "reviewed_at": r.reviewed_at,
            "reject_reason": r.review_reason,
            "photos": record_photos,
        })
    
    app_records = []
    for a in appeal_records:
        app_records.append({
            "id": a.id,
            "hazard_id": a.hazard_id,
            "reason": a.reason,
            "submitted_by": "",
            "submitted_at": a.created_at,
            "status": a.status,
            "handled_by": a.handled_by,
            "handled_at": a.handled_at,
            "remark": a.handle_remark,
        })
    
    disc_photos = []
    for p in discovery_photos:
        disc_photos.append({
            "id": p.id,
            "file_name": p.name or "photo.jpg",
            "file_path": p.url or "",
            "file_size": 0,
            "content_type": "image/jpeg",
            "is_sensitive": p.sensitive or False,
            "uploaded_by": "",
            "created_at": p.created_at,
        })
    
    return HazardDetail(
        id=h.id,
        title=h.title,
        description=h.description,
        level=h.level,
        status=h.status,
        is_overdue=is_overdue,
        deadline=h.deadline,
        discovered_at=h.discovered_at,
        fine_amount=float(h.fine_amount) if h.fine_amount else 0,
        fine_status=h.fine_status,
        team_id=h.team_id,
        team_name=h.team_name,
        type_id=h.type_id,
        type_name=h.type_name,
        inspection_point_id=h.inspection_point_id,
        inspection_point_floor=h.inspection_point_floor,
        inspection_point_name=h.inspection_point_name,
        discoverer_id=h.discoverer_id,
        discoverer_name=h.discoverer_name,
        discovery_photos=disc_photos,
        rectification_records=rect_records,
        appeal_records=app_records,
        reject_reasons=h.reject_reasons or [],
    )


@router.post("/{hazard_id}/submit-rectification")
def submit_rectification(
    hazard_id: str,
    request: SubmitRectificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hazard = db.query(Hazard).filter(Hazard.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=404, detail="隐患不存在")
    
    record = RectificationRecord(
        hazard_id=hazard_id,
        description=request.description,
        photo_ids=request.photo_ids or [],
        submitted_by=current_user.full_name,
        submitted_at=datetime.utcnow(),
    )
    db.add(record)
    
    hazard.status = "under_review"
    db.commit()
    
    return {"message": "整改已提交", "record_id": record.id}


@router.post("/{hazard_id}/review")
def review_rectification(
    hazard_id: str,
    request: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hazard = db.query(Hazard).filter(Hazard.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=404, detail="隐患不存在")
    
    if request.result == "pass":
        hazard.status = "closed"
        hazard.closed_at = datetime.utcnow()
    elif request.result == "reject":
        hazard.status = "in_progress"
        if request.reason and hazard.reject_reasons:
            hazard.reject_reasons = hazard.reject_reasons + [request.reason]
        elif request.reason:
            hazard.reject_reasons = [request.reason]
    else:
        raise HTTPException(status_code=400, detail="result 只能是 pass 或 reject")
    
    latest_record = db.query(RectificationRecord).filter(RectificationRecord.hazard_id == hazard_id).order_by(RectificationRecord.created_at.desc()).first()
    if latest_record:
        latest_record.review_result = request.result
        latest_record.review_reason = request.reason
        latest_record.reviewed_by = current_user.full_name
        latest_record.reviewed_at = datetime.utcnow()
    
    db.commit()
    return {"message": "复查完成", "hazard_id": hazard_id, "status": hazard.status}


@router.post("/{hazard_id}/appeal")
def submit_appeal(
    hazard_id: str,
    request: AppealRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hazard = db.query(Hazard).filter(Hazard.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=404, detail="隐患不存在")
    
    appeal = AppealRecord(
        hazard_id=hazard_id,
        reason=request.reason,
        status="pending",
    )
    db.add(appeal)
    db.commit()
    
    return {"message": "申诉已提交", "appeal_id": appeal.id}


@router.get("/{hazard_id}/weather-evidence", response_model=List[WeatherRecord])
def get_weather_evidence(
    hazard_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not start_date:
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    result = []
    current = start
    while current <= end:
        result.append(WeatherRecord(
            date=current.strftime("%Y-%m-%d"),
            weather="晴",
            temperature="25°C",
            wind_speed="3级",
            is_workable=True,
        ))
        current += timedelta(days=1)
    
    return result


@router.get("/{hazard_id}/stop-work-evidence", response_model=List[StopWorkRecord])
def get_stop_work_evidence(
    hazard_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return []
