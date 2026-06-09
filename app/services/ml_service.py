import os
import json
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import (
    TrainingTask, TrainingMetric, ModelVersion, RollbackLog, Ticket, ErrorSample,
)
from app.models.ticket import ModelStatus, TaskStatus, TicketStatus
from app.schemas.ml import (
    TrainingTaskCreate, ModelVersionCreate, RollbackRequest,
)
from app.services.ticket_service import TicketService, CategoryService, ErrorSampleService
from app.ml.model import TrainingSample
from app.ml.trainer import TrainingConfig, run_training
from app.core.config import settings


class TrainingService:
    @staticmethod
    def create_task(db: Session, data: TrainingTaskCreate) -> TrainingTask:
        error_sample_count = 0
        if data.include_error_samples:
            q = db.query(func.count(ErrorSample.id)).filter(ErrorSample.included_in_training == False)
            if data.error_source_filter:
                q = q.filter(ErrorSample.source.in_(data.error_source_filter))
            error_sample_count = q.scalar() or 0

        task = TrainingTask(
            name=data.name,
            status=TaskStatus.PENDING.value,
            config=data.config or {},
            include_error_samples=data.include_error_samples,
            error_source_filter=data.error_source_filter if data.error_source_filter else None,
            dataset_info=data.dataset_info or {},
            error_sample_count=error_sample_count,
            created_by=data.created_by,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def list_tasks(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
    ) -> Tuple[List[TrainingTask], int]:
        query = db.query(TrainingTask)
        if status:
            query = query.filter(TrainingTask.status == status)
        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(TrainingTask.created_at.desc()).offset(offset).limit(page_size).all()
        return items, total

    @staticmethod
    def get_task(db: Session, task_id: int) -> Optional[TrainingTask]:
        return db.query(TrainingTask).filter(TrainingTask.id == task_id).first()

    @staticmethod
    def update_status(
        db: Session,
        task_id: int,
        status: TaskStatus,
        progress: Optional[float] = None,
        message: Optional[str] = None,
        job_id: Optional[str] = None,
    ):
        task = TrainingService.get_task(db, task_id)
        if not task:
            return
        task.status = status.value
        if progress is not None:
            task.progress = progress
        if message is not None:
            task.status_message = message
        if job_id is not None:
            task.job_id = job_id
        if status == TaskStatus.RUNNING and not task.started_at:
            task.started_at = datetime.utcnow()
        if status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
            task.finished_at = datetime.utcnow()
        db.commit()

    @staticmethod
    def add_metric(
        db: Session,
        task_id: int,
        epoch: int,
        split: str,
        **metric_kwargs,
    ) -> TrainingMetric:
        metric = TrainingMetric(task_id=task_id, epoch=epoch, split=split, **metric_kwargs)
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric

    @staticmethod
    def build_training_samples(
        db: Session,
        include_error_samples: bool = True,
        error_source_filter: Optional[List[str]] = None,
    ) -> Tuple[List[TrainingSample], Dict[str, Any]]:
        confirmed_tickets = TicketService.get_confirmed_tickets_for_training(
            db, include_error_samples=include_error_samples
        )

        samples = []
        seen = set()

        for t in confirmed_tickets:
            if t.id in seen or t.category_id is None:
                continue
            seen.add(t.id)
            category = CategoryService.get_by_id(db, t.category_id)
            if not category:
                continue

            text = TicketService.build_training_text(t)
            samples.append(TrainingSample(
                ticket_id=t.id,
                text=text,
                category_id=t.category_id,
                category_code=category.code,
                category_name=category.name,
                is_error_sample=t.is_error_case,
                error_source=("human_review" if t.is_error_case else None),
                model_version_id=t.model_version_id,
            ))

        if include_error_samples:
            err_samples = ErrorSampleService.get_for_training(db, error_source_filter)

            for err in err_samples:
                if err.ticket_id in seen:
                    continue
                t = TicketService.get_by_id(db, err.ticket_id)
                if not t or err.correct_category_id is None:
                    continue
                category = CategoryService.get_by_id(db, err.correct_category_id)
                if not category:
                    continue

                text = TicketService.build_training_text(t)
                samples.append(TrainingSample(
                    ticket_id=t.id,
                    text=text,
                    category_id=err.correct_category_id,
                    category_code=category.code,
                    category_name=category.name,
                    is_error_sample=True,
                    error_source=err.source,
                    model_version_id=err.model_version_id,
                ))

        by_category = {}
        by_source = {}
        for s in samples:
            by_category[s.category_name] = by_category.get(s.category_name, 0) + 1
            src = s.error_source or "normal"
            by_source[src] = by_source.get(src, 0) + 1

        dataset_info = {
            "total_samples": len(samples),
            "error_sample_count": sum(1 for s in samples if s.is_error_sample),
            "normal_sample_count": sum(1 for s in samples if not s.is_error_sample),
            "category_distribution": by_category,
            "source_distribution": by_source,
            "num_categories": len(by_category),
        }

        return samples, dataset_info

    @staticmethod
    def execute_training_task(
        db: Session,
        task_id: int,
    ):
        task = TrainingService.get_task(db, task_id)
        if not task:
            return

        TrainingService.update_status(
            db, task_id, TaskStatus.RUNNING, 0.0, "任务启动，准备数据..."
        )

        try:
            samples, dataset_info = TrainingService.build_training_samples(
                db,
                include_error_samples=task.include_error_samples,
                error_source_filter=task.error_source_filter,
            )

            if not samples:
                TrainingService.update_status(
                    db, task_id, TaskStatus.FAILED, 0.0, "没有可用的训练样本"
                )
                return

            if task.dataset_info:
                task.dataset_info = {**dataset_info, **task.dataset_info}
            else:
                task.dataset_info = dataset_info
            db.commit()

            categories = CategoryService.get_flat_list(db)

            version_tag = f"v{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
            save_dir = os.path.join(settings.MODEL_STORE_DIR, version_tag)
            os.makedirs(save_dir, exist_ok=True)

            train_cfg = TrainingConfig()
            if task.config:
                for k, v in task.config.items():
                    if hasattr(train_cfg, k):
                        setattr(train_cfg, k, v)

            def progress_cb(stage: str, pct: float, _msg):
                TrainingService.update_status(
                    db, task_id, TaskStatus.RUNNING, round(pct * 100, 2), stage
                )

            metrics = run_training(
                samples=samples,
                categories=categories,
                save_dir=save_dir,
                config=train_cfg,
                progress_cb=progress_cb,
                include_error_samples=task.include_error_samples,
                error_source_filter=task.error_source_filter,
            )

            history = metrics.get("history", [])
            for h in history:
                epoch = h["epoch"]
                TrainingService.add_metric(
                    db, task_id, epoch, "train",
                    loss=h.get("train_loss"),
                    accuracy=h.get("train_accuracy"),
                    f1_macro=h.get("train_f1_macro"),
                )
                TrainingService.add_metric(
                    db, task_id, epoch, "validation",
                    loss=h.get("val_loss"),
                    accuracy=h.get("val_accuracy"),
                    f1_macro=h.get("val_f1_macro"),
                )

            test_metrics = metrics.get("test", {})
            if test_metrics:
                TrainingService.add_metric(
                    db, task_id, len(history), "test",
                    accuracy=test_metrics.get("accuracy"),
                    precision_macro=test_metrics.get("precision_macro"),
                    recall_macro=test_metrics.get("recall_macro"),
                    f1_macro=test_metrics.get("f1_macro"),
                    confusion_matrix=test_metrics.get("confusion_matrix"),
                    per_class_metrics=test_metrics.get("per_class"),
                )

            model_version = ModelVersionService.create(
                db,
                ModelVersionCreate(
                    version_tag=version_tag,
                    model_path=save_dir,
                    training_task_id=task.id,
                    metrics=metrics,
                    training_data_summary=dataset_info,
                    description=f"自动训练 - {task.name}",
                    created_by=task.created_by,
                ),
            )

            err_ids = []
            for s in samples:
                if s.is_error_sample:
                    errs = db.query(ErrorSample).filter(ErrorSample.ticket_id == s.ticket_id).all()
                    err_ids.extend([e.id for e in errs])
            ErrorSampleService.mark_included(db, list(set(err_ids)), training_run_id=task.id)

            TrainingService.update_status(
                db, task_id, TaskStatus.COMPLETED,
                100.0, f"训练完成，模型版本 {version_tag}"
            )

        except Exception as e:
            TrainingService.update_status(
                db, task_id, TaskStatus.FAILED,
                task.progress, f"训练失败: {str(e)}"
            )
            raise


class ModelVersionService:
    @staticmethod
    def create(db: Session, data: ModelVersionCreate) -> ModelVersion:
        prev = (
            db.query(ModelVersion)
            .filter(ModelVersion.is_current == True)
            .order_by(ModelVersion.id.desc())
            .first()
        )

        model_data = data.model_dump()
        if prev and not data.previous_version_id:
            model_data["previous_version_id"] = prev.id

        model = ModelVersion(
            status=ModelStatus.DRAFT.value,
            is_current=False,
            **model_data,
        )
        db.add(model)
        db.commit()
        db.refresh(model)
        return model

    @staticmethod
    def list_versions(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
    ) -> Tuple[List[ModelVersion], int]:
        query = db.query(ModelVersion)
        if status:
            query = query.filter(ModelVersion.status == status)
        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(ModelVersion.id.desc()).offset(offset).limit(page_size).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, version_id: int) -> Optional[ModelVersion]:
        return db.query(ModelVersion).filter(ModelVersion.id == version_id).first()

    @staticmethod
    def get_by_tag(db: Session, tag: str) -> Optional[ModelVersion]:
        return db.query(ModelVersion).filter(ModelVersion.version_tag == tag).first()

    @staticmethod
    def get_current(db: Session) -> Optional[ModelVersion]:
        return (
            db.query(ModelVersion)
            .filter(ModelVersion.is_current == True, ModelVersion.status == ModelStatus.DEPLOYED.value)
            .order_by(ModelVersion.id.desc())
            .first()
        )

    @staticmethod
    def deploy(db: Session, version_id: int, operator_name: str) -> Optional[ModelVersion]:
        target = ModelVersionService.get_by_id(db, version_id)
        if not target:
            return None

        current = ModelVersionService.get_current(db)
        if current and current.id != version_id:
            current.is_current = False
            current.status = ModelStatus.ROLLED_BACK.value if current.status == ModelStatus.DEPLOYED.value else current.status
            current.rolled_back_at = datetime.utcnow()

        target.is_current = True
        target.status = ModelStatus.DEPLOYED.value
        target.deployed_at = datetime.utcnow()
        db.commit()
        db.refresh(target)
        return target

    @staticmethod
    def rollback(db: Session, data: RollbackRequest) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        target = ModelVersionService.get_by_id(db, data.target_version_id)
        if not target:
            return None, "目标模型版本不存在"

        current = ModelVersionService.get_current(db)
        if not current:
            return None, "当前没有已部署的模型"
        if current.id == data.target_version_id:
            return None, "目标版本就是当前版本，无需回滚"

        affected_tickets = 0
        if data.rollback_tickets:
            from app.ml.inference import InferenceModel
            try:
                infer = InferenceModel(target.model_path)
                infer.load()

                affected = (
                    db.query(Ticket)
                    .filter(Ticket.model_version_id == current.id)
                    .filter(Ticket.status.in_([
                        TicketStatus.AUTO_CLASSIFIED.value,
                        TicketStatus.PENDING_REVIEW.value,
                    ]))
                    .all()
                )

                texts = [TicketService.build_training_text(t) for t in affected]
                if texts:
                    preds = infer.predict_batch(texts)
                    for t, pred in zip(affected, preds):
                        t.predicted_category_id = pred["category_id"]
                        t.confidence = pred["confidence"]
                        t.model_version_id = target.id
                        if pred["is_low_confidence"]:
                            t.status = TicketStatus.PENDING_REVIEW.value
                        else:
                            t.status = TicketStatus.AUTO_CLASSIFIED.value
                        t.updated_at = datetime.utcnow()
                    affected_tickets = len(affected)
                    db.commit()
            except Exception as e:
                return None, f"回滚工单失败: {str(e)}"

        current.is_current = False
        current.rolled_back_at = datetime.utcnow()
        current.status = ModelStatus.ROLLED_BACK.value

        target.is_current = True
        target.status = ModelStatus.DEPLOYED.value
        target.deployed_at = datetime.utcnow()

        log = RollbackLog(
            from_version_id=current.id,
            to_version_id=target.id,
            reason=data.reason,
            operator_id=data.operator_id,
            operator_name=data.operator_name,
            rollback_type=("full" if data.rollback_tickets else "model_only"),
            affected_ticket_count=affected_tickets,
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        return {
            "log_id": log.id,
            "from_version_id": log.from_version_id,
            "from_version_tag": current.version_tag,
            "to_version_id": log.to_version_id,
            "to_version_tag": target.version_tag,
            "rollback_type": log.rollback_type,
            "affected_ticket_count": log.affected_ticket_count,
            "created_at": log.created_at,
        }, None

    @staticmethod
    def list_rollback_logs(
        db: Session, page: int = 1, page_size: int = 20,
    ) -> Tuple[List[RollbackLog], int]:
        query = db.query(RollbackLog)
        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(RollbackLog.created_at.desc()).offset(offset).limit(page_size).all()
        return items, total
