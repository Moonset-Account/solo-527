import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.models.feedback import ManualFeedback
from app.models.risk_score import RiskScore
from app.models.appointment import Appointment
from app.models.user import User
from app.schemas.business import (
    ManualFeedbackCreate, BatchFeedbackRequest, BatchFeedbackResponse
)


class FeedbackService:
    @staticmethod
    def create_feedback(
        db: Session, data: ManualFeedbackCreate, operator_id: int
    ) -> Optional[ManualFeedback]:
        fb = ManualFeedback(**data.model_dump())
        fb.operator_id = operator_id
        fb.batch_id = f"fb_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
        db.add(fb)

        if fb.risk_score_id and (fb.corrected_risk_level or fb.corrected_score is not None):
            rs = db.query(RiskScore).filter(RiskScore.id == fb.risk_score_id).first()
            if rs:
                fb.original_risk_level = fb.original_risk_level or rs.risk_level
                fb.original_score = fb.original_score if fb.original_score is not None else rs.risk_score
                if fb.corrected_risk_level and fb.corrected_risk_level != rs.risk_level:
                    fb.is_error_sample = True
                    fb.error_type = fb.error_type or "risk_level_mismatch"
                if fb.corrected_score is not None and abs(fb.corrected_score - rs.risk_score) > 0.2:
                    fb.is_error_sample = True
                    fb.error_type = fb.error_type or "score_deviation"

        db.commit()
        db.refresh(fb)
        return fb

    @staticmethod
    def batch_create_feedback(
        db: Session, request: BatchFeedbackRequest, operator_id: int
    ) -> BatchFeedbackResponse:
        batch_id = request.batch_id or f"batch_fb_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"
        success = 0
        failed = 0

        for fb_data in request.feedbacks:
            try:
                fb = ManualFeedback(**fb_data.model_dump())
                fb.operator_id = operator_id
                fb.batch_id = batch_id

                if fb.risk_score_id:
                    rs = db.query(RiskScore).filter(RiskScore.id == fb.risk_score_id).first()
                    if rs:
                        fb.original_risk_level = fb.original_risk_level or rs.risk_level
                        fb.original_score = fb.original_score if fb.original_score is not None else rs.risk_score
                        if fb.corrected_risk_level and fb.corrected_risk_level != rs.risk_level:
                            fb.is_error_sample = True
                            fb.error_type = fb.error_type or "risk_level_mismatch"
                        if fb.corrected_score is not None and abs(fb.corrected_score - rs.risk_score) > 0.2:
                            fb.is_error_sample = True
                            fb.error_type = fb.error_type or "score_deviation"

                db.add(fb)
                success += 1
            except Exception:
                failed += 1

        db.commit()
        return BatchFeedbackResponse(
            total_count=len(request.feedbacks),
            success_count=success,
            failed_count=failed,
            batch_id=batch_id,
        )

    @staticmethod
    def batch_confirm(db: Session, feedback_ids: List[int], reviewer_id: int, comment: str = "") -> int:
        count = 0
        for fid in feedback_ids:
            fb = db.query(ManualFeedback).filter(ManualFeedback.id == fid).first()
            if fb and fb.review_status == "pending":
                fb.review_status = "confirmed"
                fb.reviewer_id = reviewer_id
                fb.review_comment = comment
                fb.reviewed_at = datetime.utcnow()

                if fb.corrected_risk_level or fb.corrected_score is not None:
                    rs = db.query(RiskScore).filter(RiskScore.id == fb.risk_score_id).first()
                    if rs:
                        if fb.corrected_risk_level:
                            rs.risk_level = fb.corrected_risk_level
                            rs.needs_callback = fb.corrected_risk_level in ["high", "critical"]
                        if fb.corrected_score is not None:
                            rs.risk_score = fb.corrected_score
                        rs.is_override = True
                        rs.override_reason = f"人工确认修正: {fb.reason or comment}"
                count += 1
        db.commit()
        return count

    @staticmethod
    def list_feedback(
        db: Session,
        skip: int = 0, limit: int = 100,
        review_status: Optional[str] = None,
        feedback_type: Optional[str] = None,
        is_error_sample: Optional[bool] = None,
        error_type: Optional[str] = None,
        operator_id: Optional[int] = None,
        batch_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        appointment_id: Optional[int] = None,
        risk_score_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        query = db.query(ManualFeedback)
        if review_status:
            query = query.filter(ManualFeedback.review_status == review_status)
        if feedback_type:
            query = query.filter(ManualFeedback.feedback_type == feedback_type)
        if is_error_sample is not None:
            query = query.filter(ManualFeedback.is_error_sample == is_error_sample)
        if error_type:
            query = query.filter(ManualFeedback.error_type == error_type)
        if operator_id:
            query = query.filter(ManualFeedback.operator_id == operator_id)
        if batch_id:
            query = query.filter(ManualFeedback.batch_id == batch_id)
        if date_from:
            query = query.filter(ManualFeedback.created_at >= date_from)
        if date_to:
            query = query.filter(ManualFeedback.created_at <= date_to)
        if appointment_id:
            query = query.filter(ManualFeedback.appointment_id == appointment_id)
        if risk_score_id:
            query = query.filter(ManualFeedback.risk_score_id == risk_score_id)

        fbs = query.order_by(ManualFeedback.created_at.desc()).offset(skip).limit(limit).all()

        result = []
        for fb in fbs:
            a = fb.appointment
            rs = fb.risk_score
            result.append({
                "id": fb.id,
                "appointment_id": fb.appointment_id,
                "risk_score_id": fb.risk_score_id,
                "appointment_no": a.appointment_no if a else "",
                "department_name": a.department.name if a and a.department else "",
                "appointment_date": str(a.appointment_date) if a and a.appointment_date else "",
                "original_risk_level": fb.original_risk_level,
                "corrected_risk_level": fb.corrected_risk_level,
                "original_score": fb.original_score,
                "corrected_score": fb.corrected_score,
                "feedback_type": fb.feedback_type,
                "reason": fb.reason,
                "remark": fb.remark,
                "is_error_sample": fb.is_error_sample,
                "error_type": fb.error_type,
                "risk_score_current": rs.risk_score if rs else None,
                "risk_level_current": rs.risk_level if rs else None,
                "operator_name": fb.operator.full_name if fb.operator else "",
                "reviewer_name": fb.reviewer.full_name if fb.reviewer else None,
                "review_status": fb.review_status,
                "review_comment": fb.review_comment,
                "reviewed_at": fb.reviewed_at.isoformat() if fb.reviewed_at else None,
                "batch_id": fb.batch_id,
                "created_at": fb.created_at.isoformat() if fb.created_at else None,
            })
        return result

    @staticmethod
    def update_feedback(
        db: Session, feedback_id: int, data, reviewer_id: Optional[int] = None
    ) -> Optional[ManualFeedback]:
        fb = db.query(ManualFeedback).filter(ManualFeedback.id == feedback_id).first()
        if not fb:
            return None
        update_data = data.model_dump(exclude_unset=True)
        if "review_status" in update_data:
            fb.reviewer_id = reviewer_id
            fb.reviewed_at = datetime.utcnow()
        for field, value in update_data.items():
            setattr(fb, field, value)
        db.commit()
        db.refresh(fb)
        return fb

    @staticmethod
    def get_error_samples(
        db: Session, skip: int = 0, limit: int = 100,
        error_type: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        query = db.query(ManualFeedback).filter(ManualFeedback.is_error_sample == True)
        if error_type:
            query = query.filter(ManualFeedback.error_type == error_type)
        if date_from:
            query = query.filter(ManualFeedback.created_at >= date_from)
        if date_to:
            query = query.filter(ManualFeedback.created_at <= date_to)

        samples = query.order_by(ManualFeedback.created_at.desc()).offset(skip).limit(limit).all()

        result = []
        for s in samples:
            a = s.appointment
            rs = s.risk_score
            result.append({
                "id": s.id,
                "appointment_no": a.appointment_no if a else "",
                "appointment_id": s.appointment_id,
                "patient_age": a.patient_age if a else None,
                "patient_gender": a.patient_gender if a else None,
                "department_name": a.department.name if a and a.department else "",
                "doctor_name": a.doctor_name if a else "",
                "appointment_date": str(a.appointment_date) if a and a.appointment_date else "",
                "appointment_type": a.appointment_type if a else "",
                "original_risk_level": s.original_risk_level,
                "corrected_risk_level": s.corrected_risk_level,
                "original_score": s.original_score,
                "corrected_score": s.corrected_score,
                "actual_status": a.actual_status if a else None,
                "error_type": s.error_type,
                "reason": s.reason,
                "remark": s.remark,
                "operator_name": s.operator.full_name if s.operator else "",
                "review_status": s.review_status,
                "top_features": rs.top_features if rs else None,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            })
        return result

    @staticmethod
    def get_error_statistics(db: Session) -> Dict[str, Any]:
        total_errors = db.query(ManualFeedback).filter(ManualFeedback.is_error_sample == True).count()
        total_feedback = db.query(ManualFeedback).count()

        by_type = db.query(
            ManualFeedback.error_type, func.count(ManualFeedback.id)
        ).filter(ManualFeedback.is_error_sample == True).group_by(ManualFeedback.error_type).all()

        by_level_mismatch = db.query(
            ManualFeedback.original_risk_level,
            ManualFeedback.corrected_risk_level,
            func.count(ManualFeedback.id)
        ).filter(
            ManualFeedback.is_error_sample == True,
            ManualFeedback.original_risk_level.isnot(None),
            ManualFeedback.corrected_risk_level.isnot(None),
        ).group_by(
            ManualFeedback.original_risk_level,
            ManualFeedback.corrected_risk_level
        ).all()

        error_rate = round(total_errors / total_feedback * 100, 2) if total_feedback > 0 else 0

        return {
            "total_errors": total_errors,
            "total_feedback": total_feedback,
            "error_rate": error_rate,
            "by_error_type": {t: c for t, c in by_type if t},
            "by_level_mismatch": [
                {"from": f, "to": t, "count": c} for f, t, c in by_level_mismatch
            ],
        }
