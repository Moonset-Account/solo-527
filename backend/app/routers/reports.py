from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import Optional, Dict, Any
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles
from app.tasks import export_report
import os

router = APIRouter(prefix="/reports", tags=["报表导出"])


@router.get("", response_model=dict)
async def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    report_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.ReportExport).options(
        joinedload(models.ReportExport.generator)
    )
    if report_type:
        query = query.filter(models.ReportExport.report_type == report_type)
    if status:
        query = query.filter(models.ReportExport.status == status)
    total = query.count()
    items = query.order_by(models.ReportExport.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.ReportExportResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("", response_model=schemas.ReportExportResponse)
async def create_report(
    data: schemas.ReportExportBase,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "manager", "purchaser", "warehouse"))
):
    report = models.ReportExport(
        **data.model_dump(),
        generated_by=current_user.id
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    export_report.delay(report.id)
    return report


@router.get("/{report_id}/download")
async def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    report = db.query(models.ReportExport).filter(
        models.ReportExport.id == report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="报表不存在")
    if report.status != "completed":
        raise HTTPException(status_code=400, detail=f"报表状态: {report.status}，暂不可下载")
    if not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(
        path=report.file_path,
        filename=f"{report.report_name}_{report.id}.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@router.get("/stock-abnormal", response_model=dict)
async def get_stock_abnormal_report(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from sqlalchemy import func, and_
    from datetime import date, timedelta

    query = db.query(
        models.AbnormalRecord,
        models.Batch,
        models.Medicine
    ).outerjoin(
        models.Batch, models.AbnormalRecord.batch_id == models.Batch.id
    ).outerjoin(
        models.Medicine, 
        or_(models.AbnormalRecord.medicine_id == models.Medicine.id,
            models.Batch.medicine_id == models.Medicine.id)
    )
    total = query.count()
    results = query.order_by(models.AbnormalRecord.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    items = []
    for rec, batch, med in results:
        items.append({
            "id": rec.id,
            "abnormal_type": rec.abnormal_type,
            "description": rec.description,
            "status": rec.status.value if rec.status else None,
            "severity": rec.severity.value if rec.severity else None,
            "medicine_name": med.name if med else None,
            "batch_no": batch.batch_no if batch else None,
            "found_at": rec.found_at,
            "handled_at": rec.handled_at,
            "handle_duration_minutes": rec.handle_duration_minutes,
            "handler_name": None
        })
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }
