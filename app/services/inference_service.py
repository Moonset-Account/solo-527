from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, extract

from app.models import (
    Ticket, ModelVersion, TrainingTask, ErrorSample, AnnotationVersion,
)
from app.services.batch_task_service import BatchTaskService
from app.models.ticket import TicketStatus, ModelStatus, TaskStatus
from app.services.ticket_service import (
    TicketService, CategoryService, ErrorSampleService,
)
from app.services.ml_service import ModelVersionService, TrainingService
from app.ml.inference import InferenceModel, SimilarCaseRetriever
from app.core.config import settings


class InferenceService:
    _inference_instance: Optional[InferenceModel] = None
    _inference_version_id: Optional[int] = None
    _retriever_instance: Optional[SimilarCaseRetriever] = None

    @classmethod
    def get_inference_model(cls, db: Session) -> Tuple[Optional[InferenceModel], Optional[ModelVersion]]:
        current = ModelVersionService.get_current(db)
        if not current:
            return None, None

        if cls._inference_instance is None or cls._inference_version_id != current.id:
            try:
                infer = InferenceModel(current.model_path)
                infer.load()
                cls._inference_instance = infer
                cls._inference_version_id = current.id
            except Exception:
                return None, current

        return cls._inference_instance, current

    @classmethod
    def build_retriever(cls, db: Session, limit: int = 5000):
        tickets = (
            db.query(Ticket)
            .filter(Ticket.category_id.isnot(None))
            .filter(Ticket.status == TicketStatus.CONFIRMED.value)
            .order_by(Ticket.created_at.desc())
            .limit(limit)
            .all()
        )
        cases = [
            (t.id, t.title, t.content, t.category_id)
            for t in tickets
        ]

        infer, _ = cls.get_inference_model(db)
        if infer is None:
            cls._retriever_instance = SimilarCaseRetriever()
        else:
            from app.ml.model import TicketEmbedder
            embedder = TicketEmbedder(settings.MODEL_NAME)
            retriever = SimilarCaseRetriever(embedder)
            retriever.build_index(cases)
            cls._retriever_instance = retriever

        return cls._retriever_instance

    @classmethod
    def get_retriever(cls, db: Session) -> Optional[SimilarCaseRetriever]:
        if cls._retriever_instance is None:
            return cls.build_retriever(db)
        return cls._retriever_instance

    @classmethod
    def predict_ticket(
        cls,
        db: Session,
        ticket_id: int,
        store: bool = True,
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        ticket = TicketService.get_by_id(db, ticket_id)
        if not ticket:
            return None, "工单不存在"

        infer, current = cls.get_inference_model(db)
        if infer is None:
            return None, "没有可用的推理模型，请先部署模型"

        text = TicketService.build_training_text(ticket)
        pred = infer.predict_single(text)
        embedding = pred.pop("pooled_embedding", None)

        similar_cases = []
        retriever = cls.get_retriever(db)
        if retriever is not None and embedding is not None:
            similar_cases = retriever.search(
                embedding, query_category_id=pred["category_id"], top_k=5,
            )
            pred["similar_cases"] = similar_cases

        pred["model_version"] = current.version_tag

        if store:
            TicketService.update_prediction(
                db, ticket_id,
                predicted_category_id=pred["category_id"],
                confidence=pred["confidence"],
                model_version_id=current.id,
                similar_cases=similar_cases,
            )

        return {
            "ticket_id": ticket_id,
            "predictions": pred,
        }, None

    @classmethod
    def predict_batch(
        cls,
        db: Session,
        ticket_ids: List[int],
        store: bool = True,
    ) -> Dict[str, Any]:
        infer, current = cls.get_inference_model(db)
        if infer is None:
            return {
                "total": len(ticket_ids),
                "success": 0,
                "low_confidence_count": 0,
                "results": [],
                "error": "没有可用的推理模型",
            }

        valid_tickets = []
        valid_texts = []
        for tid in ticket_ids:
            t = TicketService.get_by_id(db, tid)
            if t:
                valid_tickets.append(t)
                valid_texts.append(TicketService.build_training_text(t))

        if not valid_tickets:
            return {"total": len(ticket_ids), "success": 0, "low_confidence_count": 0, "results": []}

        preds = infer.predict_batch(valid_texts)
        retriever = cls.get_retriever(db)

        results = []
        low_conf_count = 0

        for ticket, pred in zip(valid_tickets, preds):
            emb = pred.pop("pooled_embedding", None)

            similar_cases = []
            if retriever is not None and emb is not None:
                similar_cases = retriever.search(
                    emb, query_category_id=pred["category_id"], top_k=5,
                )
                pred["similar_cases"] = similar_cases

            pred["model_version"] = current.version_tag
            if pred["is_low_confidence"]:
                low_conf_count += 1

            if store:
                TicketService.update_prediction(
                    db, ticket.id,
                    predicted_category_id=pred["category_id"],
                    confidence=pred["confidence"],
                    model_version_id=current.id,
                    similar_cases=similar_cases,
                )

            results.append({
                "ticket_id": ticket.id,
                "predictions": pred,
            })

        return {
            "total": len(ticket_ids),
            "success": len(results),
            "low_confidence_count": low_conf_count,
            "results": results,
        }

    @classmethod
    def process_pending_queue(
        cls,
        db: Session,
        limit: int = 100,
    ) -> Dict[str, Any]:
        tickets = TicketService.get_pending_tickets(db, limit=limit)
        if not tickets:
            return {"total": 0, "success": 0, "low_confidence_count": 0, "results": []}

        ids = [t.id for t in tickets]
        return cls.predict_batch(db, ids, store=True)

    @classmethod
    def execute_batch_task(
        cls,
        db: Session,
        task_id: int,
    ) -> Dict[str, Any]:
        task = BatchTaskService.get(db, task_id)
        if not task:
            return {"error": f"批量任务#{task_id}不存在"}
        BatchTaskService.update(
            db, task_id,
            status=TaskStatus.RUNNING.value,
            started_at=datetime.utcnow(),
        )
        try:
            result = cls.predict_batch(
                db, task.ticket_ids, store=task.store_predictions,
            )
            summary = {
                k: v for k, v in result.items() if k != "results"
            }
            BatchTaskService.update(
                db, task_id,
                status=TaskStatus.COMPLETED.value,
                success_count=result["success"],
                low_confidence_count=result["low_confidence_count"],
                error_count=result["total"] - result["success"],
                result_summary=summary,
                finished_at=datetime.utcnow(),
            )
            return result
        except Exception as e:
            BatchTaskService.update(
                db, task_id,
                status=TaskStatus.FAILED.value,
                error_message=str(e),
                finished_at=datetime.utcnow(),
            )
            raise


class StatsService:
    @staticmethod
    def get_dashboard_stats(
        db: Session,
        days: int = 30,
    ) -> Dict[str, Any]:
        now = datetime.utcnow()
        start_date = now - timedelta(days=days)

        total_tickets = db.query(func.count(Ticket.id)).scalar() or 0

        base_query = db.query(func.count(Ticket.id))
        auto_classified = base_query.filter(Ticket.status == TicketStatus.AUTO_CLASSIFIED.value).scalar() or 0
        pending_review = base_query.filter(Ticket.status == TicketStatus.PENDING_REVIEW.value).scalar() or 0
        human_reviewed = base_query.filter(Ticket.status == TicketStatus.HUMAN_REVIEWED.value).scalar() or 0
        confirmed = base_query.filter(Ticket.status == TicketStatus.CONFIRMED.value).scalar() or 0
        error_cases = base_query.filter(Ticket.is_error_case == True).scalar() or 0

        low_conf_count = (
            db.query(func.count(Ticket.id))
            .filter(Ticket.confidence < settings.LOW_CONFIDENCE_THRESHOLD)
            .filter(Ticket.confidence.isnot(None))
            .scalar() or 0
        )
        avg_confidence = (
            db.query(func.avg(Ticket.confidence))
            .filter(Ticket.confidence.isnot(None))
            .scalar() or 0.0
        )

        reviewed_with_pred = (
            db.query(Ticket)
            .filter(Ticket.status == TicketStatus.CONFIRMED.value)
            .filter(Ticket.predicted_category_id.isnot(None))
            .filter(Ticket.category_id.isnot(None))
            .all()
        )
        correct = sum(1 for t in reviewed_with_pred if t.predicted_category_id == t.category_id)
        auto_accuracy = (correct / len(reviewed_with_pred)) if reviewed_with_pred else None

        by_channel = dict(
            db.query(Ticket.channel, func.count(Ticket.id))
            .group_by(Ticket.channel)
            .all()
        )

        by_category = dict(
            db.query(Ticket.category_id, func.count(Ticket.id))
            .filter(Ticket.category_id.isnot(None))
            .group_by(Ticket.category_id)
            .all()
        )
        cat_names = {c.id: c.name for c in CategoryService.get_all(db)}
        by_category_named = {cat_names.get(k, str(k)): v for k, v in by_category.items()}

        by_date_rows = (
            db.query(
                func.date(Ticket.created_at),
                func.count(Ticket.id),
                func.sum(case((Ticket.status == TicketStatus.AUTO_CLASSIFIED.value, 1), else_=0)),
                func.sum(case((Ticket.is_error_case == True, 1), else_=0)),
            )
            .filter(Ticket.created_at >= start_date)
            .group_by(func.date(Ticket.created_at))
            .order_by(func.date(Ticket.created_at))
            .all()
        )
        by_date = [
            {
                "date": r[0].isoformat() if hasattr(r[0], "isoformat") else str(r[0]),
                "total": r[1],
                "auto_classified": r[2] or 0,
                "error_cases": r[3] or 0,
            }
            for r in by_date_rows
        ]

        current = ModelVersionService.get_current(db)
        active_tasks = (
            db.query(func.count(TrainingTask.id))
            .filter(TrainingTask.status.in_([
                TaskStatus.PENDING.value, TaskStatus.RUNNING.value,
            ]))
            .scalar() or 0
        )

        return {
            "total_tickets": total_tickets,
            "auto_classified": auto_classified,
            "human_review_pending": pending_review,
            "human_reviewed": human_reviewed,
            "confirmed": confirmed,
            "error_cases": error_cases,
            "low_confidence_count": low_conf_count,
            "average_confidence": float(avg_confidence),
            "auto_accuracy": float(auto_accuracy) if auto_accuracy is not None else None,
            "by_channel": by_channel,
            "by_category": by_category_named,
            "by_date": by_date,
            "current_model_tag": current.version_tag if current else None,
            "active_training_tasks": active_tasks,
        }

    @staticmethod
    def get_model_evaluation(
        db: Session,
        model_version_id: Optional[int] = None,
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        if model_version_id is None:
            current = ModelVersionService.get_current(db)
            if not current:
                return None, "没有已部署的模型"
            model = current
        else:
            model = ModelVersionService.get_by_id(db, model_version_id)
            if not model:
                return None, "模型版本不存在"

        tickets_predicted = (
            db.query(Ticket)
            .filter(Ticket.model_version_id == model.id)
            .all()
        )

        reviewed = [
            t for t in tickets_predicted
            if t.status in [TicketStatus.CONFIRMED.value, TicketStatus.HUMAN_REVIEWED.value]
            and t.category_id is not None
            and t.predicted_category_id is not None
        ]

        if not reviewed:
            return {
                "model_version_id": model.id,
                "model_version_tag": model.version_tag,
                "total_samples": len(tickets_predicted),
                "evaluated_samples": 0,
                "overall_accuracy": None,
                "overall_precision": None,
                "overall_recall": None,
                "overall_f1": None,
                "low_confidence_ratio": None,
                "per_class_metrics": [],
                "confusion_matrix": {},
                "generated_at": datetime.utcnow(),
            }, None

        y_true = []
        y_pred = []
        confidences = []
        for t in reviewed:
            y_true.append(t.category_id)
            y_pred.append(t.predicted_category_id)
            if t.confidence is not None:
                confidences.append(t.confidence)

        from sklearn.metrics import precision_recall_fscore_support, accuracy_score, confusion_matrix

        labels_all = sorted(set(y_true) | set(y_pred))

        accuracy = accuracy_score(y_true, y_pred)
        precision, recall, f1, support = precision_recall_fscore_support(
            y_true, y_pred, labels=labels_all, average=None, zero_division=0,
        )
        p_macro, r_macro, f_macro, _ = precision_recall_fscore_support(
            y_true, y_pred, average="macro", zero_division=0,
        )

        cat_map = {c.id: (c.code, c.name) for c in CategoryService.get_all(db)}
        per_class = []
        for i, label in enumerate(labels_all):
            code, name = cat_map.get(label, ("UNKNOWN", "未知"))
            per_class.append({
                "category_id": label,
                "category_code": code,
                "category_name": name,
                "precision": float(precision[i]),
                "recall": float(recall[i]),
                "f1": float(f1[i]),
                "support": int(support[i]),
            })

        cm = confusion_matrix(y_true, y_pred, labels=labels_all)
        confusion = {
            "labels": labels_all,
            "label_names": [cat_map.get(l, ("UNKNOWN", "未知"))[1] for l in labels_all],
            "values": cm.tolist(),
        }

        low_conf_count = sum(1 for c in confidences if c < settings.LOW_CONFIDENCE_THRESHOLD)
        low_conf_ratio = low_conf_count / len(confidences) if confidences else 0.0

        return {
            "model_version_id": model.id,
            "model_version_tag": model.version_tag,
            "total_samples": len(tickets_predicted),
            "evaluated_samples": len(reviewed),
            "overall_accuracy": float(accuracy),
            "overall_precision": float(p_macro),
            "overall_recall": float(r_macro),
            "overall_f1": float(f_macro),
            "low_confidence_ratio": float(low_conf_ratio),
            "per_class_metrics": per_class,
            "confusion_matrix": confusion,
            "generated_at": datetime.utcnow(),
        }, None

    @staticmethod
    def mark_stats_updated(db: Session, batch_id: int):
        from app.models import BatchConfirmLog
        log = db.query(BatchConfirmLog).filter(BatchConfirmLog.id == batch_id).first()
        if log:
            log.stats_updated = True
            db.commit()
