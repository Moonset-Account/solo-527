import json
import logging
from typing import List, Optional, Dict, Any, Tuple
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass

from loguru import logger
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_

from app.core.database import get_sync_session
from app.models.dataset import (
    ErrorSample, ErrorType, ErrorSeverity, Dataset, DatasetSample,
)
from app.models.ml import EvaluationResult, ModelVersion
from app.models.task import TaskResult
from app.models.user import User


@dataclass
class ErrorAggregate:
    error_type: ErrorType
    count: int
    severity_weighted: float
    affected_models: List[str]
    top_examples: List[int]


class ErrorSampleManager:
    """
    错误样本管理器
    功能：错误上报、分诊、归因、解决跟踪、自动聚合分析、Bad Case库维护
    """

    def __init__(self, db: Optional[Session] = None):
        self.db = db or get_sync_session()

    def close(self):
        if self.db:
            self.db.close()

    def report_error(
        self,
        *,
        model_output: str,
        expected_output: Optional[str] = None,
        input_context: Optional[str] = None,
        error_type: ErrorType = ErrorType.OTHER,
        severity: ErrorSeverity = ErrorSeverity.MINOR,
        error_description: Optional[str] = None,
        reproduction_steps: Optional[str] = None,
        model_version: Optional[str] = None,
        prompt_version: Optional[str] = None,
        run_id: Optional[str] = None,
        sample_id: Optional[int] = None,
        task_result_id: Optional[int] = None,
        reporter_id: Optional[int] = None,
        assignee_id: Optional[int] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict] = None,
    ) -> ErrorSample:
        error = ErrorSample(
            error_type=error_type,
            severity=severity,
            model_output=model_output,
            expected_output=expected_output,
            input_context=input_context,
            error_description=error_description,
            reproduction_steps=reproduction_steps,
            model_version=model_version,
            prompt_version=prompt_version,
            run_id=run_id,
            sample_id=sample_id,
            source_task_result_id=task_result_id,
            reporter_id=reporter_id,
            assignee_id=assignee_id,
            status="open",
            tags=tags,
            extra_metadata=metadata,
        )
        self.db.add(error)
        self.db.commit()
        self.db.refresh(error)

        logger.info(f"上报错误样本: id={error.id}, type={error_type.value}, severity={severity.value}")
        return error

    def report_from_feedback(
        self,
        feedback,
        *,
        task_result: Optional[TaskResult] = None,
    ) -> Optional[ErrorSample]:
        if not feedback.corrected_text and feedback.score is not None and feedback.score >= 0:
            return None

        model_output = ""
        input_context = ""
        expected_output = None
        model_version = None

        if task_result:
            model_output = task_result.result_text or json.dumps(task_result.result_data or {}, ensure_ascii=False)
            model_version = task_result.model_version
            if task_result.metrics:
                input_context = str(task_result.metrics.get("input_text", ""))

        expected_output = feedback.corrected_text or None
        error_type = self._infer_error_type(feedback, model_output, expected_output)
        severity = self._infer_severity(feedback)

        error = ErrorSample(
            error_type=error_type,
            severity=severity,
            model_output=model_output,
            expected_output=expected_output,
            input_context=input_context,
            error_description=feedback.content,
            model_version=model_version,
            source_task_result_id=task_result.id if task_result else None,
            reporter_id=feedback.user_id,
            status="open",
            extra_metadata={"feedback_id": feedback.id, "feedback_type": feedback.feedback_type.value},
        )
        self.db.add(error)
        self.db.commit()
        self.db.refresh(error)
        return error

    def auto_detect_from_evaluation(
        self,
        evaluation: EvaluationResult,
        min_error_score: float = 0.3,
    ) -> Optional[ErrorSample]:
        scores = evaluation.scores or {}
        overall_score = scores.get("overall", scores.get("f1", scores.get("rouge_l", 1.0)))
        if overall_score > 1 - min_error_score and not evaluation.is_error_case:
            return None

        error_type = self._infer_from_scores(scores)
        severity = self._score_to_severity(overall_score)

        error = ErrorSample(
            error_type=error_type,
            severity=severity,
            model_output=evaluation.model_output,
            expected_output=evaluation.reference_output,
            input_context=evaluation.input_text,
            error_description=f"评估自动检测，得分={overall_score:.3f}",
            model_version=None,
            sample_id=evaluation.sample_id,
            status="open",
            reproducible=True,
            triaged=False,
            extra_metadata={
                "evaluation_id": evaluation.id,
                "scores": scores,
                "explanation": evaluation.explanation,
            },
        )
        self.db.add(error)
        evaluation.error_sample = error
        self.db.commit()
        self.db.refresh(error)
        return error

    def triage_error(
        self,
        error_id: int,
        *,
        assignee_id: Optional[int] = None,
        new_severity: Optional[ErrorSeverity] = None,
        new_type: Optional[ErrorType] = None,
        false_alarm: Optional[bool] = None,
        reproducible: Optional[bool] = None,
        note: Optional[str] = None,
    ) -> Optional[ErrorSample]:
        error = self.db.get(ErrorSample, error_id)
        if not error:
            return None

        error.triaged = True
        if assignee_id is not None:
            error.assignee_id = assignee_id
        if new_severity:
            error.severity = new_severity
        if new_type:
            error.error_type = new_type
        if false_alarm is not None:
            error.false_alarm = false_alarm
            if false_alarm:
                error.status = "closed"
        if reproducible is not None:
            error.reproducible = reproducible

        if note:
            existing_meta = error.extra_metadata or {}
            existing_meta["triage_note"] = note
            error.extra_metadata = existing_meta

        self.db.commit()
        self.db.refresh(error)
        return error

    def resolve_error(
        self,
        error_id: int,
        *,
        resolution_note: str,
        resolved_by_id: Optional[int] = None,
        fix_suggestion: Optional[str] = None,
        add_to_dataset_id: Optional[int] = None,
        sample_type=None,
    ) -> Optional[ErrorSample]:
        error = self.db.get(ErrorSample, error_id)
        if not error:
            return None

        error.status = "resolved"
        error.resolution_note = resolution_note
        error.resolved_at = datetime.utcnow()
        error.resolved_by_id = resolved_by_id
        if fix_suggestion:
            error.fix_suggestion = fix_suggestion

        if add_to_dataset_id and error.expected_output and error.input_context:
            from app.models.dataset import DatasetSample, SampleStatus, SampleType

            stype = sample_type or SampleType.CLAUSE_SUMMARY
            sample = DatasetSample(
                dataset_id=add_to_dataset_id,
                sample_type=stype,
                status=SampleStatus.PENDING_REVIEW,
                source_risk_id=None,
                source_clause_id=None,
                input_text=error.input_context or "",
                reference_output=error.expected_output,
                input_metadata={"error_sample_id": error.id, "error_type": error.error_type.value},
                reference_metadata={"resolution_note": resolution_note},
                difficulty_level=3 if error.severity in (ErrorSeverity.CRITICAL, ErrorSeverity.MAJOR) else 2,
                weight=2.0 if error.severity == ErrorSeverity.CRITICAL else 1.5,
            )
            self.db.add(sample)

            ds = self.db.get(Dataset, add_to_dataset_id)
            if ds:
                ds.sample_count += 1

        self.db.commit()
        self.db.refresh(error)
        logger.info(f"错误样本解决: id={error_id}")
        return error

    def list_errors(
        self,
        *,
        status: Optional[str] = None,
        error_type: Optional[ErrorType] = None,
        severity: Optional[ErrorSeverity] = None,
        model_version: Optional[str] = None,
        assignee_id: Optional[int] = None,
        reporter_id: Optional[int] = None,
        triaged: Optional[bool] = None,
        false_alarm: Optional[bool] = None,
        keyword: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[ErrorSample], int]:
        query = select(ErrorSample)
        conditions = []
        if status:
            conditions.append(ErrorSample.status == status)
        if error_type:
            conditions.append(ErrorSample.error_type == error_type)
        if severity:
            conditions.append(ErrorSample.severity == severity)
        if model_version:
            conditions.append(ErrorSample.model_version == model_version)
        if assignee_id is not None:
            conditions.append(ErrorSample.assignee_id == assignee_id)
        if reporter_id is not None:
            conditions.append(ErrorSample.reporter_id == reporter_id)
        if triaged is not None:
            conditions.append(ErrorSample.triaged == triaged)
        if false_alarm is not None:
            conditions.append(ErrorSample.false_alarm == false_alarm)
        if keyword:
            like = f"%{keyword}%"
            conditions.append(or_(
                ErrorSample.error_description.like(like),
                ErrorSample.model_output.like(like),
                ErrorSample.expected_output.like(like),
            ))
        if date_from:
            conditions.append(ErrorSample.created_at >= date_from)
        if date_to:
            conditions.append(ErrorSample.created_at <= date_to)

        if conditions:
            query = query.where(and_(*conditions))

        count_q = select(func.count()).select_from(query.subquery())
        total = self.db.execute(count_q).scalar_one()

        query = query.order_by(
            ErrorSample.status.in_(["open", "in_progress"]).desc(),
            ErrorSample.severity.in_([ErrorSeverity.CRITICAL, ErrorSeverity.MAJOR]).desc(),
            ErrorSample.created_at.desc(),
        )
        query = query.offset((page - 1) * page_size).limit(page_size)
        items = list(self.db.execute(query).scalars().all())
        return items, total

    def aggregate_statistics(
        self,
        *,
        window_days: int = 30,
        model_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        start = datetime.utcnow() - timedelta(days=window_days)
        query = select(ErrorSample).where(ErrorSample.created_at >= start)
        if model_version:
            query = query.where(ErrorSample.model_version == model_version)
        errors = list(self.db.execute(query).scalars().all())

        if not errors:
            return {"total": 0, "by_type": {}, "by_severity": {}, "by_status": {}, "trend": [], "top_errors": []}

        by_type: Dict[str, int] = {}
        by_severity: Dict[str, int] = {}
        by_status: Dict[str, int] = {}
        by_model: Dict[str, int] = {}
        false_alarm_count = 0
        avg_resolution_hours = 0.0
        resolved_count = 0

        for e in errors:
            t = e.error_type.value
            by_type[t] = by_type.get(t, 0) + 1
            s = e.severity.value
            by_severity[s] = by_severity.get(s, 0) + 1
            by_status[e.status] = by_status.get(e.status, 0) + 1
            mv = e.model_version or "unknown"
            by_model[mv] = by_model.get(mv, 0) + 1
            if e.false_alarm:
                false_alarm_count += 1
            if e.status == "resolved" and e.resolved_at:
                delta = (e.resolved_at - e.created_at).total_seconds() / 3600
                avg_resolution_hours += delta
                resolved_count += 1

        if resolved_count:
            avg_resolution_hours = round(avg_resolution_hours / resolved_count, 2)

        trend = self._build_trend(errors, window_days)
        top_errors = sorted(by_type.items(), key=lambda x: x[1], reverse=True)[:10]

        type_aggregates = []
        for et, count in top_errors:
            type_errors = [e for e in errors if e.error_type.value == et]
            weight = sum(self._severity_weight(e.severity) for e in type_errors)
            affected = list({e.model_version or "unknown" for e in type_errors})
            examples = [e.id for e in sorted(type_errors, key=lambda x: self._severity_weight(x.severity), reverse=True)[:5]]
            type_aggregates.append({
                "error_type": et,
                "count": count,
                "severity_weighted": round(weight, 2),
                "affected_models": affected,
                "top_examples": examples,
            })

        return {
            "total": len(errors),
            "by_type": by_type,
            "by_severity": by_severity,
            "by_status": by_status,
            "by_model": by_model,
            "false_alarm_rate": round(false_alarm_count / len(errors), 3) if errors else 0,
            "avg_resolution_hours": avg_resolution_hours,
            "resolved_count": resolved_count,
            "untriaged_count": sum(1 for e in errors if not e.triaged),
            "trend": trend,
            "top_errors": type_aggregates,
        }

    @staticmethod
    def _severity_weight(severity: ErrorSeverity) -> float:
        return {
            ErrorSeverity.CRITICAL: 10.0,
            ErrorSeverity.MAJOR: 5.0,
            ErrorSeverity.MINOR: 2.0,
            ErrorSeverity.COSMETIC: 0.5,
        }.get(severity, 1.0)

    @staticmethod
    def _build_trend(errors: List[ErrorSample], days: int) -> List[Dict]:
        trend = []
        now = datetime.utcnow().date()
        for d in range(days - 1, -1, -1):
            day = now - timedelta(days=d)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = day_start + timedelta(days=1)
            day_errors = [
                e for e in errors
                if day_start <= e.created_at < day_end
            ]
            trend.append({
                "date": day.isoformat(),
                "total": len(day_errors),
                "critical": sum(1 for e in day_errors if e.severity == ErrorSeverity.CRITICAL),
                "major": sum(1 for e in day_errors if e.severity == ErrorSeverity.MAJOR),
                "minor": sum(1 for e in day_errors if e.severity == ErrorSeverity.MINOR),
                "resolved": sum(1 for e in day_errors if e.status == "resolved"),
            })
        return trend

    @staticmethod
    def _infer_error_type(feedback, model_output: str, expected: Optional[str]) -> ErrorType:
        content = (feedback.content or "").lower()
        if not expected:
            if "假阳性" in content or "false positive" in content or "不存在" in content:
                return ErrorType.FALSE_POSITIVE
            if "漏检" in content or "missing" in content:
                return ErrorType.FALSE_NEGATIVE
            return ErrorType.OTHER

        from rapidfuzz import fuzz
        sim = fuzz.ratio(model_output or "", expected or "")
        if sim < 30:
            return ErrorType.HALLUCINATION
        if sim < 60:
            return ErrorType.INCORRECT_SUMMARY
        if "分类" in content or "classify" in content:
            return ErrorType.WRONG_CLASSIFICATION
        if "来源" in content or "引用" in content or "source" in content:
            return ErrorType.MISATTRIBUTION
        return ErrorType.OTHER

    @staticmethod
    def _infer_severity(feedback) -> ErrorSeverity:
        if feedback.feedback_type.value == "downvote":
            return ErrorSeverity.MAJOR
        if feedback.corrected_text:
            return ErrorSeverity.MINOR
        return ErrorSeverity.COSMETIC

    @staticmethod
    def _infer_from_scores(scores: Dict) -> ErrorType:
        if scores.get("hallucination_rate", 0) > 0.3:
            return ErrorType.HALLUCINATION
        if scores.get("missing_info_rate", 0) > 0.3:
            return ErrorType.MISSING_INFORMATION
        if scores.get("accuracy", 1.0) < 0.5:
            return ErrorType.WRONG_CLASSIFICATION
        return ErrorType.POOR_QUALITY

    @staticmethod
    def _score_to_severity(score: float) -> ErrorSeverity:
        if score < 0.2:
            return ErrorSeverity.CRITICAL
        if score < 0.5:
            return ErrorSeverity.MAJOR
        if score < 0.7:
            return ErrorSeverity.MINOR
        return ErrorSeverity.COSMETIC
