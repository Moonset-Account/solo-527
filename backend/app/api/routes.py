from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from app.core.database import get_db
from app.services import EnergyService, AnomalyService, AlarmWorkorderService, FilterService
from app import schemas

router = APIRouter(prefix="/api", tags=["main"])


@router.get("/overview", response_model=schemas.OverviewMetrics)
def get_overview(
    room_ids: Optional[str] = Query(None, description="机房ID列表，逗号分隔"),
    db: Session = Depends(get_db)
):
    room_id_list = room_ids.split(",") if room_ids else None
    service = EnergyService(db)
    return service.get_overview_metrics(room_id_list)


@router.get("/energy/trend", response_model=List[schemas.EnergyTrendPoint])
def get_energy_trend(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    room_ids: Optional[str] = Query(None),
    categories: Optional[str] = Query(None),
    include_maintenance: bool = Query(False),
    db: Session = Depends(get_db)
):
    if not end_time:
        end_time = datetime.now()
    if not start_time:
        start_time = end_time - timedelta(days=1)
    
    room_id_list = room_ids.split(",") if room_ids else None
    category_list = categories.split(",") if categories else None
    
    service = EnergyService(db)
    return service.get_energy_trend(
        start_time, end_time, room_id_list, category_list, include_maintenance
    )


@router.get("/energy/breakdown", response_model=List[schemas.EnergyBreakdownItem])
def get_energy_breakdown(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    room_ids: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not end_time:
        end_time = datetime.now()
    if not start_time:
        start_time = end_time - timedelta(days=7)
    
    room_id_list = room_ids.split(",") if room_ids else None
    service = EnergyService(db)
    return service.get_energy_breakdown(start_time, end_time, room_id_list)


@router.get("/energy/compare")
def compare_weeks(
    exam_week_start: Optional[datetime] = Query(None),
    normal_week_start: Optional[datetime] = Query(None),
    room_ids: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not exam_week_start:
        exam_week_start = datetime.now() - timedelta(days=15)
    if not normal_week_start:
        normal_week_start = datetime.now() - timedelta(days=8)
    
    room_id_list = room_ids.split(",") if room_ids else None
    service = EnergyService(db)
    return service.compare_weeks(exam_week_start, normal_week_start, room_id_list)


@router.get("/energy/anomalies")
def get_anomalies(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    severity: Optional[str] = Query(None),
    room_ids: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    room_id_list = room_ids.split(",") if room_ids else None
    service = AnomalyService(db)
    anomalies = service.get_anomalies(start_time, end_time, severity, room_id_list)
    return [
        {
            "id": a.id,
            "energy_data_id": a.energy_data_id,
            "timestamp": a.timestamp,
            "value": a.value,
            "expected_value": a.expected_value,
            "deviation": a.deviation,
            "severity": a.severity,
            "comment": a.comment
        }
        for a in anomalies
    ]


@router.get("/energy/anomalies/{anomaly_id}", response_model=schemas.AnomalyDetail)
def get_anomaly_detail(anomaly_id: str, db: Session = Depends(get_db)):
    service = AnomalyService(db)
    detail = service.get_anomaly_detail(anomaly_id)
    if not detail:
        raise HTTPException(status_code=404, detail="异常点不存在")
    return detail


@router.post("/energy/anomalies/{anomaly_id}/comment")
def add_anomaly_comment(
    anomaly_id: str,
    request: schemas.AnomalyCommentRequest,
    db: Session = Depends(get_db)
):
    service = AnomalyService(db)
    success = service.add_comment(anomaly_id, request.comment)
    if not success:
        raise HTTPException(status_code=404, detail="异常点不存在")
    return {"success": True, "message": "注释添加成功"}


@router.get("/alarms", response_model=List[schemas.Alarm])
def get_alarms(
    status: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    service = AlarmWorkorderService(db)
    return service.get_alarms(status, level, limit)


@router.get("/workorders", response_model=List[schemas.Workorder])
def get_workorders(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    service = AlarmWorkorderService(db)
    return service.get_workorders(status, priority, limit)


@router.get("/devices/status", response_model=List[schemas.Device])
def get_device_status(
    room_ids: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    room_id_list = room_ids.split(",") if room_ids else None
    service = AlarmWorkorderService(db)
    return service.get_device_status(room_id_list)


@router.get("/schedule", response_model=List[schemas.Schedule])
def get_schedule(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    room_ids: Optional[str] = Query(None),
    week_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if not end_time:
        end_time = datetime.now() + timedelta(days=7)
    if not start_time:
        start_time = datetime.now()
    
    room_id_list = room_ids.split(",") if room_ids else None
    service = FilterService(db)
    return service.get_schedules(start_time, end_time, room_id_list, week_type)


@router.get("/filter/options", response_model=schemas.FilterOptions)
def get_filter_options(db: Session = Depends(get_db)):
    service = FilterService(db)
    return service.get_filter_options()


@router.post("/export/pdf")
def export_pdf(request: schemas.ExportPDFRequest, db: Session = Depends(get_db)):
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from fastapi.responses import StreamingResponse
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    title_style = styles["Title"]
    h2_style = styles["Heading2"]
    normal_style = styles["Normal"]
    
    story.append(Paragraph("高校机房能耗与故障分析报告", title_style))
    story.append(Spacer(1, 12))
    
    time_range = f"统计时间: {request.start_time.strftime('%Y-%m-%d')} 至 {request.end_time.strftime('%Y-%m-%d')}"
    story.append(Paragraph(time_range, normal_style))
    story.append(Spacer(1, 20))
    
    energy_service = EnergyService(db)
    metrics = energy_service.get_overview_metrics(request.room_ids)
    
    story.append(Paragraph("一、核心指标", h2_style))
    story.append(Spacer(1, 12))
    
    data = [
        ["指标", "数值"],
        ["总能耗 (kWh)", f"{metrics.totalEnergy:.2f}"],
        ["PUE值", f"{metrics.pue:.2f}"],
        ["在线设备数", str(metrics.onlineDevices)],
        ["待处理工单数", str(metrics.pendingWorkorders)]
    ]
    
    t = Table(data)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 12),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
        ("GRID", (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(t)
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("二、能耗分析", h2_style))
    story.append(Spacer(1, 12))
    
    breakdown = energy_service.get_energy_breakdown(
        request.start_time, request.end_time, request.room_ids
    )
    
    breakdown_data = [["能耗分类", "能耗值 (kWh)", "占比 (%)"]]
    for item in breakdown:
        breakdown_data.append([item.category, f"{item.value:.2f}", f"{item.percentage:.1f}"])
    
    t2 = Table(breakdown_data)
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(t2)
    story.append(Spacer(1, 20))
    
    alarm_service = AlarmWorkorderService(db)
    alarms = alarm_service.get_alarms(limit=10)
    
    story.append(Paragraph("三、近期告警", h2_style))
    story.append(Spacer(1, 12))
    
    if alarms:
        alarm_data = [["时间", "设备", "级别", "信息"]]
        for a in alarms[:5]:
            alarm_data.append([
                a.timestamp.strftime("%Y-%m-%d %H:%M"),
                a.device_name or "-",
                a.level,
                a.message[:30]
            ])
        
        t3 = Table(alarm_data)
        t3.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ("FONTSIZE", (0, 0), (-1, -1), 9)
        ]))
        story.append(t3)
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=energy_report.pdf"}
    )
