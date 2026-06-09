from __future__ import annotations

from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timedelta

from sqlalchemy import select, func, update, delete, and_, or_, case, Integer
from sqlalchemy.orm import Session

from app.data.models import (
    ModelVersion, IndexJob, IndexRecord, QAConversation, Citation,
    QAFeedback, ErrorSample, AuditLog, ApiCallLog
)
from app.data.models import ModelStatus, FeedbackType, ConfidenceLevel
from app.repositories.data_repo import BaseRepository


class ModelVersionRepository(BaseRepository):
    def create(self, obj_in: dict) -> ModelVersion:
        db_obj = ModelVersion(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get(self, obj_id: int) -> Optional[ModelVersion]:
        return self.db.get(ModelVersion, obj_id)

    def get_by_tag(self, version_tag: str) -> Optional[ModelVersion]:
        stmt = select(ModelVersion).where(ModelVersion.version_tag == version_tag)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_default(self) -> Optional[ModelVersion]:
        stmt = (select(ModelVersion)
                .where(and_(ModelVersion.is_default == True,
                            ModelVersion.status == ModelStatus.READY))
                .order_by(ModelVersion.created_at.desc()).limit(1))
        obj = self.db.execute(stmt).scalar_one_or_none()
        if obj:
            return obj
        stmt = (select(ModelVersion)
                .where(ModelVersion.status == ModelStatus.READY)
                .order_by(ModelVersion.created_at.desc()).limit(1))
        return self.db.execute(stmt).scalar_one_or_none()

    def set_default(self, version_tag: str) -> Optional[ModelVersion]:
        self.db.execute(update(ModelVersion).values(is_default=False))
        stmt = (update(ModelVersion)
                .where(ModelVersion.version_tag == version_tag)
                .values(is_default=True, deployed_at=func.now())
                .execution_options(synchronize_session="fetch"))
        self.db.execute(stmt)
        self.db.commit()
        return self.get_by_tag(version_tag)

    def list(self, page: int = 1, page_size: int = 20,
             status: Optional[ModelStatus] = None) -> Tuple[List[ModelVersion], int]:
        stmt = select(ModelVersion)
        if status:
            stmt = stmt.where(ModelVersion.status == status)
        stmt = stmt.order_by(ModelVersion.created_at.desc())
        return self._paginate(stmt, page, page_size)

    def update_status(self, obj_id: int, status: ModelStatus) -> Optional[ModelVersion]:
        stmt = (update(ModelVersion).where(ModelVersion.id == obj_id)
                .values(status=status).execution_options(synchronize_session="fetch"))
        self.db.execute(stmt)
        self.db.commit()
        return self.get(obj_id)


class IndexJobRepository(BaseRepository):
    def create(self, obj_in: dict) -> IndexJob:
        db_obj = IndexJob(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get(self, obj_id: int) -> Optional[IndexJob]:
        return self.db.get(IndexJob, obj_id)

    def update(self, obj_id: int, obj_in: dict) -> Optional[IndexJob]:
        stmt = (update(IndexJob).where(IndexJob.id == obj_id)
                .values(**obj_in).execution_options(synchronize_session="fetch"))
        self.db.execute(stmt)
        self.db.commit()
        return self.get(obj_id)

    def list(self, page: int = 1, page_size: int = 20,
             model_version_id: Optional[int] = None,
             status: Optional[str] = None) -> Tuple[List[IndexJob], int]:
        stmt = select(IndexJob)
        if model_version_id:
            stmt = stmt.where(IndexJob.model_version_id == model_version_id)
        if status:
            stmt = stmt.where(IndexJob.status == status)
        stmt = stmt.order_by(IndexJob.started_at.desc())
        return self._paginate(stmt, page, page_size)


class IndexRecordRepository(BaseRepository):
    def create(self, obj_in: dict) -> IndexRecord:
        db_obj = IndexRecord(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def bulk_create(self, objects_in: List[dict]) -> None:
        if not objects_in:
            return
        self.db.execute(IndexRecord.__table__.insert(), objects_in)
        self.db.commit()

    def get_by_node(self, node_id: str) -> Optional[IndexRecord]:
        stmt = select(IndexRecord).where(IndexRecord.node_id == node_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def delete_by_version(self, index_version: str) -> int:
        stmt = delete(IndexRecord).where(IndexRecord.index_version == index_version)
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount


class QAConversationRepository(BaseRepository):
    def create(self, obj_in: dict, citations: Optional[List[dict]] = None) -> QAConversation:
        db_obj = QAConversation(**obj_in)
        self.db.add(db_obj)
        self.db.flush()
        if citations:
            for cit in citations:
                cit_obj = Citation(conversation_id=db_obj.id, **cit)
                self.db.add(cit_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get(self, obj_id: int) -> Optional[QAConversation]:
        return self.db.get(QAConversation, obj_id)

    def list(self, page: int = 1, page_size: int = 20,
             user_id: Optional[str] = None,
             model_version: Optional[str] = None,
             session_id: Optional[str] = None) -> Tuple[List[QAConversation], int]:
        stmt = select(QAConversation)
        if user_id:
            stmt = stmt.where(QAConversation.user_id == user_id)
        if model_version:
            stmt = stmt.where(QAConversation.model_version == model_version)
        if session_id:
            stmt = stmt.where(QAConversation.session_id == session_id)
        stmt = stmt.order_by(QAConversation.created_at.desc())
        return self._paginate(stmt, page, page_size)

    def get_citations(self, conversation_id: int) -> List[Citation]:
        stmt = (select(Citation)
                .where(Citation.conversation_id == conversation_id)
                .order_by(Citation.id.asc()))
        return list(self.db.execute(stmt).scalars().all())

    def get_metrics(self, model_version: Optional[str] = None,
                    days: int = 30) -> Dict[str, Any]:
        since = datetime.utcnow() - timedelta(days=days)
        base_cond = QAConversation.created_at >= since
        if model_version:
            base_cond = and_(base_cond, QAConversation.model_version == model_version)

        low_cond = and_(base_cond, QAConversation.confidence_level == ConfidenceLevel.LOW)

        stmt = select(
            func.count(QAConversation.id),
            func.avg(QAConversation.confidence_score),
            func.sum(case((low_cond, 1), else_=0).cast(Integer)),
            func.avg(QAConversation.latency_ms),
        ).where(base_cond)

        row = self.db.execute(stmt).one_or_none()
        total_calls, avg_conf, low_conf_count, avg_latency = row or (0, None, 0, None)

        low_conf_count = int(low_conf_count or 0)
        total_calls = int(total_calls or 0)
        low_conf_rate = low_conf_count / total_calls if total_calls > 0 else 0.0

        return {
            "total_qa_calls": total_calls,
            "avg_confidence": float(avg_conf) if avg_conf is not None else None,
            "low_confidence_count": low_conf_count,
            "low_confidence_rate": low_conf_rate,
            "avg_latency_ms": float(avg_latency) if avg_latency is not None else None,
            "period_start": since,
            "period_end": datetime.utcnow(),
        }


class FeedbackRepository(BaseRepository):
    def create(self, obj_in: dict) -> QAFeedback:
        db_obj = QAFeedback(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get(self, obj_id: int) -> Optional[QAFeedback]:
        return self.db.get(QAFeedback, obj_id)

    def list(self, page: int = 1, page_size: int = 20,
             feedback_type: Optional[FeedbackType] = None,
             is_error_sample: Optional[bool] = None,
             resolved: Optional[bool] = None) -> Tuple[List[QAFeedback], int]:
        stmt = select(QAFeedback)
        if feedback_type:
            stmt = stmt.where(QAFeedback.feedback_type == feedback_type)
        if is_error_sample is not None:
            stmt = stmt.where(QAFeedback.is_error_sample == is_error_sample)
        if resolved is not None:
            stmt = stmt.where(QAFeedback.resolved == resolved)
        stmt = stmt.order_by(QAFeedback.created_at.desc())
        return self._paginate(stmt, page, page_size)

    def resolve(self, obj_id: int, resolved_by: str,
                resolution_note: Optional[str] = None) -> Optional[QAFeedback]:
        stmt = (update(QAFeedback).where(QAFeedback.id == obj_id)
                .values(resolved=True, resolved_by=resolved_by,
                        resolved_at=func.now(), resolution_note=resolution_note)
                .execution_options(synchronize_session="fetch"))
        self.db.execute(stmt)
        self.db.commit()
        return self.get(obj_id)

    def get_feedback_rates(self, model_version: Optional[str] = None,
                           days: int = 30) -> Dict[str, Any]:
        since = datetime.utcnow() - timedelta(days=days)
        base_stmt = (select(QAFeedback)
                     .join(QAConversation, QAFeedback.conversation_id == QAConversation.id)
                     .where(QAFeedback.created_at >= since))
        if model_version:
            base_stmt = base_stmt.where(QAConversation.model_version == model_version)

        total = self.db.execute(
            select(func.count()).select_from(base_stmt.subquery())
        ).scalar() or 0

        pos_stmt = select(func.count()).select_from(base_stmt.where(
            QAFeedback.feedback_type == FeedbackType.POSITIVE
        ).subquery())
        positive = self.db.execute(pos_stmt).scalar() or 0

        neg_stmt = select(func.count()).select_from(base_stmt.where(
            QAFeedback.feedback_type.in_([FeedbackType.NEGATIVE, FeedbackType.CORRECTION])
        ).subquery())
        negative = self.db.execute(neg_stmt).scalar() or 0

        err_stmt = select(func.count()).select_from(base_stmt.where(
            QAFeedback.is_error_sample == True
        ).subquery())
        errors = self.db.execute(err_stmt).scalar() or 0

        return {
            "total_feedback": total,
            "positive_count": positive,
            "negative_count": negative,
            "error_sample_count": errors,
            "positive_feedback_rate": positive / total if total > 0 else 0.0,
            "negative_feedback_rate": negative / total if total > 0 else 0.0,
            "error_rate": errors / total if total > 0 else 0.0,
        }


class ErrorSampleRepository(BaseRepository):
    def create(self, obj_in: dict) -> ErrorSample:
        db_obj = ErrorSample(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get(self, obj_id: int) -> Optional[ErrorSample]:
        return self.db.get(ErrorSample, obj_id)

    def update(self, obj_id: int, obj_in: dict) -> Optional[ErrorSample]:
        stmt = (update(ErrorSample).where(ErrorSample.id == obj_id)
                .values(**obj_in).execution_options(synchronize_session="fetch"))
        self.db.execute(stmt)
        self.db.commit()
        return self.get(obj_id)

    def list(self, page: int = 1, page_size: int = 20,
             status: Optional[str] = None,
             error_category: Optional[str] = None,
             severity: Optional[str] = None,
             model_version: Optional[str] = None) -> Tuple[List[ErrorSample], int]:
        stmt = select(ErrorSample)
        if status:
            stmt = stmt.where(ErrorSample.status == status)
        if error_category:
            stmt = stmt.where(ErrorSample.error_category == error_category)
        if severity:
            stmt = stmt.where(ErrorSample.severity == severity)
        if model_version:
            stmt = stmt.where(ErrorSample.model_version == model_version)
        stmt = stmt.order_by(ErrorSample.severity.desc(), ErrorSample.created_at.desc())
        return self._paginate(stmt, page, page_size)

    def get_top_categories(self, limit: int = 10, days: int = 30) -> List[Dict[str, Any]]:
        since = datetime.utcnow() - timedelta(days=days)
        stmt = (select(ErrorSample.error_category, func.count(ErrorSample.id).label("cnt"))
                .where(ErrorSample.created_at >= since)
                .group_by(ErrorSample.error_category)
                .order_by(func.count(ErrorSample.id).desc())
                .limit(limit))
        results = self.db.execute(stmt).all()
        return [{"category": r[0] or "uncategorized", "count": r[1]} for r in results]


class AuditLogRepository(BaseRepository):
    def create(self, obj_in: dict) -> AuditLog:
        db_obj = AuditLog(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        return db_obj

    def bulk_create(self, objects_in: List[dict]) -> None:
        if not objects_in:
            return
        self.db.execute(AuditLog.__table__.insert(), objects_in)
        self.db.commit()

    def list(self, page: int = 1, page_size: int = 20,
             actor: Optional[str] = None,
             action: Optional[str] = None,
             resource_type: Optional[str] = None,
             since: Optional[datetime] = None,
             until: Optional[datetime] = None) -> Tuple[List[AuditLog], int]:
        stmt = select(AuditLog)
        if actor:
            stmt = stmt.where(AuditLog.actor == actor)
        if action:
            stmt = stmt.where(AuditLog.action == action)
        if resource_type:
            stmt = stmt.where(AuditLog.resource_type == resource_type)
        if since:
            stmt = stmt.where(AuditLog.timestamp >= since)
        if until:
            stmt = stmt.where(AuditLog.timestamp <= until)
        stmt = stmt.order_by(AuditLog.timestamp.desc())
        return self._paginate(stmt, page, page_size)


class ApiCallLogRepository(BaseRepository):
    def create(self, obj_in: dict) -> ApiCallLog:
        db_obj = ApiCallLog(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        return db_obj

    def list(self, page: int = 1, page_size: int = 20,
             user_id: Optional[str] = None,
             endpoint: Optional[str] = None,
             model_version: Optional[str] = None,
             since: Optional[datetime] = None,
             until: Optional[datetime] = None) -> Tuple[List[ApiCallLog], int]:
        stmt = select(ApiCallLog)
        if user_id:
            stmt = stmt.where(ApiCallLog.user_id == user_id)
        if endpoint:
            stmt = stmt.where(ApiCallLog.endpoint == endpoint)
        if model_version:
            stmt = stmt.where(ApiCallLog.model_version == model_version)
        if since:
            stmt = stmt.where(ApiCallLog.created_at >= since)
        if until:
            stmt = stmt.where(ApiCallLog.created_at <= until)
        stmt = stmt.order_by(ApiCallLog.created_at.desc())
        return self._paginate(stmt, page, page_size)

    def count_in_period(self, user_id: Optional[str] = None,
                        since: Optional[datetime] = None) -> int:
        stmt = select(func.count(ApiCallLog.id))
        if user_id:
            stmt = stmt.where(ApiCallLog.user_id == user_id)
        if since:
            stmt = stmt.where(ApiCallLog.created_at >= since)
        return self.db.execute(stmt).scalar() or 0
