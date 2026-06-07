import random
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import Room, Device, EnergyData, Alarm, Workorder, Schedule, Anomaly, ACStrategy, WorkorderAlarm
from app.core.database import SessionLocal, engine, Base, get_db_type


def init_database():
    db_type = get_db_type()
    print(f"数据库类型: {db_type}")
    
    try:
        if db_type == "postgresql":
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
                conn.commit()
    except Exception as e:
        print(f"初始化PostgreSQL扩展时跳过 (可能已存在): {e}")
    
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        room_count = db.query(Room).count()
        if room_count == 0:
            print("正在生成模拟数据...")
            generator = DataGenerator(db)
            generator.generate_all()
            print("模拟数据生成完成！")
        else:
            print("数据库已存在数据，跳过初始化")
    except Exception as e:
        print(f"数据库初始化出错: {e}")
        db.rollback()
    finally:
        db.close()


class DataGenerator:
    def __init__(self, db: Session):
        self.db = db
        self.start_date = datetime.now() - timedelta(days=30)
        self.end_date = datetime.now()
        
    def generate_all(self):
        self._create_rooms()
        self._create_devices()
        self._generate_energy_data()
        self._generate_alarms()
        self._generate_workorders()
        self._generate_schedules()
        self._generate_ac_strategies()
        self._detect_anomalies()
        self.db.commit()
        
    def _create_rooms(self):
        rooms_data = [
            {"name": "机房A101", "building": "信息楼", "capacity": 60},
            {"name": "机房A102", "building": "信息楼", "capacity": 80},
            {"name": "机房B201", "building": "实验楼", "capacity": 50},
            {"name": "机房B202", "building": "实验楼", "capacity": 70},
            {"name": "机房C301", "building": "计算机学院", "capacity": 100},
        ]
        for data in rooms_data:
            room = Room(**data)
            self.db.add(room)
        self.db.flush()
        
    def _create_devices(self):
        rooms = self.db.query(Room).all()
        device_types = ["meter", "ac", "server", "ups"]
        device_names = {
            "meter": ["总电表", "照明电表", "空调电表", "服务器机柜电表"],
            "ac": ["空调主机-1", "空调主机-2", "精密空调-1", "精密空调-2"],
            "server": ["服务器机架-01", "服务器机架-02", "服务器机架-03", "存储服务器"],
            "ups": ["UPS主机", "UPS电池组"]
        }
        
        for room in rooms:
            for dtype in device_types:
                for i, name in enumerate(device_names[dtype][:2]):
                    device = Device(
                        name=f"{room.name}-{name}",
                        type=dtype,
                        room_id=room.id,
                        status="online" if random.random() > 0.1 else "offline",
                        last_seen=self.end_date if random.random() > 0.1 else self.end_date - timedelta(hours=random.randint(1, 24))
                    )
                    self.db.add(device)
        self.db.flush()
        
    def _generate_energy_data(self):
        devices = self.db.query(Device).all()
        current = self.start_date
        
        while current <= self.end_date:
            for device in devices:
                is_offline = device.status == "offline" and random.random() > 0.5
                
                hour = current.hour
                weekday = current.weekday()
                
                base_value = {
                    "meter": 50,
                    "ac": 30,
                    "server": 15,
                    "ups": 5
                }.get(device.type, 10)
                
                hour_factor = 1.0
                if 8 <= hour <= 18:
                    hour_factor = 1.5 + random.uniform(0, 0.5)
                elif 19 <= hour <= 22:
                    hour_factor = 1.2 + random.uniform(0, 0.3)
                else:
                    hour_factor = 0.5 + random.uniform(0, 0.2)
                    
                day_factor = 1.0 if weekday < 5 else 0.7
                
                week_type = "exam" if (current.day >= 15 and current.day <= 21) else "normal"
                if week_type == "exam":
                    hour_factor *= 1.3
                    
                value = base_value * hour_factor * day_factor * random.uniform(0.9, 1.1)
                
                category_map = {
                    "meter": "total",
                    "ac": "ac",
                    "server": "server",
                    "ups": "lighting"
                }
                
                energy = EnergyData(
                    device_id=device.id,
                    timestamp=current,
                    value=0 if is_offline else value,
                    category=category_map.get(device.type, "total"),
                    is_estimated=False
                )
                self.db.add(energy)
            current += timedelta(hours=1)
        self.db.flush()
        
    def _generate_alarms(self):
        devices = self.db.query(Device).filter(Device.type.in_(["server", "ac"])).all()
        levels = ["info", "warning", "critical"]
        messages = {
            "server": [
                "CPU使用率超过90%",
                "内存使用率过高",
                "磁盘空间不足",
                "服务响应超时",
                "网络连接异常"
            ],
            "ac": [
                "温度超过阈值",
                "压缩机高压告警",
                "过滤网需要清洗",
                "风机故障",
                "温度传感器异常"
            ]
        }
        
        for _ in range(150):
            device = random.choice(devices)
            level = random.choices(levels, weights=[0.5, 0.35, 0.15])[0]
            msg = random.choice(messages[device.type])
            alarm_time = self.start_date + timedelta(
                days=random.randint(0, 29),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            alarm = Alarm(
                device_id=device.id,
                level=level,
                message=msg,
                timestamp=alarm_time,
                status=random.choice(["active", "acknowledged", "resolved", "resolved", "resolved"])
            )
            self.db.add(alarm)
        self.db.flush()
        
    def _generate_workorders(self):
        alarms = self.db.query(Alarm).filter(Alarm.level.in_(["warning", "critical"])).all()
        titles = [
            "服务器告警处理",
            "空调故障维修",
            "设备例行维护",
            "系统性能优化",
            "网络故障排查",
            "硬件更换"
        ]
        
        for i in range(40):
            wo = Workorder(
                title=random.choice(titles),
                description=f"工单描述：处理相关设备告警和故障，确保机房正常运行。工单编号：WO{1000+i}",
                status=random.choice(["pending", "processing", "completed", "completed"]),
                priority=random.choice(["low", "medium", "medium", "high"]),
                assignee=random.choice(["张工", "李工", "王工", "赵工"])
            )
            self.db.add(wo)
            self.db.flush()
            
            num_alarms = random.randint(0, 3)
            selected_alarms = random.sample(alarms, min(num_alarms, len(alarms)))
            for alarm in selected_alarms:
                wa = WorkorderAlarm(workorder_id=wo.id, alarm_id=alarm.id)
                self.db.add(wa)
        self.db.flush()
        
    def _generate_schedules(self):
        rooms = self.db.query(Room).all()
        courses = [
            "计算机组成原理", "数据结构", "操作系统", "计算机网络",
            "数据库系统", "软件工程", "人工智能", "机器学习",
            "Python程序设计", "Java开发", "C++编程", "算法设计"
        ]
        
        current = self.start_date
        while current <= self.end_date:
            if current.weekday() < 5:
                week_type = "exam" if (current.day >= 15 and current.day <= 21) else "normal"
                
                for room in rooms:
                    num_courses = random.randint(2, 6) if week_type == "normal" else random.randint(4, 8)
                    hours_used = set()
                    
                    for _ in range(num_courses):
                        start_hour = random.choice([h for h in range(8, 20) if h not in hours_used])
                        if not hours_used:
                            duration = random.choice([2, 3])
                            for h in range(start_hour, min(start_hour + duration, 21)):
                                hours_used.add(h)
                                
                            schedule = Schedule(
                                room_id=room.id,
                                course_name=random.choice(courses),
                                start_time=current.replace(hour=start_hour, minute=0, second=0),
                                end_time=current.replace(hour=min(start_hour + duration, 20), minute=0, second=0),
                                student_count=random.randint(30, room.capacity),
                                week_type=week_type
                            )
                            self.db.add(schedule)
            current += timedelta(days=1)
        self.db.flush()
        
    def _generate_ac_strategies(self):
        rooms = self.db.query(Room).all()
        modes = ["cool", "auto"]
        fan_speeds = ["low", "medium", "high"]
        
        current = self.start_date
        while current <= self.end_date:
            for room in rooms:
                if random.random() > 0.3:
                    hour = current.hour
                    base_temp = 24 if 8 <= hour <= 20 else 26
                    
                    ac = ACStrategy(
                        room_id=room.id,
                        timestamp=current,
                        target_temp=base_temp + random.uniform(-1, 2),
                        mode=random.choice(modes),
                        fan_speed=random.choice(fan_speeds)
                    )
                    self.db.add(ac)
            current += timedelta(hours=3)
        self.db.flush()
        
    def _detect_anomalies(self):
        energy_data = self.db.query(EnergyData).all()
        values = [e.value for e in energy_data if e.value > 0]
        mean_val = np.mean(values)
        std_val = np.std(values)
        
        for ed in energy_data:
            if ed.value > 0:
                z_score = (ed.value - mean_val) / std_val if std_val > 0 else 0
                if abs(z_score) > 1.5:
                    severity = "high" if abs(z_score) > 2.5 else "medium" if abs(z_score) > 2 else "low"
                    
                    anomaly = Anomaly(
                        energy_data_id=ed.id,
                        timestamp=ed.timestamp,
                        value=ed.value,
                        expected_value=mean_val,
                        deviation=z_score,
                        severity=severity,
                        comment=None
                    )
                    self.db.add(anomaly)
        self.db.flush()
