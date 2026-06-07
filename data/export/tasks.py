import uuid
import pandas as pd
import os
import io
from datetime import datetime
from typing import Dict, Optional
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)


@dataclass
class ExportTask:
    task_id: str
    status: str
    progress: int
    filters: dict
    file_path: str = None
    error_message: str = None
    created_at: datetime = field(default_factory=datetime.now)
    export_type: str = "review_logs"
    format: str = "xlsx"


class ExportManager:
    _instance = None
    _tasks: Dict[str, ExportTask] = {}
    _use_db = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            os.makedirs("exports", exist_ok=True)
            cls._instance._init_db()
        return cls._instance

    def _init_db(self):
        try:
            from data.db.models import db_manager
            self._use_db = db_manager.is_connected
            if self._use_db:
                logger.info("✅ 导出任务将持久化到数据库")
            else:
                logger.info("ℹ️  导出任务使用内存存储（数据库未连接）")
        except Exception as e:
            logger.info(f"ℹ️  导出任务使用内存存储: {e}")
            self._use_db = False

    def submit_task(self, filters: dict, export_type: str, format: str = "xlsx") -> str:
        task_id = str(uuid.uuid4())
        task = ExportTask(
            task_id=task_id,
            status="pending",
            progress=0,
            filters=filters,
            export_type=export_type,
            format=format,
        )
        self._tasks[task_id] = task
        self._save_to_db(task)
        self._process_task(task_id, export_type, format)
        return task_id

    def _save_to_db(self, task: ExportTask):
        if not self._use_db:
            return
        try:
            from data.db.models import db_manager, ExportTask as DBExportTask
            with db_manager.get_session() as session:
                db_task = DBExportTask(
                    task_id=task.task_id,
                    status=task.status,
                    progress=task.progress,
                    filters=task.filters,
                    export_type=task.export_type,
                    format=task.format,
                    file_path=task.file_path,
                    error_message=task.error_message,
                    created_at=task.created_at,
                    completed_at=None,
                )
                session.merge(db_task)
                session.commit()
        except Exception as e:
            logger.debug(f"保存任务到数据库失败: {e}")

    def _update_db(self, task: ExportTask):
        if not self._use_db:
            return
        try:
            from data.db.models import db_manager, ExportTask as DBExportTask
            from sqlalchemy import select

            with db_manager.get_session() as session:
                stmt = select(DBExportTask).where(DBExportTask.task_id == task.task_id)
                result = session.execute(stmt)
                db_task = result.scalar_one_or_none()
                if db_task:
                    db_task.status = task.status
                    db_task.progress = task.progress
                    db_task.file_path = task.file_path
                    db_task.error_message = task.error_message
                    if task.status in ["completed", "failed"]:
                        db_task.completed_at = datetime.now()
                    session.commit()
        except Exception as e:
            logger.debug(f"更新任务到数据库失败: {e}")

    def _process_task(self, task_id: str, export_type: str, format: str):
        import threading
        thread = threading.Thread(target=self._do_export, args=(task_id, export_type, format))
        thread.daemon = True
        thread.start()

    def _do_export(self, task_id: str, export_type: str, format: str):
        task = self._tasks.get(task_id)
        if not task:
            return

        try:
            task.status = "processing"
            task.progress = 20
            self._update_db(task)

            from data.cleaning.mock_data_generator import data_store
            from data.api.routes.queries import _get_review_logs_from_db
            from datetime import datetime

            f = task.filters
            time_start = datetime.fromisoformat(f["time_start"]) if isinstance(f["time_start"], str) else f["time_start"]
            time_end = datetime.fromisoformat(f["time_end"]) if isinstance(f["time_end"], str) else f["time_end"]

            task.progress = 40
            self._update_db(task)

            df = _get_review_logs_from_db(
                risk_tags=f.get("risk_tags"),
                queue_types=f.get("queue_types"),
                reviewers=f.get("reviewers"),
                shifts=f.get("shifts"),
                sources=f.get("sources"),
                time_start=time_start,
                time_end=time_end,
            )

            if df is None:
                from data.api.routes.queries import _apply_filters
                review_logs = data_store.get_review_logs()
                df = _apply_filters(
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
            self._update_db(task)

            os.makedirs("exports", exist_ok=True)
            file_name = f"{export_type}_{task_id[:8]}.{format}"
            file_path = os.path.join("exports", file_name)

            cols = [
                "video_id", "source", "queue_type", "enqueue_time",
                "machine_risk_tags", "reviewer_id", "reviewer_decision",
                "final_risk_tags", "shift", "reviewer_start_time", "reviewer_end_time"
            ]

            available_cols = [c for c in cols if c in df.columns]
            export_df = df[available_cols].copy()
            for col in ["machine_risk_tags", "final_risk_tags"]:
                if col in export_df.columns:
                    export_df[col] = export_df[col].apply(
                        lambda x: ",".join(x) if isinstance(x, list) else ""
                    )

            task.progress = 90
            self._update_db(task)

            if format == "xlsx":
                export_df.to_excel(file_path, index=False, engine="openpyxl")
            else:
                export_df.to_csv(file_path, index=False)

            task.file_path = file_path
            task.status = "completed"
            task.progress = 100
            self._update_db(task)

            logger.info(f"✅ 导出任务完成: {task_id[:8]} -> {file_path}")

        except Exception as e:
            logger.error(f"❌ 导出任务失败: {task_id[:8]} - {e}")
            task.status = "failed"
            task.error_message = str(e)
            self._update_db(task)

    def get_status(self, task_id: str) -> Optional[ExportTask]:
        task = self._tasks.get(task_id)
        if task:
            return task

        if self._use_db:
            try:
                from data.db.models import db_manager, ExportTask as DBExportTask
                from sqlalchemy import select

                with db_manager.get_session() as session:
                    stmt = select(DBExportTask).where(DBExportTask.task_id == task_id)
                    result = session.execute(stmt)
                    db_task = result.scalar_one_or_none()
                    if db_task:
                        task = ExportTask(
                            task_id=db_task.task_id,
                            status=db_task.status,
                            progress=db_task.progress,
                            filters=db_task.filters,
                            file_path=db_task.file_path,
                            error_message=db_task.error_message,
                            created_at=db_task.created_at,
                            export_type=db_task.export_type,
                            format=db_task.format,
                        )
                        self._tasks[task_id] = task
                        return task
            except Exception as e:
                logger.debug(f"从数据库查询任务失败: {e}")

        return None

    def get_file_path(self, task_id: str) -> Optional[str]:
        task = self.get_status(task_id)
        return task.file_path if task else None


export_manager = ExportManager()
