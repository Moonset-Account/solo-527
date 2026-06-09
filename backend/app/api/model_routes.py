from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.model import (
    ScoringRequest, ScoringResponse,
    ModelTrainRequest, ModelTrainResponse, ModelVersionResponse, RollbackRequest
)
from app.services.scoring_service import ScoringService
from app.services.model_service import ModelService
from app.models.user import User
from app.models.model_version import ModelVersion

router = APIRouter(prefix="/models", tags=["模型管理与评分"])


@router.post("/train", response_model=ModelTrainResponse)
def train_model(
    request: ModelTrainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "data_scientist"])),
):
    result = ModelService.train_model(db, request, current_user.id)
    if not result:
        raise HTTPException(
            status_code=400,
            detail="模型训练失败：请检查是否有足够的已标注数据（actual_status字段）"
        )
    return result


@router.get("/versions", response_model=list)
def list_model_versions(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return ModelService.list_model_versions(db)


@router.post("/versions/{version_id}/activate", response_model=ModelVersionResponse)
def activate_model(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    mv = ModelService.activate_model(db, version_id, current_user.id)
    if not mv:
        raise HTTPException(status_code=404, detail="模型版本不存在")
    return mv


@router.post("/versions/rollback")
def rollback_model(
    request: RollbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    success = ModelService.rollback_model(db, request, current_user.id)
    if not success:
        raise HTTPException(status_code=400, detail="回滚失败，请检查目标版本是否存在，或文件系统中该版本模型文件不完整")
    try:
        db.expire_all()
    except Exception:
        pass
    target_mv = db.query(ModelVersion).filter(ModelVersion.version == request.target_version).first()
    result = {
        "success": True,
        "message": f"已回滚到版本 {request.target_version}",
        "target_version": request.target_version,
        "reason": request.reason,
    }
    if target_mv:
        try:
            db.refresh(target_mv)
        except Exception:
            pass
        detail = ModelService._serialize_mv(db, target_mv)
        if detail:
            result["version_detail"] = detail
            result["review_history"] = detail.get("review_history", [])
            result["audit_trail"] = detail.get("audit_trail", [])
            result["version_id"] = detail.get("id")
    return result


@router.post("/versions/{version_id}/review", response_model=ModelVersionResponse)
def review_model(
    version_id: int,
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    status = body.get("status") or body.get("review_status")
    comment = body.get("comment", "")
    if status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="status 必须是 approved/rejected/pending")
    mv = ModelService.review_model(db, version_id, status, comment, current_user.id)
    if not mv:
        raise HTTPException(status_code=404, detail="模型版本不存在")
    return mv


@router.post("/score", response_model=ScoringResponse)
def run_scoring(
    request: Optional[ScoringRequest] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin", "operator"])),
):
    ids = request.appointment_ids if request else None
    mv_id = request.model_version_id if request else None
    result = ScoringService.run_scoring(
        db, appointment_ids=ids, model_version_id=mv_id,
        date_from=date_from, date_to=date_to
    )
    return result


@router.get("/scores")
def list_risk_scores(
    skip: int = 0, limit: int = 100,
    risk_level: Optional[str] = None,
    department_id: Optional[int] = None,
    batch_id: Optional[str] = None,
    model_version_id: Optional[int] = None,
    needs_callback: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return ScoringService.get_risk_scores(
        db, skip=skip, limit=limit, risk_level=risk_level,
        department_id=department_id, batch_id=batch_id,
        model_version_id=model_version_id, needs_callback=needs_callback
    )


@router.get("/scores/{score_id}")
def get_score_detail(
    score_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    detail = ScoringService.get_score_detail(db, score_id)
    if not detail:
        raise HTTPException(status_code=404, detail="评分记录不存在")
    return detail


@router.put("/scores/{score_id}/override")
def override_score(
    score_id: int,
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "operator"])),
):
    new_level = body.get("new_level") or body.get("corrected_risk_level")
    new_score = body.get("new_score") or body.get("corrected_score")
    reason = body.get("reason", "")
    if new_level not in ["low", "medium", "high", "critical"]:
        raise HTTPException(status_code=400, detail="new_level 必须是 low/medium/high/critical")
    result = ScoringService.override_score(
        db, score_id, new_level, new_score, reason, current_user.id
    )
    if not result:
        raise HTTPException(status_code=404, detail="评分记录不存在")
    from app.schemas.business import ManualFeedbackCreate
    from app.services.feedback_service import FeedbackService
    rs = result
    try:
        fb_data = ManualFeedbackCreate(
            appointment_id=rs.appointment_id,
            risk_score_id=rs.id,
            original_risk_level=body.get("original_risk_level"),
            corrected_risk_level=new_level,
            original_score=body.get("original_score"),
            corrected_score=new_score,
            feedback_type=body.get("feedback_type", "override"),
            reason=reason,
            remark=body.get("remark", ""),
            is_error_sample=True,
            error_type=body.get("error_type", "manual_override"),
        )
        FeedbackService.create_feedback(db, fb_data, current_user.id)
    except Exception as e:
        print(f"Warning: Failed to create feedback record: {e}")
    return {"success": True, "message": "已人工覆盖评分结果，改标记录已写入反馈库",
            "score_id": score_id, "new_level": new_level, "new_score": new_score}
