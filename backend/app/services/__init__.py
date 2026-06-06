from sqlalchemy.orm import Session
from sqlalchemy import func, and_, between
from datetime import datetime, timedelta
from typing import Optional, List
from app.models import Room, Device, EnergyData, Alarm, Workorder, Schedule, Anomaly, ACStrategy, WorkorderAlarm
from app import schemas


class EnergyService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_overview_metrics(self, room_ids: Optional[List[str]] = None):
        query = self.db.query(EnergyData)
        if room_ids:
            query = query.join(Device).filter(Device.room_id.in_(room_ids))
        
        end_time = datetime.now()
        start_time_today = end_time.replace(hour=0, minute=0, second=0, microsecond=0)
        start_time_yesterday = start_time_today - timedelta(days=1)
        
        energy_today = query.filter(
            EnergyData.timestamp >= start_time_today,
            EnergyData.category == "total"
        ).with_entities(func.sum(EnergyData.value)).scalar() or 0
        
        energy_yesterday = query.filter(
            EnergyData.timestamp >= start_time_yesterday,
            EnergyData.timestamp < start_time_today,
            EnergyData.category == "total"
        ).with_entities(func.sum(EnergyData.value)).scalar() or 0
        
        compared = ((energy_today - energy_yesterday) / energy_yesterday * 100) if energy_yesterday > 0 else 0
        
        device_query = self.db.query(Device)
        if room_ids:
            device_query = device_query.filter(Device.room_id.in_(room_ids))
        online_devices = device_query.filter(Device.status == "online").count()
        
        pending_wo = self.db.query(Workorder).filter(Workorder.status.in_(["pending", "processing"])).count()
        
        trend_data = query.filter(
            EnergyData.timestamp >= start_time_today - timedelta(days=6),
            EnergyData.category == "total"
        ).order_by(EnergyData.timestamp).all()
        
        trend_values = []
        current_day = start_time_today - timedelta(days=6)
        while current_day <= end_time:
            day_start = current_day.replace(hour=0, minute=0, second=0)
            day_end = day_start + timedelta(days=1)
            day_sum = sum(
                ed.value for ed in trend_data 
                if day_start <= ed.timestamp < day_end
            )
            trend_values.append(round(day_sum, 2))
            current_day += timedelta(days=1)
        
        total_it_energy = query.filter(
            EnergyData.timestamp >= start_time_today,
            EnergyData.category.in_(["server", "ac"])
        ).with_entities(func.sum(EnergyData.value)).scalar() or 0
        
        pue = (energy_today / total_it_energy) if total_it_energy > 0 else 1.35
        
        return schemas.OverviewMetrics(
            totalEnergy=round(energy_today, 2),
            pue=round(pue, 2),
            onlineDevices=online_devices,
            pendingWorkorders=pending_wo,
            energyTrend=trend_values,
            comparedToYesterday=round(compared, 1)
        )
    
    def get_energy_trend(
        self, 
        start_time: datetime, 
        end_time: datetime,
        room_ids: Optional[List[str]] = None,
        categories: Optional[List[str]] = None,
        include_maintenance: bool = False
    ):
        query = self.db.query(EnergyData, Device).join(Device, EnergyData.device_id == Device.id)
        
        if room_ids:
            query = query.filter(Device.room_id.in_(room_ids))
        if categories:
            query = query.filter(EnergyData.category.in_(categories))
        if not include_maintenance:
            query = query.filter(Device.status != "maintenance")
            
        query = query.filter(
            between(EnergyData.timestamp, start_time, end_time)
        ).order_by(EnergyData.timestamp)
        
        results = query.all()
        
        trend_data = []
        for ed, device in results:
            is_offline = device.status == "offline"
            trend_data.append(schemas.EnergyTrendPoint(
                timestamp=ed.timestamp,
                value=ed.value if not is_offline else 0,
                category=ed.category,
                deviceId=device.id,
                isOffline=is_offline
            ))
        
        return trend_data
    
    def get_energy_breakdown(
        self,
        start_time: datetime,
        end_time: datetime,
        room_ids: Optional[List[str]] = None
    ):
        query = self.db.query(
            EnergyData.category,
            func.sum(EnergyData.value).label("total")
        ).join(Device).filter(
            between(EnergyData.timestamp, start_time, end_time)
        )
        
        if room_ids:
            query = query.filter(Device.room_id.in_(room_ids))
            
        query = query.group_by(EnergyData.category)
        results = query.all()
        
        total = sum(r.total for r in results) if results else 1
        breakdown = []
        category_names = {
            "total": "总能耗",
            "ac": "空调能耗",
            "server": "服务器能耗",
            "lighting": "照明能耗"
        }
        
        for category, value in results:
            if category != "total":
                breakdown.append(schemas.EnergyBreakdownItem(
                    category=category_names.get(category, category),
                    value=round(value, 2),
                    percentage=round(value / total * 100, 1) if total > 0 else 0
                ))
        
        return breakdown
    
    def compare_weeks(
        self,
        exam_week_start: datetime,
        normal_week_start: datetime,
        room_ids: Optional[List[str]] = None
    ):
        def get_week_data(start: datetime):
            end = start + timedelta(days=7)
            data = self.get_energy_trend(start, end, room_ids=room_ids, categories=["total"])
            hourly = {}
            for point in data:
                hour_key = point.timestamp.strftime("%Y-%m-%d %H:00")
                hourly[hour_key] = hourly.get(hour_key, 0) + point.value
            return [{"time": k, "value": round(v, 2)} for k, v in sorted(hourly.items())]
        
        exam_data = get_week_data(exam_week_start)
        normal_data = get_week_data(normal_week_start)
        
        exam_total = sum(d["value"] for d in exam_data)
        normal_total = sum(d["value"] for d in normal_data)
        diff_pct = ((exam_total - normal_total) / normal_total * 100) if normal_total > 0 else 0
        
        return {
            "exam_week": exam_data,
            "normal_week": normal_data,
            "exam_total": round(exam_total, 2),
            "normal_total": round(normal_total, 2),
            "difference_percent": round(diff_pct, 1)
        }


class AnomalyService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_anomalies(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        severity: Optional[str] = None,
        room_ids: Optional[List[str]] = None
    ):
        query = self.db.query(Anomaly).order_by(Anomaly.timestamp.desc())
        
        if start_time:
            query = query.filter(Anomaly.timestamp >= start_time)
        if end_time:
            query = query.filter(Anomaly.timestamp <= end_time)
        if severity:
            query = query.filter(Anomaly.severity == severity)
            
        return query.limit(100).all()
    
    def get_anomaly_detail(self, anomaly_id: str):
        anomaly = self.db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
        if not anomaly:
            return None
        
        time_window_start = anomaly.timestamp - timedelta(hours=1)
        time_window_end = anomaly.timestamp + timedelta(hours=1)
        
        energy_data = self.db.query(EnergyData).filter(
            EnergyData.id == anomaly.energy_data_id
        ).first()
        
        device = None
        if energy_data:
            device = self.db.query(Device).filter(Device.id == energy_data.device_id).first()
        
        room_id = device.room_id if device else None
        
        related_schedules = self.db.query(Schedule).filter(
            and_(
                Schedule.start_time <= time_window_end,
                Schedule.end_time >= time_window_start
            )
        )
        if room_id:
            related_schedules = related_schedules.filter(Schedule.room_id == room_id)
        related_schedules = related_schedules.all()
        
        related_alarms = self.db.query(Alarm).filter(
            between(Alarm.timestamp, time_window_start, time_window_end)
        ).all()
        
        alarm_ids = [a.id for a in related_alarms]
        related_workorders = []
        if alarm_ids:
            wo_alarms = self.db.query(WorkorderAlarm).filter(
                WorkorderAlarm.alarm_id.in_(alarm_ids)
            ).all()
            wo_ids = list(set(wa.workorder_id for wa in wo_alarms))
            if wo_ids:
                related_workorders = self.db.query(Workorder).filter(
                    Workorder.id.in_(wo_ids)
                ).all()
        
        ac_strategy = None
        if room_id:
            ac_strategy = self.db.query(ACStrategy).filter(
                ACStrategy.room_id == room_id,
                between(ACStrategy.timestamp, time_window_start, time_window_end)
            ).order_by(ACStrategy.timestamp.desc()).first()
        
        possible_causes = []
        if related_schedules:
            possible_causes.append("课程安排导致设备使用率增加")
        if related_alarms:
            possible_causes.append("设备异常或故障告警")
        if ac_strategy and ac_strategy.mode == "cool" and (ac_strategy.target_temp or 26) < 24:
            possible_causes.append("空调低温运行策略")
        if anomaly.deviation and anomaly.deviation > 2:
            possible_causes.append("能耗显著高于历史平均值，建议进一步排查")
        if not possible_causes:
            possible_causes.append("暂无明确关联因素，建议人工核查")
        
        alarm_schemas = []
        for alarm in related_alarms:
            dev = self.db.query(Device).filter(Device.id == alarm.device_id).first()
            alarm_schemas.append(schemas.Alarm(
                id=alarm.id,
                device_id=alarm.device_id,
                device_name=dev.name if dev else None,
                level=alarm.level,
                message=alarm.message,
                timestamp=alarm.timestamp,
                status=alarm.status,
                created_at=alarm.created_at
            ))
        
        wo_schemas = []
        for wo in related_workorders:
            wo_alm = self.db.query(WorkorderAlarm).filter(
                WorkorderAlarm.workorder_id == wo.id
            ).all()
            wo_schemas.append(schemas.Workorder(
                id=wo.id,
                title=wo.title,
                description=wo.description,
                status=wo.status,
                priority=wo.priority,
                created_at=wo.created_at,
                assignee=wo.assignee,
                related_alarm_ids=[wa.alarm_id for wa in wo_alm]
            ))
        
        return schemas.AnomalyDetail(
            id=anomaly.id,
            energy_data_id=anomaly.energy_data_id,
            timestamp=anomaly.timestamp,
            value=anomaly.value,
            expected_value=anomaly.expected_value,
            deviation=anomaly.deviation,
            severity=anomaly.severity,
            comment=anomaly.comment,
            possible_causes=possible_causes,
            related_schedule=[schemas.Schedule.model_validate(s) for s in related_schedules],
            related_alarms=alarm_schemas,
            related_workorders=wo_schemas,
            ac_strategy={
                "target_temp": ac_strategy.target_temp,
                "mode": ac_strategy.mode,
                "fan_speed": ac_strategy.fan_speed
            } if ac_strategy else None,
            created_at=anomaly.created_at
        )
    
    def add_comment(self, anomaly_id: str, comment: str):
        anomaly = self.db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
        if anomaly:
            anomaly.comment = comment
            self.db.commit()
            return True
        return False


class AlarmWorkorderService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_alarms(
        self,
        status: Optional[str] = None,
        level: Optional[str] = None,
        limit: int = 50
    ):
        query = self.db.query(Alarm).order_by(Alarm.timestamp.desc())
        if status:
            query = query.filter(Alarm.status == status)
        if level:
            query = query.filter(Alarm.level == level)
        
        alarms = query.limit(limit).all()
        result = []
        for alarm in alarms:
            device = self.db.query(Device).filter(Device.id == alarm.device_id).first()
            result.append(schemas.Alarm(
                id=alarm.id,
                device_id=alarm.device_id,
                device_name=device.name if device else None,
                level=alarm.level,
                message=alarm.message,
                timestamp=alarm.timestamp,
                status=alarm.status,
                created_at=alarm.created_at
            ))
        return result
    
    def get_workorders(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 50
    ):
        query = self.db.query(Workorder).order_by(Workorder.created_at.desc())
        if status:
            query = query.filter(Workorder.status == status)
        if priority:
            query = query.filter(Workorder.priority == priority)
        
        workorders = query.limit(limit).all()
        result = []
        for wo in workorders:
            wo_alm = self.db.query(WorkorderAlarm).filter(
                WorkorderAlarm.workorder_id == wo.id
            ).all()
            result.append(schemas.Workorder(
                id=wo.id,
                title=wo.title,
                description=wo.description,
                status=wo.status,
                priority=wo.priority,
                created_at=wo.created_at,
                assignee=wo.assignee,
                related_alarm_ids=[wa.alarm_id for wa in wo_alm]
            ))
        return result
    
    def get_device_status(self, room_ids: Optional[List[str]] = None):
        query = self.db.query(Device)
        if room_ids:
            query = query.filter(Device.room_id.in_(room_ids))
        
        devices = query.all()
        return [schemas.Device.model_validate(d) for d in devices]


class FilterService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_filter_options(self):
        rooms = self.db.query(Room).all()
        return schemas.FilterOptions(
            rooms=[schemas.Room.model_validate(r) for r in rooms],
            weekTypes=["all", "normal", "exam"],
            deviceTypes=["meter", "ac", "server", "ups"]
        )
    
    def get_schedules(
        self,
        start_time: datetime,
        end_time: datetime,
        room_ids: Optional[List[str]] = None,
        week_type: Optional[str] = None
    ):
        query = self.db.query(Schedule).filter(
            and_(
                Schedule.start_time >= start_time,
                Schedule.end_time <= end_time
            )
        )
        if room_ids:
            query = query.filter(Schedule.room_id.in_(room_ids))
        if week_type and week_type != "all":
            query = query.filter(Schedule.week_type == week_type)
        
        return [schemas.Schedule.model_validate(s) for s in query.all()]
