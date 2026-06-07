from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
import io
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.schemas import AttachmentResponse
from app.models.models import Attachment, User, Hazard, Team, HazardType, InspectionPoint, Fine

router = APIRouter(tags=["附件与导出"])


@router.get("/attachments/{attachment_id}", response_model=AttachmentResponse)
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
    
    return attachment


@router.post("/attachments/upload", response_model=AttachmentResponse)
async def upload_attachment(
    file: UploadFile = File(...),
    related_type: str = Query(...),
    related_id: str = Query(...),
    sensitive: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attachment = Attachment(
        name=file.filename or "unknown",
        url=f"/uploads/{file.filename}",
        type="image" if file.content_type and file.content_type.startswith("image") else "document",
        related_type=related_type,
        related_id=related_id,
        sensitive=sensitive,
        uploaded_by=current_user.id,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return attachment


@router.get("/export/hazards")
def export_hazards(
    format: str = Query("csv", regex="^(csv|xlsx)$"),
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
    
    hazards = query.order_by(Hazard.created_at.desc()).all()
    
    rows = []
    for h in hazards:
        hazard_type = db.query(HazardType).filter(HazardType.id == h.type_id).first()
        team = db.query(Team).filter(Team.id == h.team_id).first()
        point = db.query(InspectionPoint).filter(InspectionPoint.id == h.inspection_point_id).first()
        
        rows.append({
            "隐患编号": h.code,
            "标题": h.title,
            "描述": h.description or "",
            "类型": hazard_type.name if hazard_type else "",
            "等级": h.level,
            "楼层": point.floor if point else "",
            "巡检点": point.name if point else "",
            "责任班组": team.name if team else "",
            "状态": h.status,
            "发现人": h.discoverer_id,
            "发现时间": h.discovered_at.strftime("%Y-%m-%d %H:%M:%S") if h.discovered_at else "",
            "截止时间": h.deadline.strftime("%Y-%m-%d %H:%M:%S") if h.deadline else "",
            "关闭时间": h.closed_at.strftime("%Y-%m-%d %H:%M:%S") if h.closed_at else "",
            "罚款金额": float(h.fine_amount) if h.fine_amount else 0,
            "罚款状态": h.fine_status or "",
        })
    
    import csv
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys() if rows else [])
    writer.writeheader()
    writer.writerows(rows)
    
    content = output.getvalue()
    
    return StreamingResponse(
        iter([content.encode("utf-8-sig")]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=隐患列表_{datetime.now().strftime('%Y%m%d')}.csv"
        },
    )


@router.get("/export/fines")
def export_fines(
    format: str = Query("csv", regex="^(csv|xlsx)$"),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Fine)
    
    if status:
        query = query.filter(Fine.status == status)
    
    fines = query.order_by(Fine.created_at.desc()).all()
    
    rows = []
    for fine in fines:
        hazard = db.query(Hazard).filter(Hazard.id == fine.hazard_id).first()
        team = db.query(Team).filter(Team.id == hazard.team_id).first() if hazard else None
        
        rows.append({
            "罚款编号": fine.id,
            "隐患编号": hazard.code if hazard else "",
            "隐患标题": hazard.title if hazard else "",
            "责任班组": team.name if team else "",
            "罚款金额": float(fine.amount),
            "状态": fine.status,
            "确认人": fine.confirmed_by or "",
            "确认时间": fine.confirmed_at.strftime("%Y-%m-%d %H:%M:%S") if fine.confirmed_at else "",
            "创建时间": fine.created_at.strftime("%Y-%m-%d %H:%M:%S") if fine.created_at else "",
            "驳回原因": fine.reject_reason or "",
        })
    
    import csv
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys() if rows else [])
    writer.writeheader()
    writer.writerows(rows)
    
    content = output.getvalue()
    
    return StreamingResponse(
        iter([content.encode("utf-8-sig")]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=罚款记录_{datetime.now().strftime('%Y%m%d')}.csv"
        },
    )
