import os
import sys
import traceback
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal
from app.services import TrainingService, InferenceService, StatsService
from app.models.ticket import TaskStatus


def execute_training_task(task_id: int):
    db = SessionLocal()
    try:
        TrainingService.execute_training_task(db, task_id)
        return {"task_id": task_id, "status": "success"}
    except Exception as e:
        TrainingService.update_status(
            db, task_id, TaskStatus.FAILED, 0.0, f"Worker执行失败: {str(e)}"
        )
        traceback.print_exc()
        raise
    finally:
        db.close()


def execute_batch_inference(task_id: int):
    db = SessionLocal()
    try:
        from rq.job import get_current_job as _get_current_rq_job
        from app.services.batch_task_service import BatchTaskService
        from app.models.ticket import TaskStatus

        _job = _get_current_rq_job()
        _real_job_id = _job.id if _job else None

        task = BatchTaskService.get(db, task_id)
        if task is None:
            return {"error": f"batch task {task_id} not found"}

        update_fields = dict(
            status=TaskStatus.RUNNING.value,
            started_at=datetime.utcnow(),
        )
        if _real_job_id and (task.job_id is None or task.job_id != _real_job_id):
            update_fields["job_id"] = _real_job_id
        BatchTaskService.update(db, task_id, **update_fields)

        result = InferenceService.execute_batch_task(db, task_id)
        return {"task_id": task_id, "job_id": _real_job_id, "status": "success", **{
            k: v for k, v in result.items() if k != "results"
        }}
    except Exception as e:
        traceback.print_exc()
        raise
    finally:
        db.close()


def execute_process_pending_queue(limit: int = 100):
    db = SessionLocal()
    try:
        result = InferenceService.process_pending_queue(db, limit=limit)
        return result
    except Exception as e:
        traceback.print_exc()
        raise
    finally:
        db.close()


def execute_build_retriever(limit: int = 5000):
    db = SessionLocal()
    try:
        InferenceService.build_retriever(db, limit=limit)
        return {"status": "success", "limit": limit}
    except Exception as e:
        traceback.print_exc()
        raise
    finally:
        db.close()
