from __future__ import annotations

import json
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta

from loguru import logger
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_

from app.core.database import get_sync_session
from app.models.dataset import DatasetSample, SampleStatus, Dataset, SampleType
from app.models.task import Feedback, FeedbackType, AuditLog, AuditAction
from app.services.data.error_sample_manager import ErrorSampleManager


class ReviewState(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    IN_REVIEW = "in_review"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUPERSEDED = "superseded"


class ReviewDecision(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    REVISE = "revise"
    ESCALATE = "escalate"


class ReviewPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ReviewAssignment:
    """审核任务分配"""

    id: int
    sample_type: SampleType
    sample_id: int
    reviewer_id: int
    status: str
    priority: ReviewPriority
    deadline: Optional[datetime] = None
    assigned_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "sample_type": self.sample_type.value if isinstance(self.sample_type, SampleType) else self.sample_type,
            "sample_id": self.sample_id,
            "reviewer_id": self.reviewer_id,
            "status": self.status,
            "priority": self.priority.value,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


@dataclass
class ReviewCorrection:
    """审核修正内容"""

    field: str
    old_value: Any
    new_value: Any
    reason: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "field": self.field,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "reason": self.reason,
        }


class FeedbackProcessor:
    """反馈处理器"""

    def __init__(self, db: Optional[Session] = None):
        self.db = db or get_sync_session()

    def close(self):
        if self.db:
            self.db.close()

    def _commit_and_refresh(self, obj: Any) -> Any:
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def submit_summary_feedback(
        self,
        summary_id: int,
        feedback_type: FeedbackType,
        corrected_text: Optional[str] = None,
        note: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> Feedback:
        """提交摘要反馈"""
        feedback = Feedback(
            summary_id=summary_id,
            user_id=user_id or 0,
            feedback_type=feedback_type,
            content=note,
            corrected_text=corrected_text,
            metadata={
                "target_type": "summary",
                "submitted_at": datetime.utcnow().isoformat(),
            },
        )

        if feedback_type == FeedbackType.UPVOTE:
            feedback.score = 1.0
        elif feedback_type == FeedbackType.DOWNVOTE:
            feedback.score = -1.0

        self.db.add(feedback)
        self._commit_and_refresh(feedback)

        if feedback_type in (FeedbackType.DOWNVOTE, FeedbackType.CORRECTION):
            self._handle_negative_feedback(feedback, SampleType.DOCUMENT_SUMMARY)
        elif feedback_type == FeedbackType.UPVOTE:
            self._handle_positive_feedback(feedback, SampleType.DOCUMENT_SUMMARY)

        self._create_audit_log(
            action=AuditAction.CREATE,
            resource_type="feedback_summary",
            resource_id=str(feedback.id),
            user_id=user_id,
            note=f"提交摘要反馈: {feedback_type.value}",
        )

        logger.info(f"提交摘要反馈: summary_id={summary_id}, type={feedback_type.value}, feedback_id={feedback.id}")
        return feedback

    def submit_risk_feedback(
        self,
        risk_id: int,
        is_false_positive: bool = False,
        correct_risk_type: Optional[str] = None,
        correct_risk_level: Optional[str] = None,
        reviewer_note: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> Feedback:
        """提交风险检测反馈"""
        feedback_type = FeedbackType.CORRECTION if (is_false_positive or correct_risk_type or correct_risk_level) else FeedbackType.COMMENT
        if is_false_positive and not correct_risk_type and not correct_risk_level:
            feedback_type = FeedbackType.DOWNVOTE
        elif not is_false_positive and not correct_risk_type and not correct_risk_level and reviewer_note:
            feedback_type = FeedbackType.COMMENT

        score = -1.0 if is_false_positive else (0.5 if correct_risk_type or correct_risk_level else None)

        feedback = Feedback(
            risk_id=risk_id,
            user_id=user_id or 0,
            feedback_type=feedback_type,
            score=score,
            content=reviewer_note,
            metadata={
                "target_type": "risk_detection",
                "is_false_positive": is_false_positive,
                "correct_risk_type": correct_risk_type,
                "correct_risk_level": correct_risk_level,
                "submitted_at": datetime.utcnow().isoformat(),
            },
        )
        self.db.add(feedback)
        self._commit_and_refresh(feedback)

        if is_false_positive or correct_risk_type or correct_risk_level:
            self._handle_negative_feedback(feedback, SampleType.RISK_DETECTION)

        self._create_audit_log(
            action=AuditAction.CREATE,
            resource_type="feedback_risk",
            resource_id=str(feedback.id),
            user_id=user_id,
            note=f"提交风险反馈: risk_id={risk_id}, false_positive={is_false_positive}",
        )

        logger.info(f"提交风险反馈: risk_id={risk_id}, fp={is_false_positive}, feedback_id={feedback.id}")
        return feedback

    def submit_qa_feedback(
        self,
        qa_result_id: int,
        feedback_type: FeedbackType,
        corrected_answer: Optional[str] = None,
        note: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> Feedback:
        """提交问答结果反馈"""
        feedback = Feedback(
            task_result_id=qa_result_id,
            user_id=user_id or 0,
            feedback_type=feedback_type,
            content=note,
            corrected_text=corrected_answer,
            metadata={
                "target_type": "qa_result",
                "submitted_at": datetime.utcnow().isoformat(),
            },
        )

        if feedback_type == FeedbackType.UPVOTE:
            feedback.score = 1.0
        elif feedback_type == FeedbackType.DOWNVOTE:
            feedback.score = -1.0

        self.db.add(feedback)
        self._commit_and_refresh(feedback)

        if feedback_type in (FeedbackType.DOWNVOTE, FeedbackType.CORRECTION):
            self._handle_negative_feedback(feedback, SampleType.QA_PAIR)
        elif feedback_type == FeedbackType.UPVOTE:
            self._handle_positive_feedback(feedback, SampleType.QA_PAIR)

        self._create_audit_log(
            action=AuditAction.CREATE,
            resource_type="feedback_qa",
            resource_id=str(feedback.id),
            user_id=user_id,
            note=f"提交QA反馈: qa_result_id={qa_result_id}, type={feedback_type.value}",
        )

        logger.info(f"提交QA反馈: qa_result_id={qa_result_id}, type={feedback_type.value}, feedback_id={feedback.id}")
        return feedback

    def _handle_negative_feedback(self, feedback: Feedback, sample_type: SampleType) -> None:
        """处理负面反馈：自动创建错误样本、分配审核员"""
        try:
            error_manager = ErrorSampleManager(self.db)
            error = error_manager.report_from_feedback(feedback)
            if error:
                logger.info(f"负面反馈已创建错误样本: error_id={error.id}")

            sample = self._create_review_sample_from_feedback(feedback, sample_type)
            if sample:
                sample.status = SampleStatus.PENDING_REVIEW
                self.db.commit()
                logger.info(f"负面反馈已创建审核样本: sample_id={sample.id}")
        except Exception as e:
            logger.warning(f"处理负面反馈时出错: {e}")

    def _handle_positive_feedback(self, feedback: Feedback, sample_type: SampleType) -> None:
        """处理正向反馈：自动回流为训练样本"""
        try:
            sample = self._create_review_sample_from_feedback(feedback, sample_type)
            if sample:
                sample.status = SampleStatus.APPROVED
                sample.quality_score = 0.9
                sample.approved_at = datetime.utcnow()
                self.db.commit()
                logger.info(f"正向反馈已回流为训练样本: sample_id={sample.id}")
        except Exception as e:
            logger.warning(f"处理正向反馈时出错: {e}")

    def _create_review_sample_from_feedback(
        self, feedback: Feedback, sample_type: SampleType
    ) -> Optional[DatasetSample]:
        """从反馈创建审核样本"""
        from app.models.dataset import Dataset

        default_dataset = self.db.execute(
            select(Dataset).where(Dataset.is_active == True).order_by(Dataset.created_at.desc())
        ).scalars().first()

        if not default_dataset:
            return None

        input_text = feedback.content or ""
        reference_output = feedback.corrected_text or ""

        existing = self.db.execute(
            select(DatasetSample).where(
                and_(
                    DatasetSample.dataset_id == default_dataset.id,
                    DatasetSample.input_text == input_text,
                )
            )
        ).scalars().first()

        if existing:
            return existing

        sample = DatasetSample(
            dataset_id=default_dataset.id,
            sample_type=sample_type,
            status=SampleStatus.DRAFT,
            input_text=input_text,
            reference_output=reference_output,
            input_metadata={"feedback_id": feedback.id, "feedback_type": feedback.feedback_type.value},
            difficulty_level=2,
            quality_score=0.6,
            weight=1.5,
        )
        self.db.add(sample)
        self.db.flush()
        return sample

    def _create_audit_log(
        self,
        *,
        action: AuditAction,
        resource_type: str,
        resource_id: Optional[str] = None,
        user_id: Optional[int] = None,
        old_value: Any = None,
        new_value: Any = None,
        note: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            note=note,
            metadata=metadata,
            created_at=datetime.utcnow(),
        )
        self.db.add(log)
        self.db.flush()
        return log


class ReviewWorkflow:
    """审核工作流"""

    STATE_TRANSITIONS: Dict[ReviewState, List[ReviewState]] = {
        ReviewState.DRAFT: [ReviewState.PENDING_REVIEW, ReviewState.SUPERSEDED],
        ReviewState.PENDING_REVIEW: [ReviewState.IN_REVIEW, ReviewState.SUPERSEDED],
        ReviewState.IN_REVIEW: [ReviewState.REVIEWED, ReviewState.REJECTED, ReviewState.PENDING_REVIEW],
        ReviewState.REVIEWED: [ReviewState.APPROVED, ReviewState.REJECTED, ReviewState.PENDING_REVIEW],
        ReviewState.APPROVED: [ReviewState.SUPERSEDED, ReviewState.PENDING_REVIEW],
        ReviewState.REJECTED: [ReviewState.PENDING_REVIEW, ReviewState.SUPERSEDED],
        ReviewState.SUPERSEDED: [],
    }

    def __init__(self, db: Optional[Session] = None):
        self.db = db or get_sync_session()

    def close(self):
        if self.db:
            self.db.close()

    def _commit_and_refresh(self, obj: Any) -> Any:
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def _validate_transition(self, current: str, target: ReviewState) -> bool:
        try:
            current_state = ReviewState(current)
            return target in self.STATE_TRANSITIONS.get(current_state, [])
        except (ValueError, KeyError):
            return False

    def _create_audit_log(
        self,
        *,
        action: AuditAction,
        resource_type: str,
        resource_id: Optional[str] = None,
        user_id: Optional[int] = None,
        old_value: Any = None,
        new_value: Any = None,
        note: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            note=note,
            metadata=metadata,
        )
        self.db.add(log)
        self.db.flush()
        return log

    def assign_review(
        self,
        sample_ids: List[int],
        reviewer_ids: List[int],
        priority: ReviewPriority = ReviewPriority.MEDIUM,
        deadline_days: Optional[int] = None,
        assigner_id: Optional[int] = None,
    ) -> List[ReviewAssignment]:
        """分配审核任务"""
        assignments: List[ReviewAssignment] = []
        deadline = None
        if deadline_days:
            deadline = datetime.utcnow() + timedelta(days=deadline_days)

        for sample_id in sample_ids:
            sample = self.db.get(DatasetSample, sample_id)
            if not sample:
                logger.warning(f"分配审核时样本不存在: sample_id={sample_id}")
                continue

            if not self._validate_transition(sample.status, ReviewState.PENDING_REVIEW):
                logger.warning(f"样本状态无法进入待审核: sample_id={sample_id}, status={sample.status}")
                continue

            for idx, reviewer_id in enumerate(reviewer_ids):
                sample.status = SampleStatus.PENDING_REVIEW

                if idx == 0:
                    sample.assignee_id = reviewer_id

                assignment = ReviewAssignment(
                    id=len(assignments) + 1,
                    sample_type=sample.sample_type,
                    sample_id=sample_id,
                    reviewer_id=reviewer_id,
                    status=ReviewState.PENDING_REVIEW.value,
                    priority=priority,
                    deadline=deadline,
                    assigned_at=datetime.utcnow(),
                )
                assignments.append(assignment)

            self._create_audit_log(
                action=AuditAction.UPDATE,
                resource_type="review_assignment",
                resource_id=str(sample_id),
                user_id=assigner_id,
                old_value=sample.status.value if hasattr(sample.status, "value") else sample.status,
                new_value=ReviewState.PENDING_REVIEW.value,
                note=f"分配审核: reviewers={reviewer_ids}, priority={priority.value}",
                metadata={"deadline": deadline.isoformat() if deadline else None},
            )

        self.db.commit()
        logger.info(f"分配审核任务: {len(sample_ids)}个样本, {len(reviewer_ids)}个审核员")
        return assignments

    def start_review(
        self,
        sample_id: int,
        reviewer_id: int,
    ) -> Optional[DatasetSample]:
        """开始审核：锁定审核权、记录开始时间"""
        sample = self.db.get(DatasetSample, sample_id)
        if not sample:
            logger.warning(f"开始审核时样本不存在: sample_id={sample_id}")
            return None

        if sample.reviewer_id is not None and sample.reviewer_id != reviewer_id:
            logger.warning(f"样本已被其他审核员锁定: sample_id={sample_id}, locked_by={sample.reviewer_id}")
            raise PermissionError(f"样本 {sample_id} 已被审核员 {sample.reviewer_id} 锁定")

        if not self._validate_transition(sample.status, ReviewState.IN_REVIEW):
            logger.warning(f"样本状态无法进入审核中: sample_id={sample_id}, status={sample.status}")
            raise ValueError(f"样本状态 {sample.status} 无法开始审核")

        sample.status = SampleStatus.REVIEWING
        sample.reviewer_id = reviewer_id
        sample.reviewed_at = datetime.utcnow()

        self._create_audit_log(
            action=AuditAction.REVIEW,
            resource_type="sample_review",
            resource_id=str(sample_id),
            user_id=reviewer_id,
            old_value=ReviewState.PENDING_REVIEW.value,
            new_value=ReviewState.IN_REVIEW.value,
            note="开始审核",
        )

        self._commit_and_refresh(sample)
        logger.info(f"开始审核: sample_id={sample_id}, reviewer={reviewer_id}")
        return sample

    def submit_review(
        self,
        sample_id: int,
        reviewer_id: int,
        decision: ReviewDecision,
        review_comment: Optional[str] = None,
        corrections: Optional[List[ReviewCorrection]] = None,
    ) -> Optional[DatasetSample]:
        """提交审核结果"""
        sample = self.db.get(DatasetSample, sample_id)
        if not sample:
            logger.warning(f"提交审核时样本不存在: sample_id={sample_id}")
            return None

        if sample.reviewer_id is not None and sample.reviewer_id != reviewer_id:
            raise PermissionError(f"样本 {sample_id} 不属于审核员 {reviewer_id}")

        old_status = sample.status.value if hasattr(sample.status, "value") else sample.status

        target_state: Optional[ReviewState] = None
        if decision == ReviewDecision.APPROVE:
            target_state = ReviewState.APPROVED
        elif decision == ReviewDecision.REJECT:
            target_state = ReviewState.REJECTED
        elif decision == ReviewDecision.REVISE:
            target_state = ReviewState.PENDING_REVIEW

        if target_state is None:
            raise ValueError(f"不支持的审核决策: {decision.value}")

        if not self._validate_transition(sample.status, target_state):
            logger.warning(f"状态转换不合法: {sample.status} -> {target_state.value}")
            raise ValueError(f"无法从状态 {sample.status} 转换到 {target_state.value}")

        old_sample_id = None
        if corrections:
            old_sample_id = self._create_corrected_version(sample, corrections, reviewer_id)

        sample.status = getattr(SampleStatus, target_state.value.upper(), SampleStatus.REVIEWING)
        sample.review_comment = review_comment

        if target_state == ReviewState.APPROVED:
            sample.approved_at = datetime.utcnow()
        elif target_state == ReviewState.REJECTED:
            pass
        elif target_state == ReviewState.PENDING_REVIEW:
            sample.reviewer_id = None

        changes = {}
        if corrections:
            changes = {c.field: {"old": c.old_value, "new": c.new_value, "reason": c.reason} for c in corrections}

        self._create_audit_log(
            action=AuditAction.REVIEW,
            resource_type="sample_review",
            resource_id=str(sample_id),
            user_id=reviewer_id,
            old_value=old_status,
            new_value=target_state.value,
            note=f"审核决策: {decision.value}, {review_comment or ''}",
            metadata={
                "corrections": json.dumps(changes, ensure_ascii=False) if changes else None,
                "decision": decision.value,
                "old_sample_id": old_sample_id,
            },
        )

        self._commit_and_refresh(sample)
        logger.info(f"提交审核: sample_id={sample_id}, decision={decision.value}, reviewer={reviewer_id}")
        return sample

    def _create_corrected_version(
        self,
        sample: DatasetSample,
        corrections: List[ReviewCorrection],
        operator_id: int,
    ) -> Optional[int]:
        """创建修正版本，保留变更链"""
        if not corrections:
            return None

        new_sample = DatasetSample(
            dataset_id=sample.dataset_id,
            sample_type=sample.sample_type,
            status=SampleStatus.DRAFT,
            source_contract_id=sample.source_contract_id,
            source_clause_id=sample.source_clause_id,
            source_risk_id=sample.source_risk_id,
            source_task_result_id=sample.source_task_result_id,
            input_text=sample.input_text,
            reference_output=sample.reference_output,
            input_metadata=sample.input_metadata,
            reference_metadata=sample.reference_metadata,
            reference_score=sample.reference_score,
            difficulty_level=sample.difficulty_level,
            quality_score=sample.quality_score,
            weight=sample.weight,
            previous_sample_id=sample.id,
        )

        for correction in corrections:
            if correction.field == "input_text":
                new_sample.input_text = correction.new_value
            elif correction.field == "reference_output":
                new_sample.reference_output = correction.new_value
            elif correction.field == "reference_metadata":
                if isinstance(correction.new_value, dict):
                    new_sample.reference_metadata = correction.new_value
            elif correction.field == "difficulty_level":
                new_sample.difficulty_level = correction.new_value

        self.db.add(new_sample)
        self.db.flush()

        sample.status = SampleStatus.SUPERSEDED
        return new_sample.id

    def escalate_review(
        self,
        sample_id: int,
        from_reviewer_id: int,
        to_reviewer_id: int,
        reason: str,
    ) -> Optional[DatasetSample]:
        """升级/转交审核"""
        sample = self.db.get(DatasetSample, sample_id)
        if not sample:
            logger.warning(f"升级审核时样本不存在: sample_id={sample_id}")
            return None

        if sample.reviewer_id is not None and sample.reviewer_id != from_reviewer_id:
            raise PermissionError(f"样本 {sample_id} 不属于审核员 {from_reviewer_id}")

        sample.reviewer_id = to_reviewer_id
        sample.status = SampleStatus.PENDING_REVIEW

        existing_comment = sample.review_comment or ""
        escalation_note = f"[转交] 从 {from_reviewer_id} 转至 {to_reviewer_id}: {reason}"
        sample.review_comment = (existing_comment + "\n" + escalation_note).strip() if existing_comment else escalation_note

        self._create_audit_log(
            action=AuditAction.UPDATE,
            resource_type="sample_escalation",
            resource_id=str(sample_id),
            user_id=from_reviewer_id,
            old_value=str(from_reviewer_id),
            new_value=str(to_reviewer_id),
            note=f"转交审核: reason={reason}",
        )

        self._commit_and_refresh(sample)
        logger.info(f"升级审核: sample_id={sample_id}, from={from_reviewer_id}, to={to_reviewer_id}")
        return sample

    def batch_review(
        self,
        sample_ids: List[int],
        reviewer_id: int,
        decisions_map: Dict[int, Dict[str, Any]],
    ) -> Dict[str, Any]:
        """批量审核"""
        results: Dict[str, Any] = {"success": [], "failed": [], "total": len(sample_ids)}

        for sample_id in sample_ids:
            decision_info = decisions_map.get(sample_id)
            if not decision_info:
                results["failed"].append({"sample_id": sample_id, "reason": "未提供决策信息"})
                continue

            try:
                decision_str = decision_info.get("decision", "approve")
                decision = ReviewDecision(decision_str)
                review_comment = decision_info.get("comment")
                corrections_data = decision_info.get("corrections", [])
                corrections = [
                    ReviewCorrection(
                        field=c.get("field", ""),
                        old_value=c.get("old_value"),
                        new_value=c.get("new_value"),
                        reason=c.get("reason", ""),
                    )
                    for c in corrections_data
                ]

                result = self.submit_review(
                    sample_id=sample_id,
                    reviewer_id=reviewer_id,
                    decision=decision,
                    review_comment=review_comment,
                    corrections=corrections,
                )

                if result:
                    results["success"].append(sample_id)
                else:
                    results["failed"].append({"sample_id": sample_id, "reason": "样本不存在"})

            except (PermissionError, ValueError) as e:
                results["failed"].append({"sample_id": sample_id, "reason": str(e)})
            except Exception as e:
                logger.warning(f"批量审核异常: sample_id={sample_id}, error={e}")
                results["failed"].append({"sample_id": sample_id, "reason": f"内部错误: {str(e)}"})

        logger.info(f"批量审核完成: 成功{len(results['success'])}, 失败{len(results['failed'])}")
        return results

    def detect_conflicts(
        self,
        sample_id: int,
        operator_id: int,
    ) -> List[Dict[str, Any]]:
        """检测审核冲突"""
        conflicts: List[Dict[str, Any]] = []

        recent_logs = self.db.execute(
            select(AuditLog)
            .where(
                and_(
                    AuditLog.resource_type == "sample_review",
                    AuditLog.resource_id == str(sample_id),
                    AuditLog.user_id != operator_id,
                )
            )
            .order_by(AuditLog.created_at.desc())
            .limit(10)
        ).scalars().all()

        for log in recent_logs:
            if log.action in (AuditAction.REVIEW, AuditAction.UPDATE):
                conflicts.append({
                    "log_id": log.id,
                    "operator_id": log.user_id,
                    "action": log.action.value if hasattr(log.action, "value") else log.action,
                    "timestamp": log.created_at.isoformat() if log.created_at else None,
                    "note": log.note,
                    "old_value": log.old_value,
                    "new_value": log.new_value,
                })

        return conflicts


class RollbackManager:
    """回滚管理器"""

    def __init__(self, db: Optional[Session] = None):
        self.db = db or get_sync_session()

    def close(self):
        if self.db:
            self.db.close()

    def _commit_and_refresh(self, obj: Any) -> Any:
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def _create_audit_log(
        self,
        *,
        action: AuditAction,
        resource_type: str,
        resource_id: Optional[str] = None,
        user_id: Optional[int] = None,
        old_value: Any = None,
        new_value: Any = None,
        note: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            note=note,
            metadata=metadata,
        )
        self.db.add(log)
        self.db.flush()
        return log

    def rollback_sample(
        self,
        sample_id: int,
        target_version_id: Optional[int] = None,
        reason: str = "",
        operator_id: Optional[int] = None,
    ) -> Optional[DatasetSample]:
        """样本级回滚"""
        current_sample = self.db.get(DatasetSample, sample_id)
        if not current_sample:
            logger.warning(f"回滚样本不存在: sample_id={sample_id}")
            return None

        target_sample: Optional[DatasetSample] = None
        if target_version_id:
            target_sample = self.db.get(DatasetSample, target_version_id)
            if not target_sample:
                raise ValueError(f"目标版本不存在: target_version_id={target_version_id}")
        else:
            if current_sample.previous_sample_id:
                target_sample = self.db.get(DatasetSample, current_sample.previous_sample_id)
            if not target_sample:
                raise ValueError("无可回滚的历史版本")

        rolled_back_sample = DatasetSample(
            dataset_id=target_sample.dataset_id,
            sample_type=target_sample.sample_type,
            status=SampleStatus.DRAFT,
            source_contract_id=target_sample.source_contract_id,
            source_clause_id=target_sample.source_clause_id,
            source_risk_id=target_sample.source_risk_id,
            source_task_result_id=target_sample.source_task_result_id,
            input_text=target_sample.input_text,
            reference_output=target_sample.reference_output,
            input_metadata=target_sample.input_metadata,
            reference_metadata=target_sample.reference_metadata,
            reference_score=target_sample.reference_score,
            difficulty_level=target_sample.difficulty_level,
            quality_score=target_sample.quality_score,
            weight=target_sample.weight,
            previous_sample_id=sample_id,
            rollback_to_id=target_sample.id,
            is_rollback=True,
            rollback_reason=reason,
            rolled_back_at=datetime.utcnow(),
        )

        self.db.add(rolled_back_sample)
        self.db.flush()

        current_sample.status = SampleStatus.SUPERSEDED

        self._create_audit_log(
            action=AuditAction.ROLLBACK,
            resource_type="sample_rollback",
            resource_id=str(sample_id),
            user_id=operator_id,
            old_value=str(sample_id),
            new_value=str(target_sample.id),
            note=f"样本回滚: reason={reason}",
            metadata={
                "target_version_id": target_sample.id,
                "new_sample_id": rolled_back_sample.id,
                "reason": reason,
            },
        )

        self._commit_and_refresh(rolled_back_sample)
        impact = self._assess_sample_rollback_impact(sample_id)
        logger.info(f"样本回滚: sample_id={sample_id} -> {target_sample.id}, new_id={rolled_back_sample.id}")
        logger.info(f"回滚影响评估: {impact}")
        return rolled_back_sample

    def rollback_dataset_version(
        self,
        dataset_id: int,
        version: str,
        operator_id: Optional[int] = None,
        reason: str = "",
    ) -> Optional[Dataset]:
        """数据集级回滚"""
        from app.models.dataset import DatasetVersion

        dataset = self.db.get(Dataset, dataset_id)
        if not dataset:
            logger.warning(f"回滚数据集不存在: dataset_id={dataset_id}")
            return None

        target_version = self.db.execute(
            select(DatasetVersion).where(
                and_(
                    DatasetVersion.dataset_id == dataset_id,
                    DatasetVersion.version == version,
                )
            )
        ).scalars().first()

        if not target_version:
            raise ValueError(f"数据集版本不存在: {version}")

        old_version = dataset.version
        old_stats = dataset.stats
        old_sample_count = dataset.sample_count

        dataset.version = version
        dataset.stats = target_version.stats_snapshot
        dataset.sample_count = target_version.sample_count

        self._create_audit_log(
            action=AuditAction.ROLLBACK,
            resource_type="dataset_version_rollback",
            resource_id=str(dataset_id),
            user_id=operator_id,
            old_value=old_version,
            new_value=version,
            note=f"数据集版本回滚: reason={reason}",
            metadata={
                "old_stats": old_stats,
                "new_stats": target_version.stats_snapshot,
                "old_sample_count": old_sample_count,
                "new_sample_count": target_version.sample_count,
            },
        )

        self._commit_and_refresh(dataset)
        impact = self._assess_dataset_rollback_impact(dataset_id)
        logger.info(f"数据集版本回滚: dataset_id={dataset_id} -> {version}")
        logger.info(f"回滚影响评估: {impact}")
        return dataset

    def rollback_model_version(
        self,
        model_id: int,
        reason: str = "",
        operator_id: Optional[int] = None,
    ) -> Optional[Any]:
        """模型发布回滚"""
        from app.models.ml import ModelVersion, ModelStatus

        current_model = self.db.get(ModelVersion, model_id)
        if not current_model:
            logger.warning(f"回滚模型不存在: model_id={model_id}")
            return None

        if not current_model.parent_version_id:
            raise ValueError("该模型无父版本，无法回滚")

        parent_model = self.db.get(ModelVersion, current_model.parent_version_id)
        if not parent_model:
            raise ValueError(f"父版本模型不存在: parent_id={current_model.parent_version_id}")

        old_status = current_model.status.value if hasattr(current_model.status, "value") else current_model.status
        old_is_default = current_model.is_default

        current_model.status = ModelStatus.ROLLED_BACK
        current_model.rollback_to_version = parent_model.version
        current_model.rolled_back_at = datetime.utcnow()
        current_model.rollback_reason = reason
        current_model.is_default = False

        if old_is_default:
            parent_model.is_default = True
            parent_model.status = ModelStatus.PRODUCTION

        self._create_audit_log(
            action=AuditAction.ROLLBACK,
            resource_type="model_version_rollback",
            resource_id=str(model_id),
            user_id=operator_id,
            old_value=str(current_model.version),
            new_value=str(parent_model.version),
            note=f"模型版本回滚: reason={reason}",
            metadata={
                "parent_model_id": parent_model.id,
                "old_status": old_status,
                "was_default": old_is_default,
                "reason": reason,
            },
        )

        self.db.commit()
        impact = self._assess_model_rollback_impact(model_id)
        logger.info(f"模型版本回滚: model_id={model_id} -> v{parent_model.version}")
        logger.info(f"回滚影响评估: {impact}")
        return current_model

    def get_rollback_history(
        self,
        resource_type: str,
        resource_id: str,
    ) -> List[Dict[str, Any]]:
        """获取完整回滚链"""
        histories: List[Dict[str, Any]] = []

        rollback_logs = self.db.execute(
            select(AuditLog)
            .where(
                and_(
                    AuditLog.action == AuditAction.ROLLBACK,
                    AuditLog.resource_type.like(f"%{resource_type}%"),
                    AuditLog.resource_id == str(resource_id),
                )
            )
            .order_by(AuditLog.created_at.desc())
        ).scalars().all()

        for log in rollback_logs:
            histories.append({
                "log_id": log.id,
                "action": log.action.value if hasattr(log.action, "value") else log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "from_version": log.old_value,
                "to_version": log.new_value,
                "operator_id": log.user_id,
                "timestamp": log.created_at.isoformat() if log.created_at else None,
                "note": log.note,
                "metadata": log.metadata,
            })

        if resource_type == "sample":
            sample_id = int(resource_id)
            chain: List[Dict[str, Any]] = []
            current_id: Optional[int] = sample_id
            visited: set = set()

            while current_id and current_id not in visited:
                visited.add(current_id)
                sample = self.db.get(DatasetSample, current_id)
                if not sample:
                    break
                chain.append({
                    "sample_id": sample.id,
                    "status": sample.status.value if hasattr(sample.status, "value") else sample.status,
                    "is_rollback": sample.is_rollback,
                    "rollback_to_id": sample.rollback_to_id,
                    "rollback_reason": sample.rollback_reason,
                    "rolled_back_at": sample.rolled_back_at.isoformat() if sample.rolled_back_at else None,
                    "previous_sample_id": sample.previous_sample_id,
                    "created_at": sample.created_at.isoformat() if sample.created_at else None,
                })
                current_id = sample.previous_sample_id

            histories.append({"version_chain": chain})

        return histories

    def _assess_sample_rollback_impact(self, sample_id: int) -> Dict[str, Any]:
        """评估样本回滚的下游影响"""
        from app.models.ml import EvaluationResult

        affected_evaluations = self.db.execute(
            select(func.count(EvaluationResult.id)).where(EvaluationResult.sample_id == sample_id)
        ).scalar() or 0

        affected_tasks = self.db.execute(
            select(func.count(AuditLog.id)).where(
                and_(
                    AuditLog.resource_type == "sample_review",
                    AuditLog.resource_id == str(sample_id),
                )
            )
        ).scalar() or 0

        return {
            "affected_evaluations": affected_evaluations,
            "affected_reviews": affected_tasks,
            "recommended_actions": [
                "重新运行受影响的评估任务" if affected_evaluations > 0 else None,
                "通知相关审核人员" if affected_tasks > 0 else None,
            ],
        }

    def _assess_dataset_rollback_impact(self, dataset_id: int) -> Dict[str, Any]:
        """评估数据集版本回滚的下游影响"""
        from app.models.ml import EvaluationResult, ModelVersion

        affected_evaluations = self.db.execute(
            select(func.count(EvaluationResult.id))
            .select_from(ModelVersion)
            .where(ModelVersion.fine_tune_dataset_id == dataset_id)
        ).scalar() or 0

        affected_models = self.db.execute(
            select(func.count(ModelVersion.id)).where(ModelVersion.fine_tune_dataset_id == dataset_id)
        ).scalar() or 0

        return {
            "affected_models": affected_models,
            "affected_evaluations": affected_evaluations,
            "recommended_actions": [
                "重新微调受影响的模型" if affected_models > 0 else None,
                "重新运行模型评估" if affected_evaluations > 0 else None,
            ],
        }

    def _assess_model_rollback_impact(self, model_id: int) -> Dict[str, Any]:
        """评估模型回滚的下游影响"""
        from app.models.ml import EvaluationResult, ABRun

        affected_evaluations = self.db.execute(
            select(func.count(EvaluationResult.id)).where(EvaluationResult.model_id == model_id)
        ).scalar() or 0

        affected_ab_runs = self.db.execute(
            select(func.count(ABRun.id)).where(
                or_(ABRun.model_a_id == model_id, ABRun.model_b_id == model_id)
            )
        ).scalar() or 0

        return {
            "affected_evaluations": affected_evaluations,
            "affected_ab_runs": affected_ab_runs,
            "recommended_actions": [
                "更新线上服务的模型引用" if affected_ab_runs > 0 else None,
                "通知相关AB测试负责人" if affected_ab_runs > 0 else None,
            ],
        }


class LabelStudioBridge:
    """LabelStudio集成桥接器（可选集成）"""

    def __init__(self, db: Optional[Session] = None):
        self.db = db or get_sync_session()

    def close(self):
        if self.db:
            self.db.close()

    def export_to_labelstudio(
        self,
        dataset_id: int,
        export_format: str = "json",
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """导出数据集到LabelStudio格式"""
        dataset = self.db.get(Dataset, dataset_id)
        if not dataset:
            raise ValueError(f"数据集不存在: dataset_id={dataset_id}")

        query = select(DatasetSample).where(DatasetSample.dataset_id == dataset_id)
        if limit:
            query = query.limit(limit)

        samples = self.db.execute(query).scalars().all()
        tasks: List[Dict[str, Any]] = []

        for sample in samples:
            task = self.convert_sample_to_labelstudio_task(sample)
            tasks.append(task)

        logger.info(f"导出LabelStudio任务: dataset_id={dataset_id}, count={len(tasks)}")
        return tasks

    def import_from_labelstudio(
        self,
        annotations_json: List[Dict[str, Any]],
        dataset_id: int,
        annotator_id: Optional[int] = None,
    ) -> Tuple[int, int]:
        """从LabelStudio导入标注结果"""
        dataset = self.db.get(Dataset, dataset_id)
        if not dataset:
            raise ValueError(f"数据集不存在: dataset_id={dataset_id}")

        imported = 0
        skipped = 0

        for annotation in annotations_json:
            try:
                sample = self._process_labelstudio_annotation(
                    annotation=annotation,
                    dataset_id=dataset_id,
                    annotator_id=annotator_id,
                )
                if sample:
                    imported += 1
                else:
                    skipped += 1
            except Exception as e:
                logger.warning(f"导入LabelStudio标注失败: {e}")
                skipped += 1

        if imported > 0:
            dataset.sample_count += imported
            self.db.commit()

        logger.info(f"导入LabelStudio标注: 成功={imported}, 跳过={skipped}")
        return imported, skipped

    def convert_sample_to_labelstudio_task(self, sample: DatasetSample) -> Dict[str, Any]:
        """将数据集样本转换为LabelStudio任务"""
        sample_type = sample.sample_type.value if isinstance(sample.sample_type, SampleType) else sample.sample_type

        data: Dict[str, Any] = {"text": sample.input_text}
        if sample.reference_output:
            data["reference"] = sample.reference_output
        if sample.input_metadata:
            data["metadata"] = sample.input_metadata

        task = {
            "id": sample.id,
            "data": data,
            "meta": {
                "sample_id": sample.id,
                "sample_type": sample_type,
                "status": sample.status.value if hasattr(sample.status, "value") else sample.status,
                "difficulty_level": sample.difficulty_level,
                "quality_score": sample.quality_score,
                "created_at": sample.created_at.isoformat() if sample.created_at else None,
            },
        }

        if sample_type == "risk_detection":
            task["meta"]["clause_id"] = sample.source_clause_id
        elif sample_type == "qa_pair":
            task["meta"]["task_result_id"] = sample.source_task_result_id

        return task

    def _process_labelstudio_annotation(
        self,
        annotation: Dict[str, Any],
        dataset_id: int,
        annotator_id: Optional[int],
    ) -> Optional[DatasetSample]:
        """处理单个LabelStudio标注"""
        task_id = annotation.get("id") or annotation.get("task_id")
        if not task_id:
            return None

        annotations = annotation.get("annotations", [])
        if not annotations:
            return None

        first_annotation = annotations[0]
        result = first_annotation.get("result", [])

        reference_output = None
        labels: List[Dict[str, Any]] = []

        for r in result:
            value = r.get("value", {})
            if "text" in value:
                reference_output = value["text"][0] if isinstance(value["text"], list) else value["text"]
            if "choices" in value:
                labels.append({
                    "type": r.get("from_name", "choice"),
                    "value": value["choices"],
                })
            if "labels" in value:
                labels.append({
                    "type": r.get("from_name", "label"),
                    "value": value["labels"],
                    "start": value.get("start"),
                    "end": value.get("end"),
                    "text": value.get("text"),
                })

        input_text = annotation.get("data", {}).get("text", "")
        sample_type_str = annotation.get("meta", {}).get("sample_type", "clause_summary")
        try:
            sample_type = SampleType(sample_type_str)
        except (ValueError, KeyError):
            sample_type = SampleType.CLAUSE_SUMMARY

        sample = DatasetSample(
            dataset_id=dataset_id,
            sample_type=sample_type,
            status=SampleStatus.PENDING_REVIEW,
            input_text=input_text,
            reference_output=reference_output,
            input_metadata={"source": "labelstudio_import", "task_id": task_id},
            reference_metadata={"labels": labels, "annotation_id": first_annotation.get("id")},
            quality_score=0.7,
            difficulty_level=2,
        )

        self.db.add(sample)
        self.db.flush()

        if labels and annotator_id:
            from app.models.dataset import SampleLabel, LabelType

            for label_data in labels:
                label_type_mapping = {
                    "category": LabelType.CATEGORY,
                    "risk_level": LabelType.RISK_LEVEL,
                    "risk_type": LabelType.RISK_TYPE,
                    "summary": LabelType.SUMMARY,
                }
                label_type = label_type_mapping.get(label_data["type"], LabelType.CATEGORY)
                label_value = json.dumps(label_data["value"], ensure_ascii=False) if isinstance(label_data["value"], list) else str(label_data["value"])

                sample_label = SampleLabel(
                    sample_id=sample.id,
                    label_type=label_type,
                    label_value=label_value,
                    label_confidence=first_annotation.get("completed_by") and 1.0 or 0.8,
                    annotator_id=annotator_id,
                    is_gold_label=False,
                    label_metadata={
                        "start": label_data.get("start"),
                        "end": label_data.get("end"),
                        "text": label_data.get("text"),
                    },
                )
                self.db.add(sample_label)

        return sample
