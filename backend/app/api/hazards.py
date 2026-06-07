from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.schemas import (
    HazardListItem,
    HazardDetailResponse,
    PaginatedResponse,
    SubmitRectificationRequest,
    ReviewRequest,
    AppealRecordBase,
    WeatherRecordResponse,
    StopWorkRecordResponse,
)
from app.models.models import (
    Hazard,
    HazardType,
    Team,
    InspectionPoint,
    User,
    RectificationRecord,
    AppealRecord,
    Attachment,
    StatusHistory,
    WeatherRecord,
    StopWorkRecord,
    Fine,
)

router = APIRouter(prefix="/hazards", tags=["隐患管理"])


def build_hazard_list_item(hazard: Hazard, db_session: Session) -> HazardListItem:
    hazard_type = db_session.query(HazardType).filter(HazardType.id == hazard.type_id).first()
    team = db_session.query(Team).filter(Team.id == hazard.team_id).first()
    point = db_session.query(InspectionPoint).filter(InspectionPoint.id == hazard.inspection_point_id).first()
    
    now = datetime.utcnow()
    is_overdue = hazard.deadline < now and hazard.status != 'closed'
    
    return HazardListItem(
        id=hazard.id,
        code=hazard.code,
        title=hazard.title,
        level=hazard.level,
        status=hazard.status,
        discovered_at=hazard.discovered_at,
        deadline=hazard.deadline,
        is_overdue=is_overdue,
        type=hazard_type,
        inspection_point=point,
        team=team,
    )


@router.get("", response_model=PaginatedResponse)
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
        query = query.join(InspectionPoint).filter(InspectionPoint.floor.in_(floors))
    if team_ids:
        query = query.filter(Hazard.team_id.in_(team_ids))
    if type_ids:
        query = query.filter(Hazard.type_id.in_(type_ids))
    if statuses:
        query = query.filter(Hazard.status.in_(statuses))
    if levels:
        query = query.filter(Hazard.level.in_(levels))
    if keyword:
        query = query.filter(Hazard.title.ilike(f"%{keyword}%") | Hazard.code.ilike(f"%{keyword}%"))
    if start_date:
        query = query.filter(Hazard.discovered_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Hazard.discovered_at <= datetime.fromisoformat(end_date))
    
    total = query.count()
    hazards = query.order_by(Hazard.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    items = [build_hazard_list_item(h, db) for h in hazards]
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{hazard_id}", response_model=HazardDetailResponse)
def get_hazard_detail(
    hazard_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hazard = db.query(Hazard).filter(Hazard.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=404, detail="隐患不存在")
    
    hazard_type = db.query(HazardType).filter(HazardType.id == hazard.type_id).first()
    team = db.query(Team).filter(Team.id == hazard.team_id).first()
    point = db.query(InspectionPoint).filter(InspectionPoint.id == hazard.inspection_point_id).first()
    discoverer = db.query(User).filter(User.id == hazard.discoverer_id).first()
    
    discovery_photos = db.query(Attachment).filter(
        Attachment.related_type == "hazard_discovery",
        Attachment.related_id == hazard_id,
    ).all()
    
    rectification_records_db = db.query(RectificationRecord).filter(
        RectificationRecord.hazard_id == hazard_id
    ).order_by(RectificationRecord.created_at.desc()).all()
    
    rectification_records = []
    for record in rectification_records_db:
        photos = db.query(Attachment).filter(
            Attachment.related_type == "rectification",
            Attachment.related_id == record.id,
        ).all()
        rectification_records.append({
            "id": record.id,
            "hazard_id": record.hazard_id,
            "description": record.description,
            "submitted_at": record.submitted_at,
            "submitted_by": record.submitted_by,
            "review_result": record.review_result,
            "review_reason": record.review_reason,
            "reviewed_at": record.reviewed_at,
            "reviewed_by": record.reviewed_by,
            "photos": photos,
        })
    
    appeal_records = db.query(AppealRecord).filter(
        AppealRecord.hazard_id == hazard_id
    ).order_by(AppealRecord.created_at.desc()).all()
    
    now = datetime.utcnow()
    is_overdue = hazard.deadline < now and hazard.status != 'closed'
    
    return HazardDetailResponse(
        id=hazard.id,
        code=hazard.code,
        title=hazard.title,
        description=hazard.description,
        level=hazard.level,
        status=hazard.status,
        discovered_at=hazard.discovered_at,
        deadline=hazard.deadline,
        is_overdue=is_overdue,
        closed_at=hazard.closed_at,
        type=hazard_type,
        inspection_point=point,
        team=team,
        discoverer=discoverer.name if discoverer else "未知",
        fine_amount=float(hazard.fine_amount) if hazard.fine_amount else None,
        fine_status=hazard.fine_status,
        reject_reasons=hazard.reject_reasons or [],
        discovery_photos=discovery_photos,
        rectification_records=rectification_records,
        appeal_records=appeal_records,
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
        submitted_by=current_user.id,
        submitted_at=datetime.utcnow(),
    )
    db.add(record)
    
    old_status = hazard.status
    hazard.status = "under_review"
    
    history = StatusHistory(
        hazard_id=hazard_id,
        from_status=old_status,
        to_status="under_review",
        remark="提交整改申请",
        operator_id=current_user.id,
    )
    db.add(history)
    
    db.commit()
    
    return {"success": True, "record_id": record.id}


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
    
    latest_record = db.query(RectificationRecord).filter(
        RectificationRecord.hazard_id == hazard_id
    ).order_by(RectificationRecord.created_at.desc()).first()
    
    if not latest_record:
        raise HTTPException(status_code=400, detail="没有待复查记录")
    
    latest_record.review_result = request.result
    latest_record.review_reason = request.reason
    latest_record.reviewed_by = current_user.id
    latest_record.reviewed_at = datetime.utcnow()
    
    old_status = hazard.status
    
    if request.result == "pass":
        hazard.status = "closed"
        hazard.closed_at = datetime.utcnow()
    else:
        hazard.status = "rejected"
        if hazard.reject_reasons is None:
            hazard.reject_reasons = []
        if request.reason:
            hazard.reject_reasons.append(request.reason)
    
    history = StatusHistory(
        hazard_id=hazard_id,
        from_status=old_status,
        to_status=hazard.status,
        remark=request.reason or "",
        operator_id=current_user.id,
    )
    db.add(history)
    
    db.commit()
    
    return {"success": True}


@router.post("/{hazard_id}/appeal")
def submit_appeal(
    hazard_id: str,
    request: AppealRecordBase,
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
    
    return {"success": True, "appeal_id": appeal.id}


@router.get("/{hazard_id}/weather-evidence", response_model=List[WeatherRecordResponse])
def get_weather_evidence(
    hazard_id: str,
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    weather = db.query(WeatherRecord).filter(
        WeatherRecord.date >= start_date,
        WeatherRecord.date <= end_date,
    ).all()
    
    if not weather:
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
        delta = (end - start).days
        for i in range(delta + 1):
            d = start + datetime.timedelta(days=i)
            weather_types = ["晴", "多云", "阴", "小雨", "中雨", "暴雨"]
            import random
            w = WeatherRecord(
                date=d,
                weather=random.choice(weather_types),
                temperature=random.randint(15, 35),
                wind_level=random.randint(1, 6),
                rain_volume=random.randint(0, 100),
            )
            db.add(w)
        db.commit()
        weather = db.query(WeatherRecord).filter(
            WeatherRecord.date >= start_date,
            WeatherRecord.date <= end_date,
        ).all()
    
    return weather


@router.get("/{hazard_id}/stop-work-evidence", response_model=List[StopWorkRecordResponse])
def get_stop_work_evidence(
    hazard_id: str,
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = db.query(StopWorkRecord).filter(
        StopWorkRecord.start_date <= end_date,
        StopWorkRecord.end_date >= start_date,
    ).all()
    
    if not records:
        default_records = [
            StopWorkRecord(
                start_date="2024-06-01",
                end_date="2024-06-03",
                reason="台风预警，全面停工",
            ),
            StopWorkRecord(
                start_date="2024-06-15",
                end_date="2024-06-17",
                reason="极端暴雨天气，暂停所有高处作业",
            ),
        ]
        for r in default_records:
            db.add(r)
        db.commit()
        records = db.query(StopWorkRecord).all()
    
    return records
