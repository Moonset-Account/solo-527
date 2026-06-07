"""
模拟数据生成器
生成脱敏的医院门诊等待时间数据
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import hashlib
from typing import List
from data_models import ProcessNode, PatientType, TimeSlot, NODE_ORDER


def generate_depts() -> List[dict]:
    """生成科室列表"""
    return [
        {"dept_id": "D001", "dept_name": "内科门诊"},
        {"dept_id": "D002", "dept_name": "外科门诊"},
        {"dept_id": "D003", "dept_name": "儿科门诊"},
        {"dept_id": "D004", "dept_name": "妇产科门诊"},
        {"dept_id": "D005", "dept_name": "眼科门诊"},
        {"dept_id": "D006", "dept_name": "耳鼻喉科门诊"},
        {"dept_id": "D007", "dept_name": "皮肤科门诊"},
        {"dept_id": "D008", "dept_name": "口腔科门诊"},
    ]


def generate_doctors(depts: List[dict]) -> List[dict]:
    """生成医生列表（脱敏）"""
    doctors = []
    surname_pool = ["张", "王", "李", "赵", "刘", "陈", "杨", "黄", "周", "吴", "徐", "孙", "马", "朱", "胡"]
    name_pool = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛"]
    
    for dept in depts:
        num_doctors = random.randint(2, 4)
        for i in range(num_doctors):
            doctor_id = f"{dept['dept_id']}_DR{i+1:02d}"
            name = random.choice(surname_pool) + random.choice(name_pool)
            doctors.append({
                "doctor_id": doctor_id,
                "doctor_name": name,
                "dept_id": dept["dept_id"],
                "dept_name": dept["dept_name"]
            })
    return doctors


def generate_visit_id(seed: int) -> str:
    """生成脱敏就诊ID"""
    raw = f"VISIT_{seed}_{datetime.now().strftime('%Y%m%d')}"
    return hashlib.md5(raw.encode()).hexdigest()[:12].upper()


def get_time_slot(hour: int, minute: int) -> str:
    """根据时间获取时段"""
    total_minutes = hour * 60 + minute
    if 450 <= total_minutes < 540:
        return TimeSlot.MORNING_EARLY.value
    elif 540 <= total_minutes < 720:
        return TimeSlot.MORNING.value
    elif 810 <= total_minutes < 870:
        return TimeSlot.AFTERNOON_EARLY.value
    elif 870 <= total_minutes < 1050:
        return TimeSlot.AFTERNOON.value
    elif 1050 <= total_minutes < 1200:
        return TimeSlot.EVENING.value
    return TimeSlot.MORNING.value


def generate_mock_data(num_patients: int = 2000, start_date: str = "2025-06-01", days: int = 7) -> pd.DataFrame:
    """生成模拟门诊数据"""
    depts = generate_depts()
    doctors = generate_doctors(depts)
    
    records = []
    patient_types = [pt.value for pt in PatientType]
    patient_type_weights = [0.6, 0.15, 0.1, 0.15]
    
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    
    for day in range(days):
        current_date = start_dt + timedelta(days=day)
        date_str = current_date.strftime("%Y-%m-%d")
        is_weekend = current_date.weekday() >= 5
        
        daily_patients = int(num_patients / days * (0.7 if is_weekend else 1.0))
        
        for i in range(daily_patients):
            dept = random.choice(depts)
            dept_doctors = [d for d in doctors if d["dept_id"] == dept["dept_id"]]
            doctor = random.choice(dept_doctors)
            patient_type = random.choices(patient_types, weights=patient_type_weights)[0]
            
            hour_weights = [1, 3, 5, 8, 10, 12, 15, 18, 20, 22, 20, 18,
                           15, 12, 10, 8, 12, 15, 18, 16, 14, 12, 10, 6]
            hour = random.choices(range(7, 31), weights=hour_weights[:24])[0]
            if hour >= 24:
                hour = hour - 24
            minute = random.randint(0, 59)
            
            time_slot = get_time_slot(hour, minute)
            base_time = current_date + timedelta(hours=hour, minutes=minute)
            
            is_anomaly = random.random() < 0.08
            anomaly_reason = None
            
            def add_noise(base_minutes, scale=5):
                noise = int(np.random.normal(0, scale))
                return max(1, base_minutes + noise)
            
            reg_time = base_time
            checkin_time = reg_time + timedelta(minutes=add_noise(8, 4))
            
            if patient_type == PatientType.EMERGENCY.value:
                triage_time = checkin_time + timedelta(minutes=add_noise(5, 2))
                call_time = triage_time + timedelta(minutes=add_noise(8, 3))
            elif patient_type == PatientType.VETERAN.value:
                triage_time = checkin_time + timedelta(minutes=add_noise(6, 2))
                call_time = triage_time + timedelta(minutes=add_noise(10, 4))
            else:
                triage_time = checkin_time + timedelta(minutes=add_noise(12, 5))
                call_time = triage_time + timedelta(minutes=add_noise(20, 8))
            
            if is_anomaly:
                anomaly_types = ["设备故障", "医生临时开会", "系统卡顿", "患者迟到", "特殊检查"]
                anomaly_reason = random.choice(anomaly_types)
                if random.random() < 0.5:
                    call_time = call_time + timedelta(minutes=random.randint(30, 90))
                else:
                    triage_time = triage_time + timedelta(minutes=random.randint(20, 60))
            
            consult_start_time = call_time + timedelta(minutes=add_noise(3, 2))
            consult_duration = add_noise(12, 4) if dept["dept_name"] in ["内科门诊", "儿科门诊"] else add_noise(8, 3)
            consult_end_time = consult_start_time + timedelta(minutes=consult_duration)
            payment_time = consult_end_time + timedelta(minutes=add_noise(6, 3))
            medicine_time = payment_time + timedelta(minutes=add_noise(10, 4))
            
            if random.random() < 0.03:
                medicine_time = None
            if random.random() < 0.02:
                payment_time = None
                medicine_time = None
            
            record = {
                "visit_id": generate_visit_id(day * 10000 + i),
                "dept_id": dept["dept_id"],
                "dept_name": dept["dept_name"],
                "doctor_id": doctor["doctor_id"],
                "doctor_name": doctor["doctor_name"],
                "patient_type": patient_type,
                "time_slot": time_slot,
                "visit_date": date_str,
                "reg_time": reg_time.strftime("%Y-%m-%d %H:%M:%S"),
                "checkin_time": checkin_time.strftime("%Y-%m-%d %H:%M:%S"),
                "triage_time": triage_time.strftime("%Y-%m-%d %H:%M:%S"),
                "call_time": call_time.strftime("%Y-%m-%d %H:%M:%S"),
                "consult_start_time": consult_start_time.strftime("%Y-%m-%d %H:%M:%S"),
                "consult_end_time": consult_end_time.strftime("%Y-%m-%d %H:%M:%S"),
                "payment_time": payment_time.strftime("%Y-%m-%d %H:%M:%S") if payment_time else None,
                "medicine_time": medicine_time.strftime("%Y-%m-%d %H:%M:%S") if medicine_time else None,
                "is_anomaly": is_anomaly,
                "anomaly_reason": anomaly_reason,
                "comment": None
            }
            records.append(record)
    
    df = pd.DataFrame(records)
    
    time_cols = ["reg_time", "checkin_time", "triage_time", "call_time", 
                 "consult_start_time", "consult_end_time", "payment_time", "medicine_time"]
    for col in time_cols:
        df[col] = pd.to_datetime(df[col])
    
    return df


def save_data(df: pd.DataFrame, path: str = "data/mock_visit_data.parquet"):
    """保存数据"""
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    df.to_parquet(path)
    print(f"数据已保存到: {path}, 共 {len(df)} 条记录")


def load_data(path: str = "data/mock_visit_data.parquet") -> pd.DataFrame:
    """加载数据"""
    return pd.read_parquet(path)


if __name__ == "__main__":
    df = generate_mock_data(num_patients=3000, days=14)
    save_data(df)
    print("\n数据概览:")
    print(df.head())
    print(f"\n缺失值统计:")
    print(df.isnull().sum())
    print(f"\n异常样本数: {df['is_anomaly'].sum()}")
