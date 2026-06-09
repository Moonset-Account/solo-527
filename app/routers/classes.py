from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Dict, Any
from collections import Counter

from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_teacher
from app.models import (
    UserRole, FeedbackCategory, AuditStatus,
    Essay, EssayFeedback, FeedbackItem, TeacherReview, User, Class
)

router = APIRouter()


def _get_top_approved_suggestions(db: Session, class_id: int, limit: int = 10) -> List[Dict[str, Any]]:
    items = db.query(FeedbackItem).join(
        EssayFeedback, FeedbackItem.feedback_id == EssayFeedback.id
    ).join(
        Essay, EssayFeedback.essay_id == Essay.id
    ).filter(
        Essay.class_id == class_id,
        FeedbackItem.audit_status == AuditStatus.APPROVED
    ).all()

    suggestion_counts = Counter()
    category_counts = Counter()
    for item in items:
        text = item.revised_suggestion or item.suggestion_text
        key = (item.category.value, text[:80])
        suggestion_counts[key] += 1
        category_counts[item.category.value] += 1

    top_suggestions = []
    for (cat, snippet), count in suggestion_counts.most_common(limit):
        top_suggestions.append({
            "category": cat,
            "suggestion_snippet": snippet,
            "occurrence_count": count
        })
    return top_suggestions


@router.get("/{class_id}/stats", response_model=schemas.ClassStatsResponse)
def get_class_statistics(
    class_id: int,
    date_from: str = None,
    date_to: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    if current_user.role != UserRole.ADMIN and class_id != current_user.class_id:
        raise HTTPException(status_code=403, detail="只能查看自己班级的统计")

    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="班级不存在")

    total_students = db.query(func.count(User.id)).filter(
        User.class_id == class_id, User.role == UserRole.STUDENT
    ).scalar() or 0

    essay_query = db.query(Essay).filter(Essay.class_id == class_id)
    if date_from:
        from datetime import datetime
        try:
            dt_from = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            essay_query = essay_query.filter(Essay.submitted_at >= dt_from)
        except (ValueError, TypeError):
            pass
    if date_to:
        from datetime import datetime
        try:
            dt_to = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            essay_query = essay_query.filter(Essay.submitted_at <= dt_to)
        except (ValueError, TypeError):
            pass

    essays = essay_query.all()
    total_essays = len(essays)
    essay_ids = [e.id for e in essays] if essays else [-1]

    reviewed_essays = db.query(func.count(TeacherReview.id)).filter(
        TeacherReview.essay_id.in_(essay_ids)
    ).scalar() or 0

    reviews = db.query(TeacherReview).filter(
        TeacherReview.essay_id.in_(essay_ids)
    ).all()

    def _avg(values):
        vals = [v for v in values if v is not None]
        return round(sum(vals) / len(vals), 2) if vals else None

    avg_structure = _avg([r.structure_rating for r in reviews])
    avg_evidence = _avg([r.evidence_rating for r in reviews])
    avg_expression = _avg([r.expression_rating for r in reviews])
    avg_score = _avg([r.final_score for r in reviews])

    low_conf_count = db.query(func.count(EssayFeedback.id)).filter(
        EssayFeedback.essay_id.in_(essay_ids),
        EssayFeedback.is_low_confidence == True
    ).scalar() or 0

    category_items = db.query(
        FeedbackItem.category, func.count(FeedbackItem.id)
    ).join(
        EssayFeedback, FeedbackItem.feedback_id == EssayFeedback.id
    ).filter(
        EssayFeedback.essay_id.in_(essay_ids),
        FeedbackItem.audit_status == AuditStatus.APPROVED
    ).group_by(FeedbackItem.category).all()

    category_breakdown = {cat.value: count for cat, count in category_items}
    for fc in FeedbackCategory:
        if fc.value not in category_breakdown:
            category_breakdown[fc.value] = 0

    top_suggestions = _get_top_approved_suggestions(db, class_id)

    return schemas.ClassStatsResponse(
        class_id=class_id,
        class_name=cls.class_name,
        grade=cls.grade,
        total_students=total_students,
        total_essays=total_essays,
        reviewed_essays=reviewed_essays,
        avg_structure_rating=avg_structure,
        avg_evidence_rating=avg_evidence,
        avg_expression_rating=avg_expression,
        avg_final_score=avg_score,
        low_confidence_count=low_conf_count,
        category_breakdown=category_breakdown,
        top_suggestions=top_suggestions
    )


@router.get("/{class_id}/report")
def generate_class_report(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    if current_user.role != UserRole.ADMIN and class_id != current_user.class_id:
        raise HTTPException(status_code=403, detail="只能查看自己班级的报告")

    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="班级不存在")

    approved_items = db.query(FeedbackItem).join(
        EssayFeedback, FeedbackItem.feedback_id == EssayFeedback.id
    ).join(
        Essay, EssayFeedback.essay_id == Essay.id
    ).filter(
        Essay.class_id == class_id,
        FeedbackItem.audit_status == AuditStatus.APPROVED
    ).order_by(FeedbackItem.category).all()

    by_category: Dict[str, List[Dict[str, Any]]] = {fc.value: [] for fc in FeedbackCategory}
    for item in approved_items:
        display = item.revised_suggestion or item.suggestion_text
        by_category[item.category.value].append({
            "suggestion": display[:200],
            "severity": item.severity,
            "essay_id": item.feedback.essay_id
        })

    weak_areas = []
    for cat, items in by_category.items():
        if len(items) > 0:
            high_count = sum(1 for i in items if i["severity"] == "high")
            if high_count >= 3 or len(items) >= 10:
                weak_areas.append({
                    "category": cat,
                    "total_count": len(items),
                    "high_severity_count": high_count
                })

    essays_with_review = db.query(Essay).filter(
        Essay.class_id == class_id,
        Essay.teacher_review != None
    ).all()

    student_progress = []
    student_ids = db.query(User.id).filter(
        User.class_id == class_id,
        User.role == UserRole.STUDENT
    ).all()
    for (sid,) in student_ids:
        student_essays = [e for e in essays_with_review if e.student_id == sid]
        if student_essays:
            scores = [e.teacher_review.final_score for e in student_essays
                      if e.teacher_review and e.teacher_review.final_score is not None]
            if scores:
                student_progress.append({
                    "student_id": sid,
                    "essay_count": len(student_essays),
                    "avg_score": round(sum(scores) / len(scores), 1),
                    "latest_score": scores[-1]
                })

    return {
        "class_info": {
            "class_id": cls.id,
            "class_name": cls.class_name,
            "grade": cls.grade
        },
        "report_generated_at": __import__("datetime").datetime.utcnow().isoformat(),
        "data_scope": "仅包含教师已审核标记为APPROVED的反馈建议",
        "approved_feedback_by_category": by_category,
        "weakness_areas": sorted(weak_areas, key=lambda x: -x["total_count"]),
        "student_performance_summary": student_progress
    }
