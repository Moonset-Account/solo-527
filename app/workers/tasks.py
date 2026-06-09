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


def execute_batch_inference(ticket_ids: list, store: bool = True):
    db = SessionLocal()
    try:
        result = InferenceService.predict_batch(db, ticket_ids, store=store)
        return result
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
