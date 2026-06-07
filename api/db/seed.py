import random
import math
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import psycopg2

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "logistics_sort",
    "user": "postgres",
    "password": "",
}

SLOTS = [f"{row}{str(num).zfill(2)}" for row in "ABCDE" for num in range(1, 13)]
SHIFTS = ["早班", "中班", "晚班"]
DEVICES = [f"分拣机{i}" for i in range(1, 7)]
ROUTES = ["北京线路", "上海线路", "广州线路", "成都线路", "武汉线路", "西安线路", "杭州线路", "深圳线路"]
ALARM_TYPES = ["传感器故障", "皮带跑偏", "电机过载", "通信中断", "格口堵塞", "扫码异常"]

SLOT_DEVICE_MAP = {slot: DEVICES[i % len(DEVICES)] for i, slot in enumerate(SLOTS)}
SLOT_ROUTE_MAP = {slot: ROUTES[i % len(ROUTES)] for i, slot in enumerate(SLOTS)}

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

random.seed(42)


def seed():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("TRUNCATE hourly_sort_stats, device_alarms, slots, shifts, devices, routes CASCADE")

    for i, slot in enumerate(SLOTS):
        zone = chr(65 + i // 12)
        cur.execute("INSERT INTO slots (slot_id, slot_name, zone) VALUES (%s, %s, %s)", (slot, f"格口{slot}", zone))

    shift_data = [
        ("早班", "早班", "06:00:00", "14:00:00"),
        ("中班", "中班", "14:00:00", "22:00:00"),
        ("晚班", "晚班", "22:00:00", "06:00:00"),
    ]
    for sid, sname, st, et in shift_data:
        cur.execute("INSERT INTO shifts (shift_id, shift_name, start_time, end_time) VALUES (%s, %s, %s, %s)", (sid, sname, st, et))

    for i, dev in enumerate(DEVICES):
        cur.execute("INSERT INTO devices (device_id, device_name, device_type) VALUES (%s, %s, %s)", (dev, dev, "自动分拣机"))

    for i, rt in enumerate(ROUTES):
        dest = rt.replace("线路", "")
        cur.execute("INSERT INTO routes (route_id, route_name, destination) VALUES (%s, %s, %s)", (rt, rt, dest))

    conn.commit()

    now = datetime.now()
    start_date = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30)

    alarms = []
    alarm_id = 0
    for day_offset in range(30):
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
                "device_id": device,
                "alarm_type": alarm_type,
                "start_time": alarm_start,
                "end_time": alarm_end,
                "duration_minutes": duration,
                "severity": random.choice(["warning", "critical"]),
            })
            cur.execute(
                "INSERT INTO device_alarms (device_id, alarm_type, alarm_start, alarm_end, severity, duration_minutes) VALUES (%s, %s, %s, %s, %s, %s)",
                (device, alarm_type, alarm_start, alarm_end, "warning", duration),
            )
            alarm_id += 1

    conn.commit()

    from collections import defaultdict
    device_alarm_index = defaultdict(list)
    for alarm in alarms:
        device_alarm_index[alarm["device_id"]].append(alarm)

    batch = []
    batch_size = 5000
    for day_offset in range(30):
        current_date = start_date + timedelta(days=day_offset)
        for hour in range(24):
            ts = current_date.replace(hour=hour, minute=0, second=0, microsecond=0)
            shift = HOUR_SHIFT_MAP[hour]
            base_volume = HOUR_VOLUME_PATTERN[hour]
            day_factor = 1.0 + 0.1 * math.sin(2 * math.pi * day_offset / 7)

            for slot in SLOTS:
                device = SLOT_DEVICE_MAP[slot]
                route = SLOT_ROUTE_MAP[slot]
                slot_factor = 0.8 + random.random() * 0.4
                total_count = int(base_volume * day_factor * slot_factor / len(SLOTS) * 10)
                total_count = max(total_count, 5)

                alarm_active = False
                for alarm in device_alarm_index.get(device, []):
                    if alarm["start_time"] <= ts <= alarm["end_time"]:
                        alarm_active = True
                        break

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

                batch.append((ts, slot, shift, device, route, total_count, error_count, review_failed, alarm_active))

                if len(batch) >= batch_size:
                    cur.executemany(
                        "INSERT INTO hourly_sort_stats (stat_time, slot_id, shift_id, device_id, route_id, total_count, error_count, review_failed, alarm_active) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                        batch,
                    )
                    batch = []

    if batch:
        cur.executemany(
            "INSERT INTO hourly_sort_stats (stat_time, slot_id, shift_id, device_id, route_id, total_count, error_count, review_failed, alarm_active) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            batch,
        )

    conn.commit()
    cur.close()
    conn.close()
    print("Seed completed successfully!")


if __name__ == "__main__":
    seed()
