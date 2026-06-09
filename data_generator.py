import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from database import Database, SensorReading, MaintenanceRecord
from sqlalchemy import and_


class SensorDataGenerator:
    def __init__(self, random_seed: int = 42):
        np.random.seed(random_seed)
        self.equipment_ids = ["EQ-A001", "EQ-A002", "EQ-B001", "EQ-B002", "EQ-C001"]

    def _get_shift(self, hour: int) -> str:
        if 8 <= hour < 16:
            return "早班"
        elif 16 <= hour < 24:
            return "中班"
        else:
            return "晚班"

    def _generate_normal_reading(self, base_temp: float = 65.0) -> Dict:
        temperature = base_temp + np.random.normal(0, 1.5)
        vibration = 2.5 + np.random.normal(0, 0.4)
        current = 15.0 + np.random.normal(0, 0.8)
        rpm = 1800 + np.random.normal(0, 25)
        return {
            "temperature": temperature,
            "vibration": vibration,
            "current": current,
            "rpm": rpm,
        }

    def _generate_bearing_wear_reading(self, severity: float = 1.0) -> Dict:
        temperature = 72.0 + severity * 12 + np.random.normal(0, 2.0)
        vibration = 4.0 + severity * 3.5 + np.random.normal(0, 0.8)
        current = 16.5 + severity * 2.0 + np.random.normal(0, 1.0)
        rpm = 1780 - severity * 40 + np.random.normal(0, 35)
        return {
            "temperature": temperature,
            "vibration": vibration,
            "current": current,
            "rpm": rpm,
        }

    def _generate_sensor_drift_reading(self, drift_factor: float = 1.0) -> Dict:
        base = self._generate_normal_reading()
        base["temperature"] += drift_factor * 8 + np.random.normal(0, 0.5)
        base["vibration"] *= (1 + drift_factor * 0.15)
        base["current"] -= drift_factor * 3
        return base

    def _generate_downtime_reading(self) -> Dict:
        return {
            "temperature": 25.0 + np.random.normal(0, 1.0),
            "vibration": 0.1 + np.random.normal(0, 0.05),
            "current": 0.05 + np.random.normal(0, 0.02),
            "rpm": 0.0 + np.random.normal(0, 1.0),
        }

    def generate_historical_data(
        self,
        start_date: datetime,
        days: int = 30,
        anomaly_ratio: float = 0.08,
        drift_ratio: float = 0.04,
        downtime_ratio: float = 0.05,
        insert_to_db: bool = True
    ) -> pd.DataFrame:
        end_date = start_date + timedelta(days=days)
        total_seconds = int((end_date - start_date).total_seconds())
        timestamps = [start_date + timedelta(seconds=s) for s in range(0, total_seconds, 60)]

        records = []
        equipment_base_temps = {eq: 62 + np.random.uniform(-3, 3) for eq in self.equipment_ids}

        for equipment_id in self.equipment_ids:
            base_temp = equipment_base_temps[equipment_id]
            anomaly_segment_start = None
            drift_segment_start = None
            current_severity = 0

            for i, ts in enumerate(timestamps):
                hour = ts.hour
                shift = self._get_shift(hour)
                rand = np.random.random()

                if anomaly_segment_start is not None:
                    segment_len = i - anomaly_segment_start
                    if segment_len < 300:
                        severity = min(segment_len / 100.0, 2.0)
                        reading = self._generate_bearing_wear_reading(severity)
                        label = "轴承磨损"
                    else:
                        anomaly_segment_start = None
                        reading = self._generate_normal_reading(base_temp)
                        label = "正常"
                elif drift_segment_start is not None:
                    segment_len = i - drift_segment_start
                    if segment_len < 500:
                        drift_factor = min(segment_len / 150.0, 3.0)
                        reading = self._generate_sensor_drift_reading(drift_factor)
                        label = "传感器漂移"
                    else:
                        drift_segment_start = None
                        reading = self._generate_normal_reading(base_temp)
                        label = "正常"
                else:
                    if rand < downtime_ratio:
                        reading = self._generate_downtime_reading()
                        label = "停机检修"
                    elif rand < downtime_ratio + anomaly_ratio:
                        anomaly_segment_start = i
                        reading = self._generate_bearing_wear_reading(0.5)
                        label = "轴承磨损"
                    elif rand < downtime_ratio + anomaly_ratio + drift_ratio:
                        drift_segment_start = i
                        reading = self._generate_sensor_drift_reading(0.3)
                        label = "传感器漂移"
                    else:
                        reading = self._generate_normal_reading(base_temp)
                        label = "正常"

                is_downtime = (label == "停机检修")
                records.append({
                    "equipment_id": equipment_id,
                    "timestamp": ts,
                    "temperature": round(reading["temperature"], 3),
                    "vibration": round(reading["vibration"], 4),
                    "current": round(reading["current"], 3),
                    "rpm": round(reading["rpm"], 2),
                    "shift": shift,
                    "is_downtime": is_downtime,
                    "raw_label": label if not is_downtime else None,
                })

        df = pd.DataFrame(records)

        if insert_to_db:
            self._insert_to_db(df)
            self._generate_maintenance_records(start_date, days)

        return df

    def _insert_to_db(self, df: pd.DataFrame, batch_size: int = 5000):
        session = Database.get_session()
        try:
            records = df.to_dict("records")
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                db_records = [SensorReading(**r) for r in batch]
                session.add_all(db_records)
                session.commit()
                print(f"Inserted {min(i + batch_size, len(records))}/{len(records)} sensor readings")
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def _generate_maintenance_records(self, start_date: datetime, days: int):
        session = Database.get_session()
        try:
            records = []
            for d in range(0, days, 7):
                for equipment_id in self.equipment_ids:
                    if np.random.random() < 0.3:
                        m_start = start_date + timedelta(days=d, hours=np.random.randint(1, 5))
                        m_end = m_start + timedelta(hours=np.random.randint(2, 6))
                        records.append(MaintenanceRecord(
                            equipment_id=equipment_id,
                            start_time=m_start,
                            end_time=m_end,
                            maintenance_type=np.random.choice(["定期检修", "故障维修", "保养"]),
                            description=f"设备{equipment_id}例行维护",
                            operator=np.random.choice(["张工", "李工", "王工", "赵工"])
                        ))
            session.add_all(records)
            session.commit()
            print(f"Generated {len(records)} maintenance records")
        finally:
            session.close()

    def generate_realtime_reading(self, equipment_id: str, label: str = "normal") -> Dict:
        if label == "bearing_wear":
            reading = self._generate_bearing_wear_reading(severity=np.random.uniform(0.5, 1.5))
            raw_label = "轴承磨损"
        elif label == "sensor_drift":
            reading = self._generate_sensor_drift_reading(drift_factor=np.random.uniform(0.5, 2.0))
            raw_label = "传感器漂移"
        elif label == "downtime":
            reading = self._generate_downtime_reading()
            raw_label = None
        else:
            reading = self._generate_normal_reading()
            raw_label = "正常"

        now = datetime.now()
        return {
            "equipment_id": equipment_id,
            "timestamp": now,
            "temperature": round(reading["temperature"], 3),
            "vibration": round(reading["vibration"], 4),
            "current": round(reading["current"], 3),
            "rpm": round(reading["rpm"], 2),
            "shift": self._get_shift(now.hour),
            "is_downtime": label == "downtime",
            "raw_label": raw_label,
        }


class DataLoader:
    @staticmethod
    def load_sensor_data(
        equipment_id: str = None,
        start_time: datetime = None,
        end_time: datetime = None,
        exclude_downtime: bool = True
    ) -> pd.DataFrame:
        session = Database.get_session()
        try:
            query = session.query(SensorReading)
            filters = []
            if equipment_id:
                filters.append(SensorReading.equipment_id == equipment_id)
            if start_time:
                filters.append(SensorReading.timestamp >= start_time)
            if end_time:
                filters.append(SensorReading.timestamp <= end_time)
            if exclude_downtime:
                filters.append(SensorReading.is_downtime == False)
            if filters:
                query = query.filter(and_(*filters))
            query = query.order_by(SensorReading.equipment_id, SensorReading.timestamp)

            df = pd.read_sql(query.statement, session.bind)
            return df
        finally:
            session.close()

    @staticmethod
    def get_maintenance_windows(
        equipment_id: str = None,
        start_time: datetime = None,
        end_time: datetime = None
    ) -> List[Tuple[datetime, datetime]]:
        session = Database.get_session()
        try:
            query = session.query(MaintenanceRecord)
            if equipment_id:
                query = query.filter(MaintenanceRecord.equipment_id == equipment_id)
            if start_time:
                query = query.filter(MaintenanceRecord.end_time >= start_time)
            if end_time:
                query = query.filter(MaintenanceRecord.start_time <= end_time)
            records = query.all()
            return [(r.start_time, r.end_time) for r in records]
        finally:
            session.close()
