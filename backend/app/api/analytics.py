from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.schemas import (
    FilterParams, ChartDataResponse, DashboardOverview,
    SavedViewCreate, SavedViewResponse, ReportExportRequest
)
from app.services.analytics_service import (
    get_overview_stats, get_reason_tree, get_cycle_distribution,
    get_product_ranking, get_service_duration_stats,
    get_dimension_stats, get_dimension_options
)
from app.models import SavedView
import json
from datetime import datetime

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/options")
def get_filter_options(db: Session = Depends(get_db)):
    return get_dimension_options(db)


@router.post("/dashboard", response_model=ChartDataResponse)
def get_dashboard_data(filters: FilterParams, db: Session = Depends(get_db)):
    filter_dict = filters.model_dump(exclude_none=True)

    overview = get_overview_stats(db, filter_dict)
    reason_tree = get_reason_tree(db, filter_dict)
    cycle_dist = get_cycle_distribution(db, filter_dict)
    product_rank = get_product_ranking(db, filter_dict)
    service_dur = get_service_duration_stats(db, filter_dict)
    dim_stats = get_dimension_stats(db, filter_dict)

    return ChartDataResponse(
        overview=DashboardOverview(**overview),
        reason_tree=reason_tree,
        cycle_distribution=cycle_dist,
        product_ranking=product_rank,
        service_duration=service_dur,
        dimension_stats=dim_stats,
        applied_filters=filter_dict
    )


@router.get("/views", response_model=List[SavedViewResponse])
def get_saved_views(
    user_id: int = Query(1),
    include_public: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(SavedView).filter(
        (SavedView.user_id == user_id) | (SavedView.is_public == True)
    )
    views = query.order_by(SavedView.updated_at.desc()).all()
    result = []
    for v in views:
        try:
            filters = json.loads(v.filters) if v.filters else {}
        except:
            filters = {}
        result.append(SavedViewResponse(
            id=v.id,
            name=v.name,
            filters=filters,
            created_at=v.created_at,
            updated_at=v.updated_at,
            is_public=v.is_public
        ))
    return result


@router.post("/views", response_model=SavedViewResponse)
def create_saved_view(
    view_data: SavedViewCreate,
    user_id: int = Query(1),
    db: Session = Depends(get_db)
):
    db_view = SavedView(
        name=view_data.name,
        user_id=user_id,
        filters=json.dumps(view_data.filters),
        is_public=view_data.is_public
    )
    db.add(db_view)
    db.commit()
    db.refresh(db_view)
    return SavedViewResponse(
        id=db_view.id,
        name=db_view.name,
        filters=json.loads(db_view.filters),
        created_at=db_view.created_at,
        updated_at=db_view.updated_at,
        is_public=db_view.is_public
    )


@router.delete("/views/{view_id}")
def delete_saved_view(
    view_id: int,
    user_id: int = Query(1),
    db: Session = Depends(get_db)
):
    view = db.query(SavedView).filter(
        SavedView.id == view_id,
        SavedView.user_id == user_id
    ).first()
    if not view:
        raise HTTPException(status_code=404, detail="视图不存在")
    db.delete(view)
    db.commit()
    return {"success": True}
