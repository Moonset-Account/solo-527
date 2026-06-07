from collections import defaultdict
from datetime import datetime

from db.database import query
from cache import get_cached, set_cached, get_cache_key


def _time_filter(start_time: str = None, end_time: str = None, prefix: str = "h") -> tuple[str, list]:
    clauses = []
    params = []
    if start_time:
        clauses.append(f"{prefix}.stat_time >= %s")
        params.append(start_time)
    if end_time:
        clauses.append(f"{prefix}.stat_time <= %s")
        params.append(end_time)
    return clauses, params


def _full_filter(start_time: str = None, end_time: str = None,
                 shift: str = None, device: str = None,
                 slot: str = None, route: str = None,
                 prefix: str = "h") -> tuple[str, list]:
    clauses = []
    params = []
    if start_time:
        clauses.append(f"{prefix}.stat_time >= %s")
        params.append(start_time)
    if end_time:
        clauses.append(f"{prefix}.stat_time <= %s")
        params.append(end_time)
    if shift:
        clauses.append(f"{prefix}.shift_id = %s")
        params.append(shift)
    if device:
        clauses.append(f"{prefix}.device_id = %s")
        params.append(device)
    if slot:
        clauses.append(f"{prefix}.slot_id = %s")
        params.append(slot)
    if route:
        clauses.append(f"{prefix}.route_id = %s")
        params.append(route)
    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    return where, params


def _alarm_filter(start_time: str = None, end_time: str = None,
                  device: str = None, prefix: str = "a") -> tuple[str, list]:
    clauses = []
    params = []
    if start_time:
        clauses.append(f"{prefix}.alarm_start >= %s")
        params.append(start_time)
    if end_time:
        clauses.append(f"{prefix}.alarm_end <= %s")
        params.append(end_time)
    if device:
        clauses.append(f"{prefix}.device_id = %s")
        params.append(device)
    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    return where, params


def compute_summary(start_time: str = None, end_time: str = None,
                    shift: str = None, device: str = None,
                    slot: str = None, route: str = None) -> dict:
    cache_key = get_cache_key("summary", start_time=start_time, end_time=end_time,
                              shift=shift, device=device, slot=slot, route=route)
    cached = get_cached(cache_key)
    if cached:
        return cached

    where, params = _full_filter(start_time, end_time, shift, device, slot, route)
    sql = f"""
        SELECT COALESCE(SUM(total_count), 0) as total_sorted,
               COALESCE(SUM(error_count), 0) as total_errors,
               COALESCE(SUM(review_failed), 0) as review_failed
        FROM hourly_sort_stats h{where}
    """
    row = query(sql, tuple(params))[0]

    alarm_where, alarm_params = _alarm_filter(start_time, end_time, device)
    alarm_sql = f"SELECT count(*) as cnt FROM device_alarms a{alarm_where}"
    alarm_row = query(alarm_sql, tuple(alarm_params))[0]

    total_sorted = int(row["total_sorted"])
    total_errors = int(row["total_errors"])
    review_failed = int(row["review_failed"])
    alarm_count = int(alarm_row["cnt"])
    error_rate = round(total_errors / total_sorted * 100, 2) if total_sorted > 0 else 0.0

    prev_start = None
    prev_end = None
    error_rate_change = 0.0
    alarm_count_change = 0

    if start_time and end_time:
        st = datetime.fromisoformat(start_time)
        et = datetime.fromisoformat(end_time)
        duration = et - st
        prev_start = (st - duration).isoformat()
        prev_end = start_time

        prev_where, prev_params = _full_filter(prev_start, prev_end, shift, device, slot, route)
        prev_sql = f"""
            SELECT COALESCE(SUM(total_count), 0) as total_sorted,
                   COALESCE(SUM(error_count), 0) as total_errors
            FROM hourly_sort_stats h{prev_where}
        """
        prev_row = query(prev_sql, tuple(prev_params))[0]
        prev_sorted = int(prev_row["total_sorted"])
        prev_errors = int(prev_row["total_errors"])
        prev_error_rate = round(prev_errors / prev_sorted * 100, 2) if prev_sorted > 0 else 0.0
        error_rate_change = round(error_rate - prev_error_rate, 2) if prev_error_rate > 0 else 0.0

        prev_alarm_where, prev_alarm_params = _alarm_filter(prev_start, prev_end, device)
        prev_alarm_sql = f"SELECT count(*) as cnt FROM device_alarms a{prev_alarm_where}"
        prev_alarm_count = int(query(prev_alarm_sql, tuple(prev_alarm_params))[0]["cnt"])
        alarm_count_change = int(alarm_count - prev_alarm_count)

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


def compute_trend(start_time: str = None, end_time: str = None,
                  granularity: str = "hour", shift: str = None,
                  slot: str = None, route: str = None, device: str = None) -> dict:
    cache_key = get_cache_key("trend", start_time=start_time, end_time=end_time,
                              granularity=granularity, shift=shift,
                              slot=slot, route=route, device=device)
    cached = get_cached(cache_key)
    if cached:
        return cached

    where, params = _full_filter(start_time, end_time, shift, device, slot, route)

    if granularity == "day":
        group_expr = "DATE(h.stat_time)"
        order_expr = "DATE(h.stat_time)"
    else:
        group_expr = "h.stat_time"
        order_expr = "h.stat_time"

    sql = f"""
        SELECT {group_expr} as ts,
               SUM(h.total_count) as total_count,
               SUM(h.error_count) as error_count
        FROM hourly_sort_stats h{where}
        GROUP BY {group_expr}
        ORDER BY {order_expr}
    """
    rows = query(sql, tuple(params))

    timestamps = []
    error_counts = []
    error_rates = []
    total_counts = []
    for r in rows:
        ts_val = r["ts"]
        if isinstance(ts_val, datetime):
            ts_str = ts_val.strftime("%Y-%m-%d %H:%M:%S")
        else:
            ts_str = str(ts_val)
        timestamps.append(ts_str)
        total = int(r["total_count"])
        errors = int(r["error_count"])
        total_counts.append(total)
        error_counts.append(errors)
        error_rates.append(round(errors / total * 100, 2) if total > 0 else 0.0)

    alarm_where, alarm_params = _alarm_filter(start_time, end_time, device)
    alarm_sql = f"""
        SELECT a.device_id as device, a.alarm_type,
               a.alarm_start, a.alarm_end, a.duration_minutes
        FROM device_alarms a{alarm_where}
        ORDER BY a.alarm_start
    """
    alarm_rows = query(alarm_sql, tuple(alarm_params))
    alarm_periods = []
    for a in alarm_rows:
        alarm_periods.append({
            "device": a["device_id"],
            "alarm_type": a["alarm_type"],
            "start_time": a["alarm_start"].strftime("%Y-%m-%d %H:%M:%S") if isinstance(a["alarm_start"], datetime) else str(a["alarm_start"]),
            "end_time": a["alarm_end"].strftime("%Y-%m-%d %H:%M:%S") if isinstance(a["alarm_end"], datetime) else str(a["alarm_end"]),
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


def compute_heatmap(start_time: str = None, end_time: str = None,
                    metric: str = "error_rate", shift: str = None,
                    slot: str = None, route: str = None, device: str = None) -> dict:
    cache_key = get_cache_key("heatmap", start_time=start_time, end_time=end_time,
                              metric=metric, shift=shift, slot=slot, route=route, device=device)
    cached = get_cached(cache_key)
    if cached:
        return cached

    where, params = _full_filter(start_time, end_time, shift, device, slot, route)

    sql = f"""
        SELECT h.slot_id,
               TO_CHAR(h.stat_time, 'MM-DD HH24:00') as time_key,
               SUM(h.total_count) as total_count,
               SUM(h.error_count) as error_count
        FROM hourly_sort_stats h{where}
        GROUP BY h.slot_id, time_key
        ORDER BY h.slot_id, time_key
    """
    rows = query(sql, tuple(params))

    slot_time_agg = defaultdict(lambda: defaultdict(lambda: {"total": 0, "errors": 0}))
    all_time_keys = set()
    for r in rows:
        sk = r["slot_id"]
        tk = r["time_key"]
        slot_time_agg[sk][tk]["total"] += int(r["total_count"])
        slot_time_agg[sk][tk]["errors"] += int(r["error_count"])
        all_time_keys.add(tk)

    time_periods = sorted(all_time_keys)

    slot_where = ""
    slot_params = []
    target_slots_sql = "SELECT slot_id FROM slots"
    if slot:
        slot_where = " WHERE slot_id = %s"
        slot_params = [slot]
    slot_rows = query(target_slots_sql + slot_where + " ORDER BY slot_id", tuple(slot_params))
    filtered_slots = [r["slot_id"] for r in slot_rows]

    values = []
    for s in filtered_slots:
        row = []
        for tp in time_periods:
            agg = slot_time_agg[s][tp]
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
        "slots": filtered_slots,
        "time_periods": time_periods,
        "values": values,
    }
    set_cached(cache_key, result)
    return result


def compute_shift_rank(start_time: str = None, end_time: str = None,
                       shift: str = None, slot: str = None,
                       route: str = None, device: str = None) -> dict:
    cache_key = get_cache_key("shift_rank", start_time=start_time, end_time=end_time,
                              shift=shift, slot=slot, route=route, device=device)
    cached = get_cached(cache_key)
    if cached:
        return cached

    where, params = _full_filter(start_time, end_time, shift, device, slot, route)

    sql = f"""
        SELECT h.shift_id,
               SUM(h.total_count) as total_sorted,
               SUM(h.error_count) as error_count
        FROM hourly_sort_stats h{where}
        GROUP BY h.shift_id
        ORDER BY h.shift_id
    """
    rows = query(sql, tuple(params))

    shift_agg = {}
    for r in rows:
        shift_agg[r["shift_id"]] = {
            "total": int(r["total_sorted"]),
            "errors": int(r["error_count"]),
        }

    alarm_where, alarm_params = _alarm_filter(start_time, end_time, device)
    alarm_sql = f"SELECT device_id, alarm_start FROM device_alarms a{alarm_where}"
    alarm_rows = query(alarm_sql, tuple(alarm_params))

    shift_alarm_count = defaultdict(int)
    for a in alarm_rows:
        h = a["alarm_start"].hour if isinstance(a["alarm_start"], datetime) else 12
        if 6 <= h < 14:
            s = "早班"
        elif 14 <= h < 22:
            s = "中班"
        else:
            s = "晚班"
        shift_alarm_count[s] += 1

    target_shifts = [shift] if shift else ["早班", "中班", "晚班"]

    rank_data = []
    for s in target_shifts:
        agg = shift_agg.get(s, {"total": 0, "errors": 0})
        error_rate = round(agg["errors"] / agg["total"] * 100, 2) if agg["total"] > 0 else 0.0
        rank_data.append({
            "shift": s,
            "total_sorted": agg["total"],
            "error_count": agg["errors"],
            "error_rate": error_rate,
            "alarm_count": shift_alarm_count[s],
            "rank": 0,
        })

    rank_data.sort(key=lambda x: x["error_rate"])
    for i, item in enumerate(rank_data):
        item["rank"] = i + 1

    result = {"data": rank_data}
    set_cached(cache_key, result)
    return result


def compute_alarm_correlation(start_time: str = None, end_time: str = None,
                              shift: str = None, slot: str = None,
                              route: str = None, device: str = None) -> dict:
    cache_key = get_cache_key("alarm_correlation", start_time=start_time, end_time=end_time,
                              shift=shift, slot=slot, route=route, device=device)
    cached = get_cached(cache_key)
    if cached:
        return cached

    where, params = _full_filter(start_time, end_time, shift, device, slot, route)

    alarm_where, alarm_params = _alarm_filter(start_time, end_time, device)

    alarm_records_sql = f"""
        SELECT h.device_id, h.route_id, h.shift_id, SUM(h.error_count) as error_count
        FROM hourly_sort_stats h{where}
        {' AND' if where.replace('WHERE','').strip() else ' WHERE'} h.alarm_active = TRUE
        GROUP BY h.device_id, h.route_id, h.shift_id
    """
    if "WHERE" not in where:
        alarm_records_sql = f"""
            SELECT h.device_id, h.route_id, h.shift_id, SUM(h.error_count) as error_count
            FROM hourly_sort_stats h WHERE h.alarm_active = TRUE
        """
        extra_clauses = []
        extra_params = []
        if start_time:
            extra_clauses.append("h.stat_time >= %s")
            extra_params.append(start_time)
        if end_time:
            extra_clauses.append("h.stat_time <= %s")
            extra_params.append(end_time)
        if shift:
            extra_clauses.append("h.shift_id = %s")
            extra_params.append(shift)
        if device:
            extra_clauses.append("h.device_id = %s")
            extra_params.append(device)
        if slot:
            extra_clauses.append("h.slot_id = %s")
            extra_params.append(slot)
        if route:
            extra_clauses.append("h.route_id = %s")
            extra_params.append(route)
        if extra_clauses:
            alarm_records_sql += " AND " + " AND ".join(extra_clauses)
            params = list(extra_params)
        else:
            params = []
        alarm_records_sql += " GROUP BY h.device_id, h.route_id, h.shift_id"

    alarm_rows = query(alarm_records_sql, tuple(params))

    devices_sql = "SELECT device_id FROM devices"
    dev_params = []
    if device:
        devices_sql += " WHERE device_id = %s"
        dev_params = [device]
    device_rows = query(devices_sql + " ORDER BY device_id", tuple(dev_params))
    target_devices = [r["device_id"] for r in device_rows]

    routes_in_data = set()
    for r in alarm_rows:
        routes_in_data.add(r["route_id"])

    nodes = []
    for d in target_devices:
        nodes.append({"name": d, "category": "设备"})
    for r in sorted(routes_in_data):
        nodes.append({"name": r, "category": "线路"})
    if not shift:
        for s in ["早班", "中班", "晚班"]:
            nodes.append({"name": s, "category": "班次"})

    device_error = defaultdict(int)
    route_error = defaultdict(int)
    device_route = defaultdict(int)

    for r in alarm_rows:
        dev = r["device_id"]
        rt = r["route_id"]
        cnt = int(r["error_count"])
        device_error[dev] += cnt
        route_error[rt] += cnt
        device_route[(dev, rt)] += cnt

    links = []
    for d in target_devices:
        if device_error[d] > 0:
            links.append({"source": "告警", "target": d, "value": device_error[d]})
    for (dev, rt), count in device_route.items():
        if count > 0 and dev in target_devices and rt in routes_in_data:
            links.append({"source": dev, "target": rt, "value": count})
    for r in sorted(routes_in_data):
        if route_error[r] > 0:
            links.append({"source": r, "target": "差错", "value": route_error[r]})

    nodes.insert(0, {"name": "告警", "category": "触发源"})
    nodes.append({"name": "差错", "category": "结果"})

    result = {
        "nodes": nodes,
        "links": links,
    }
    set_cached(cache_key, result)
    return result
