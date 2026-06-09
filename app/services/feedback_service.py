from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any

from sqlalchemy.orm import Session

from app.data.models import FeedbackType
from app.repositories.system_repo import (
    FeedbackRepository, ErrorSampleRepository, QAConversationRepository
)
from app.schemas.feedback import (
    QAFeedbackCreate, QAFeedbackOut, ErrorSampleCreate, ErrorSampleUpdate, ErrorSampleOut
)

logger = logging.getLogger(__name__)


class FeedbackService:
    """反馈与错误样本管理。"""

    def __init__(self, db: Session):
        self.db = db
        self.fb_repo = FeedbackRepository(db)
        self.err_repo = ErrorSampleRepository(db)
        self.conv_repo = QAConversationRepository(db)

    def submit_feedback(self, conversation_id: int, obj_in: QAFeedbackCreate,
                        user_id: Optional[str] = None):
        conv = self.conv_repo.get(conversation_id)
        if not conv:
            raise ValueError(f"Conversation {conversation_id} not found")
        data = obj_in.model_dump()
        data["conversation_id"] = conversation_id
        data["user_id"] = user_id
        fb = self.fb_repo.create(data)

        if fb.is_error_sample:
            try:
                self.err_repo.create({
                    "question": conv.question,
                    "incorrect_answer": conv.answer,
                    "expected_answer": fb.corrected_answer,
                    "error_category": fb.error_category,
                    "source_feedback_id": fb.id,
                    "model_version": conv.model_version,
                    "created_by": user_id,
                })
            except Exception as e:
                logger.warning(f"Failed to create error sample from feedback: {e}")
        return fb

    def list_feedbacks(self, page: int = 1, page_size: int = 20, **filters):
        return self.fb_repo.list(page=page, page_size=page_size, **filters)

    def get_feedback(self, feedback_id: int):
        return self.fb_repo.get(feedback_id)

    def resolve_feedback(self, feedback_id: int, resolved_by: str,
                         resolution_note: Optional[str] = None):
        return self.fb_repo.resolve(feedback_id, resolved_by, resolution_note)

    # === Error Samples ===
    def create_error_sample(self, obj_in: ErrorSampleCreate, created_by: Optional[str] = None):
        data = obj_in.model_dump()
        data["created_by"] = created_by
        return self.err_repo.create(data)

    def list_error_samples(self, page: int = 1, page_size: int = 20, **filters):
        return self.err_repo.list(page=page, page_size=page_size, **filters)

    def get_error_sample(self, sample_id: int):
        return self.err_repo.get(sample_id)

    def update_error_sample(self, sample_id: int, obj_in: ErrorSampleUpdate):
        data = obj_in.model_dump(exclude_unset=True)
        return self.err_repo.update(sample_id, data)

    def get_top_error_categories(self, limit: int = 10, days: int = 30):
        return self.err_repo.get_top_categories(limit=limit, days=days)

    def export_error_samples(self, status: Optional[str] = None,
                             limit: int = 1000) -> List[Dict[str, Any]]:
        samples, _ = self.list_error_samples(page=1, page_size=limit, status=status)
        return [
            {
                "id": s.id,
                "question": s.question,
                "incorrect_answer": s.incorrect_answer,
                "expected_answer": s.expected_answer,
                "error_category": s.error_category,
                "severity": s.severity,
                "status": s.status,
                "model_version": s.model_version,
                "dataset_version": s.dataset_version,
                "labels": s.labels,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in samples
        ]
