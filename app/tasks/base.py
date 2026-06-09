from __future__ import annotations

import traceback
from datetime import datetime
from typing import Any, Optional, Dict

from celery import Task
from loguru import logger
from sqlalchemy.orm import Session

from app.core.database import get_sync_session
from app.models.task import Task, TaskStatus, TaskResult


class ContractAIBaseTask(Task):
    abstract = True

    _db_session: Optional[Session] = None
    _task_record: Optional[Task] = None
    _task_start_time: Optional[datetime] = None

    @property
    def db(self) -> Session:
        if self._db_session is None:
            self._db_session = get_sync_session()
        return self._db_session

    def _get_task_record(self, task_id_str: Optional[str] = None) -> Optional[Task]:
        if self._task_record is not None:
            return self._task_record

        celery_task_id = self.request.id
        record_id = None

        if task_id_str and task_id_str.isdigit():
            record_id = int(task_id_str)
        elif hasattr(self.request, "kwargs"):
            kwargs = self.request.kwargs or {}
            for key in ["task_id_str", "task_id"]:
                val = kwargs.get(key)
                if val and str(val).isdigit():
                    record_id = int(val)
                    break

        if record_id is not None:
            try:
                self._task_record = self.db.get(Task, record_id)
            except Exception as e:
                logger.warning(f"加载Task记录失败 id={record_id}: {e}")

        if self._task_record is None and celery_task_id:
            try:
                from sqlalchemy import select
                stmt = select(Task).where(Task.celery_task_id == celery_task_id)
                self._task_record = self.db.execute(stmt).scalar_one_or_none()
            except Exception as e:
                logger.warning(f"通过celery_id加载Task记录失败: {e}")

        return self._task_record

    def _update_task_status(self, status: TaskStatus, **fields: Any) -> None:
        record = self._get_task_record()
        if record is None:
            return

        try:
            record.status = status
            for key, value in fields.items():
                if hasattr(record, key):
                    setattr(record, key, value)
            self.db.commit()
        except Exception as e:
            logger.warning(f"更新Task状态失败 status={status.value}: {e}")
            self.db.rollback()

    def before_start(self, task_id: str, args: tuple, kwargs: dict) -> None:
        self._task_start_time = datetime.utcnow()
        task_id_str = None
        if args:
            task_id_str = str(args[0]) if len(args) > 0 else None
        if not task_id_str and kwargs:
            task_id_str = str(kwargs.get("task_id_str") or kwargs.get("task_id") or "")

        try:
            record = self._get_task_record(task_id_str)
            if record is not None:
                record.celery_task_id = task_id
                record.status = TaskStatus.RUNNING
                record.started_at = datetime.utcnow()
                record.progress_percent = 0.0
                record.progress_message = "任务开始执行"
                self.db.commit()
        except Exception as e:
            logger.warning(f"before_start更新Task失败: {e}")
            self.db.rollback()

        logger.info(f"任务开始: name={self.name}, task_id={task_id}")

    def on_success(self, retval: Any, task_id: str, args: tuple, kwargs: dict) -> None:
        duration_ms = 0.0
        if self._task_start_time:
            duration_ms = (datetime.utcnow() - self._task_start_time).total_seconds() * 1000

        try:
            record = self._get_task_record()
            if record is not None:
                record.status = TaskStatus.COMPLETED
                record.completed_at = datetime.utcnow()
                record.progress_percent = 100.0
                record.progress_message = "任务执行完成"
                if record.started_at:
                    record.total_time_ms = (
                        datetime.utcnow() - record.started_at
                    ).total_seconds() * 1000

                if isinstance(retval, dict):
                    task_result = TaskResult(
                        task_id=record.id,
                        result_data=retval,
                        metrics=retval.get("metrics") if isinstance(retval, dict) else None,
                        latency_ms=duration_ms,
                    )
                    self.db.add(task_result)

                self.db.commit()
        except Exception as e:
            logger.warning(f"on_success更新Task失败: {e}")
            self.db.rollback()

        logger.info(
            f"任务完成: name={self.name}, task_id={task_id}, duration={duration_ms:.1f}ms"
        )

        if self._db_session is not None:
            try:
                self._db_session.close()
                self._db_session = None
            except Exception:
                pass

    def on_failure(
        self, exc: Exception, task_id: str, args: tuple, kwargs: dict, einfo: Any
    ) -> None:
        duration_ms = 0.0
        if self._task_start_time:
            duration_ms = (datetime.utcnow() - self._task_start_time).total_seconds() * 1000

        error_tb = einfo.traceback if hasattr(einfo, "traceback") else traceback.format_exc()

        try:
            record = self._get_task_record()
            if record is not None:
                record.status = TaskStatus.FAILED
                record.failed_at = datetime.utcnow()
                record.progress_message = f"任务执行失败: {str(exc)[:200]}"
                record.error_message = str(exc)[:500]
                record.error_traceback = (error_tb or "")[:5000]
                if record.started_at:
                    record.total_time_ms = (
                        datetime.utcnow() - record.started_at
                    ).total_seconds() * 1000
                self.db.commit()
        except Exception as e:
            logger.warning(f"on_failure更新Task失败: {e}")
            self.db.rollback()

        logger.error(
            f"任务失败: name={self.name}, task_id={task_id}, error={str(exc)}, "
            f"duration={duration_ms:.1f}ms"
        )

        if self._db_session is not None:
            try:
                self._db_session.rollback()
                self._db_session.close()
                self._db_session = None
            except Exception:
                pass

    def on_retry(
        self, exc: Exception, task_id: str, args: tuple, kwargs: dict, einfo: Any
    ) -> None:
        try:
            record = self._get_task_record()
            if record is not None:
                record.status = TaskStatus.RETRYING
                record.retry_count = (record.retry_count or 0) + 1
                record.progress_message = (
                    f"任务重试 ({record.retry_count}次): {str(exc)[:200]}"
                )
                self.db.commit()
        except Exception as e:
            logger.warning(f"on_retry更新Task失败: {e}")
            self.db.rollback()

        logger.warning(
            f"任务重试: name={self.name}, task_id={task_id}, attempt={self.request.retries + 1}, "
            f"error={str(exc)}"
        )

    def update_progress(
        self,
        percent: float,
        message: str = "",
        detail: Optional[Dict[str, Any]] = None,
    ) -> None:
        try:
            record = self._get_task_record()
            if record is not None:
                record.progress_percent = max(0.0, min(100.0, float(percent)))
                if message:
                    record.progress_message = message[:512]
                if detail is not None:
                    record.progress_detail = detail
                self.db.commit()
        except Exception as e:
            logger.warning(f"update_progress失败: {e}")
            self.db.rollback()

    def save_task_result(
        self,
        result_data: Optional[Dict[str, Any]] = None,
        result_text: Optional[str] = None,
        result_file_path: Optional[str] = None,
        metrics: Optional[Dict[str, Any]] = None,
        result_key: str = "default",
        tokens_used: int = 0,
        latency_ms: Optional[float] = None,
        cost_usd: float = 0.0,
        model_version: Optional[str] = None,
    ) -> Optional[TaskResult]:
        try:
            record = self._get_task_record()
            if record is None:
                return None

            task_result = TaskResult(
                task_id=record.id,
                result_key=result_key,
                result_data=result_data,
                result_text=result_text,
                result_file_path=result_file_path,
                metrics=metrics,
                tokens_used=tokens_used,
                latency_ms=latency_ms,
                cost_usd=cost_usd,
                model_version=model_version,
            )
            self.db.add(task_result)
            self.db.commit()
            self.db.refresh(task_result)
            return task_result
        except Exception as e:
            logger.warning(f"save_task_result失败: {e}")
            self.db.rollback()
            return None
