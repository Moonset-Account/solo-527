from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_teacher, require_admin, can_access_essay
from app.masking import mask_sensitive_data, encrypt_sensitive, mask_for_export
from app.models import AuditStatus, FeedbackCategory, UserRole, Class

router = APIRouter()


def _is_class_head(db: Session, user: models.User, class_id: int) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    cls = db.query(Class).filter(Class.id == class_id).first()
    return cls is not None and cls.head_teacher_id == user.id


@router.post("/audit", response_model=List[schemas.FeedbackItemResponse])
def audit_feedback_items(
    audit_in: schemas.FeedbackBatchAudit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    feedback = db.query(models.EssayFeedback).filter(
        models.EssayFeedback.id == audit_in.feedback_id
    ).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="反馈不存在")

    essay = feedback.essay
    if not _is_class_head(db, current_user, essay.class_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅班主任或管理员可以审核反馈"
        )

    updated_items = []
    item_map = {audit.item_id: audit for audit in audit_in.items}

    for db_item in feedback.items:
        if db_item.id not in item_map:
            continue
        audit_data = item_map[db_item.id]
        db_item.audit_status = audit_data.audit_status
        db_item.audit_note = audit_data.audit_note
        db_item.revised_suggestion = audit_data.revised_suggestion
        db_item.audited_by = current_user.id
        db_item.audited_at = datetime.utcnow()
        updated_items.append(db_item)

    log_detail = {
        "feedback_id": audit_in.feedback_id,
        "essay_id": essay.id,
        "approved_count": sum(1 for a in audit_in.items if a.audit_status == AuditStatus.APPROVED),
        "needs_revision_count": sum(1 for a in audit_in.items if a.audit_status == AuditStatus.NEEDS_REVISION),
        "rejected_count": sum(1 for a in audit_in.items if a.audit_status == AuditStatus.REJECTED)
    }
    log = models.AuditLog(
        user_id=current_user.id,
        action="audit_feedback",
        target_type="essay_feedback",
        target_id=audit_in.feedback_id,
        detail=log_detail
    )
    db.add(log)
    db.commit()

    for item in updated_items:
        db.refresh(item)
    return updated_items


@router.post("/teacher-review", response_model=schemas.TeacherReviewResponse)
def create_teacher_review(
    review_in: schemas.TeacherReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    essay = db.query(models.Essay).filter(models.Essay.id == review_in.essay_id).first()
    if not essay:
        raise HTTPException(status_code=404, detail="作文不存在")
    if not _is_class_head(db, current_user, essay.class_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅班主任可以录入最终评价与分数"
        )

    existing_review = db.query(models.TeacherReview).filter(
        models.TeacherReview.essay_id == review_in.essay_id
    ).first()

    masked_comment, _ = mask_sensitive_data(review_in.overall_comment)
    encrypted_comment = encrypt_sensitive(review_in.overall_comment)

    if existing_review:
        existing_review.final_score = review_in.final_score
        existing_review.overall_comment_masked = masked_comment
        existing_review.overall_comment_encrypted = encrypted_comment
        existing_review.structure_rating = review_in.structure_rating
        existing_review.evidence_rating = review_in.evidence_rating
        existing_review.expression_rating = review_in.expression_rating
        existing_review.teacher_id = current_user.id
        review = existing_review
    else:
        review = models.TeacherReview(
            essay_id=review_in.essay_id,
            teacher_id=current_user.id,
            final_score=review_in.final_score,
            overall_comment_masked=masked_comment,
            overall_comment_encrypted=encrypted_comment,
            structure_rating=review_in.structure_rating,
            evidence_rating=review_in.evidence_rating,
            expression_rating=review_in.expression_rating
        )
        db.add(review)

    log = models.AuditLog(
        user_id=current_user.id,
        action="teacher_review",
        target_type="essay",
        target_id=review_in.essay_id,
        detail={
            "has_final_score": review_in.final_score is not None,
            "score_value": review_in.final_score,
            "is_update": existing_review is not None
        }
    )
    db.add(log)
    db.commit()
    db.refresh(review)
    return review


@router.get("/pending-audit")
def list_pending_audit_essays(
    class_id: int = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    target_class_id = class_id or current_user.class_id
    if not _is_class_head(db, current_user, target_class_id):
        raise HTTPException(status_code=403, detail="仅班主任或管理员可查看待审核清单")

    essays = db.query(models.Essay).filter(
        models.Essay.class_id == target_class_id
    ).order_by(models.Essay.submitted_at.desc()).offset(skip).limit(limit).all()

    result = []
    for essay in essays:
        pending_count = db.query(models.FeedbackItem).join(
            models.EssayFeedback
        ).filter(
            models.EssayFeedback.essay_id == essay.id,
            models.FeedbackItem.audit_status == AuditStatus.PENDING
        ).count()

        low_conf_count = db.query(models.FeedbackItem).join(
            models.EssayFeedback
        ).filter(
            models.EssayFeedback.essay_id == essay.id,
            models.FeedbackItem.is_low_confidence == True
        ).count()

        result.append({
            "essay_id": essay.id,
            "title": essay.title,
            "student_id": essay.student_id,
            "submitted_at": essay.submitted_at,
            "word_count": essay.word_count,
            "pending_items": pending_count,
            "low_confidence_items": low_conf_count,
            "has_teacher_review": essay.teacher_review is not None
        })
    return result


@router.get("/by-essay/{essay_id}")
def get_essay_feedbacks(
    essay_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    essay = db.query(models.Essay).filter(models.Essay.id == essay_id).first()
    if not essay:
        raise HTTPException(status_code=404, detail="作文不存在")
    if not can_access_essay(current_user, essay):
        raise HTTPException(status_code=403, detail="无权限查看")

    is_authorized_viewer = _is_class_head(db, current_user, essay.class_id)

    feedbacks = []
    for fb in essay.feedbacks:
        items = []
        for it in fb.items:
            display_suggestion = it.revised_suggestion or it.suggestion_text

            if current_user.role == UserRole.STUDENT:
                if it.audit_status not in [AuditStatus.APPROVED, AuditStatus.NEEDS_REVISION]:
                    continue
                display_suggestion = it.revised_suggestion or it.suggestion_text
                safe_original = mask_for_export(it.original_text) if it.original_text else None
            else:
                safe_original = it.original_text

            items.append({
                "id": it.id,
                "category": it.category.value,
                "original_text": safe_original,
                "suggestion_text": display_suggestion,
                "location_start": it.location_start,
                "location_end": it.location_end,
                "confidence": it.confidence,
                "is_low_confidence": it.is_low_confidence,
                "severity": it.severity,
                "audit_status": it.audit_status.value,
                "has_revision": it.revised_suggestion is not None
            })

        evidence_refs = []
        if is_authorized_viewer:
            evidence_refs = [{
                "id": e.id,
                "evidence_type": e.evidence_type,
                "evidence_data": e.evidence_data,
                "description": e.description
            } for e in fb.evidence_refs]

        feedbacks.append({
            "id": fb.id,
            "category": fb.category.value,
            "prompt_version_id": fb.prompt_version_id,
            "prompt_version_code": fb.prompt_version.version_code if fb.prompt_version else None,
            "generated_at": fb.generated_at,
            "model_name": fb.model_name,
            "overall_confidence": fb.overall_confidence,
            "is_low_confidence": fb.is_low_confidence,
            "items": items,
            "evidence_refs": evidence_refs,
            "viewer_is_authorized": is_authorized_viewer
        })
    return feedbacks
