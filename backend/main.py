from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import date, datetime, timedelta
from typing import Optional
import io
import csv
import pandas as pd
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


@app.get("/api/time-slots")
def get_time_slots():
    slots = [
        {'key': 'morning', 'label': '上午 (08:00-12:00)'},
        {'key': 'afternoon', 'label': '下午 (12:00-18:00)'},
        {'key': 'evening', 'label': '晚间 (18:00-22:00)'},
        {'key': '08-10', 'label': '08:00-10:00'},
        {'key': '10-12', 'label': '10:00-12:00'},
        {'key': '12-14', 'label': '12:00-14:00'},
        {'key': '14-16', 'label': '14:00-16:00'},
        {'key': '16-18', 'label': '16:00-18:00'},
        {'key': '18-20', 'label': '18:00-20:00'},
        {'key': '20-22', 'label': '20:00-22:00'},
    ]
    return {"data": slots, "update_time": datetime.now()}


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
    time_slot: Optional[str] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'area_id': area_id,
        'time_slot': time_slot
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
    time_slot: Optional[str] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'area_id': area_id,
        'seat_type': seat_type,
        'user_group_id': user_group_id,
        'time_slot': time_slot
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
    area_id: Optional[int] = None,
    seat_type: Optional[str] = None,
    user_group_id: Optional[int] = None,
    time_slot: Optional[str] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'area_id': area_id,
        'seat_type': seat_type,
        'user_group_id': user_group_id,
        'time_slot': time_slot
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
    time_slot: Optional[str] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'area_id': area_id,
        'seat_type': seat_type,
        'user_group_id': user_group_id,
        'time_slot': time_slot
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
    time_slot: Optional[str] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'area_id': area_id,
        'seat_type': seat_type,
        'user_group_id': user_group_id,
        'time_slot': time_slot
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


def import_reservations(df: pd.DataFrame, db: Session):
    count = 0
    for _, row in df.iterrows():
        try:
            seat_code = row.get('seat_code') or row.get('座位号')
            seat = db.query(models.Seat).filter(models.Seat.seat_code == seat_code).first()
            if not seat:
                continue
            
            group_name = row.get('user_group') or row.get('用户组') or '本科生'
            user_group = db.query(models.UserGroup).filter(models.UserGroup.group_name == group_name).first()
            if not user_group:
                user_group = models.UserGroup(group_name=group_name)
                db.add(user_group)
                db.flush()
            
            res_date = pd.to_datetime(row.get('reservation_date') or row.get('预约日期')).date()
            start_time = str(row.get('start_time') or row.get('开始时间') or '08:00')
            end_time = str(row.get('end_time') or row.get('结束时间') or '10:00')
            status = str(row.get('status') or row.get('状态') or 'completed')
            
            checkin_time = None
            if row.get('checkin_time') or row.get('签到时间'):
                checkin_val = row.get('checkin_time') or row.get('签到时间')
                if pd.notna(checkin_val):
                    checkin_time = pd.to_datetime(checkin_val).to_pydatetime()
            
            checkout_time = None
            if row.get('checkout_time') or row.get('离座时间'):
                checkout_val = row.get('checkout_time') or row.get('离座时间')
                if pd.notna(checkout_val):
                    checkout_time = pd.to_datetime(checkout_val).to_pydatetime()
            
            reservation = models.Reservation(
                seat_id=seat.id,
                user_group_id=user_group.id,
                reservation_date=res_date,
                start_time=start_time,
                end_time=end_time,
                status=status,
                checkin_time=checkin_time,
                checkout_time=checkout_time
            )
            db.add(reservation)
            db.flush()
            
            if status == 'no_show':
                no_show = models.NoShowRecord(
                    reservation_id=reservation.id,
                    user_group_id=user_group.id,
                    record_date=res_date,
                    reason=row.get('reason') or row.get('爽约原因')
                )
                db.add(no_show)
            
            count += 1
            if count % 100 == 0:
                db.commit()
        except Exception:
            continue
    
    db.commit()
    return count


def import_floors(df: pd.DataFrame, db: Session):
    count = 0
    for _, row in df.iterrows():
        try:
            floor_num = int(row.get('floor_number') or row.get('楼层号'))
            existing = db.query(models.Floor).filter(models.Floor.floor_number == floor_num).first()
            if existing:
                continue
            
            floor = models.Floor(
                floor_number=floor_num,
                floor_name=str(row.get('floor_name') or row.get('楼层名称') or f'{floor_num}层'),
                total_seats=int(row.get('total_seats') or row.get('座位数') or 0),
                description=str(row.get('description') or row.get('描述') or '')
            )
            db.add(floor)
            count += 1
        except Exception:
            continue
    db.commit()
    return count


def import_exam_weeks(df: pd.DataFrame, db: Session):
    count = 0
    for _, row in df.iterrows():
        try:
            week_start = pd.to_datetime(row.get('week_start') or row.get('开始日期')).date()
            week_end = pd.to_datetime(row.get('week_end') or row.get('结束日期')).date()
            
            existing = db.query(models.ExamWeek).filter(
                and_(models.ExamWeek.week_start == week_start, models.ExamWeek.week_end == week_end)
            ).first()
            if existing:
                continue
            
            exam_week = models.ExamWeek(
                week_start=week_start,
                week_end=week_end,
                semester=str(row.get('semester') or row.get('学期') or ''),
                is_exam_week=bool(row.get('is_exam_week') or row.get('是否考试周') or True)
            )
            db.add(exam_week)
            count += 1
        except Exception:
            continue
    db.commit()
    return count


def import_device_repairs(df: pd.DataFrame, db: Session):
    count = 0
    for _, row in df.iterrows():
        try:
            seat_code = row.get('seat_code') or row.get('座位号')
            seat = db.query(models.Seat).filter(models.Seat.seat_code == seat_code).first()
            if not seat:
                continue
            
            report_date = pd.to_datetime(row.get('report_date') or row.get('报修日期')).date()
            repair_date = None
            if row.get('repair_date') or row.get('维修日期'):
                repair_date = pd.to_datetime(row.get('repair_date') or row.get('维修日期')).date()
            
            repair = models.DeviceRepair(
                seat_id=seat.id,
                report_date=report_date,
                repair_date=repair_date,
                issue_type=str(row.get('issue_type') or row.get('问题类型') or '其他'),
                status=str(row.get('status') or row.get('状态') or 'pending'),
                description=str(row.get('description') or row.get('描述') or '')
            )
            db.add(repair)
            count += 1
            if count % 100 == 0:
                db.commit()
        except Exception:
            continue
    db.commit()
    return count


def import_wait_queue(df: pd.DataFrame, db: Session):
    count = 0
    for _, row in df.iterrows():
        try:
            area_name = row.get('area_name') or row.get('区域名称')
            area = db.query(models.Area).filter(models.Area.area_name == area_name).first()
            if not area:
                continue
            
            group_name = row.get('user_group') or row.get('用户组') or '本科生'
            user_group = db.query(models.UserGroup).filter(models.UserGroup.group_name == group_name).first()
            if not user_group:
                user_group = models.UserGroup(group_name=group_name)
                db.add(user_group)
                db.flush()
            
            queue_date = pd.to_datetime(row.get('queue_date') or row.get('排队日期')).date()
            
            queue = models.WaitQueue(
                area_id=area.id,
                user_group_id=user_group.id,
                queue_date=queue_date,
                queue_time=str(row.get('queue_time') or row.get('排队时间') or '08:00'),
                queue_position=int(row.get('queue_position') or row.get('排队位置') or 1),
                wait_duration=float(row.get('wait_duration') or row.get('等待时长') or 0),
                is_served=bool(row.get('is_served') or row.get('是否服务') or False)
            )
            db.add(queue)
            count += 1
            if count % 100 == 0:
                db.commit()
        except Exception:
            continue
    db.commit()
    return count


@app.post("/api/import")
async def import_data(file: UploadFile = File(...), data_type: str = 'reservations', db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="仅支持CSV文件")
    
    content = await file.read()
    total_count = 0
    
    try:
        import pandas as pd
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        df = data_processor.handle_missing_values(df)
        
        if data_type == 'reservations':
            total_count = import_reservations(df, db)
        elif data_type == 'floors':
            total_count = import_floors(df, db)
        elif data_type == 'exam_weeks':
            total_count = import_exam_weeks(df, db)
        elif data_type == 'device_repairs':
            total_count = import_device_repairs(df, db)
        elif data_type == 'wait_queue':
            total_count = import_wait_queue(df, db)
        else:
            total_count = import_reservations(df, db)
        
        log = models.DataImportLog(
            import_date=datetime.now(),
            source_file=file.filename,
            records_count=total_count,
            status='success',
            notes=f'CSV数据导入成功，类型: {data_type}'
        )
        db.add(log)
        db.commit()
        
        return {"message": "导入成功", "records": total_count, "data_type": data_type}
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
    time_slot: Optional[str] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'area_id': area_id,
        'seat_type': seat_type,
        'user_group_id': user_group_id,
        'time_slot': time_slot
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
    time_slot: Optional[str] = None,
    db: Session = Depends(get_db)
):
    filters = {
        'start_date': start_date,
        'end_date': end_date,
        'floor_id': floor_id,
        'area_id': area_id,
        'seat_type': seat_type,
        'user_group_id': user_group_id,
        'time_slot': time_slot
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
