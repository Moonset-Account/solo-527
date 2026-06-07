import random
import math
from datetime import datetime, timedelta
from collections import defaultdict

random.seed(42)

SLOTS = [f"{row}{str(num).zfill(2)}" for row in "ABCDE" for num in range(1, 13)]
SHIFTS = ["早班", "中班", "晚班"]
DEVICES = [f"分拣机{i}" for i in range(1, 7)]
ROUTES = ["北京线路", "上海线路", "广州线路", "成都线路", "武汉线路", "西安线路", "杭州线路", "深圳线路"]
ALARM_TYPES = ["传感器故障", "皮带跑偏", "电机过载", "通信中断", "格口堵塞", "扫码异常"]

SLOT_DEVICE_MAP = {}
for i, slot in enumerate(SLOTS):
    SLOT_DEVICE_MAP[slot] = DEVICES[i % len(DEVICES)]

SLOT_ROUTE_MAP = {}
for i, slot in enumerate(SLOTS):
    SLOT_ROUTE_MAP[slot] = ROUTES[i % len(ROUTES)]

HOUR_SHIFT_MAP = {}
for h in range(24):
    if 6 <= h < 14:
        HOUR_SHIFT_MAP[h] = "早班"
    elif 14 <= h < 22:
        HOUR_SHIFT_MAP[h] = "中班"
    else:
        HOUR_SHIFT_MAP[h] = "晚班"

HOUR_VOLUME_PATTERN = [
    200, 150, 100, 80, 60, 100,
    500, 800, 1100, 1300, 1400, 1350,
    1200, 1100, 1250, 1300, 1400, 1350,
    1200, 1100, 900, 600, 400, 300,
]


def _generate_alarms(start_date: datetime, days: int = 30) -> list[dict]:
    alarms = []
    alarm_id = 0
    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)
        num_alarms = random.randint(2, 6)
        for _ in range(num_alarms):
            hour = random.choices(range(24), weights=[max(v, 50) for v in HOUR_VOLUME_PATTERN])[0]
            minute = random.randint(0, 59)
            alarm_start = current_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            duration = random.choice([5, 10, 15, 20, 30, 45, 60, 90, 120])
            alarm_end = alarm_start + timedelta(minutes=duration)
            device = random.choice(DEVICES)
            alarm_type = random.choice(ALARM_TYPES)
            alarms.append({
                "alarm_id": alarm_id,
                "device": device,
                "alarm_type": alarm_type,
                "start_time": alarm_start,
                "end_time": alarm_end,
                "duration_minutes": duration,
            })
            alarm_id += 1
    return alarms


def _is_alarm_active(alarms: list[dict], ts: datetime, device: str) -> bool:
    for alarm in alarms:
        if alarm["device"] == device and alarm["start_time"] <= ts <= alarm["end_time"]:
            return True
    return False


def generate_mock_data(days: int = 30) -> dict:
    now = datetime.now()
    start_date = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days)

    alarms = _generate_alarms(start_date, days)

    device_alarm_index = defaultdict(list)
    for alarm in alarms:
        device_alarm_index[alarm["device"]].append(alarm)

    hourly_records = []
    for day_offset in range(days):
        current_date = start_date + timedelta(days=day_offset)
        for hour in range(24):
            ts = current_date.replace(hour=hour)
            shift = HOUR_SHIFT_MAP[hour]
            base_volume = HOUR_VOLUME_PATTERN[hour]
            day_factor = 1.0 + 0.1 * math.sin(2 * math.pi * day_offset / 7)

            for slot in SLOTS:
                device = SLOT_DEVICE_MAP[slot]
                route = SLOT_ROUTE_MAP[slot]

                slot_factor = 0.8 + random.random() * 0.4
                total_count = int(base_volume * day_factor * slot_factor / len(SLOTS) * 10)
                total_count = max(total_count, 5)

                alarm_active = _is_alarm_active(device_alarm_index[device], ts, device)

                if alarm_active:
                    base_error_rate = random.uniform(2.0, 5.0)
                else:
                    base_error_rate = random.uniform(0.3, 1.5)

                weekend_factor = 1.0
                if current_date.weekday() >= 5:
                    weekend_factor = 1.2
                error_rate = min(base_error_rate * weekend_factor, 8.0)

                error_count = max(int(total_count * error_rate / 100), 0)
                if error_count > total_count:
                    error_count = total_count

                review_failed = max(int(error_count * random.uniform(0.2, 0.5)), 0)

                hourly_records.append({
                    "timestamp": ts,
                    "slot": slot,
                    "shift": shift,
                    "device": device,
                    "route": route,
                    "total_count": total_count,
                    "error_count": error_count,
                    "review_failed": review_failed,
                    "alarm_active": alarm_active,
                })

    return {
        "records": hourly_records,
        "alarms": alarms,
        "start_date": start_date,
        "end_date": start_date + timedelta(days=days),
    }


def filter_records(data: dict, start_time: str = None, end_time: str = None,
                   shift: str = None, device: str = None,
                   slot: str = None, route: str = None) -> list[dict]:
    records = data["records"]
    if start_time:
        st = datetime.fromisoformat(start_time)
        records = [r for r in records if r["timestamp"] >= st]
    if end_time:
        et = datetime.fromisoformat(end_time)
        records = [r for r in records if r["timestamp"] <= et]
    if shift:
        records = [r for r in records if r["shift"] == shift]
    if device:
        records = [r for r in records if r["device"] == device]
    if slot:
        records = [r for r in records if r["slot"] == slot]
    if route:
        records = [r for r in records if r["route"] == route]
    return records


def filter_alarms(data: dict, start_time: str = None, end_time: str = None) -> list[dict]:
    alarms = data["alarms"]
    if start_time:
        st = datetime.fromisoformat(start_time)
        alarms = [a for a in alarms if a["start_time"] >= st]
    if end_time:
        et = datetime.fromisoformat(end_time)
        alarms = [a for a in alarms if a["end_time"] <= et]
    return alarms
