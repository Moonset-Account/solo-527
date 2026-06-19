import io
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd

from app.api.deps import get_db, get_current_active_operator
from app.crud import crud_registration, crud_checkin, crud_event
from app.models.user import User
from app.models.registration import RegistrationStatus, RegistrationQuality
from app.core.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/exports", tags=["报表导出"])


def get_export_filename(prefix: str) -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    env_mark = "" if settings.is_production else f"_{settings.ENVIRONMENT}"
    return f"{prefix}_{timestamp}{env_mark}.xlsx"


@router.get("/registrations/{event_id}")
def export_registrations(
    event_id: int,
    status: Optional[RegistrationStatus] = None,
    quality: Optional[RegistrationQuality] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    if settings.is_testing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="测试环境不允许导出真实数据",
        )
    
    event = crud_event.get(db, id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )
    
    items, _ = crud_registration.get_multi_by_event(
        db, event_id=event_id, skip=0, limit=10000,
        status=status, quality=quality,
    )
    
    data = []
    for item in items:
        data.append({
            "报名编号": item.registration_no,
            "姓名": item.real_name,
            "身份证号": item.id_card_no or "",
            "手机号": item.phone or "",
            "邮箱": item.email or "",
            "公司": item.company or "",
            "职位": item.position or "",
            "票种": item.ticket_type or "",
            "票价": item.ticket_price,
            "状态": item.status.value,
            "质量等级": item.quality.value,
            "备注": item.remark or "",
            "报名时间": item.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        })
    
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="报名数据")
    
    output.seek(0)
    
    filename = get_export_filename(f"registration_{event_id}")
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/checkins/{event_id}")
def export_checkins(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    if settings.is_testing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="测试环境不允许导出真实数据",
        )
    
    event = crud_event.get(db, id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )
    
    items, _ = crud_checkin.get_multi_by_event(
        db, event_id=event_id, skip=0, limit=10000,
    )
    
    data = []
    for item in items:
        reg_name = item.registration.real_name if item.registration else ""
        reg_no = item.registration.registration_no if item.registration else ""
        device_name = item.device.device_name if item.device else ""
        operator_name = item.operator.full_name if item.operator else (item.operator.username if item.operator else "")
        
        data.append({
            "签到编号": item.id,
            "报名编号": reg_no,
            "姓名": reg_name,
            "签到时间": item.checkin_time.strftime("%Y-%m-%d %H:%M:%S"),
            "签到状态": item.status.value,
            "到场反馈": item.attendance_feedback.value,
            "签到方式": item.checkin_method or "",
            "设备": device_name,
            "操作人": operator_name,
            "备注": item.remark or "",
        })
    
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="签到数据")
    
    output.seek(0)
    
    filename = get_export_filename(f"checkin_{event_id}")
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/quality-history/{event_id}")
def export_quality_history(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_operator),
):
    if settings.is_testing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="测试环境不允许导出真实数据",
        )
    
    event = crud_event.get(db, id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="活动不存在",
        )
    
    registrations, _ = crud_registration.get_multi_by_event(
        db, event_id=event_id, skip=0, limit=10000,
    )
    
    data = []
    for reg in registrations:
        histories = crud_registration.get_quality_histories(db, registration_id=reg.id)
        for h in histories:
            data.append({
                "报名编号": reg.registration_no,
                "姓名": reg.real_name,
                "原质量等级": h.old_quality.value if h.old_quality else "",
                "新质量等级": h.new_quality.value,
                "变更人": h.changed_by or "",
                "变更原因": h.reason or "",
                "变更时间": h.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            })
    
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="质量变更历史")
    
    output.seek(0)
    
    filename = get_export_filename(f"quality_history_{event_id}")
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
