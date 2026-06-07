from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
import io
import csv

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import Attachment, User, Hazard, Team, HazardType, InspectionPoint, Fine

router = APIRouter(prefix="/export", tags=["附件与导出"])


@router.get("/attachments/{attachment_id}")
def get_attachment(
    attachment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")
    
    if attachment.sensitive and current_user.role not in ["director", "admin"]:
        raise HTTPException(status_code=403, detail="无权限查看敏感附件")
    
    return {
        "id": attachment.id,
        "name": attachment.name,
        "url": attachment.url,
        "type": attachment.type,
        "sensitive": attachment.sensitive,
        "created_at": attachment.created_at,
    }


@router.get("/hazards")
def export_hazards(
    format: str = Query("csv", description="导出格式: csv"),
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
    if levels:
        query = query.filter(Hazard.level.in_(levels))
    if statuses:
        query = query.filter(Hazard.status.in_(statuses))
    if keyword:
        query = query.filter(Hazard.title.ilike(f"%{keyword}%"))
    if start_date:
        query = query.filter(Hazard.discovered_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Hazard.discovered_at <= datetime.fromisoformat(end_date))
    
    hazards = query.order_by(Hazard.discovered_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "隐患编号", "标题", "描述", "等级", "状态", "是否逾期",
        "发现时间", "整改期限", "责任班组", "隐患类型",
        "巡检点", "楼层", "罚款金额", "罚款状态", "发现人"
    ])
    
    for h in hazards:
        writer.writerow([
            h.code or h.id,
            h.title,
            h.description or "",
            h.level,
            h.status,
            "是" if h.is_overdue else "否",
            h.discovered_at.strftime("%Y-%m-%d %H:%M") if h.discovered_at else "",
            h.deadline.strftime("%Y-%m-%d %H:%M") if h.deadline else "",
            h.team_name or "",
            h.type_name or "",
            h.inspection_point_name or "",
            h.inspection_point_floor or "",
            float(h.fine_amount or 0),
            h.fine_status or "",
            h.discoverer_name or "",
        ])
    
    output.seek(0)
    content = output.getvalue()
    
    return StreamingResponse(
        iter([content]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=hazards_{datetime.now().strftime('%Y%m%d')}.csv"
        },
    )


@router.get("/fines")
def export_fines(
    format: str = Query("csv", description="导出格式: csv"),
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    team_ids: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    
    fines = query.order_by(Fine.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "罚款编号", "关联隐患", "责任班组", "罚款金额", "罚款原因",
        "状态", "创建时间", "确认时间"
    ])
    
    for f in fines:
        writer.writerow([
            f.id,
            f.hazard_id,
            f.team_name or "",
            float(f.amount),
            f.reason or "",
            f.status,
            f.created_at.strftime("%Y-%m-%d %H:%M") if f.created_at else "",
            f.confirmed_at.strftime("%Y-%m-%d %H:%M") if f.confirmed_at else "",
        ])
    
    output.seek(0)
    content = output.getvalue()
    
    return StreamingResponse(
        iter([content]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=fines_{datetime.now().strftime('%Y%m%d')}.csv"
        },
    )
