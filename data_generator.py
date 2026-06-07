import os
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
from dataclasses import dataclass, field


@dataclass
class ThresholdConfig:
    min_temp: float = 2.0
    max_temp: float = 8.0
    min_sample_count: int = 3


@dataclass
class ShipmentRecord:
    box_id: str
    batch_no: str
    route: str
    from_station: str
    to_station: str
    temperature_samples: List[Dict] = field(default_factory=list)
    signoff_time: Optional[datetime] = None
    status: str = "completed"
    review_status: str = "none"
    review_note: str = ""
    signoff_photo_url: str = ""


class ColdChainDataGenerator:
    def __init__(self, seed: int = 42):
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)
        
        self.routes = [
            "北京-上海", "北京-广州", "上海-深圳", "广州-成都",
            "北京-成都", "上海-武汉", "广州-西安", "深圳-杭州",
            "成都-重庆", "武汉-长沙", "西安-郑州", "杭州-南京"
        ]
        
        self.stations = [
            "北京CDC", "上海CDC", "广州CDC", "深圳CDC", "成都CDC",
            "武汉CDC", "西安CDC", "杭州CDC", "重庆CDC", "长沙CDC",
            "郑州CDC", "南京CDC"
        ]
        
        self.vaccine_types = ["HPV", "新冠灭活", "流感", "乙肝", "百白破", "麻腮风"]

    def generate_shipments(self, count: int = 200, start_date: datetime = None) -> List[ShipmentRecord]:
        if start_date is None:
            start_date = datetime.now() - timedelta(days=60)
        
        shipments = []
        
        for i in range(count):
            route = random.choice(self.routes)
            from_station, to_station = route.split("-")
            from_station += "CDC"
            to_station += "CDC"
            
            batch_no = f"B{random.randint(20240000, 20259999)}"
            box_id = f"BOX{str(i+1).zfill(6)}"
            
            shipment_date = start_date + timedelta(
                days=random.randint(0, 60),
                hours=random.randint(0, 23)
            )
            
            duration_hours = random.uniform(4, 72)
            sample_interval = random.uniform(10, 30)
            n_samples = max(1, int(duration_hours * 60 / sample_interval))
            
            base_temp = random.uniform(3.5, 6.5)
            temp_variation = np.random.normal(0, 0.8, n_samples)
            
            anomaly_type = random.choices(
                ["none", "minor", "major", "sensor_fault", "missing"],
                weights=[0.6, 0.15, 0.08, 0.07, 0.10]
            )[0]
            
            samples = []
            current_time = shipment_date
            
            for j in range(n_samples):
                temp = base_temp + temp_variation[j]
                
                is_anomaly = False
                anomaly_reason = ""
                
                if anomaly_type == "minor" and random.random() < 0.2:
                    temp += random.choice([-3, 3])
                    is_anomaly = True
                    anomaly_reason = "轻微超温"
                elif anomaly_type == "major" and random.random() < 0.1:
                    temp += random.choice([-8, 8])
                    is_anomaly = True
                    anomaly_reason = "严重超温"
                elif anomaly_type == "sensor_fault" and random.random() < 0.05:
                    temp = random.choice([-99, 99, None])
                    is_anomaly = True
                    anomaly_reason = "传感器故障"
                elif anomaly_type == "missing" and random.random() < 0.15:
                    temp = None
                    is_anomaly = True
                    anomaly_reason = "数据缺失"
                
                sample_time = current_time + timedelta(minutes=j * sample_interval)
                
                samples.append({
                    "timestamp": sample_time,
                    "temperature": temp,
                    "is_anomaly": is_anomaly,
                    "anomaly_reason": anomaly_reason,
                    "is_cleaned": False,
                    "cleaned_reason": ""
                })
            
            signoff_time = shipment_date + timedelta(hours=duration_hours)
            
            review_status = random.choices(
                ["none", "pending", "appealed", "resolved"],
                weights=[0.75, 0.10, 0.10, 0.05]
            )[0]
            
            review_note = ""
            if review_status == "appealed":
                review_note = f"站点{to_station}申诉：环境温度波动，设备正常"
            elif review_status == "pending":
                review_note = "待复核"
            elif review_status == "resolved":
                review_note = "已确认合规"
            
            photo_seed = abs(hash(box_id)) % 1000
            
            shipment = ShipmentRecord(
                box_id=box_id,
                batch_no=batch_no,
                route=route,
                from_station=from_station,
                to_station=to_station,
                temperature_samples=samples,
                signoff_time=signoff_time,
                status="completed",
                review_status=review_status,
                review_note=review_note,
                signoff_photo_url=f"https://picsum.photos/seed/vaccine{photo_seed}/600/400"
            )
            
            shipments.append(shipment)
        
        return shipments

    def shipments_to_dataframes(self, shipments: List[ShipmentRecord]) -> tuple:
        shipment_records = []
        sample_records = []
        
        for idx, ship in enumerate(shipments):
            shipment_records.append({
                "shipment_id": idx + 1,
                "box_id": ship.box_id,
                "batch_no": ship.batch_no,
                "route": ship.route,
                "from_station": ship.from_station,
                "to_station": ship.to_station,
                "signoff_time": ship.signoff_time,
                "status": ship.status,
                "review_status": ship.review_status,
                "review_note": ship.review_note,
                "signoff_photo_url": ship.signoff_photo_url,
                "sample_count": len(ship.temperature_samples)
            })
            
            for s in ship.temperature_samples:
                sample_records.append({
                    "shipment_id": idx + 1,
                    "box_id": ship.box_id,
                    "timestamp": s["timestamp"],
                    "temperature": s["temperature"],
                    "is_anomaly": s["is_anomaly"],
                    "anomaly_reason": s["anomaly_reason"],
                    "is_cleaned": s["is_cleaned"],
                    "cleaned_reason": s["cleaned_reason"]
                })
        
        df_shipments = pd.DataFrame(shipment_records)
        df_samples = pd.DataFrame(sample_records)
        
        return df_shipments, df_samples


def generate_demo_data():
    generator = ColdChainDataGenerator()
    shipments = generator.generate_shipments(count=250)
    df_shipments, df_samples = generator.shipments_to_dataframes(shipments)
    return df_shipments, df_samples, ThresholdConfig()
