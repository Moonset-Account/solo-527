import io
import csv
import uuid
import threading
from datetime import datetime

from db.database import query

_export_tasks: dict = {}
_export_lock = threading.Lock()


def create_export_task(start_time: str = None, end_time: str = None,
                       data_type: str = "summary", shift: str = None,
                       slot: str = None, route: str = None,
                       device: str = None) -> str:
    task_id = str(uuid.uuid4())[:8]
    with _export_lock:
        _export_tasks[task_id] = {
            "task_id": task_id,
            "status": "处理中",
            "download_url": None,
            "created_at": datetime.now().isoformat(),
        }

    def _run():
        try:
            csv_content = _generate_csv(start_time, end_time, data_type,
                                        shift, slot, route, device)
            with _export_lock:
                _export_tasks[task_id]["status"] = "已完成"
                _export_tasks[task_id]["download_url"] = f"/api/export/{task_id}/download"
                _export_tasks[task_id]["csv_content"] = csv_content
        except Exception as e:
            with _export_lock:
                _export_tasks[task_id]["status"] = f"失败: {str(e)}"

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    return task_id


def get_export_task(task_id: str) -> dict | None:
    with _export_lock:
        task = _export_tasks.get(task_id)
        if task:
            return {
                "task_id": task["task_id"],
                "status": task["status"],
                "download_url": task.get("download_url"),
            }
        return None


def get_export_csv(task_id: str) -> str | None:
    with _export_lock:
        task = _export_tasks.get(task_id)
        if task and task.get("csv_content"):
            return task["csv_content"]
        return None


def _build_where(start_time=None, end_time=None, shift=None,
                 device=None, slot=None, route=None, prefix="h"):
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


def _build_alarm_where(start_time=None, end_time=None, device=None, prefix="a"):
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


def _generate_csv(start_time, end_time, data_type, shift, slot, route, device) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    if data_type == "alarm":
        alarm_where, alarm_params = _build_alarm_where(start_time, end_time, device)
        alarm_sql = f"""
            SELECT a.id, a.device_id, a.alarm_type,
                   a.alarm_start, a.alarm_end, a.duration_minutes
            FROM device_alarms a{alarm_where}
            ORDER BY a.alarm_start
        """
        rows = query(alarm_sql, tuple(alarm_params))
        writer.writerow(["告警ID", "设备", "告警类型", "开始时间", "结束时间", "持续分钟"])
        for a in rows:
            start_val = a["alarm_start"]
            end_val = a["alarm_end"]
            if isinstance(start_val, datetime):
                start_val = start_val.strftime("%Y-%m-%d %H:%M:%S")
            if isinstance(end_val, datetime):
                end_val = end_val.strftime("%Y-%m-%d %H:%M:%S")
            writer.writerow([
                a["id"],
                a["device_id"],
                a["alarm_type"],
                start_val,
                end_val,
                a["duration_minutes"],
            ])
    else:
        where, params = _build_where(start_time, end_time, shift, device, slot, route)
        sql = f"""
            SELECT h.stat_time, h.slot_id, h.shift_id, h.device_id, h.route_id,
                   h.total_count, h.error_count, h.review_failed, h.alarm_active
            FROM hourly_sort_stats h{where}
            ORDER BY h.stat_time, h.slot_id
            LIMIT 100000
        """
        rows = query(sql, tuple(params))
        if data_type == "summary":
            writer.writerow(["时间戳", "格口", "班次", "设备", "线路",
                             "总分拣量", "差错量", "复核不通过量", "告警时段"])
            for r in rows:
                ts = r["stat_time"]
                if isinstance(ts, datetime):
                    ts = ts.strftime("%Y-%m-%d %H:%M:%S")
                writer.writerow([
                    ts,
                    r["slot_id"],
                    r["shift_id"],
                    r["device_id"],
                    r["route_id"],
                    int(r["total_count"]),
                    int(r["error_count"]),
                    int(r["review_failed"]),
                    "是" if r["alarm_active"] else "否",
                ])
        else:
            writer.writerow(["时间戳", "格口", "班次", "设备", "线路",
                             "总分拣量", "差错量"])
            for r in rows:
                ts = r["stat_time"]
                if isinstance(ts, datetime):
                    ts = ts.strftime("%Y-%m-%d %H:%M:%S")
                writer.writerow([
                    ts,
                    r["slot_id"],
                    r["shift_id"],
                    r["device_id"],
                    r["route_id"],
                    int(r["total_count"]),
                    int(r["error_count"]),
                ])

    return output.getvalue()
