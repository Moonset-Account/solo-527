import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

random.seed(42)
np.random.seed(42)

PRODUCTION_LINES = [
    {"line_id": 1, "line_name": "1号线", "workshop": "装配车间"},
    {"line_id": 2, "line_name": "2号线", "workshop": "装配车间"},
    {"line_id": 3, "line_name": "3号线", "workshop": "机加工车间"},
    {"line_id": 4, "line_name": "4号线", "workshop": "机加工车间"},
]

EQUIPMENTS = [
    {"equipment_id": 101, "equipment_name": "CNC-001", "line_id": 3, "model": "VMC-850", "install_date": "2022-03-15"},
    {"equipment_id": 102, "equipment_name": "CNC-002", "line_id": 3, "model": "VMC-850", "install_date": "2022-04-20"},
    {"equipment_id": 103, "equipment_name": "CNC-003", "line_id": 4, "model": "VMC-1060", "install_date": "2021-11-08"},
    {"equipment_id": 104, "equipment_name": "CNC-004", "line_id": 4, "model": "VMC-1060", "install_date": "2021-12-01"},
    {"equipment_id": 201, "equipment_name": "ASM-001", "line_id": 1, "model": "ASM-X1", "install_date": "2023-01-10"},
    {"equipment_id": 202, "equipment_name": "ASM-002", "line_id": 1, "model": "ASM-X1", "install_date": "2023-02-05"},
    {"equipment_id": 203, "equipment_name": "ASM-003", "line_id": 2, "model": "ASM-X2", "install_date": "2022-09-18"},
    {"equipment_id": 204, "equipment_name": "ASM-004", "line_id": 2, "model": "ASM-X2", "install_date": "2022-10-22"},
    {"equipment_id": 301, "equipment_name": "ROBOT-01", "line_id": 1, "model": "IRB-1200", "install_date": "2023-03-01"},
    {"equipment_id": 302, "equipment_name": "ROBOT-02", "line_id": 2, "model": "IRB-1200", "install_date": "2023-03-15"},
]

SHIFTS = [
    {"shift_id": 1, "shift_name": "早班", "start_time": "08:00:00", "end_time": "16:00:00"},
    {"shift_id": 2, "shift_name": "中班", "start_time": "16:00:00", "end_time": "00:00:00"},
    {"shift_id": 3, "shift_name": "晚班", "start_time": "00:00:00", "end_time": "08:00:00"},
]

FAULT_TYPES = [
    {"fault_code": "MECH-001", "fault_name": "机械磨损", "category": "机械故障",
     "description": "运动部件长期使用导致磨损，精度下降，表现为加工尺寸超差或异常噪音",
     "suggestion": "制定预防性更换计划，增加润滑频次，建立磨损量监测制度"},
    {"fault_code": "ELEC-001", "fault_name": "电气故障", "category": "电气故障",
     "description": "传感器、电机或控制系统故障，表现为设备报警、无法启动或动作异常",
     "suggestion": "定期检查电气连接，备关键传感器和电机备件，建立电气柜温度监控"},
    {"fault_code": "HYD-001", "fault_name": "液压泄漏", "category": "液压系统",
     "description": "液压管路或密封件老化导致泄漏，表现为压力不足、油位下降或地面油污",
     "suggestion": "定期更换密封件，建立液压油检测制度，检查管路接头扭矩"},
    {"fault_code": "PNEU-001", "fault_name": "气动故障", "category": "气动系统",
     "description": "气源不足或气缸密封不良，表现为夹爪无力、动作迟缓或无法定位",
     "suggestion": "检查气源压力，定期更换气缸密封圈，加装空气干燥装置"},
    {"fault_code": "SOFT-001", "fault_name": "程序异常", "category": "软件系统",
     "description": "PLC程序错误或通讯中断，表现为设备停机、报错或数据丢失",
     "suggestion": "更新程序版本，检查通讯线路，定期备份程序参数"},
    {"fault_code": "LUB-001", "fault_name": "润滑不足", "category": "维护不当",
     "description": "润滑点缺油导致摩擦增大，表现为温升过高、磨损加快或卡滞",
     "suggestion": "完善润滑计划，安装自动润滑系统，培训操作人员日常点检"},
    {"fault_code": "OPER-001", "fault_name": "操作失误", "category": "人为因素",
     "description": "操作人员不规范操作导致设备损坏，如撞机、超程、参数误改等",
     "suggestion": "加强操作培训，完善SOP，关键操作增加双人确认机制"},
    {"fault_code": "PREV-001", "fault_name": "定期检修", "category": "计划检修",
     "description": "按计划进行的预防性维护，包含更换易损件、清洁、校准等工作",
     "suggestion": "优化检修周期，基于设备状态调整维护频率，减少过度维修"},
]

REPAIR_PERSONS = [
    {"person_id": "P001", "person_name": "张工", "skill_level": "高级", "team": "机械组"},
    {"person_id": "P002", "person_name": "李工", "skill_level": "中级", "team": "电气组"},
    {"person_id": "P003", "person_name": "王工", "skill_level": "高级", "team": "电气组"},
    {"person_id": "P004", "person_name": "赵工", "skill_level": "中级", "team": "机械组"},
    {"person_id": "P005", "person_name": "陈工", "skill_level": "初级", "team": "机械组"},
    {"person_id": "P006", "person_name": "刘工", "skill_level": "中级", "team": "液压组"},
]

SPARE_PARTS = [
    {"part_id": "SP001", "part_name": "轴承6205", "specification": "内径25mm外径52mm", "unit_price": 85.0, "stock_quantity": 50},
    {"part_id": "SP002", "part_name": "密封圈", "specification": "丁腈橡胶50×70×8", "unit_price": 12.5, "stock_quantity": 200},
    {"part_id": "SP003", "part_name": "接近传感器", "specification": "PNP常开检测距离8mm", "unit_price": 280.0, "stock_quantity": 30},
    {"part_id": "SP004", "part_name": "伺服电机", "specification": "1kW带刹车", "unit_price": 5600.0, "stock_quantity": 5},
    {"part_id": "SP005", "part_name": "液压油", "specification": "抗磨46号 20L", "unit_price": 450.0, "stock_quantity": 20},
    {"part_id": "SP006", "part_name": "导轨滑块", "specification": "HGH25CA", "unit_price": 320.0, "stock_quantity": 15},
    {"part_id": "SP007", "part_name": "气缸", "specification": "SC50×100", "unit_price": 420.0, "stock_quantity": 10},
    {"part_id": "SP008", "part_name": "润滑油", "specification": "锂基脂2号 1kg", "unit_price": 65.0, "stock_quantity": 80},
]

FAULT_PART_MAPPING = {
    "MECH-001": [("SP001", 0.7), ("SP006", 0.5), ("SP008", 0.8)],
    "ELEC-001": [("SP003", 0.6), ("SP004", 0.2)],
    "HYD-001": [("SP002", 0.9), ("SP005", 0.5)],
    "PNEU-001": [("SP002", 0.6), ("SP007", 0.4)],
    "SOFT-001": [],
    "LUB-001": [("SP008", 0.9)],
    "OPER-001": [("SP001", 0.3), ("SP006", 0.2)],
    "PREV-001": [("SP001", 0.4), ("SP002", 0.5), ("SP008", 0.8), ("SP003", 0.2)],
}


def generate_downtime_events(days: int = 90) -> pd.DataFrame:
    end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=days)
    
    events = []
    event_id = 1
    order_id = 1
    
    equipment_fault_weights = {
        101: {"MECH-001": 0.25, "ELEC-001": 0.15, "LUB-001": 0.2, "PREV-001": 0.2, "OPER-001": 0.1, "HYD-001": 0.1},
        102: {"MECH-001": 0.2, "ELEC-001": 0.2, "SOFT-001": 0.15, "PREV-001": 0.25, "PNEU-001": 0.1, "LUB-001": 0.1},
        103: {"MECH-001": 0.3, "HYD-001": 0.2, "LUB-001": 0.15, "PREV-001": 0.2, "ELEC-001": 0.1, "OPER-001": 0.05},
        104: {"MECH-001": 0.25, "HYD-001": 0.25, "ELEC-001": 0.15, "PREV-001": 0.2, "LUB-001": 0.1, "SOFT-001": 0.05},
        201: {"PNEU-001": 0.25, "ELEC-001": 0.2, "SOFT-001": 0.15, "PREV-001": 0.2, "OPER-001": 0.1, "MECH-001": 0.1},
        202: {"PNEU-001": 0.2, "ELEC-001": 0.25, "SOFT-001": 0.2, "PREV-001": 0.2, "OPER-001": 0.1, "LUB-001": 0.05},
        203: {"MECH-001": 0.2, "PNEU-001": 0.2, "ELEC-001": 0.15, "PREV-001": 0.25, "SOFT-001": 0.1, "OPER-001": 0.1},
        204: {"ELEC-001": 0.3, "SOFT-001": 0.2, "PNEU-001": 0.15, "PREV-001": 0.2, "MECH-001": 0.1, "LUB-001": 0.05},
        301: {"ELEC-001": 0.3, "SOFT-001": 0.25, "MECH-001": 0.1, "PREV-001": 0.2, "LUB-001": 0.1, "PNEU-001": 0.05},
        302: {"ELEC-001": 0.25, "SOFT-001": 0.3, "PREV-001": 0.2, "MECH-001": 0.1, "LUB-001": 0.1, "OPER-001": 0.05},
    }
    
    current_date = start_date
    while current_date <= end_date:
        for equip in EQUIPMENTS:
            equip_id = equip["equipment_id"]
            weights = equipment_fault_weights.get(equip_id, {})
            
            n_events = np.random.poisson(lam=0.8)
            for _ in range(n_events):
                fault_code = random.choices(
                    list(weights.keys()),
                    weights=list(weights.values()),
                    k=1
                )[0]
                
                fault_info = next(f for f in FAULT_TYPES if f["fault_code"] == fault_code)
                breakdown_type = "planned" if fault_code == "PREV-001" else "unplanned"
                
                hour = np.random.randint(0, 24)
                minute = np.random.randint(0, 60)
                start_dt = current_date + timedelta(hours=hour, minutes=minute)
                
                if fault_code == "PREV-001":
                    duration = int(np.random.normal(loc=120, scale=30))
                elif fault_code in ["MECH-001", "HYD-001"]:
                    duration = int(np.random.normal(loc=90, scale=40))
                elif fault_code in ["ELEC-001", "SOFT-001"]:
                    duration = int(np.random.normal(loc=60, scale=25))
                elif fault_code == "OPER-001":
                    duration = int(np.random.normal(loc=45, scale=20))
                else:
                    duration = int(np.random.normal(loc=40, scale=15))
                
                duration = max(10, min(duration, 480))
                end_dt = start_dt + timedelta(minutes=duration)
                
                shift_id = 1 if 8 <= start_dt.hour < 16 else (2 if 16 <= start_dt.hour < 24 else 3)
                
                events.append({
                    "event_id": event_id,
                    "equipment_id": equip_id,
                    "fault_code": fault_code,
                    "shift_id": shift_id,
                    "start_time": start_dt,
                    "end_time": end_dt,
                    "duration_minutes": duration,
                    "breakdown_type": breakdown_type,
                    "description": f"{fault_info['fault_name']}事件",
                    "order_id": order_id,
                })
                event_id += 1
                order_id += 1
        
        current_date += timedelta(days=1)
    
    return pd.DataFrame(events)


def generate_work_orders(events_df: pd.DataFrame) -> pd.DataFrame:
    orders = []
    for _, event in events_df.iterrows():
        person = random.choice(REPAIR_PERSONS)
        
        repair_duration = int(event["duration_minutes"] * np.random.uniform(0.7, 1.0))
        
        if person["skill_level"] == "高级":
            repair_duration = int(repair_duration * 0.85)
        elif person["skill_level"] == "初级":
            repair_duration = int(repair_duration * 1.2)
        
        labor_cost = repair_duration * 1.5 * (1.5 if person["skill_level"] == "高级" else 1.0)
        
        orders.append({
            "order_id": event["order_id"],
            "event_id": event["event_id"],
            "person_id": person["person_id"],
            "person_name": person["person_name"],
            "skill_level": person["skill_level"],
            "team": person["team"],
            "create_time": event["start_time"] + timedelta(minutes=5),
            "complete_time": event["start_time"] + timedelta(minutes=repair_duration + 10),
            "repair_duration": repair_duration,
            "status": "completed",
            "labor_cost": round(labor_cost, 2),
        })
    
    return pd.DataFrame(orders)


def generate_spare_part_usages(orders_df: pd.DataFrame, events_df: pd.DataFrame) -> pd.DataFrame:
    usages = []
    usage_id = 1
    
    events_with_fault = events_df.set_index("event_id")["fault_code"].to_dict()
    
    for _, order in orders_df.iterrows():
        event_id = order["event_id"]
        fault_code = events_with_fault.get(event_id, "")
        part_mappings = FAULT_PART_MAPPING.get(fault_code, [])
        
        for part_id, prob in part_mappings:
            if random.random() < prob:
                part = next(p for p in SPARE_PARTS if p["part_id"] == part_id)
                quantity = random.randint(1, 3) if part["unit_price"] < 100 else 1
                total_cost = quantity * part["unit_price"]
                
                usages.append({
                    "usage_id": usage_id,
                    "order_id": order["order_id"],
                    "event_id": event_id,
                    "fault_code": fault_code,
                    "part_id": part_id,
                    "part_name": part["part_name"],
                    "quantity": quantity,
                    "unit_price": part["unit_price"],
                    "total_cost": round(total_cost, 2),
                })
                usage_id += 1
    
    return pd.DataFrame(usages)


def enrich_events(events_df: pd.DataFrame) -> pd.DataFrame:
    df = events_df.copy()
    
    equip_map = {e["equipment_id"]: e for e in EQUIPMENTS}
    line_map = {l["line_id"]: l for l in PRODUCTION_LINES}
    shift_map = {s["shift_id"]: s for s in SHIFTS}
    fault_map = {f["fault_code"]: f for f in FAULT_TYPES}
    
    df["equipment_name"] = df["equipment_id"].map(lambda x: equip_map.get(x, {}).get("equipment_name", ""))
    df["line_id"] = df["equipment_id"].map(lambda x: equip_map.get(x, {}).get("line_id", 0))
    df["line_name"] = df["line_id"].map(lambda x: line_map.get(x, {}).get("line_name", ""))
    df["workshop"] = df["line_id"].map(lambda x: line_map.get(x, {}).get("workshop", ""))
    df["shift_name"] = df["shift_id"].map(lambda x: shift_map.get(x, {}).get("shift_name", ""))
    df["fault_name"] = df["fault_code"].map(lambda x: fault_map.get(x, {}).get("fault_name", ""))
    df["fault_category"] = df["fault_code"].map(lambda x: fault_map.get(x, {}).get("category", ""))
    df["fault_description"] = df["fault_code"].map(lambda x: fault_map.get(x, {}).get("description", ""))
    df["fault_suggestion"] = df["fault_code"].map(lambda x: fault_map.get(x, {}).get("suggestion", ""))
    
    df["date"] = df["start_time"].dt.date
    df["week"] = df["start_time"].dt.isocalendar().week
    df["month"] = df["start_time"].dt.month
    df["hour"] = df["start_time"].dt.hour
    
    return df


def get_all_data() -> dict:
    events_raw = generate_downtime_events(days=90)
    events = enrich_events(events_raw)
    work_orders = generate_work_orders(events_raw)
    spare_part_usages = generate_spare_part_usages(work_orders, events_raw)
    
    return {
        "events": events,
        "work_orders": work_orders,
        "spare_part_usages": spare_part_usages,
        "production_lines": pd.DataFrame(PRODUCTION_LINES),
        "equipments": pd.DataFrame(EQUIPMENTS),
        "shifts": pd.DataFrame(SHIFTS),
        "fault_types": pd.DataFrame(FAULT_TYPES),
        "repair_persons": pd.DataFrame(REPAIR_PERSONS),
        "spare_parts": pd.DataFrame(SPARE_PARTS),
    }
