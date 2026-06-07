import io
import csv
import uuid
import threading
from datetime import datetime

from mock_data import filter_records, filter_alarms

_export_tasks: dict = {}
_export_lock = threading.Lock()


def create_export_task(data: dict, start_time: str = None, end_time: str = None,
                       data_type: str = "summary") -> str:
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
            csv_content = _generate_csv(data, start_time, end_time, data_type)
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


def _generate_csv(data: dict, start_time: str, end_time: str, data_type: str) -> str:
    records = filter_records(data, start_time, end_time)

    output = io.StringIO()
    if data_type == "summary":
        writer = csv.writer(output)
        writer.writerow(["时间戳", "格口", "班次", "设备", "线路", "总分拣量", "差错量", "复核不通过量", "告警时段"])
        for r in records:
            writer.writerow([
                r["timestamp"].strftime("%Y-%m-%d %H:%M:%S"),
                r["slot"],
                r["shift"],
                r["device"],
                r["route"],
                r["total_count"],
                r["error_count"],
                r["review_failed"],
                "是" if r["alarm_active"] else "否",
            ])
    elif data_type == "alarm":
        alarms = filter_alarms(data, start_time, end_time)
        writer = csv.writer(output)
        writer.writerow(["告警ID", "设备", "告警类型", "开始时间", "结束时间", "持续分钟"])
        for a in alarms:
            writer.writerow([
                a["alarm_id"],
                a["device"],
                a["alarm_type"],
                a["start_time"].strftime("%Y-%m-%d %H:%M:%S"),
                a["end_time"].strftime("%Y-%m-%d %H:%M:%S"),
                a["duration_minutes"],
            ])
    else:
        writer = csv.writer(output)
        writer.writerow(["时间戳", "格口", "班次", "设备", "线路", "总分拣量", "差错量"])
        for r in records:
            writer.writerow([
                r["timestamp"].strftime("%Y-%m-%d %H:%M:%S"),
                r["slot"],
                r["shift"],
                r["device"],
                r["route"],
                r["total_count"],
                r["error_count"],
            ])

    return output.getvalue()
