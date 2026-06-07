from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import Optional, List

from app.core.database import get_db
from app.models import Hazard, Team, InspectionPoint, Fine
from app.schemas import (
    DashboardStats,
    ClosureRateTrendItem,
    OverdueRankingItem,
    FloorHeatmapItem,
    TeamTrendItem,
)

router = APIRouter(prefix="/dashboard", tags=["看板数据"])


def apply_filters(query, db: Session, floors=None, team_ids=None, type_ids=None, levels=None):
    if floors:
        query = query.filter(Hazard.inspection_point_floor.in_(floors))
    if team_ids:
        query = query.filter(Hazard.team_id.in_(team_ids))
    if type_ids:
        query = query.filter(Hazard.type_id.in_(type_ids))
    if levels:
        query = query.filter(Hazard.level.in_(levels))
    return query


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
    query = apply_filters(query, db, floors, team_ids, type_ids, levels)
    
    if statuses:
        query = query.filter(Hazard.status.in_(statuses))
    if keyword:
        query = query.filter(Hazard.title.ilike(f"%{keyword}%"))
    if start_date:
        query = query.filter(Hazard.discovered_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Hazard.discovered_at <= datetime.fromisoformat(end_date))
    
    hazards = query.all()
    
    total = len(hazards)
    pending = sum(1 for h in hazards if h.status == 'pending')
    in_progress = sum(1 for h in hazards if h.status == 'in_progress')
    under_review = sum(1 for h in hazards if h.status == 'under_review')
    closed = sum(1 for h in hazards if h.status == 'closed')
    
    now = datetime.utcnow()
    overdue = sum(1 for h in hazards if h.is_overdue)
    
    closure_rate = round((closed / total * 100)) if total > 0 else 0
    overdue_rate = round((overdue / total * 100)) if total > 0 else 0
    
    confirmed_fines = sum(float(h.fine_amount or 0) for h in hazards if h.fine_status == 'confirmed')
    pending_fines = sum(float(h.fine_amount or 0) for h in hazards if h.fine_status == 'pending')
    
    return DashboardStats(
        total=total,
        pending=pending,
        in_progress=in_progress,
        under_review=under_review,
        closed=closed,
        overdue=overdue,
        closure_rate=closure_rate,
        overdue_rate=overdue_rate,
        total_confirmed_fine=confirmed_fines,
        total_pending_fine=pending_fines,
    )


@router.get("/closure-rate-trend", response_model=List[ClosureRateTrendItem])
def get_closure_rate_trend(
    days: int = Query(14, ge=1, le=60),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    floors: Optional[List[int]] = Query(None),
    team_ids: Optional[List[str]] = Query(None),
    type_ids: Optional[List[str]] = Query(None),
    levels: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    result = []
    base_date = datetime.utcnow().date()
    
    for i in range(days - 1, -1, -1):
        current_date = base_date - timedelta(days=i)
        date_str = current_date.strftime("%m-%d")
        
        query = db.query(Hazard)
        query = apply_filters(query, db, floors, team_ids, type_ids, levels)
        
        start_dt = datetime.combine(current_date, datetime.min.time())
        end_dt = datetime.combine(current_date, datetime.max.time())
        
        if start_date:
            query = query.filter(Hazard.discovered_at >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Hazard.discovered_at <= datetime.fromisoformat(end_date))
        
        new_hazards = query.filter(
            Hazard.discovered_at >= start_dt,
            Hazard.discovered_at <= end_dt,
        ).count()
        
        closed_hazards = query.filter(
            Hazard.closed_at >= start_dt,
            Hazard.closed_at <= end_dt,
            Hazard.status == 'closed',
        ).count()
        
        cumulative_query = db.query(Hazard)
        cumulative_query = apply_filters(cumulative_query, db, floors, team_ids, type_ids, levels)
        if start_date:
            cumulative_query = cumulative_query.filter(Hazard.discovered_at >= datetime.fromisoformat(start_date))
        if end_date:
            cumulative_query = cumulative_query.filter(Hazard.discovered_at <= datetime.fromisoformat(end_date))
        
        cumulative_before = cumulative_query.filter(Hazard.discovered_at <= end_dt).all()
        total_before = len(cumulative_before)
        closed_before = sum(1 for h in cumulative_before if h.status == 'closed' and h.closed_at and h.closed_at <= end_dt)
        rate = round((closed_before / total_before * 100), 1) if total_before > 0 else 0
        
        result.append(ClosureRateTrendItem(
            date=date_str,
            new_hazards=new_hazards,
            closed_hazards=closed_hazards,
            closure_rate=rate,
        ))
    
    return result


@router.get("/overdue-ranking", response_model=List[OverdueRankingItem])
def get_overdue_ranking(
    limit: int = Query(10, ge=1, le=50),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    floors: Optional[List[int]] = Query(None),
    team_ids: Optional[List[str]] = Query(None),
    type_ids: Optional[List[str]] = Query(None),
    levels: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Hazard).filter(Hazard.status != 'closed')
    query = apply_filters(query, db, floors, team_ids, type_ids, levels)
    
    if start_date:
        query = query.filter(Hazard.discovered_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Hazard.discovered_at <= datetime.fromisoformat(end_date))
    
    now = datetime.utcnow()
    hazards = query.filter(Hazard.deadline < now).all()
    
    team_counts = {}
    for h in hazards:
        team_id = h.team_id or 'unknown'
        team_name = h.team_name or '未分配'
        if team_id not in team_counts:
            team_counts[team_id] = {'team_id': team_id, 'team_name': team_name, 'overdue_count': 0}
        team_counts[team_id]['overdue_count'] += 1
    
    ranking = sorted(team_counts.values(), key=lambda x: x['overdue_count'], reverse=True)[:limit]
    return [OverdueRankingItem(**item) for item in ranking]


@router.get("/floor-heatmap", response_model=List[FloorHeatmapItem])
def get_floor_heatmap(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    floors: Optional[List[int]] = Query(None),
    team_ids: Optional[List[str]] = Query(None),
    type_ids: Optional[List[str]] = Query(None),
    levels: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Hazard)
    query = apply_filters(query, db, floors, team_ids, type_ids, levels)
    
    if start_date:
        query = query.filter(Hazard.discovered_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Hazard.discovered_at <= datetime.fromisoformat(end_date))
    
    hazards = query.all()
    
    floor_data = {}
    for h in hazards:
        floor = h.inspection_point_floor or 0
        if floor not in floor_data:
            floor_data[floor] = {
                'floor': floor,
                'hazard_count': 0,
                'level_1_count': 0,
                'level_2_count': 0,
                'level_3_count': 0,
            }
        
        floor_data[floor]['hazard_count'] += 1
        
        if h.level == 'low':
            floor_data[floor]['level_1_count'] += 1
        elif h.level == 'medium':
            floor_data[floor]['level_2_count'] += 1
        else:
            floor_data[floor]['level_3_count'] += 1
    
    result = sorted(floor_data.values(), key=lambda x: x['floor'])
    return [FloorHeatmapItem(**item) for item in result]


@router.get("/team-trend", response_model=List[TeamTrendItem])
def get_team_trend(
    days: int = Query(7, ge=1, le=30),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    floors: Optional[List[int]] = Query(None),
    team_ids: Optional[List[str]] = Query(None),
    type_ids: Optional[List[str]] = Query(None),
    levels: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    result = []
    base_date = datetime.utcnow().date()
    
    teams_query = db.query(Team).filter(Team.is_active == True)
    if team_ids:
        teams_query = teams_query.filter(Team.id.in_(team_ids))
    teams = teams_query.all()
    
    for i in range(days - 1, -1, -1):
        current_date = base_date - timedelta(days=i)
        date_str = current_date.strftime("%m-%d")
        
        start_dt = datetime.combine(current_date, datetime.min.time())
        end_dt = datetime.combine(current_date, datetime.max.time())
        
        for team in teams:
            query = db.query(Hazard).filter(Hazard.team_id == team.id)
            query = apply_filters(query, db, floors, None, type_ids, levels)
            
            if start_date:
                query = query.filter(Hazard.discovered_at >= datetime.fromisoformat(start_date))
            if end_date:
                query = query.filter(Hazard.discovered_at <= datetime.fromisoformat(end_date))
            
            total_count = query.filter(
                Hazard.discovered_at >= start_dt,
                Hazard.discovered_at <= end_dt,
            ).count()
            
            closed_count = query.filter(
                Hazard.closed_at >= start_dt,
                Hazard.closed_at <= end_dt,
                Hazard.status == 'closed',
            ).count()
            
            if total_count > 0 or closed_count > 0 or True:
                result.append({
                    "date": date_str,
                    "team_id": team.id,
                    "team_name": team.name,
                    "hazard_count": total_count,
                    "completed_count": closed_count,
                })
    
    return result
