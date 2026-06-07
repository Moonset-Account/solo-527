import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from backend.db.database import SessionLocal, engine
from backend.db.models import Base, Store, Coach, Course, MemberType, Member, \
    Booking, Checkin, BodyMeasurement, PTPurchase, Feedback, Suspension

def generate_mock_data():
    db = SessionLocal()
    
    try:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        
        stores = [
            Store(name="朝阳旗舰店", city="北京", address="朝阳区建国路88号"),
            Store(name="海淀分店", city="北京", address="海淀区中关村大街1号"),
            Store(name="浦东分店", city="上海", address="浦东新区陆家嘴环路100号"),
        ]
        db.add_all(stores)
        db.flush()
        
        member_types = [
            MemberType(name="月卡", description="月度会员", price_monthly=299),
            MemberType(name="季卡", description="季度会员", price_monthly=249),
            MemberType(name="年卡", description="年度会员", price_monthly=199),
            MemberType(name="私教会员", description="含私教课的高级会员", price_monthly=599),
        ]
        db.add_all(member_types)
        db.flush()
        
        courses = [
            Course(name="瑜伽基础", category="瑜伽", duration=60, capacity=20),
            Course(name="动感单车", category="有氧", duration=45, capacity=30),
            Course(name="力量训练", category="力量", duration=60, capacity=15),
            Course(name="HIIT燃脂", category="有氧", duration=30, capacity=25),
            Course(name="普拉提", category="瑜伽", duration=50, capacity=12),
            Course(name="拳击课", category="格斗", duration=60, capacity=10),
            Course(name="游泳课", category="水上", duration=45, capacity=15),
        ]
        db.add_all(courses)
        db.flush()
        
        coach_names = ["张教练", "李教练", "王教练", "刘教练", "陈教练", 
                       "杨教练", "赵教练", "黄教练", "周教练", "吴教练"]
        specialties = ["力量训练", "瑜伽", "有氧", "私教", "康复", "拳击"]
        levels = ["初级", "中级", "高级", "资深"]
        
        coaches = []
        for i, name in enumerate(coach_names):
            coach = Coach(
                name=name,
                store_id=stores[i % len(stores)].id,
                specialty=random.choice(specialties),
                level=random.choice(levels),
                hire_date=datetime(2022 + random.randint(0, 2), random.randint(1, 12), 1).date()
            )
            coaches.append(coach)
        db.add_all(coaches)
        db.flush()
        
        first_names = ["王", "李", "张", "刘", "陈", "杨", "黄", "赵", "周", "吴", 
                       "徐", "孙", "马", "朱", "胡", "郭", "何", "高", "林", "罗"]
        last_names = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "洋", "艳",
                      "勇", "军", "杰", "娟", "涛", "明", "超", "秀兰", "霞", "平"]
        
        members = []
        for i in range(500):
            join_date = datetime(2024, 1, 1) + timedelta(days=random.randint(0, 365))
            expire_date = join_date + timedelta(days=random.randint(30, 365))
            
            member = Member(
                name=random.choice(first_names) + random.choice(last_names),
                phone=f"1{random.randint(3, 9)}{random.randint(100000000, 999999999)}",
                gender=random.choice(["男", "女"]),
                age=random.randint(18, 60),
                member_type_id=member_types[random.choices([0, 1, 2, 3], weights=[0.3, 0.3, 0.25, 0.15])[0]].id,
                store_id=stores[random.randint(0, len(stores)-1)].id,
                join_date=join_date.date(),
                expire_date=expire_date.date(),
                status=random.choice(["active", "active", "active", "active", "expired"])
            )
            members.append(member)
        db.add_all(members)
        db.flush()
        
        for member in members:
            if random.random() < 0.15:
                susp_start = member.join_date + timedelta(days=random.randint(30, 180))
                susp_end = susp_start + timedelta(days=random.randint(7, 60))
                suspension = Suspension(
                    member_id=member.id,
                    start_date=susp_start,
                    end_date=susp_end,
                    reason=random.choice(["生病", "出差", "受伤", "怀孕", "未说明"])
                )
                db.add(suspension)
        
        db.flush()
        
        checkins = []
        bookings = []
        for member in members:
            if member.status != "active":
                continue
                
            member_join_date = pd.Timestamp(member.join_date)
            today = pd.Timestamp(datetime.now().date())
            
            active_days = (today - member_join_date).days
            if active_days <= 0:
                continue
                
            avg_freq = random.uniform(0.5, 4)
            total_visits = max(0, int(active_days / 7 * avg_freq))
            
            for _ in range(total_visits):
                visit_offset = random.randint(0, active_days)
                visit_date = member_join_date + timedelta(days=visit_offset)
                
                is_suspended = db.query(Suspension).filter(
                    Suspension.member_id == member.id,
                    Suspension.start_date <= visit_date.date(),
                    Suspension.end_date >= visit_date.date()
                ).first()
                
                if is_suspended:
                    continue
                
                if visit_date > today:
                    continue
                
                checkin_hour = random.randint(6, 22)
                checkin_time = visit_date + timedelta(hours=checkin_hour, minutes=random.randint(0, 59))
                checkout_time = checkin_time + timedelta(minutes=random.randint(30, 120))
                
                if random.random() < 0.7:
                    course = random.choice(courses)
                    coach = random.choice(coaches)
                    booking = Booking(
                        member_id=member.id,
                        course_id=course.id,
                        coach_id=coach.id,
                        store_id=member.store_id,
                        booking_date=visit_date.date(),
                        booking_time=checkin_time.time(),
                        status=random.choice(["checked_in", "checked_in", "checked_in", "cancelled"])
                    )
                    bookings.append(booking)
                    db.flush()
                    booking_id = booking.id
                else:
                    booking_id = None
                
                checkin = Checkin(
                    member_id=member.id,
                    store_id=member.store_id,
                    checkin_time=checkin_time,
                    checkout_time=checkout_time,
                    booking_id=booking_id
                )
                checkins.append(checkin)
        
        db.add_all(bookings)
        db.add_all(checkins)
        db.flush()
        
        for member in members[:200]:
            for _ in range(random.randint(1, 3)):
                measure_date = member.join_date + timedelta(days=random.randint(0, 180))
                bmi = random.uniform(18, 32)
                body_measurement = BodyMeasurement(
                    member_id=member.id,
                    coach_id=random.choice(coaches).id,
                    measure_date=measure_date,
                    height=random.uniform(155, 190),
                    weight=random.uniform(45, 100),
                    body_fat=random.uniform(10, 35),
                    muscle_mass=random.uniform(25, 60),
                    bmi=bmi,
                    notes="常规体测"
                )
                db.add(body_measurement)
        
        for member in members[:150]:
            coach = random.choice(coaches)
            pt_purchase = PTPurchase(
                member_id=member.id,
                coach_id=coach.id,
                purchase_date=member.join_date + timedelta(days=random.randint(0, 60)),
                sessions=random.choice([10, 20, 30, 50]),
                price=random.choice([3000, 5000, 8000, 12000]),
                used_sessions=random.randint(0, 20)
            )
            db.add(pt_purchase)
        
        for member in members[:300]:
            feedback = Feedback(
                member_id=member.id,
                coach_id=random.choice(coaches).id if random.random() < 0.6 else None,
                course_id=random.choice(courses).id if random.random() < 0.4 else None,
                rating=random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.05, 0.2, 0.4, 0.3])[0],
                content=random.choice(["教练很专业", "环境不错", "课程安排合理", "需要改进", "非常满意", "一般般"]),
                feedback_date=member.join_date + timedelta(days=random.randint(7, 90))
            )
            db.add(feedback)
        
        db.commit()
        print("模拟数据生成完成！")
        print(f"生成 {len(stores)} 个门店")
        print(f"生成 {len(coaches)} 个教练")
        print(f"生成 {len(courses)} 个课程")
        print(f"生成 {len(members)} 个会员")
        print(f"生成 {len(checkins)} 条签到记录")
        print(f"生成 {len(bookings)} 条预约记录")
        
    except Exception as e:
        db.rollback()
        print(f"生成数据失败: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    generate_mock_data()
