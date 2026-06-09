from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_teacher, require_admin, can_access_essay
from app.masking import mask_sensitive_data, encrypt_sensitive, decrypt_sensitive
from app.analyzer import analyzer
from app.config import settings
from app.models import FeedbackCategory, AuditStatus, Class

router = APIRouter()


def _count_words(text: str) -> int:
    import re
    import jieba
    chinese_chars = len(re.findall(r'[\u4e00-\u9fa5]', text))
    english_words = len(re.findall(r'[a-zA-Z]+', text))
    jieba_words = len([w for w in jieba.cut(text) if w.strip()])
    return max(chinese_chars + english_words, jieba_words // 2)


def _get_active_prompt_version(db: Session, category: FeedbackCategory):
    return db.query(models.PromptVersion).filter(
        models.PromptVersion.category == category,
        models.PromptVersion.is_active == True
    ).first()


def _can_view_original(db: Session, user: models.User, essay: models.Essay) -> bool:
    if user.role == models.UserRole.ADMIN:
        return True
    if user.role != models.UserRole.TEACHER:
        return False
    cls = db.query(Class).filter(Class.id == essay.class_id).first()
    if cls and cls.head_teacher_id == user.id:
        return True
    return False


@router.post("/submit", response_model=schemas.EssayResponse)
def submit_essay(
    essay_in: schemas.EssaySubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == models.UserRole.STUDENT:
        if essay_in.class_id != current_user.class_id:
            raise HTTPException(status_code=403, detail="只能提交到自己班级")
        student_id = current_user.id
    else:
        raise HTTPException(status_code=403, detail="只有学生可以提交作文")

    masked_content, mask_actions = mask_sensitive_data(essay_in.content)
    encrypted_original = encrypt_sensitive(essay_in.content)

    word_count = _count_words(essay_in.content)

    essay = models.Essay(
        student_id=student_id,
        class_id=essay_in.class_id,
        title=essay_in.title,
        content_masked=masked_content,
        content_original_encrypted=encrypted_original,
        word_count=word_count,
        topic_tag=essay_in.topic_tag
    )
    db.add(essay)
    db.commit()
    db.refresh(essay)

    try:
        analysis_results = analyzer.analyze_full(masked_content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    for category, result in analysis_results.items():
        prompt_version = _get_active_prompt_version(db, category)
        is_low_conf = result.overall_confidence < settings.LOW_CONFIDENCE_THRESHOLD

        feedback = models.EssayFeedback(
            essay_id=essay.id,
            category=category,
            prompt_version_id=prompt_version.id if prompt_version else None,
            model_name=result.model_name,
            overall_confidence=result.overall_confidence,
            is_low_confidence=is_low_conf
        )
        db.add(feedback)
        db.flush()

        for item_data in result.items:
            item_low_conf = item_data.confidence < settings.LOW_CONFIDENCE_THRESHOLD
            db_item = models.FeedbackItem(
                feedback_id=feedback.id,
                category=item_data.category,
                original_text=item_data.original_text,
                suggestion_text=item_data.suggestion_text,
                location_start=item_data.location_start,
                location_end=item_data.location_end,
                confidence=item_data.confidence,
                is_low_confidence=item_low_conf,
                severity=item_data.severity,
                audit_status=AuditStatus.PENDING
            )
            db.add(db_item)

        for ev_ref in result.evidence_refs:
            db_ev = models.ModelEvidence(
                feedback_id=feedback.id,
                evidence_type=ev_ref["evidence_type"],
                evidence_data=ev_ref["evidence_data"],
                description=ev_ref.get("description")
            )
            db.add(db_ev)

    log = models.AuditLog(
        user_id=current_user.id,
        action="submit_essay",
        target_type="essay",
        target_id=essay.id,
        detail={"word_count": word_count, "mask_count": len(mask_actions)}
    )
    db.add(log)
    db.commit()
    db.refresh(essay)

    resp = schemas.EssayResponse.model_validate(essay)
    resp.has_feedback = True
    resp.is_low_confidence = any(
        fb.is_low_confidence for fb in essay.feedbacks
    )
    return resp


@router.get("/", response_model=List[schemas.EssayResponse])
def list_essays(
    class_id: int = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Essay)
    if current_user.role == models.UserRole.STUDENT:
        query = query.filter(models.Essay.student_id == current_user.id)
    elif current_user.role == models.UserRole.TEACHER:
        if class_id:
            if class_id != current_user.class_id:
                raise HTTPException(status_code=403, detail="只能查看自己班级的作文")
            query = query.filter(models.Essay.class_id == class_id)
        else:
            query = query.filter(models.Essay.class_id == current_user.class_id)
    if class_id and current_user.role == models.UserRole.ADMIN:
        query = query.filter(models.Essay.class_id == class_id)

    essays = query.order_by(models.Essay.submitted_at.desc()).offset(skip).limit(limit).all()
    result = []
    for essay in essays:
        resp = schemas.EssayResponse.model_validate(essay)
        resp.has_feedback = len(essay.feedbacks) > 0
        resp.has_teacher_review = essay.teacher_review is not None
        resp.is_low_confidence = any(fb.is_low_confidence for fb in essay.feedbacks)
        result.append(resp)
    return result


@router.post("/prompt-versions", response_model=schemas.PromptVersionResponse,
             dependencies=[Depends(require_admin)])
def create_prompt_version(
    pv_in: schemas.PromptVersionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.PromptVersion).filter(
        models.PromptVersion.version_code == pv_in.version_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="版本号已存在")

    if pv_in.is_active:
        db.query(models.PromptVersion).filter(
            models.PromptVersion.category == pv_in.category,
            models.PromptVersion.is_active == True
        ).update({"is_active": False})

    pv = models.PromptVersion(
        version_code=pv_in.version_code,
        category=pv_in.category,
        prompt_content=pv_in.prompt_content,
        description=pv_in.description,
        is_active=pv_in.is_active,
        created_by=current_user.id
    )
    db.add(pv)
    db.commit()
    db.refresh(pv)
    db.add(models.AuditLog(
        user_id=current_user.id,
        action="create_prompt_version",
        target_type="prompt_version",
        target_id=pv.id,
        detail={"version": pv.version_code, "category": pv_in.category.value}
    ))
    db.commit()
    return pv


@router.get("/prompt-versions", response_model=List[schemas.PromptVersionResponse])
def list_prompt_versions(
    category: FeedbackCategory = None,
    only_active: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.PromptVersion)
    if category:
        query = query.filter(models.PromptVersion.category == category)
    if only_active:
        query = query.filter(models.PromptVersion.is_active == True)
    return query.order_by(models.PromptVersion.created_at.desc()).all()


@router.get("/{essay_id}", response_model=schemas.EssayDetailResponse)
def get_essay_detail(
    essay_id: int,
    include_original: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    essay = db.query(models.Essay).filter(models.Essay.id == essay_id).first()
    if not essay:
        raise HTTPException(status_code=404, detail="作文不存在")
    if not can_access_essay(current_user, essay):
        raise HTTPException(status_code=403, detail="无权限查看该作文")

    original_decrypted = False
    resp_data = {
        "id": essay.id,
        "title": essay.title,
        "content_masked": essay.content_masked,
        "word_count": essay.word_count,
        "topic_tag": essay.topic_tag,
        "submitted_at": essay.submitted_at,
        "has_feedback": len(essay.feedbacks) > 0,
        "has_teacher_review": essay.teacher_review is not None,
        "is_low_confidence": any(fb.is_low_confidence for fb in essay.feedbacks),
    }

    if include_original:
        if not _can_view_original(db, current_user, essay):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="仅班主任或管理员可查看原文。如需查看，请联系班主任解密"
            )
        original = decrypt_sensitive(essay.content_original_encrypted)
        if original:
            resp_data["content_masked"] = original
            original_decrypted = True

    feedbacks_resp = []
    for fb in essay.feedbacks:
        fb_dict = {
            "id": fb.id,
            "essay_id": fb.essay_id,
            "category": fb.category,
            "prompt_version_id": fb.prompt_version_id,
            "prompt_version_code": fb.prompt_version.version_code if fb.prompt_version else None,
            "generated_at": fb.generated_at,
            "model_name": fb.model_name,
            "overall_confidence": fb.overall_confidence,
            "is_low_confidence": fb.is_low_confidence,
            "evidence_refs": [],
            "items": []
        }

        if current_user.role != models.UserRole.STUDENT:
            fb_dict["evidence_refs"] = [
                schemas.ModelEvidenceResponse.model_validate(e) for e in fb.evidence_refs
            ]

        for item in fb.items:
            display_suggestion = item.revised_suggestion or item.suggestion_text
            is_visible_to_student = (
                item.audit_status in [AuditStatus.APPROVED, AuditStatus.NEEDS_REVISION]
            )

            if current_user.role == models.UserRole.STUDENT and not is_visible_to_student:
                continue

            item_dict = {
                "id": item.id,
                "category": item.category,
                "original_text": item.original_text,
                "suggestion_text": display_suggestion,
                "location_start": item.location_start,
                "location_end": item.location_end,
                "confidence": item.confidence,
                "is_low_confidence": item.is_low_confidence,
                "severity": item.severity,
                "audit_status": item.audit_status,
                "audit_note": item.audit_note,
                "audited_at": item.audited_at,
                "revised_suggestion": item.revised_suggestion,
            }
            fb_dict["items"].append(schemas.FeedbackItemResponse(**item_dict))

        feedbacks_resp.append(schemas.EssayFeedbackResponse(**fb_dict))
    resp_data["feedbacks"] = feedbacks_resp
    resp_data["teacher_review"] = (
        schemas.TeacherReviewResponse.model_validate(essay.teacher_review)
        if essay.teacher_review else None
    )

    log = models.AuditLog(
        user_id=current_user.id,
        action="view_essay",
        target_type="essay",
        target_id=essay_id,
        detail={
            "include_original_requested": include_original,
            "original_decrypted": original_decrypted
        }
    )
    db.add(log)
    db.commit()

    return schemas.EssayDetailResponse(**resp_data)
