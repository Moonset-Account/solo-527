import random
from datetime import date, datetime, timedelta
from database import SessionLocal, engine
import models
from sqlalchemy.orm import Session

models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    floors_data = [
        {'floor_number': 1, 'floor_name': '一层自习区', 'total_seats': 120, 'description': '入口层，开放自习区'},
        {'floor_number': 2, 'floor_name': '二层研讨区', 'total_seats': 100, 'description': '小组讨论和静音区'},
        {'floor_number': 3, 'floor_name': '三层专业区', 'total_seats': 80, 'description': '研究生和专业书籍区'},
        {'floor_number': 4, 'floor_name': '四层电子区', 'total_seats': 60, 'description': '电子阅览和机房'},
    ]
    
    for f in floors_data:
        floor = models.Floor(**f)
        db.add(floor)
    db.commit()
    
    areas_data = [
        {'area_name': '北区靠窗', 'floor_id': 1, 'total_seats': 40, 'seat_type': 'single'},
        {'area_name': '南区大厅', 'floor_id': 1, 'total_seats': 80, 'seat_type': 'single'},
        {'area_name': '研讨室A', 'floor_id': 2, 'total_seats': 30, 'seat_type': 'group'},
        {'area_name': '静音区B', 'floor_id': 2, 'total_seats': 70, 'seat_type': 'single'},
        {'area_name': '研究生专区', 'floor_id': 3, 'total_seats': 50, 'seat_type': 'single'},
        {'area_name': '专业阅览', 'floor_id': 3, 'total_seats': 30, 'seat_type': 'single'},
        {'area_name': '电子阅览', 'floor_id': 4, 'total_seats': 40, 'seat_type': 'computer'},
        {'area_name': '机房区', 'floor_id': 4, 'total_seats': 20, 'seat_type': 'computer'},
    ]
    
    for a in areas_data:
        area = models.Area(**a)
        db.add(area)
    db.commit()
    
    areas = db.query(models.Area).all()
    seat_id = 1
    for area in areas:
        cols = 8
        rows = (area.total_seats + cols - 1) // cols
        for i in range(area.total_seats):
            row = i // cols
            col = i % cols
            seat = models.Seat(
                seat_code=f'F{area.floor_id}-{area.id}-{i+1:03d}',
                area_id=area.id,
                seat_type=area.seat_type,
                has_power=random.random() > 0.1,
                has_window=col == 0 or col == cols - 1,
                is_disabled=random.random() > 0.95,
                grid_x=col,
                grid_y=row
            )
            db.add(seat)
            seat_id += 1
    db.commit()
    
    user_groups = ['本科生', '研究生', '教职工', '访问学者']
    for g in user_groups:
        db.add(models.UserGroup(group_name=g))
    db.commit()
    
    today = date(2026, 6, 7)
    
    exam_weeks = [
        {'week_start': date(2026, 1, 12), 'week_end': date(2026, 1, 25), 'semester': '2025-2026秋', 'is_exam_week': True},
        {'week_start': date(2026, 6, 2), 'week_end': date(2026, 6, 15), 'semester': '2025-2026春', 'is_exam_week': True},
    ]
    for ew in exam_weeks:
        db.add(models.ExamWeek(**ew))
    db.commit()
    
    seats = db.query(models.Seat).filter(models.Seat.is_disabled == False).all()
    groups = db.query(models.UserGroup).all()
    
    start_date = today - timedelta(days=60)
    date_range = [start_date + timedelta(days=i) for i in range(61)]
    
    time_slots = [
        ('08:00', '10:00'), ('10:00', '12:00'),
        ('12:00', '14:00'), ('14:00', '16:00'),
        ('16:00', '18:00'), ('18:00', '20:00'),
        ('20:00', '22:00')
    ]
    
    reservation_id = 1
    queue_id = 1
    repair_id = 1
    
    for d in date_range:
        is_exam = any(ew['week_start'] <= d <= ew['week_end'] for ew in exam_weeks)
        is_weekend = d.weekday() >= 5
        
        base_multiplier = 1.3 if is_exam else 0.8 if is_weekend else 1.0
        
        daily_reservations = int(len(seats) * 3 * base_multiplier)
        
        for _ in range(daily_reservations):
            seat = random.choice(seats)
            group = random.choice(groups)
            start_t, end_t = random.choice(time_slots)
            
            rand = random.random()
            if rand < 0.75:
                status = 'completed'
                checkin_time = datetime.combine(d, datetime.strptime(start_t, '%H:%M').time())
                checkout_time = datetime.combine(d, datetime.strptime(end_t, '%H:%M').time())
            elif rand < 0.85:
                status = 'no_show'
                checkin_time = None
                checkout_time = None
            elif rand < 0.95:
                status = 'checked_in'
                checkin_time = datetime.combine(d, datetime.strptime(start_t, '%H:%M').time())
                checkout_time = None
            else:
                status = 'cancelled'
                checkin_time = None
                checkout_time = None
            
            reservation = models.Reservation(
                seat_id=seat.id,
                user_group_id=group.id,
                reservation_date=d,
                start_time=start_t,
                end_time=end_t,
                status=status,
                checkin_time=checkin_time,
                checkout_time=checkout_time
            )
            db.add(reservation)
            
            if status == 'no_show':
                db.add(models.NoShowRecord(
                    reservation_id=reservation_id,
                    user_group_id=group.id,
                    record_date=d,
                    reason=random.choice(['临时有事', '忘记签到', '找到其他座位', None])
                ))
            
            reservation_id += 1
        
        daily_queue = int(daily_reservations * 0.3)
        for _ in range(daily_queue):
            area = random.choice(areas)
            group = random.choice(groups)
            queue_time = random.choice(['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'])
            
            db.add(models.WaitQueue(
                area_id=area.id,
                user_group_id=group.id,
                queue_date=d,
                queue_time=queue_time,
                queue_position=random.randint(1, 15),
                wait_duration=round(random.uniform(5, 45), 1),
                is_served=random.random() > 0.3
            ))
            queue_id += 1
        
        if random.random() < 0.3:
            seat = random.choice(seats)
            db.add(models.DeviceRepair(
                seat_id=seat.id,
                report_date=d,
                repair_date=d + timedelta(days=random.randint(0, 3)) if random.random() > 0.2 else None,
                issue_type=random.choice(['电源故障', '座椅损坏', '灯光问题', '桌面损坏', '网络故障']),
                status=random.choice(['pending', 'in_progress', 'completed']),
                description='设备损坏需要维修'
            ))
            repair_id += 1
    
    db.add(models.DataImportLog(
        import_date=datetime.now(),
        source_file='generated_mock_data',
        records_count=reservation_id + queue_id + repair_id,
        status='success',
        notes='模拟数据生成完成'
    ))
    
    db.commit()
    print(f"数据生成完成！共生成:")
    print(f"  - 座位: {len(seats)} 个")
    print(f"  - 预约记录: {reservation_id - 1} 条")
    print(f"  - 排队记录: {queue_id - 1} 条")
    print(f"  - 报修记录: {repair_id - 1} 条")
    
except Exception as e:
    db.rollback()
    print(f"错误: {e}")
    raise
finally:
    db.close()
