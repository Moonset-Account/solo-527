import pandas as pd
import numpy as np
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import models


def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].isnull().any():
            df[col] = df[col].fillna(df[col].median())
    
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        if df[col].isnull().any():
            df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown')
    
    if 'reservation_date' in df.columns:
        df['reservation_date'] = pd.to_datetime(df['reservation_date']).dt.date
    
    return df


def is_exam_week(target_date: date, db: Session) -> bool:
    exam_week = db.query(models.ExamWeek).filter(
        and_(
            models.ExamWeek.week_start <= target_date,
            models.ExamWeek.week_end >= target_date
        )
    ).first()
    return exam_week is not None and exam_week.is_exam_week


def apply_time_filter(query, filters, time_field='start_time'):
    time_slot = filters.get('time_slot')
    if not time_slot:
        return query
    
    time_map = {
        'morning': ('08:00', '12:00'),
        'afternoon': ('12:00', '18:00'),
        'evening': ('18:00', '22:00'),
        '08-10': ('08:00', '10:00'),
        '10-12': ('10:00', '12:00'),
        '12-14': ('12:00', '14:00'),
        '14-16': ('14:00', '16:00'),
        '16-18': ('16:00', '18:00'),
        '18-20': ('18:00', '20:00'),
        '20-22': ('20:00', '22:00'),
    }
    
    if time_slot in time_map:
        start_t, end_t = time_map[time_slot]
        field = getattr(models.Reservation, time_field)
        query = query.filter(and_(field >= start_t, field < end_t))
    
    return query


def get_utilization_rate(db: Session, filters: dict) -> float:
    query = db.query(models.Reservation).join(models.Seat)
    
    if filters.get('start_date'):
        query = query.filter(models.Reservation.reservation_date >= filters['start_date'])
    if filters.get('end_date'):
        query = query.filter(models.Reservation.reservation_date <= filters['end_date'])
    if filters.get('floor_id'):
        query = query.join(models.Area).filter(models.Area.floor_id == filters['floor_id'])
    if filters.get('area_id'):
        query = query.filter(models.Seat.area_id == filters['area_id'])
    if filters.get('seat_type'):
        query = query.filter(models.Seat.seat_type == filters['seat_type'])
    if filters.get('user_group_id'):
        query = query.filter(models.Reservation.user_group_id == filters['user_group_id'])
    
    query = apply_time_filter(query, filters)
    
    total = query.count()
    if total == 0:
        return 0.0
    
    checked_in = query.filter(
        or_(
            models.Reservation.status == 'checked_in',
            models.Reservation.status == 'completed'
        )
    ).count()
    
    return round(checked_in / total * 100, 2)


def get_no_show_rate(db: Session, filters: dict) -> float:
    query = db.query(models.Reservation).join(models.Seat)
    
    if filters.get('start_date'):
        query = query.filter(models.Reservation.reservation_date >= filters['start_date'])
    if filters.get('end_date'):
        query = query.filter(models.Reservation.reservation_date <= filters['end_date'])
    if filters.get('floor_id'):
        query = query.join(models.Area).filter(models.Area.floor_id == filters['floor_id'])
    if filters.get('area_id'):
        query = query.filter(models.Seat.area_id == filters['area_id'])
    if filters.get('seat_type'):
        query = query.filter(models.Seat.seat_type == filters['seat_type'])
    if filters.get('user_group_id'):
        query = query.filter(models.Reservation.user_group_id == filters['user_group_id'])
    
    query = apply_time_filter(query, filters)
    
    total = query.count()
    if total == 0:
        return 0.0
    
    no_shows = query.filter(models.Reservation.status == 'no_show').count()
    
    return round(no_shows / total * 100, 2)


def get_sample_size(db: Session, filters: dict) -> int:
    query = db.query(models.Reservation).join(models.Seat)
    
    if filters.get('start_date'):
        query = query.filter(models.Reservation.reservation_date >= filters['start_date'])
    if filters.get('end_date'):
        query = query.filter(models.Reservation.reservation_date <= filters['end_date'])
    if filters.get('floor_id'):
        query = query.join(models.Area).filter(models.Area.floor_id == filters['floor_id'])
    if filters.get('area_id'):
        query = query.filter(models.Seat.area_id == filters['area_id'])
    if filters.get('seat_type'):
        query = query.filter(models.Seat.seat_type == filters['seat_type'])
    if filters.get('user_group_id'):
        query = query.filter(models.Reservation.user_group_id == filters['user_group_id'])
    
    query = apply_time_filter(query, filters)
    
    return query.count()


def get_heatmap_data(db: Session, filters: dict) -> list:
    from sqlalchemy import case
    
    checkin_case = case(
        (or_(models.Reservation.status == 'checked_in', models.Reservation.status == 'completed'), 1),
        else_=0
    )
    
    query = db.query(
        models.Seat.grid_x,
        models.Seat.grid_y,
        models.Seat.seat_code,
        func.count(models.Reservation.id).label('reservation_count'),
        func.sum(checkin_case).label('checkin_count')
    ).select_from(models.Seat).outerjoin(models.Reservation)
    
    if filters.get('start_date'):
        query = query.filter(models.Reservation.reservation_date >= filters['start_date'])
    if filters.get('end_date'):
        query = query.filter(models.Reservation.reservation_date <= filters['end_date'])
    if filters.get('area_id'):
        query = query.filter(models.Seat.area_id == filters['area_id'])
    else:
        query = query.filter(models.Seat.area_id == 1)
    
    query = query.group_by(models.Seat.id, models.Seat.grid_x, models.Seat.grid_y, models.Seat.seat_code)
    
    results = query.all()
    
    heatmap_data = []
    for row in results:
        if row.grid_x is not None and row.grid_y is not None:
            utilization = (row.checkin_count / row.reservation_count * 100) if row.reservation_count > 0 else 0
            heatmap_data.append({
                'grid_x': row.grid_x,
                'grid_y': row.grid_y,
                'value': round(utilization, 1),
                'seat_code': row.seat_code,
                'sample_size': row.reservation_count or 0
            })
    
    return heatmap_data


def get_no_show_trend(db: Session, filters: dict) -> list:
    base_query = db.query(models.Reservation).join(models.Seat)
    
    if filters.get('floor_id'):
        base_query = base_query.join(models.Area).filter(models.Area.floor_id == filters['floor_id'])
    if filters.get('area_id'):
        base_query = base_query.filter(models.Seat.area_id == filters['area_id'])
    if filters.get('seat_type'):
        base_query = base_query.filter(models.Seat.seat_type == filters['seat_type'])
    if filters.get('user_group_id'):
        base_query = base_query.filter(models.Reservation.user_group_id == filters['user_group_id'])
    
    base_query = apply_time_filter(base_query, filters)
    
    start_date = filters.get('start_date', date.today() - timedelta(days=30))
    end_date = filters.get('end_date', date.today())
    
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    trend_data = []
    for d in date_range:
        d_date = d.date()
        day_query = base_query.filter(models.Reservation.reservation_date == d_date)
        total = day_query.count()
        no_shows = day_query.filter(models.Reservation.status == 'no_show').count()
        rate = (no_shows / total * 100) if total > 0 else 0
        exam_week = is_exam_week(d_date, db)
        
        trend_data.append({
            'date': d_date,
            'value': round(rate, 2),
            'sample_size': total,
            'is_exam_week': exam_week
        })
    
    return trend_data


def get_area_comparison(db: Session, filters: dict) -> list:
    from sqlalchemy import case
    
    checkin_case = case(
        (or_(models.Reservation.status == 'checked_in', models.Reservation.status == 'completed'), 1),
        else_=0
    )
    no_show_case = case(
        (models.Reservation.status == 'no_show', 1),
        else_=0
    )
    
    query = db.query(
        models.Area.area_name,
        func.count(models.Reservation.id).label('total_reservations'),
        func.sum(checkin_case).label('checkin_count'),
        func.sum(no_show_case).label('no_show_count'),
        func.avg(models.WaitQueue.wait_duration).label('avg_wait'),
        models.Area.total_seats
    ).select_from(models.Area) \
     .join(models.Seat, models.Seat.area_id == models.Area.id) \
     .outerjoin(models.Reservation, models.Reservation.seat_id == models.Seat.id) \
     .outerjoin(models.WaitQueue, models.WaitQueue.area_id == models.Area.id)
    
    if filters.get('start_date'):
        query = query.filter(models.Reservation.reservation_date >= filters['start_date'])
    if filters.get('end_date'):
        query = query.filter(models.Reservation.reservation_date <= filters['end_date'])
    if filters.get('floor_id'):
        query = query.filter(models.Area.floor_id == filters['floor_id'])
    if filters.get('seat_type'):
        query = query.filter(models.Seat.seat_type == filters['seat_type'])
    
    if filters.get('time_slot'):
        query = apply_time_filter(query, filters)
    
    query = query.group_by(models.Area.id, models.Area.area_name, models.Area.total_seats)
    
    results = query.all()
    
    comparison_data = []
    for row in results:
        utilization = (row.checkin_count / row.total_reservations * 100) if row.total_reservations > 0 else 0
        no_show_rate = (row.no_show_count / row.total_reservations * 100) if row.total_reservations > 0 else 0
        
        comparison_data.append({
            'area_name': row.area_name,
            'utilization_rate': round(utilization, 2),
            'no_show_rate': round(no_show_rate, 2),
            'avg_wait_time': round(float(row.avg_wait or 0), 1),
            'sample_size': row.total_reservations or 0,
            'seat_count': row.total_seats
        })
    
    return comparison_data


def get_funnel_data(db: Session, filters: dict) -> list:
    base_query = db.query(models.Reservation).join(models.Seat)
    
    if filters.get('start_date'):
        base_query = base_query.filter(models.Reservation.reservation_date >= filters['start_date'])
    if filters.get('end_date'):
        base_query = base_query.filter(models.Reservation.reservation_date <= filters['end_date'])
    if filters.get('floor_id'):
        base_query = base_query.join(models.Area).filter(models.Area.floor_id == filters['floor_id'])
    if filters.get('area_id'):
        base_query = base_query.filter(models.Seat.area_id == filters['area_id'])
    if filters.get('seat_type'):
        base_query = base_query.filter(models.Seat.seat_type == filters['seat_type'])
    if filters.get('user_group_id'):
        base_query = base_query.filter(models.Reservation.user_group_id == filters['user_group_id'])
    
    base_query = apply_time_filter(base_query, filters)
    
    queue_query = db.query(models.WaitQueue)
    if filters.get('start_date'):
        queue_query = queue_query.filter(models.WaitQueue.queue_date >= filters['start_date'])
    if filters.get('end_date'):
        queue_query = queue_query.filter(models.WaitQueue.queue_date <= filters['end_date'])
    if filters.get('area_id'):
        queue_query = queue_query.filter(models.WaitQueue.area_id == filters['area_id'])
    
    browse_count = base_query.count() * 3
    queue_count = queue_query.count()
    reservation_count = base_query.count()
    checkin_count = base_query.filter(
        or_(
            models.Reservation.status == 'checked_in',
            models.Reservation.status == 'completed'
        )
    ).count()
    completed_count = base_query.filter(models.Reservation.status == 'completed').count()
    
    steps = [
        {'name': '浏览座位', 'value': browse_count, 'conversion_rate': 100.0},
        {'name': '加入等待', 'value': queue_count, 'conversion_rate': round(queue_count / browse_count * 100, 2) if browse_count > 0 else 0},
        {'name': '预约成功', 'value': reservation_count, 'conversion_rate': round(reservation_count / queue_count * 100, 2) if queue_count > 0 else 0},
        {'name': '实际签到', 'value': checkin_count, 'conversion_rate': round(checkin_count / reservation_count * 100, 2) if reservation_count > 0 else 0},
        {'name': '完成使用', 'value': completed_count, 'conversion_rate': round(completed_count / checkin_count * 100, 2) if checkin_count > 0 else 0},
    ]
    
    return steps


def get_repair_rate(db: Session, filters: dict) -> float:
    area_id = filters.get('area_id')
    start_date = filters.get('start_date')
    end_date = filters.get('end_date')
    
    seat_query = db.query(models.Seat.id)
    if area_id:
        seat_query = seat_query.filter(models.Seat.area_id == area_id)
    total_seats = seat_query.count()
    
    if total_seats == 0:
        return 0.0
    
    repair_query = db.query(models.DeviceRepair).join(models.Seat)
    if area_id:
        repair_query = repair_query.filter(models.Seat.area_id == area_id)
    if start_date:
        repair_query = repair_query.filter(models.DeviceRepair.report_date >= start_date)
    if end_date:
        repair_query = repair_query.filter(models.DeviceRepair.report_date <= end_date)
    
    repair_count = repair_query.count()
    return round(repair_count / total_seats * 100, 2)


def detect_anomalies(db: Session, target_date: date = None) -> list:
    if target_date is None:
        target_date = date.today()
    
    anomalies = []
    anomaly_id = 1
    
    prev_30 = target_date - timedelta(days=30)
    
    areas = db.query(models.Area).all()
    
    for area in areas:
        area_filters = {'area_id': area.id, 'start_date': target_date, 'end_date': target_date}
        baseline_filters = {'area_id': area.id, 'start_date': prev_30, 'end_date': target_date - timedelta(days=1)}
        
        current_util = get_utilization_rate(db, area_filters)
        baseline_util = get_utilization_rate(db, baseline_filters)
        
        change = current_util - baseline_util
        if abs(change) > 20 and baseline_util > 0:
            sample_size = get_sample_size(db, area_filters)
            if sample_size >= 10:
                anomalies.append({
                    'id': anomaly_id,
                    'title': f'{area.area_name} 利用率异常',
                    'description': f'今日利用率较过去30天平均水平{"上升" if change > 0 else "下降"}了{abs(change):.1f}%',
                    'severity': 'high' if abs(change) > 30 else 'medium',
                    'metric_value': current_util,
                    'baseline_value': baseline_util,
                    'change_percent': round(change, 2),
                    'related_dimension': 'area',
                    'related_id': area.id,
                    'date': target_date,
                    'sample_size': sample_size
                })
                anomaly_id += 1
        
        current_repair = get_repair_rate(db, area_filters)
        baseline_repair = get_repair_rate(db, baseline_filters)
        repair_change = current_repair - baseline_repair
        if repair_change > 15 and baseline_repair >= 0:
            repair_count_today = db.query(models.DeviceRepair).join(models.Seat)\
                .filter(models.Seat.area_id == area.id)\
                .filter(models.DeviceRepair.report_date == target_date).count()
            if repair_count_today >= 2:
                anomalies.append({
                    'id': anomaly_id,
                    'title': f'{area.area_name} 设备报修激增',
                    'description': f'今日报修率较过去30天均值上升了{repair_change:.1f}%，请检查设备状况',
                    'severity': 'medium',
                    'metric_value': current_repair,
                    'baseline_value': baseline_repair,
                    'change_percent': round(repair_change, 2),
                    'related_dimension': 'area',
                    'related_id': area.id,
                    'date': target_date,
                    'sample_size': repair_count_today
                })
                anomaly_id += 1
    
    floors = db.query(models.Floor).all()
    for floor in floors:
        floor_filters_today = {'floor_id': floor.id, 'start_date': target_date, 'end_date': target_date}
        floor_filters_baseline = {'floor_id': floor.id, 'start_date': prev_30, 'end_date': target_date - timedelta(days=1)}
        
        current_no_show = get_no_show_rate(db, floor_filters_today)
        baseline_no_show = get_no_show_rate(db, floor_filters_baseline)
        
        change = current_no_show - baseline_no_show
        if change > 10 and baseline_no_show > 0:
            sample_size = get_sample_size(db, floor_filters_today)
            if sample_size >= 10:
                anomalies.append({
                    'id': anomaly_id,
                    'title': f'{floor.floor_name} 爽约率飙升',
                    'description': f'今日爽约率较过去30天平均水平上升了{change:.1f}%',
                    'severity': 'high' if change > 20 else 'medium',
                    'metric_value': current_no_show,
                    'baseline_value': baseline_no_show,
                    'change_percent': round(change, 2),
                    'related_dimension': 'floor',
                    'related_id': floor.id,
                    'date': target_date,
                    'sample_size': sample_size
                })
                anomaly_id += 1
    
    user_groups = db.query(models.UserGroup).all()
    for group in user_groups:
        group_filters_today = {'user_group_id': group.id, 'start_date': target_date, 'end_date': target_date}
        group_filters_baseline = {'user_group_id': group.id, 'start_date': prev_30, 'end_date': target_date - timedelta(days=1)}
        
        current_util = get_utilization_rate(db, group_filters_today)
        baseline_util = get_utilization_rate(db, group_filters_baseline)
        
        change = current_util - baseline_util
        if abs(change) > 25 and baseline_util > 5:
            sample_size = get_sample_size(db, group_filters_today)
            if sample_size >= 10:
                anomalies.append({
                    'id': anomaly_id,
                    'title': f'{group.group_name} 使用量异常',
                    'description': f'今日{group.group_name}利用率较基线{"上升" if change > 0 else "下降"}了{abs(change):.1f}%',
                    'severity': 'medium',
                    'metric_value': current_util,
                    'baseline_value': baseline_util,
                    'change_percent': round(change, 2),
                    'related_dimension': 'user_group',
                    'related_id': group.id,
                    'date': target_date,
                    'sample_size': sample_size
                })
                anomaly_id += 1
    
    time_slots = ['morning', 'afternoon', 'evening']
    for slot in time_slots:
        slot_filters = {'time_slot': slot, 'start_date': target_date, 'end_date': target_date}
        slot_baseline = {'time_slot': slot, 'start_date': prev_30, 'end_date': target_date - timedelta(days=1)}
        
        current_util = get_utilization_rate(db, slot_filters)
        baseline_util = get_utilization_rate(db, slot_baseline)
        
        change = current_util - baseline_util
        if abs(change) > 30 and baseline_util > 10:
            sample_size = get_sample_size(db, slot_filters)
            slot_name = {'morning': '上午', 'afternoon': '下午', 'evening': '晚间'}[slot]
            if sample_size >= 20:
                anomalies.append({
                    'id': anomaly_id,
                    'title': f'{slot_name}时段利用率异常',
                    'description': f'{slot_name}时段利用率较基线{"上升" if change > 0 else "下降"}了{abs(change):.1f}%',
                    'severity': 'medium',
                    'metric_value': current_util,
                    'baseline_value': baseline_util,
                    'change_percent': round(change, 2),
                    'related_dimension': 'time_slot',
                    'related_id': slot,
                    'date': target_date,
                    'sample_size': sample_size
                })
                anomaly_id += 1
    
    anomalies.sort(key=lambda x: abs(x['change_percent']), reverse=True)
    
    return anomalies[:3]
