from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from io import BytesIO

from backend.db.database import get_db
from backend.api.analytics_service import AnalyticsService
from backend.export.export_service import ExportService

router = APIRouter(prefix="/api", tags=["analytics"])

class FilterParams(BaseModel):
    member_type_ids: Optional[List[int]] = None
    store_ids: Optional[List[int]] = None
    coach_ids: Optional[List[int]] = None
    course_ids: Optional[List[int]] = None
    month: Optional[str] = None

@router.get("/filters/options")
def get_filter_options(db: Session = Depends(get_db)):
    service = AnalyticsService(db)
    return service.get_filters_options()

@router.get("/anomaly-summary")
def get_anomaly_summary(
    member_type_ids: Optional[List[int]] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    coach_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    filters = {
        "member_type_ids": member_type_ids,
        "store_ids": store_ids,
        "coach_ids": coach_ids
    }
    service = AnalyticsService(db)
    return service.get_anomaly_summary(filters)

@router.get("/retention-cohort")
def get_retention_cohort(
    member_type_ids: Optional[List[int]] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    coach_ids: Optional[List[int]] = Query(None),
    months: int = Query(6, ge=3, le=12),
    db: Session = Depends(get_db)
):
    filters = {
        "member_type_ids": member_type_ids,
        "store_ids": store_ids,
        "coach_ids": coach_ids
    }
    service = AnalyticsService(db)
    return service.get_retention_cohort(filters, months)

@router.get("/course-heatmap")
def get_course_heatmap(
    store_ids: Optional[List[int]] = Query(None),
    coach_ids: Optional[List[int]] = Query(None),
    course_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    filters = {
        "store_ids": store_ids,
        "coach_ids": coach_ids,
        "course_ids": course_ids
    }
    service = AnalyticsService(db)
    return service.get_course_heatmap(filters)

@router.get("/coach-load")
def get_coach_load(
    store_ids: Optional[List[int]] = Query(None),
    coach_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    filters = {
        "store_ids": store_ids,
        "coach_ids": coach_ids
    }
    service = AnalyticsService(db)
    return service.get_coach_load(filters)

@router.get("/churn-warning")
def get_churn_warning(
    member_type_ids: Optional[List[int]] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    coach_ids: Optional[List[int]] = Query(None),
    limit: int = Query(100, ge=10, le=500),
    db: Session = Depends(get_db)
):
    filters = {
        "member_type_ids": member_type_ids,
        "store_ids": store_ids,
        "coach_ids": coach_ids
    }
    service = AnalyticsService(db)
    return service.get_churn_warning_list(filters, limit)

@router.get("/export/cohort")
def export_cohort(
    member_type_ids: Optional[List[int]] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    coach_ids: Optional[List[int]] = Query(None),
    months: int = Query(6, ge=3, le=12),
    db: Session = Depends(get_db)
):
    filters = {
        "member_type_ids": member_type_ids,
        "store_ids": store_ids,
        "coach_ids": coach_ids
    }
    service = AnalyticsService(db)
    data = service.get_retention_cohort(filters, months)
    
    output = ExportService.export_cohort_analysis(data.get("cohort_data", []))
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=cohort_analysis.xlsx"}
    )

@router.get("/export/churn-warning")
def export_churn_warning(
    member_type_ids: Optional[List[int]] = Query(None),
    store_ids: Optional[List[int]] = Query(None),
    coach_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    filters = {
        "member_type_ids": member_type_ids,
        "store_ids": store_ids,
        "coach_ids": coach_ids
    }
    service = AnalyticsService(db)
    data = service.get_churn_warning_list(filters, limit=500)
    
    output = ExportService.export_churn_warning(data.get("members", []))
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=churn_warning.xlsx"}
    )

@router.get("/export/coach-load")
def export_coach_load(
    store_ids: Optional[List[int]] = Query(None),
    coach_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db)
):
    filters = {
        "store_ids": store_ids,
        "coach_ids": coach_ids
    }
    service = AnalyticsService(db)
    data = service.get_coach_load(filters)
    
    output = ExportService.export_coach_load(data.get("coaches", []))
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=coach_load.xlsx"}
    )
