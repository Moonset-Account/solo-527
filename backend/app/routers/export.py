from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from app.database import get_db
from app.models import User, ExportRecord
from app.schemas import ExportRequest, ExportRecordResponse
from app.utils.permissions import get_current_user
from app.tasks import generate_export
from app.config import settings

router = APIRouter(prefix="/api/export", tags=["export"])


@router.post("/", response_model=ExportRecordResponse, status_code=status.HTTP_201_CREATED)
async def trigger_export(
    export_req: ExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    record = ExportRecord(
        operator_id=current_user.id,
        export_type=export_req.export_type,
        filter_params=export_req.filter_params,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    try:
        generate_export.delay(export_id=record.id, filter_params=export_req.filter_params or {})
    except Exception:
        pass

    return record


@router.get("/{export_id}", response_model=ExportRecordResponse)
async def get_export_status(
    export_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    record = db.query(ExportRecord).filter(ExportRecord.id == export_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export record not found")

    return record


@router.get("/{export_id}/download")
async def download_export(
    export_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    record = db.query(ExportRecord).filter(ExportRecord.id == export_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export record not found")

    if not record.file_path or not os.path.exists(record.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Export file not found or not ready")

    filename = os.path.basename(record.file_path)
    return FileResponse(
        path=record.file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/", response_model=list[ExportRecordResponse])
async def list_exports(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("staff", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")

    return db.query(ExportRecord).order_by(ExportRecord.created_at.desc()).offset(skip).limit(limit).all()
