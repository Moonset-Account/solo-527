import random
from datetime import datetime, timedelta
from collections import defaultdict

random.seed(123)

SLOTS_VALID = [f"{row}{str(num).zfill(2)}" for row in "ABCDE" for num in range(1, 13)]
SHIFTS_VALID = ["早班", "中班", "晚班"]
DEVICES_VALID = [f"分拣机{i}" for i in range(1, 7)]
ROUTES_VALID = ["北京线路", "上海线路", "广州线路", "成都线路", "武汉线路", "西安线路", "杭州线路", "深圳线路"]

SLOT_ALIASES = {
    "格口 A01": "A01", "格口A-01": "A01", "a01": "A01",
    "格口 B03": "B03", "格口B-03": "B03", "b03": "B03",
    "格口 C05": "C05", "格口C-05": "C05", "c05": "C05",
    "格口 D07": "D07", "格口D-07": "D07", "d07": "D07",
    "格口 E09": "E09", "格口E-09": "E09", "e09": "E09",
}

HOUR_SHIFT_MAP = {}
for h in range(24):
    if 6 <= h < 14:
        HOUR_SHIFT_MAP[h] = "早班"
    elif 14 <= h < 22:
        HOUR_SHIFT_MAP[h] = "中班"
    else:
        HOUR_SHIFT_MAP[h] = "晚班"


def generate_raw_dirty_data(num_records: int = 500) -> list[dict]:
    base_time = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=7)
    records = []
    for _ in range(num_records):
        day_offset = random.randint(0, 6)
        hour = random.choices(range(24), k=1)[0]
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        ts = base_time + timedelta(days=day_offset, hours=hour, minutes=minute, seconds=second)

        slot = random.choice(SLOTS_VALID)
        if random.random() < 0.1:
            slot = random.choice(list(SLOT_ALIASES.keys()))

        device = random.choice(DEVICES_VALID)
        route = random.choice(ROUTES_VALID)
        total_count = random.randint(50, 300)
        error_rate = random.uniform(0.3, 3.0)
        error_count = max(int(total_count * error_rate / 100), 0)

        shift = HOUR_SHIFT_MAP.get(hour, "晚班")
        if random.random() < 0.08:
            shift = random.choice(["早", "中班 ", "晚班班", ""])

        record = {
            "timestamp": ts,
            "slot": slot,
            "device": device,
            "route": route,
            "total_count": total_count,
            "error_count": error_count,
            "shift": shift,
        }

        if random.random() < 0.05:
            record["duplicate_flag"] = True

        records.append(record)

    for _ in range(int(num_records * 0.03)):
        if records:
            orig = random.choice(records)
            dup = orig.copy()
            dup["duplicate_flag"] = True
            records.append(dup)

    for _ in range(int(num_records * 0.02)):
        if records:
            bad = random.choice(records).copy()
            bad["timestamp"] = bad["timestamp"] - timedelta(hours=random.randint(1, 3))
            bad["time_offset_flag"] = True
            records.append(bad)

    return records


def dedup(records: list[dict]) -> list[dict]:
    seen = set()
    result = []
    for r in records:
        key = (r["timestamp"].isoformat(), r["slot"], r["device"])
        if key not in seen:
            seen.add(key)
            result.append(r)
    return result


def calibrate_time(records: list[dict]) -> list[dict]:
    for r in records:
        ts = r["timestamp"]
        if ts.minute >= 55 or ts.minute <= 5:
            r["timestamp"] = ts.replace(minute=0, second=0, microsecond=0)
        r.pop("time_offset_flag", None)
    return records


def standardize_slots(records: list[dict]) -> list[dict]:
    for r in records:
        slot = r["slot"]
        if slot in SLOT_ALIASES:
            r["slot"] = SLOT_ALIASES[slot]
        elif slot in SLOTS_VALID:
            pass
        else:
            r["slot"] = "UNKNOWN"
    return records


def attribute_shift(records: list[dict]) -> list[dict]:
    for r in records:
        shift = r.get("shift", "")
        if shift in SHIFTS_VALID:
            continue
        hour = r["timestamp"].hour
        r["shift"] = HOUR_SHIFT_MAP.get(hour, "晚班")
    return records


def mark_alarm_periods(records: list[dict], alarms: list[dict]) -> list[dict]:
    device_alarms = defaultdict(list)
    for a in alarms:
        device_alarms[a["device"]].append((a["start_time"], a["end_time"]))

    for r in records:
        alarm_active = False
        for alarm_start, alarm_end in device_alarms.get(r["device"], []):
            if alarm_start <= r["timestamp"] <= alarm_end:
                alarm_active = True
                break
        r["alarm_active"] = alarm_active
    return records


def run_clean_pipeline(records: list[dict], alarms: list[dict] = None) -> dict:
    stats = {
        "原始记录数": len(records),
        "去重前": len(records),
    }

    cleaned = dedup(records)
    stats["去重后"] = len(cleaned)
    stats["去重移除数"] = len(records) - len(cleaned)

    cleaned = calibrate_time(cleaned)
    stats["时间校准"] = "已完成"

    unknown_before = sum(1 for r in cleaned if r["slot"] not in SLOTS_VALID)
    cleaned = standardize_slots(cleaned)
    unknown_after = sum(1 for r in cleaned if r["slot"] == "UNKNOWN")
    stats["格口标准化-别名修复"] = unknown_before - unknown_after
    stats["格口标准化-无法识别"] = unknown_after

    cleaned = attribute_shift(cleaned)
    stats["班次归属修正"] = "已完成"

    if alarms:
        cleaned = mark_alarm_periods(cleaned, alarms)
        alarm_count = sum(1 for r in cleaned if r.get("alarm_active"))
        stats["告警时段标记-受影响记录"] = alarm_count

    stats["最终记录数"] = len(cleaned)

    return {
        "cleaned_data": cleaned,
        "stats": stats,
    }


if __name__ == "__main__":
    raw = generate_raw_dirty_data(500)
    fake_alarms = [
        {"device": "分拣机1", "start_time": datetime.now() - timedelta(hours=2),
         "end_time": datetime.now() - timedelta(hours=1, minutes=30)},
        {"device": "分拣机3", "start_time": datetime.now() - timedelta(hours=5),
         "end_time": datetime.now() - timedelta(hours=4, minutes=15)},
    ]
    result = run_clean_pipeline(raw, fake_alarms)
    print("数据清洗统计:")
    for k, v in result["stats"].items():
        print(f"  {k}: {v}")
    print(f"\n清洗后记录数: {len(result['cleaned_data'])}")
