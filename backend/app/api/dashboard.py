from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from app.core.database import get_db
from app.models.schemas import (
    DashboardStats,
    ClosureRateTrendItem,
    OverdueRankingItem,
    FloorHeatmapItem,
    TeamTrendItem,
    FilterCriteria,
)
from app.models.models import Hazard, Team, InspectionPoint

router = APIRouter(prefix="/dashboard", tags=["看板数据"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    floors: Optional[List[int]] = Query(None),
    team_ids: Optional[List[str]] = Query(None),
    type_ids: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
    levels: Optional[List[str]] = Query(None),
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
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
    
    hazards = query.all()
    
    total = len(hazards)
    pending = sum(1 for h in hazards if h.status == 'pending')
    in_progress = sum(1 for h in hazards if h.status == 'in_progress')
    under_review = sum(1 for h in hazards if h.status == 'under_review')
    closed = sum(1 for h in hazards if h.status == 'closed')
    
    now = datetime.utcnow()
    overdue = sum(1 for h in hazards if h.deadline < now and h.status != 'closed')
    
    closure_rate = (closed / total * 100) if total > 0 else 0
    overdue_rate = (overdue / total * 100) if total > 0 else 0
    
    confirmed_fines = sum(float(h.fine_amount or 0) for h in hazards if h.fine_status == 'confirmed')
    pending_fines = sum(float(h.fine_amount or 0) for h in hazards if h.fine_status == 'pending')
    
    return DashboardStats(
        total=total,
        pending=pending,
        in_progress=in_progress,
        under_review=under_review,
        closed=closed,
        overdue=overdue,
        closure_rate=round(closure_rate, 1),
        overdue_rate=round(overdue_rate, 1),
        total_confirmed_fine=confirmed_fines,
        total_pending_fine=pending_fines,
    )


@router.get("/closure-rate-trend", response_model=List[ClosureRateTrendItem])
def get_closure_rate_trend(
    days: int = Query(14, ge=1, le=60),
    db: Session = Depends(get_db),
):
    result = []
    base_date = datetime.utcnow().date()
    
    for i in range(days - 1, -1, -1):
        date = base_date - timedelta(days=i)
        date_str = date.strftime("%m-%d")
        
        day_start = datetime.combine(date, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        
        total = db.query(Hazard).filter(Hazard.created_at < day_end).count()
        closed = db.query(Hazard).filter(
            Hazard.status == 'closed',
            Hazard.closed_at >= day_start,
            Hazard.closed_at < day_end,
        ).count()
        
        rate = (closed / total * 100) if total > 0 else 0
        
        result.append(ClosureRateTrendItem(
            date=date_str,
            rate=round(rate, 1),
            closed=closed,
            total=total,
        ))
    
    return result


@router.get("/overdue-ranking", response_model=List[OverdueRankingItem])
def get_overdue_ranking(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    teams = db.query(Team).all()
    now = datetime.utcnow()
    
    result = []
    for team in teams:
        team_hazards = db.query(Hazard).filter(
            Hazard.team_id == team.id,
            Hazard.deadline < now,
            Hazard.status != 'closed',
        ).all()
        
        count = len(team_hazards)
        amount = sum(float(h.fine_amount or 0) for h in team_hazards)
        
        result.append(OverdueRankingItem(
            team_id=team.id,
            team_name=team.name,
            count=count,
            amount=amount,
        ))
    
    result.sort(key=lambda x: x.count, reverse=True)
    return result[:limit]


@router.get("/floor-heatmap", response_model=List[FloorHeatmapItem])
def get_floor_heatmap(
    db: Session = Depends(get_db),
):
    points = db.query(InspectionPoint).all()
    floor_data = {}
    
    for point in points:
        if point.floor not in floor_data:
            floor_data[point.floor] = {'count': 0, 'points': {}}
        
        hazard_count = db.query(Hazard).filter(
            Hazard.inspection_point_id == point.id
        ).count()
        
        floor_data[point.floor]['count'] += hazard_count
        floor_data[point.floor]['points'][point.name] = hazard_count
    
    result = []
    for floor, data in sorted(floor_data.items()):
        result.append(FloorHeatmapItem(
            floor=floor,
            count=data['count'],
            points=[{'name': name, 'count': cnt} for name, cnt in data['points'].items()],
        ))
    
    return result


@router.get("/team-trend", response_model=List[TeamTrendItem])
def get_team_trend(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
):
    teams = db.query(Team).limit(4).all()
    base_date = datetime.utcnow().date()
    result = []
    
    for team in teams:
        for i in range(days - 1, -1, -1):
            date = base_date - timedelta(days=i)
            date_str = date.strftime("%m-%d")
            
            day_start = datetime.combine(date, datetime.min.time())
            day_end = day_start + timedelta(days=1)
            
            total = db.query(Hazard).filter(
                Hazard.team_id == team.id,
                Hazard.created_at < day_end,
            ).count()
            
            completed = db.query(Hazard).filter(
                Hazard.team_id == team.id,
                Hazard.status == 'closed',
                Hazard.closed_at >= day_start,
                Hazard.closed_at < day_end,
            ).count()
            
            result.append(TeamTrendItem(
                team=team.name,
                team_id=team.id,
                date=date_str,
                completed=completed,
                total=total,
            ))
    
    return result
