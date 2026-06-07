from collections import defaultdict
from datetime import datetime, timedelta

from mock_data import (
    filter_records, filter_alarms, SLOTS, SHIFTS, DEVICES, ROUTES,
    SLOT_DEVICE_MAP, SLOT_ROUTE_MAP,
)
from cache import get_cached, set_cached, get_cache_key


def compute_summary(data: dict, start_time: str = None, end_time: str = None,
                    shift: str = None, device: str = None) -> dict:
    cache_key = get_cache_key("summary", start_time=start_time, end_time=end_time,
                              shift=shift, device=device)
    cached = get_cached(cache_key)
    if cached:
        return cached

    records = filter_records(data, start_time, end_time, shift, device)
    total_sorted = sum(r["total_count"] for r in records)
    total_errors = sum(r["error_count"] for r in records)
    review_failed = sum(r["review_failed"] for r in records)

    alarms = filter_alarms(data, start_time, end_time)
    alarm_count = len(alarms)

    error_rate = round(total_errors / total_sorted * 100, 2) if total_sorted > 0 else 0.0

    prev_start = None
    prev_end = None
    if start_time and end_time:
        st = datetime.fromisoformat(start_time)
        et = datetime.fromisoformat(end_time)
        duration = et - st
        prev_start = (st - duration).isoformat()
        prev_end = start_time

    prev_records = filter_records(data, prev_start, prev_end, shift, device)
    prev_sorted = sum(r["total_count"] for r in prev_records)
    prev_errors = sum(r["error_count"] for r in prev_records)
    prev_error_rate = round(prev_errors / prev_sorted * 100, 2) if prev_sorted > 0 else 0.0

    prev_alarms = filter_alarms(data, prev_start, prev_end)
    prev_alarm_count = len(prev_alarms)

    error_rate_change = round(error_rate - prev_error_rate, 2) if prev_error_rate > 0 else 0.0
    alarm_count_change = alarm_count - prev_alarm_count

    result = {
        "total_packages": total_sorted,
        "total_sorted": total_sorted,
        "total_errors": total_errors,
        "error_rate": error_rate,
        "alarm_count": alarm_count,
        "review_failed": review_failed,
        "error_rate_change": error_rate_change,
        "alarm_count_change": alarm_count_change,
    }
    set_cached(cache_key, result)
    return result


def compute_trend(data: dict, start_time: str = None, end_time: str = None,
                  granularity: str = "hour", shift: str = None) -> dict:
    cache_key = get_cache_key("trend", start_time=start_time, end_time=end_time,
                              granularity=granularity, shift=shift)
    cached = get_cached(cache_key)
    if cached:
        return cached

    records = filter_records(data, start_time, end_time, shift=shift)

    hourly_agg = defaultdict(lambda: {"total": 0, "errors": 0})
    for r in records:
        ts_key = r["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
        hourly_agg[ts_key]["total"] += r["total_count"]
        hourly_agg[ts_key]["errors"] += r["error_count"]

    sorted_keys = sorted(hourly_agg.keys())

    if granularity == "day":
        daily_agg = defaultdict(lambda: {"total": 0, "errors": 0})
        for k in sorted_keys:
            day_key = k[:10]
            daily_agg[day_key]["total"] += hourly_agg[k]["total"]
            daily_agg[day_key]["errors"] += hourly_agg[k]["errors"]
        sorted_keys = sorted(daily_agg.keys())
        agg_data = daily_agg
    else:
        agg_data = hourly_agg

    timestamps = []
    error_counts = []
    error_rates = []
    total_counts = []

    for k in sorted_keys:
        timestamps.append(k)
        total = agg_data[k]["total"]
        errors = agg_data[k]["errors"]
        total_counts.append(total)
        error_counts.append(errors)
        error_rates.append(round(errors / total * 100, 2) if total > 0 else 0.0)

    alarms = filter_alarms(data, start_time, end_time)
    alarm_periods = []
    for a in alarms:
        alarm_periods.append({
            "device": a["device"],
            "alarm_type": a["alarm_type"],
            "start_time": a["start_time"].strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": a["end_time"].strftime("%Y-%m-%d %H:%M:%S"),
            "duration_minutes": a["duration_minutes"],
        })

    result = {
        "timestamps": timestamps,
        "error_counts": error_counts,
        "error_rates": error_rates,
        "total_counts": total_counts,
        "alarm_periods": alarm_periods,
    }
    set_cached(cache_key, result)
    return result


def compute_heatmap(data: dict, start_time: str = None, end_time: str = None,
                    metric: str = "error_rate") -> dict:
    cache_key = get_cache_key("heatmap", start_time=start_time, end_time=end_time, metric=metric)
    cached = get_cached(cache_key)
    if cached:
        return cached

    records = filter_records(data, start_time, end_time)

    slot_time_agg = defaultdict(lambda: defaultdict(lambda: {"total": 0, "errors": 0}))
    for r in records:
        time_key = r["timestamp"].strftime("%m-%d %H:00")
        slot_time_agg[r["slot"]][time_key]["total"] += r["total_count"]
        slot_time_agg[r["slot"]][time_key]["errors"] += r["error_count"]

    all_time_keys = set()
    for slot_data in slot_time_agg.values():
        all_time_keys.update(slot_data.keys())
    time_periods = sorted(all_time_keys)

    values = []
    for slot in SLOTS:
        row = []
        for tp in time_periods:
            agg = slot_time_agg[slot][tp]
            if metric == "error_rate":
                val = round(agg["errors"] / agg["total"] * 100, 2) if agg["total"] > 0 else 0.0
            elif metric == "error_count":
                val = agg["errors"]
            elif metric == "total_count":
                val = agg["total"]
            else:
                val = round(agg["errors"] / agg["total"] * 100, 2) if agg["total"] > 0 else 0.0
            row.append(val)
        values.append(row)

    result = {
        "slots": SLOTS,
        "time_periods": time_periods,
        "values": values,
    }
    set_cached(cache_key, result)
    return result


def compute_shift_rank(data: dict, start_time: str = None, end_time: str = None) -> dict:
    cache_key = get_cache_key("shift_rank", start_time=start_time, end_time=end_time)
    cached = get_cached(cache_key)
    if cached:
        return cached

    records = filter_records(data, start_time, end_time)
    alarms = filter_alarms(data, start_time, end_time)

    shift_agg = defaultdict(lambda: {"total": 0, "errors": 0})
    for r in records:
        shift_agg[r["shift"]]["total"] += r["total_count"]
        shift_agg[r["shift"]]["errors"] += r["error_count"]

    shift_alarm_count = defaultdict(int)
    for a in alarms:
        shift = None
        h = a["start_time"].hour
        if 6 <= h < 14:
            shift = "早班"
        elif 14 <= h < 22:
            shift = "中班"
        else:
            shift = "晚班"
        shift_alarm_count[shift] += 1

    rank_data = []
    for shift in SHIFTS:
        agg = shift_agg[shift]
        error_rate = round(agg["errors"] / agg["total"] * 100, 2) if agg["total"] > 0 else 0.0
        rank_data.append({
            "shift": shift,
            "total_sorted": agg["total"],
            "error_count": agg["errors"],
            "error_rate": error_rate,
            "alarm_count": shift_alarm_count[shift],
            "rank": 0,
        })

    rank_data.sort(key=lambda x: x["error_rate"])
    for i, item in enumerate(rank_data):
        item["rank"] = i + 1

    result = {"data": rank_data}
    set_cached(cache_key, result)
    return result


def compute_alarm_correlation(data: dict, start_time: str = None, end_time: str = None) -> dict:
    cache_key = get_cache_key("alarm_correlation", start_time=start_time, end_time=end_time)
    cached = get_cached(cache_key)
    if cached:
        return cached

    records = filter_records(data, start_time, end_time)
    alarms = filter_alarms(data, start_time, end_time)

    alarm_records = [r for r in records if r["alarm_active"]]
    non_alarm_records = [r for r in records if not r["alarm_active"]]

    nodes = []
    node_names = set()

    for device in DEVICES:
        node_names.add(device)
        nodes.append({"name": device, "category": "设备"})
    for route in ROUTES:
        node_names.add(route)
        nodes.append({"name": route, "category": "线路"})
    for shift in SHIFTS:
        node_names.add(shift)
        nodes.append({"name": shift, "category": "班次"})

    device_error = defaultdict(int)
    route_error = defaultdict(int)
    shift_error = defaultdict(int)
    device_route = defaultdict(int)

    for r in alarm_records:
        device_error[r["device"]] += r["error_count"]
        route_error[r["route"]] += r["error_count"]
        shift_error[r["shift"]] += r["error_count"]
        device_route[(r["device"], r["route"])] += r["error_count"]

    links = []
    for device in DEVICES:
        if device_error[device] > 0:
            links.append({"source": "告警", "target": device, "value": device_error[device]})
    for (device, route), count in device_route.items():
        if count > 0:
            links.append({"source": device, "target": route, "value": count})
    for route in ROUTES:
        if route_error[route] > 0:
            links.append({"source": route, "target": "差错", "value": route_error[route]})

    nodes.insert(0, {"name": "告警", "category": "触发源"})
    nodes.append({"name": "差错", "category": "结果"})

    result = {
        "nodes": nodes,
        "links": links,
    }
    set_cached(cache_key, result)
    return result
