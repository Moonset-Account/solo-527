import json
import os
import random
import uuid
from datetime import datetime, timedelta

import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from config import Config

CITIES = [
    "北京", "上海", "广州", "深圳", "成都", "重庆", "武汉", "杭州",
    "南京", "天津", "西安", "长沙", "沈阳", "青岛", "郑州", "大连",
    "厦门", "昆明", "济南", "哈尔滨", "福州", "合肥", "南昌", "贵阳",
]

PRODUCTS = [
    ("新冠疫苗", -25, -15),
    ("胰岛素注射液", 2, 8),
    ("冷藏酸奶", 2, 6),
    ("速冻水饺", -18, -15),
    ("冰鲜三文鱼", -2, 2),
    ("鲜牛奶", 0, 4),
    ("冷鲜牛肉", -1, 4),
    ("速冻虾仁", -20, -18),
    ("冷藏蛋糕", 2, 8),
    ("新鲜草莓", 0, 4),
    ("冷切拼盘", 0, 5),
    ("冰淇淋", -25, -18),
    ("冷藏果汁", 2, 8),
    ("速冻蔬菜", -18, -15),
    ("冷藏巧克力", 12, 18),
]

VEHICLE_TYPES = ["冷藏车", "冷冻车", "恒温车"]
VEHICLE_STATUSES = ["运行中", "空闲", "维修中", "装载中"]
ROUTE_STATUSES = ["运输中", "已完成", "待发车", "延迟", "已取消"]
EXCEPTION_TYPES = ["temp_exceeded", "unauthorized_door", "delayed_arrival", "calibration_drift"]
SEVERITIES = ["low", "medium", "high", "critical"]
CALIBRATION_STATUSES = ["valid", "expired", "due_soon"]
CONDITIONS = ["良好", "轻微温差", "温度异常", "包装破损", "合格"]
REGIONS = ["华东", "华南", "华北", "西南", "东北", "华中", "西北"]


def ts(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def gen_vehicles(n=20):
    data = []
    for i in range(n):
        data.append({
            "vehicle_id": f"V{str(i + 1).zfill(4)}",
            "plate_number": f"京{random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ')}{random.randint(10000, 99999)}",
            "vehicle_type": random.choice(VEHICLE_TYPES),
            "status": random.choices(VEHICLE_STATUSES, weights=[40, 30, 10, 20])[0],
        })
    return data


def gen_routes(vehicles, n=50):
    data = []
    base_date = datetime(2026, 5, 1)
    for i in range(n):
        vid = random.choice(vehicles)["vehicle_id"]
        origin, dest = random.sample(CITIES, 2)
        distance = random.randint(100, 2500)
        planned_dep = base_date + timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        travel_hours = distance / random.uniform(60, 100)
        planned_arr = planned_dep + timedelta(hours=travel_hours)
        status = random.choices(ROUTE_STATUSES, weights=[25, 45, 15, 10, 5])[0]
        actual_dep = None
        actual_arr = None
        if status in ("运输中", "已完成", "延迟"):
            delay_minutes = random.randint(-30, 180)
            actual_dep = ts(planned_dep + timedelta(minutes=delay_minutes))
        if status in ("已完成", "延迟"):
            actual_arr = ts(planned_arr + timedelta(minutes=random.randint(-60, 300)))
        data.append({
            "route_id": f"R{str(i + 1).zfill(5)}",
            "vehicle_id": vid,
            "origin": origin,
            "destination": dest,
            "distance_km": round(distance, 1),
            "planned_departure": ts(planned_dep),
            "planned_arrival": ts(planned_arr),
            "actual_departure": actual_dep,
            "actual_arrival": actual_arr,
            "status": status,
        })
    return data


def gen_batches(routes, n=100):
    data = []
    for i in range(n):
        route = random.choice(routes)
        product_name, tmin, tmax = random.choice(PRODUCTS)
        data.append({
            "batch_id": f"B{str(i + 1).zfill(5)}",
            "route_id": route["route_id"],
            "product_name": product_name,
            "quantity": random.randint(50, 5000),
            "required_temp_min": tmin,
            "required_temp_max": tmax,
        })
    return data


def gen_temperature_boxes(batches, vehicles, n=200):
    data = []
    for i in range(n):
        batch = random.choice(batches)
        vid = random.choice(vehicles)["vehicle_id"]
        temp = random.uniform(batch["required_temp_min"], batch["required_temp_max"])
        data.append({
            "box_id": f"BX{str(i + 1).zfill(5)}",
            "batch_id": batch["batch_id"],
            "vehicle_id": vid,
            "probe_id": f"P{str(i + 1).zfill(5)}",
            "current_temp": round(temp, 1),
        })
    return data


def gen_temperature_readings(boxes, n=10000):
    data = []
    base_date = datetime(2026, 5, 1)
    box_map = {}
    for b in boxes:
        box_map[b["box_id"]] = b
    for i in range(n):
        box = random.choice(boxes)
        tmin = box_map[box["box_id"]].get("required_temp_min", -25)
        tmax = box_map[box["box_id"]].get("required_temp_max", 8)
        if tmin == -25 and tmax == 8:
            tmin, tmax = -25, 8
        offset = random.gauss(0, 2)
        temp = random.uniform(tmin, tmax) + offset
        recorded = base_date + timedelta(
            days=random.randint(0, 35),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
            seconds=random.randint(0, 59),
        )
        data.append({
            "reading_id": f"TR{str(i + 1).zfill(7)}",
            "box_id": box["box_id"],
            "probe_id": box["probe_id"],
            "temperature": round(temp, 2),
            "recorded_at": ts(recorded),
        })
    return data


def gen_door_events(vehicles, boxes, n=500):
    data = []
    base_date = datetime(2026, 5, 1)
    for i in range(n):
        vid = random.choice(vehicles)["vehicle_id"]
        box = random.choice(boxes)
        occurred = base_date + timedelta(
            days=random.randint(0, 35),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )
        lat = round(random.uniform(18.0, 53.0), 6)
        lng = round(random.uniform(73.0, 135.0), 6)
        event_type = random.choice(["open", "close"])
        duration = random.randint(5, 600) if event_type == "open" else None
        data.append({
            "event_id": f"DE{str(i + 1).zfill(6)}",
            "vehicle_id": vid,
            "box_id": box["box_id"],
            "event_type": event_type,
            "occurred_at": ts(occurred),
            "location_lat": lat,
            "location_lng": lng,
            "duration_seconds": duration,
        })
    return data


def gen_exceptions(vehicles, routes, batches, boxes, n=200):
    data = []
    base_date = datetime(2026, 5, 1)
    for i in range(n):
        vid = random.choice(vehicles)["vehicle_id"]
        route = random.choice(routes)
        batch = random.choice(batches)
        box = random.choice(boxes)
        exc_type = random.choice(EXCEPTION_TYPES)
        severity = random.choices(SEVERITIES, weights=[30, 35, 25, 10])[0]
        started = base_date + timedelta(
            days=random.randint(0, 35),
            hours=random.randint(0, 23),
        )
        duration_mins = random.randint(5, 480)
        ended = started + timedelta(minutes=duration_mins)
        descriptions = {
            "temp_exceeded": f"温度超出允许范围，持续{duration_mins}分钟",
            "unauthorized_door": f"检测到未授权开门事件，持续时间{duration_mins}分钟",
            "delayed_arrival": f"到达延迟{duration_mins}分钟",
            "calibration_drift": f"温度探头偏差超过阈值，偏差值{round(random.uniform(0.5, 3.0), 2)}°C",
        }
        resolution = random.choice(["已处理", "自动恢复", "人工干预", "待处理", None])
        resolved_by = random.choice(["系统自动", "张工", "李工", "王工", None]) if resolution and resolution != "待处理" else None
        data.append({
            "exception_id": f"EX{str(i + 1).zfill(5)}",
            "vehicle_id": vid,
            "route_id": route["route_id"],
            "batch_id": batch["batch_id"],
            "box_id": box["box_id"],
            "exception_type": exc_type,
            "severity": severity,
            "started_at": ts(started),
            "ended_at": ts(ended),
            "duration_minutes": duration_mins,
            "description": descriptions[exc_type],
            "resolution": resolution,
            "resolved_by": resolved_by,
            "original_record_ids": json.dumps([f"TR{random.randint(1, 10000):07d}", f"DE{random.randint(1, 500):06d}"]),
        })
    return data


def gen_calibrations(boxes, n=50):
    data = []
    base_date = datetime(2026, 4, 1)
    for i in range(n):
        box = random.choice(boxes)
        cal_at = base_date + timedelta(days=random.randint(0, 50))
        next_due = cal_at + timedelta(days=random.randint(30, 180))
        now = datetime(2026, 6, 8)
        if next_due < now:
            status = "expired"
        elif (next_due - now).days < 30:
            status = "due_soon"
        else:
            status = "valid"
        data.append({
            "calibration_id": f"CAL{str(i + 1).zfill(4)}",
            "probe_id": box["probe_id"],
            "box_id": box["box_id"],
            "calibrated_at": ts(cal_at),
            "next_calibration_due": ts(next_due),
            "status": status,
            "deviation_celsius": round(random.uniform(-1.5, 1.5), 3),
        })
    return data


def gen_customers(n=30):
    data = []
    surnames = ["张", "王", "李", "赵", "刘", "陈", "杨", "黄", "周", "吴"]
    names = ["伟", "芳", "敏", "强", "丽", "军", "洋", "勇", "艳", "杰"]
    companies = [
        "华润万家", "永辉超市", "盒马鲜生", "京东物流", "顺丰冷运",
        "国药物流", "上药集团", "九州通", "双汇冷链", "光明乳业",
        "伊利集团", "蒙牛乳业", "正大集团", "万纬物流", "普洛斯",
        "中粮集团", "雨润集团", "大润发", "沃尔玛中国", "山姆会员店",
        "叮咚买菜", "每日优鲜", "美团优选", "朴朴超市", "钱大妈",
        "百胜中国", "麦当劳中国", "星巴克中国", "喜茶", "奈雪的茶",
    ]
    for i in range(n):
        data.append({
            "customer_id": f"CU{str(i + 1).zfill(4)}",
            "name": companies[i] if i < len(companies) else f"客户{ i + 1}",
            "contact": f"{random.choice(surnames)}{random.choice(names)}",
            "region": random.choice(REGIONS),
        })
    return data


def gen_deliveries(routes, batches, customers, n=300):
    data = []
    base_date = datetime(2026, 5, 1)
    for i in range(n):
        route = random.choice(routes)
        batch = random.choice(batches)
        customer = random.choice(customers)
        arrival = base_date + timedelta(
            days=random.randint(0, 35),
            hours=random.randint(6, 22),
            minutes=random.randint(0, 59),
        )
        data.append({
            "delivery_id": f"DL{str(i + 1).zfill(5)}",
            "route_id": route["route_id"],
            "batch_id": batch["batch_id"],
            "customer_id": customer["customer_id"],
            "arrival_time": ts(arrival),
            "condition_at_arrival": random.choices(CONDITIONS, weights=[50, 20, 10, 5, 15])[0],
        })
    return data


def gen_etl_status():
    etl_names = [
        "temperature_readings_etl",
        "door_events_etl",
        "exceptions_etl",
        "calibrations_etl",
        "deliveries_etl",
    ]
    data = []
    base_date = datetime(2026, 6, 8)
    for i, name in enumerate(etl_names):
        started = base_date - timedelta(hours=random.randint(1, 24))
        completed = started + timedelta(minutes=random.randint(5, 60))
        data.append({
            "run_id": f"ETL{str(i + 1).zfill(4)}",
            "etl_name": name,
            "started_at": ts(started),
            "completed_at": ts(completed),
            "rows_processed": random.randint(1000, 50000),
            "status": random.choices(["success", "running", "failed"], weights=[80, 10, 10])[0],
        })
    return data


def save_as_json(data, table_name, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, f"{table_name}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  -> 已保存 {filepath} ({len(data)} 条记录)")


def try_insert_clickhouse(data, table_name, config):
    try:
        from clickhouse_driver import Client
        client = Client(
            host=config.CLICKHOUSE_HOST,
            port=config.CLICKHOUSE_PORT,
            user=config.CLICKHOUSE_USER,
            password=config.CLICKHOUSE_PASSWORD,
            database=config.CLICKHOUSE_DB,
        )
        client.execute("SELECT 1")
        if not data:
            return False
        columns = list(data[0].keys())
        rows = [tuple(row[col] for col in columns) for row in data]
        client.execute(f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES", rows)
        print(f"  -> 已插入 ClickHouse {table_name} ({len(data)} 条记录)")
        return True
    except Exception as e:
        print(f"  -> ClickHouse 不可用 ({e})，将保存为 JSON 文件")
        return False


def main():
    config = Config()
    output_dir = config.MOCK_DATA_DIR
    print("=" * 60)
    print("冷链物流温控追踪系统 - 模拟数据生成")
    print("=" * 60)

    print("\n[1/11] 生成车辆数据 (20)...")
    vehicles = gen_vehicles(20)
    if not try_insert_clickhouse(vehicles, "vehicles", config):
        save_as_json(vehicles, "vehicles", output_dir)

    print("[2/11] 生成路线数据 (50)...")
    routes = gen_routes(vehicles, 50)
    if not try_insert_clickhouse(routes, "routes", config):
        save_as_json(routes, "routes", output_dir)

    print("[3/11] 生成批次数据 (100)...")
    batches = gen_batches(routes, 100)
    if not try_insert_clickhouse(batches, "batches", config):
        save_as_json(batches, "batches", output_dir)

    print("[4/11] 生成温控箱数据 (200)...")
    boxes = gen_temperature_boxes(batches, vehicles, 200)
    if not try_insert_clickhouse(boxes, "temperature_boxes", config):
        save_as_json(boxes, "temperature_boxes", output_dir)

    print("[5/11] 生成温度读数数据 (10000)...")
    readings = gen_temperature_readings(boxes, 10000)
    if not try_insert_clickhouse(readings, "temperature_readings", config):
        save_as_json(readings, "temperature_readings", output_dir)

    print("[6/11] 生成门事件数据 (500)...")
    door_events = gen_door_events(vehicles, boxes, 500)
    if not try_insert_clickhouse(door_events, "door_events", config):
        save_as_json(door_events, "door_events", output_dir)

    print("[7/11] 生成异常数据 (200)...")
    exceptions = gen_exceptions(vehicles, routes, batches, boxes, 200)
    if not try_insert_clickhouse(exceptions, "exceptions", config):
        save_as_json(exceptions, "exceptions", output_dir)

    print("[8/11] 生成校准数据 (50)...")
    calibrations = gen_calibrations(boxes, 50)
    if not try_insert_clickhouse(calibrations, "probe_calibrations", config):
        save_as_json(calibrations, "probe_calibrations", output_dir)

    print("[9/11] 生成客户数据 (30)...")
    customers = gen_customers(30)
    if not try_insert_clickhouse(customers, "customers", config):
        save_as_json(customers, "customers", output_dir)

    print("[10/11] 生成交付数据 (300)...")
    deliveries = gen_deliveries(routes, batches, customers, 300)
    if not try_insert_clickhouse(deliveries, "deliveries", config):
        save_as_json(deliveries, "deliveries", output_dir)

    print("[11/11] 生成ETL状态数据 (5)...")
    etl_data = gen_etl_status()
    if not try_insert_clickhouse(etl_data, "etl_status", config):
        save_as_json(etl_data, "etl_status", output_dir)

    print("\n" + "=" * 60)
    print("模拟数据生成完成！")
    print(f"JSON 文件目录: {output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
