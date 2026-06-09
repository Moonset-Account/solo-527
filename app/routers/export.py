from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from io import BytesIO
import json
from datetime import datetime

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

from app.database import get_db
from app import models, schemas
from app.security import require_teacher, get_current_user, require_admin
from app.masking import mask_for_export, extract_evidence_summary
from app.models import (
    UserRole, FeedbackCategory, AuditStatus,
    Essay, EssayFeedback, FeedbackItem, TeacherReview, User, Class
)

router = APIRouter()


def _can_export(db: Session, user: models.User, class_ids: Optional[List[int]]) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    if user.role != UserRole.TEACHER:
        return False
    check_ids = class_ids or [user.class_id]
    for cid in check_ids:
        cls = db.query(Class).filter(Class.id == cid).first()
        if not cls or cls.head_teacher_id != user.id:
            return False
    return True


def _build_aggregated_class_data(
    db: Session,
    class_ids: Optional[List[int]] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    include_low_confidence: bool = False
) -> List[Dict[str, Any]]:
    class_query = db.query(Class)
    if class_ids:
        class_query = class_query.filter(Class.id.in_(class_ids))
    classes = class_query.all()

    aggregated_rows = []
    for cls in classes:
        essay_query = db.query(Essay).filter(Essay.class_id == cls.id)
        if date_from:
            essay_query = essay_query.filter(Essay.submitted_at >= date_from)
        if date_to:
            essay_query = essay_query.filter(Essay.submitted_at <= date_to)
        essays = essay_query.all()
        essay_ids = [e.id for e in essays] if essays else [-1]

        feedback_filter = [EssayFeedback.essay_id.in_(essay_ids)]
        if not include_low_confidence:
            feedback_filter.append(EssayFeedback.is_low_confidence == False)

        reviews = db.query(TeacherReview).filter(
            TeacherReview.essay_id.in_(essay_ids)
        ).all()

        score_values = [r.final_score for r in reviews if r.final_score is not None]
        structure_values = [r.structure_rating for r in reviews if r.structure_rating is not None]
        evidence_values = [r.evidence_rating for r in reviews if r.evidence_rating is not None]
        expression_values = [r.expression_rating for r in reviews if r.expression_rating is not None]

        def safe_avg(vals):
            return round(sum(vals) / len(vals), 2) if vals else None

        approved_items = db.query(FeedbackItem).join(
            EssayFeedback, FeedbackItem.feedback_id == EssayFeedback.id
        ).filter(
            EssayFeedback.essay_id.in_(essay_ids),
            FeedbackItem.audit_status == AuditStatus.APPROVED,
            *feedback_filter
        ).all()

        category_stats = {fc.value: 0 for fc in FeedbackCategory}
        severity_stats = {"high": 0, "normal": 0, "low": 0}
        for item in approved_items:
            category_stats[item.category.value] = category_stats.get(item.category.value, 0) + 1
            severity_stats[item.severity] = severity_stats.get(item.severity, 0) + 1

        low_conf_total = db.query(func.count(EssayFeedback.id)).filter(
            EssayFeedback.essay_id.in_(essay_ids),
            EssayFeedback.is_low_confidence == True
        ).scalar() or 0

        student_count = db.query(func.count(User.id)).filter(
            User.class_id == cls.id,
            User.role == UserRole.STUDENT
        ).scalar() or 0

        row = {
            "导出时间": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            "班级ID": cls.id,
            "班级名称": cls.class_name,
            "年级": cls.grade,
            "统计周期开始": date_from.isoformat() if date_from else "不限",
            "统计周期结束": date_to.isoformat() if date_to else "不限",
            "学生总数(已脱敏计数)": student_count,
            "作文提交总数": len(essays),
            "已完成教师评价数": len(reviews),
            "教师评价完成率(%)": round(len(reviews) / max(len(essays), 1) * 100, 1),
            "平均最终得分": safe_avg(score_values),
            "平均结构评分(1-5)": safe_avg(structure_values),
            "平均论据评分(1-5)": safe_avg(evidence_values),
            "平均表达评分(1-5)": safe_avg(expression_values),
            "低置信度反馈总数": low_conf_total,
            "是否包含低置信度数据": "是" if include_low_confidence else "否",
            "结构类建议数(已审核)": category_stats.get("structure", 0),
            "论据类建议数(已审核)": category_stats.get("evidence", 0),
            "错别字类建议数(已审核)": category_stats.get("typo", 0),
            "表达类建议数(已审核)": category_stats.get("expression", 0),
            "严重程度-高": severity_stats.get("high", 0),
            "严重程度-中": severity_stats.get("normal", 0),
            "严重程度-低": severity_stats.get("low", 0),
            "业务证据摘要(已脱敏截断)": json.dumps(
                extract_evidence_summary(
                    [{"audit_status": "approved",
                      "category": i.category.value,
                      "revised_suggestion": i.revised_suggestion,
                      "suggestion_text": i.suggestion_text,
                      "severity": i.severity} for i in approved_items[:50]]
                ),
                ensure_ascii=False
            )
        }
        aggregated_rows.append(row)

    return aggregated_rows


@router.post("/class-report/excel")
def export_class_report_excel(
    options: schemas.ExportOptions,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    if not HAS_PANDAS:
        raise HTTPException(status_code=500, detail="pandas依赖未安装，请使用JSON导出")

    target_class_ids = options.class_ids
    if current_user.role != UserRole.ADMIN:
        if target_class_ids:
            target_class_ids = [cid for cid in target_class_ids if cid == current_user.class_id]
        else:
            target_class_ids = [current_user.class_id]

    if not _can_export(db, current_user, target_class_ids):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅班主任或管理员可导出班级统计聚合数据。请联系管理员获取授权。"
        )

    aggregated = _build_aggregated_class_data(
        db,
        class_ids=target_class_ids,
        date_from=options.date_from,
        date_to=options.date_to,
        include_low_confidence=options.include_low_confidence
    )

    if not aggregated:
        raise HTTPException(status_code=404, detail="没有符合条件的数据可导出")

    df = pd.DataFrame(aggregated)
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="班级作文统计汇总", index=False)

        audit_counts = []
        for row in aggregated:
            audit_counts.append({
                "班级名称": row["班级名称"],
                "通过(APPROVED)": row["结构类建议数(已审核)"] + row["论据类建议数(已审核)"] + row["错别字类建议数(已审核)"] + row["表达类建议数(已审核)"],
                "备注": row["业务证据摘要(已脱敏截断)"][:100] + "..."
            })
        if audit_counts:
            pd.DataFrame(audit_counts).to_excel(writer, sheet_name="审核通过计数", index=False)

    output.seek(0)

    log = models.AuditLog(
        user_id=current_user.id,
        action="export_excel",
        target_type="class_report",
        target_id=target_class_ids[0] if len(target_class_ids) == 1 else 0,
        detail={
            "format": "xlsx",
            "class_ids": target_class_ids,
            "row_count": len(aggregated),
            "include_low_confidence": options.include_low_confidence,
            "filters": {
                "date_from": options.date_from.isoformat() if options.date_from else None,
                "date_to": options.date_to.isoformat() if options.date_to else None
            },
            "exported_at": datetime.utcnow().isoformat()
        }
    )
    db.add(log)
    db.commit()

    filename = f"班级作文统计聚合_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "X-Content-Security-Note": "本文件仅包含聚合统计结果和脱敏证据摘要，不含个人敏感信息",
        "X-Exported-By": f"user_{current_user.id}",
        "X-Exported-At": datetime.utcnow().isoformat(timespec="seconds") + "Z"
    }
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )


@router.post("/class-report/json")
def export_class_report_json(
    options: schemas.ExportOptions,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    target_class_ids = options.class_ids
    if current_user.role != UserRole.ADMIN:
        if target_class_ids:
            target_class_ids = [cid for cid in target_class_ids if cid == current_user.class_id]
        else:
            target_class_ids = [current_user.class_id]

    if not _can_export(db, current_user, target_class_ids):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅班主任或管理员可导出班级统计聚合数据。请联系管理员获取授权。"
        )

    aggregated = _build_aggregated_class_data(
        db,
        class_ids=target_class_ids,
        date_from=options.date_from,
        date_to=options.date_to,
        include_low_confidence=options.include_low_confidence
    )

    export_payload = {
        "export_meta": {
            "generated_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            "exported_by_user_id": current_user.id,
            "exported_by_role": current_user.role.value,
            "is_authorized_exporter": _can_export(db, current_user, target_class_ids),
            "data_policy": "仅聚合统计数据 + 脱敏证据摘要。无个人身份信息，无原始作文全文，无教师评价全文。",
            "filters": {
                "class_ids": target_class_ids,
                "date_from": options.date_from.isoformat() if options.date_from else None,
                "date_to": options.date_to.isoformat() if options.date_to else None,
                "include_low_confidence": options.include_low_confidence
            },
            "audit_scope": "仅包含教师审核标记为 APPROVED 的反馈建议"
        },
        "aggregated_class_statistics": aggregated
    }

    log = models.AuditLog(
        user_id=current_user.id,
        action="export_json",
        target_type="class_report",
        target_id=target_class_ids[0] if len(target_class_ids) == 1 else 0,
        detail={
            "format": "json",
            "class_ids": target_class_ids,
            "row_count": len(aggregated),
            "include_low_confidence": options.include_low_confidence
        }
    )
    db.add(log)
    db.commit()

    return export_payload


@router.get("/audit-trail-summary", dependencies=[Depends(require_admin)])
def export_audit_trail_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    target_class_id = current_user.class_id if current_user.role != UserRole.ADMIN else None

    query = db.query(FeedbackItem).join(
        EssayFeedback, FeedbackItem.feedback_id == EssayFeedback.id
    ).join(Essay, EssayFeedback.essay_id == Essay.id)

    if target_class_id:
        query = query.filter(Essay.class_id == target_class_id)

    items = query.all()

    summary = {
        "meta": {
            "generated_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            "requested_by": current_user.id,
            "requested_role": current_user.role.value,
            "permission_level_required": "admin",
            "note": "所有统计均为聚合数据，不含个人可识别信息"
        },
        "total_items": len(items),
        "by_audit_status": {},
        "by_category": {},
        "audit_rate_pct": 0.0,
        "low_confidence_items": 0,
        "teacher_revised_count": 0
    }

    status_counts = {}
    category_counts = {}
    audited_count = 0

    for item in items:
        s = item.audit_status.value
        c = item.category.value
        status_counts[s] = status_counts.get(s, 0) + 1
        category_counts[c] = category_counts.get(c, 0) + 1
        if item.audit_status != AuditStatus.PENDING:
            audited_count += 1
        if item.is_low_confidence:
            summary["low_confidence_items"] += 1
        if item.revised_suggestion:
            summary["teacher_revised_count"] += 1

    summary["by_audit_status"] = status_counts
    summary["by_category"] = category_counts
    summary["audit_rate_pct"] = round(audited_count / max(len(items), 1) * 100, 1)

    return summary
