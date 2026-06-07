import uuid
import pandas as pd
import os
import io
from datetime import datetime
from typing import Dict
from dataclasses import dataclass, field


@dataclass
class ExportTask:
    task_id: str
    status: str
    progress: int
    filters: dict
    file_path: str = None
    error_message: str = None
    created_at: datetime = field(default_factory=datetime.now)


class ExportManager:
    _instance = None
    _tasks: Dict[str, ExportTask] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            os.makedirs("exports", exist_ok=True)
        return cls._instance
    
    def submit_task(self, filters: dict, export_type: str, format: str = "xlsx") -> str:
        task_id = str(uuid.uuid4())
        task = ExportTask(
            task_id=task_id,
            status="pending",
            progress=0,
            filters=filters,
        )
        self._tasks[task_id] = task
        self._process_task(task_id, export_type, format)
        return task_id
    
    def _process_task(self, task_id: str, export_type: str, format: str):
        import threading
        thread = threading.Thread(target=self._do_export, args=(task_id, export_type, format))
        thread.daemon = True
        thread.start()
    
    def _do_export(self, task_id: str, export_type: str, format: str):
        task = self._tasks[task_id]
        try:
            task.status = "processing"
            task.progress = 20
            
            from data.cleaning.mock_data_generator import data_store
            from data.api.routes.queries import _apply_filters
            
            f = task.filters
            time_start = datetime.fromisoformat(f["time_start"]) if isinstance(f["time_start"], str) else f["time_start"]
            time_end = datetime.fromisoformat(f["time_end"]) if isinstance(f["time_end"], str) else f["time_end"]
            
            task.progress = 40
            
            review_logs = data_store.get_review_logs()
            filtered = _apply_filters(
                review_logs,
                f.get("risk_tags"),
                f.get("queue_types"),
                f.get("reviewers"),
                f.get("shifts"),
                f.get("sources"),
                time_start,
                time_end,
            )
            
            task.progress = 70
            
            os.makedirs("exports", exist_ok=True)
            file_name = f"{export_type}_{task_id[:8]}.{format}"
            file_path = os.path.join("exports", file_name)
            
            cols = [
                "video_id", "source", "queue_type", "enqueue_time",
                "machine_risk_tags", "reviewer_id", "reviewer_decision",
                "final_risk_tags", "shift", "reviewer_start_time", "reviewer_end_time"
            ]
            export_df = filtered[cols].copy()
            for col in ["machine_risk_tags", "final_risk_tags"]:
                export_df[col] = export_df[col].apply(lambda x: ",".join(x) if isinstance(x, list) else "")
            
            task.progress = 90
            
            if format == "xlsx":
                export_df.to_excel(file_path, index=False, engine="openpyxl")
            else:
                export_df.to_csv(file_path, index=False)
            
            task.file_path = file_path
            task.status = "completed"
            task.progress = 100
            
        except Exception as e:
            task.status = "failed"
            task.error_message = str(e)
    
    def get_status(self, task_id: str) -> ExportTask:
        return self._tasks.get(task_id)
    
    def get_file_path(self, task_id: str) -> str:
        task = self._tasks.get(task_id)
        return task.file_path if task else None


export_manager = ExportManager()
