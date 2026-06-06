from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import Optional
import io
import csv
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

import models
import schemas
from database import engine, get_db
import data_processor

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="高校图书馆自习位利用率分析平台")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.now()}


@app.get("/api/floors")
def get_floors(db: Session = Depends(get_db)):
    floors = db.query(models.Floor).all()
    return {"data": floors, "update_time": datetime.now()}


@app.get("/api/areas")
def get_areas(floor_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Area)
    if floor_id:
        query = query.filter(models.Area.floor_id == floor_id)
    areas = query.all()
    return {"data": areas, "update_time": datetime.now()}


@app.get("/api/user-groups")
def get_user_groups(db: Session = Depends(get_db)):
    groups = db.query(models.UserGroup).all()
    return {"data": groups, "update_time": datetime.now()}


@app.get("/api/seat-types")
def get_seat_types(db: Session = Depends(get_db)):
    types = db.query(models.Seat.seat_type).distinct().all()
    return {"data": [t[0] for t in types], "update_time": datetime.now()}


@app.get("/api/anomalies")
def get_anomalies(target_date: Optional[date] = None, db: Session = Depends(get_db)):
    anomalies = data_processor.detect_anomalies(db, target_date)
    return {
        "data": anomalies,
        "update_time": datetime.now(),
        "target_date": target_date or date.today()
    }


@app.get("/api/heatmap")
def get_heatmap(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    area_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'area_id': area_id
    }
    data = data_processor.get_heatmap_data(db, filters)
    sample_size = sum(d['sample_size'] for d in data)
    return {
        "data": data,
        "sample_size": sample_size,
        "update_time": datetime.now(),
        "filters": filters
    }


@app.get("/api/no-show-trend")
def get_no_show_trend(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    floor_id: Optional[int] = None,
    area_id: Optional[int] = None,
    seat_type: Optional[str] = None,
    user_group_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'area_id': area_id,
        'seat_type': seat_type,
        'user_group_id': user_group_id
    }
    data = data_processor.get_no_show_trend(db, filters)
    total_sample = sum(d['sample_size'] for d in data)
    return {
        "data": data,
        "sample_size": total_sample,
        "update_time": datetime.now(),
        "filters": filters
    }


@app.get("/api/area-comparison")
def get_area_comparison(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    floor_id: Optional[int] = None,
    seat_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'seat_type': seat_type
    }
    data = data_processor.get_area_comparison(db, filters)
    total_sample = sum(d['sample_size'] for d in data)
    return {
        "data": data,
        "sample_size": total_sample,
        "update_time": datetime.now(),
        "filters": filters
    }


@app.get("/api/funnel")
def get_funnel(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    floor_id: Optional[int] = None,
    area_id: Optional[int] = None,
    seat_type: Optional[str] = None,
    user_group_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'area_id': area_id,
        'seat_type': seat_type,
        'user_group_id': user_group_id
    }
    data = data_processor.get_funnel_data(db, filters)
    sample_size = data[0]['value'] if data else 0
    return {
        "data": data,
        "sample_size": sample_size,
        "update_time": datetime.now(),
        "filters": filters
    }


@app.get("/api/summary")
def get_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    floor_id: Optional[int] = None,
    area_id: Optional[int] = None,
    seat_type: Optional[str] = None,
    user_group_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'area_id': area_id,
        'seat_type': seat_type,
        'user_group_id': user_group_id
    }
    utilization = data_processor.get_utilization_rate(db, filters)
    no_show_rate = data_processor.get_no_show_rate(db, filters)
    sample_size = data_processor.get_sample_size(db, filters)
    
    return {
        "data": {
            "utilization_rate": utilization,
            "no_show_rate": no_show_rate,
            "sample_size": sample_size
        },
        "update_time": datetime.now(),
        "filters": filters
    }


@app.get("/api/exam-week-comparison")
def get_exam_week_comparison(
    db: Session = Depends(get_db)
):
    exam_weeks = db.query(models.ExamWeek).filter(models.ExamWeek.is_exam_week == True).all()
    
    if not exam_weeks:
        return {"data": [], "update_time": datetime.now()}
    
    result = []
    for ew in exam_weeks:
        exam_filters = {'start_date': ew.week_start, 'end_date': ew.week_end}
        normal_start = ew.week_start - timedelta(weeks=2)
        normal_end = ew.week_start - timedelta(days=1)
        normal_filters = {'start_date': normal_start, 'end_date': normal_end}
        
        exam_util = data_processor.get_utilization_rate(db, exam_filters)
        normal_util = data_processor.get_utilization_rate(db, normal_filters)
        exam_no_show = data_processor.get_no_show_rate(db, exam_filters)
        normal_no_show = data_processor.get_no_show_rate(db, normal_filters)
        
        result.append({
            'semester': ew.semester,
            'exam_week': f"{ew.week_start} ~ {ew.week_end}",
            'exam_utilization': exam_util,
            'normal_utilization': normal_util,
            'exam_no_show_rate': exam_no_show,
            'normal_no_show_rate': normal_no_show,
            'exam_sample_size': data_processor.get_sample_size(db, exam_filters),
            'normal_sample_size': data_processor.get_sample_size(db, normal_filters)
        })
    
    return {"data": result, "update_time": datetime.now()}


@app.post("/api/import")
async def import_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="仅支持CSV文件")
    
    content = await file.read()
    try:
        import pandas as pd
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        df = data_processor.handle_missing_values(df)
        
        log = models.DataImportLog(
            import_date=datetime.now(),
            source_file=file.filename,
            records_count=len(df),
            status='success',
            notes='CSV数据导入成功'
        )
        db.add(log)
        db.commit()
        
        return {"message": "导入成功", "records": len(df)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")


@app.get("/api/report/csv")
def export_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    floor_id: Optional[int] = None,
    area_id: Optional[int] = None,
    seat_type: Optional[str] = None,
    user_group_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'area_id': area_id,
        'seat_type': seat_type,
        'user_group_id': user_group_id
    }
    
    area_data = data_processor.get_area_comparison(db, filters)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['区域名称', '利用率(%)', '爽约率(%)', '平均等待(分钟)', '样本量', '座位数'])
    
    for row in area_data:
        writer.writerow([
            row['area_name'],
            row['utilization_rate'],
            row['no_show_rate'],
            row['avg_wait_time'],
            row['sample_size'],
            row['seat_count']
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=library_report_{date.today()}.csv"}
    )


@app.get("/api/report/pdf")
def export_pdf(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    floor_id: Optional[int] = None,
    area_id: Optional[int] = None,
    seat_type: Optional[str] = None,
    user_group_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'area_id': area_id,
        'seat_type': seat_type,
        'user_group_id': user_group_id
    }
    
    area_data = data_processor.get_area_comparison(db, filters)
    sample_size = sum(d['sample_size'] for d in area_data)
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
    styles = getSampleStyleSheet()
    elements = []
    
    title = Paragraph("高校图书馆自习位利用率分析报告", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    info = Paragraph(f"""
        <b>生成时间:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>
        <b>样本量:</b> {sample_size}<br/>
        <b>筛选条件:</b> {str(filters)}
    """, styles['Normal'])
    elements.append(info)
    elements.append(Spacer(1, 20))
    
    data = [['区域名称', '利用率(%)', '爽约率(%)', '平均等待(分钟)', '样本量', '座位数']]
    for row in area_data:
        data.append([
            row['area_name'],
            str(row['utilization_rate']),
            str(row['no_show_rate']),
            str(row['avg_wait_time']),
            str(row['sample_size']),
            str(row['seat_count'])
        ])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=library_report_{date.today()}.pdf"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
